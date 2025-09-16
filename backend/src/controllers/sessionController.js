const InterviewSession = require('../models/InterviewSession');
const Candidate = require('../models/Candidate');
const DetectionEvent = require('../models/DetectionEvent');
const { validationResult } = require('express-validator');

// @desc    Get all interview sessions
// @route   GET /api/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by candidate if provided
    if (req.query.candidateId) {
      query.candidateId = req.query.candidateId;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.startTime = {};
      if (req.query.startDate) {
        query.startTime.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.startTime.$lte = new Date(req.query.endDate);
      }
    }

    const sessions = await InterviewSession.find(query)
      .populate('candidateId', 'name email position')
      .populate('events')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InterviewSession.countDocuments(query);

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single interview session
// @route   GET /api/sessions/:id
// @access  Private
exports.getSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate('candidateId')
      .populate({
        path: 'events',
        options: { sort: { timestamp: 1 } }
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new interview session
// @route   POST /api/sessions
// @access  Private
exports.createSession = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    // Verify candidate exists
    const candidate = await Candidate.findById(req.body.candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Check if candidate already has an active session
    const activeSession = await InterviewSession.findOne({
      candidateId: req.body.candidateId,
      status: 'active'
    });

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'Candidate already has an active interview session'
      });
    }

    const session = await InterviewSession.create(req.body);

    // Update candidate status
    await Candidate.findByIdAndUpdate(req.body.candidateId, {
      status: 'in-progress'
    });

    const populatedSession = await InterviewSession.findById(session._id)
      .populate('candidateId', 'name email position');

    res.status(201).json({
      success: true,
      data: populatedSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update interview session
// @route   PUT /api/sessions/:id
// @access  Private
exports.updateSession = async (req, res) => {
  try {
    let session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // If ending the session, calculate integrity score
    if (req.body.status === 'completed' && session.status !== 'completed') {
      const events = await DetectionEvent.find({ sessionId: req.params.id });
      
      const focusViolations = events.filter(e => 
        ['focus_lost', 'no_face'].includes(e.type)
      ).length;
      
      const objectViolations = events.filter(e => 
        ['phone', 'book', 'notes', 'device'].includes(e.type)
      ).length;
      
      const multiplePersonViolations = events.filter(e => 
        e.type === 'multiple_faces'
      ).length;

      // Calculate integrity score (100 - deductions)
      let integrityScore = 100;
      integrityScore -= focusViolations * 5; // 5 points per focus violation
      integrityScore -= objectViolations * 10; // 10 points per object violation
      integrityScore -= multiplePersonViolations * 15; // 15 points per multiple person violation
      integrityScore = Math.max(0, integrityScore); // Don't go below 0

      req.body.integrityScore = integrityScore;
      req.body.totalEvents = events.length;
      req.body.focusViolations = focusViolations;
      req.body.objectViolations = objectViolations;
      req.body.multiplePersonViolations = multiplePersonViolations;
      req.body.endTime = new Date();

      // Update candidate status
      await Candidate.findByIdAndUpdate(session.candidateId, {
        status: 'completed'
      });
    }

    session = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('candidateId', 'name email position');

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete interview session
// @route   DELETE /api/sessions/:id
// @access  Private
exports.deleteSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Delete all associated events
    await DetectionEvent.deleteMany({ sessionId: req.params.id });

    await session.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Interview session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get session statistics
// @route   GET /api/sessions/stats
// @access  Private
exports.getSessionStats = async (req, res) => {
  try {
    const stats = await InterviewSession.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgIntegrityScore: { $avg: '$integrityScore' },
          avgDuration: { $avg: '$actualDuration' }
        }
      }
    ]);

    const totalSessions = await InterviewSession.countDocuments();
    const activeSessions = await InterviewSession.countDocuments({ status: 'active' });
    const completedSessions = await InterviewSession.countDocuments({ status: 'completed' });

    // Get average integrity score for completed sessions
    const avgIntegrityResult = await InterviewSession.aggregate([
      { $match: { status: 'completed', integrityScore: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$integrityScore' } } }
    ]);

    const avgIntegrityScore = avgIntegrityResult.length > 0 ? avgIntegrityResult[0].avgScore : 0;

    res.status(200).json({
      success: true,
      data: {
        total: totalSessions,
        active: activeSessions,
        completed: completedSessions,
        avgIntegrityScore: Math.round(avgIntegrityScore * 100) / 100,
        byStatus: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    End interview session
// @route   POST /api/sessions/:id/end
// @access  Private
exports.endSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    // Calculate final statistics
    const events = await DetectionEvent.find({ sessionId: req.params.id });
    
    const focusViolations = events.filter(e => 
      ['focus_lost', 'no_face'].includes(e.type)
    ).length;
    
    const objectViolations = events.filter(e => 
      ['phone', 'book', 'notes', 'device'].includes(e.type)
    ).length;
    
    const multiplePersonViolations = events.filter(e => 
      e.type === 'multiple_faces'
    ).length;

    // Calculate integrity score
    let integrityScore = 100;
    integrityScore -= focusViolations * 5;
    integrityScore -= objectViolations * 10;
    integrityScore -= multiplePersonViolations * 15;
    integrityScore = Math.max(0, integrityScore);

    const updatedSession = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        endTime: new Date(),
        integrityScore,
        totalEvents: events.length,
        focusViolations,
        objectViolations,
        multiplePersonViolations
      },
      { new: true }
    ).populate('candidateId', 'name email position');

    // Update candidate status
    await Candidate.findByIdAndUpdate(session.candidateId, {
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};