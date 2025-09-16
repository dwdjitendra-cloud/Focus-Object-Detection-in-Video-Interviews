const DetectionEvent = require('../models/DetectionEvent');
const InterviewSession = require('../models/InterviewSession');
const { validationResult } = require('express-validator');

// @desc    Get all detection events
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Filter by session if provided
    if (req.query.sessionId) {
      query.sessionId = req.query.sessionId;
    }

    // Filter by candidate if provided
    if (req.query.candidateId) {
      query.candidateId = req.query.candidateId;
    }

    // Filter by event type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by severity if provided
    if (req.query.severity) {
      query.severity = req.query.severity;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) {
        query.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    const events = await DetectionEvent.find(query)
      .populate('sessionId', 'startTime status')
      .populate('candidateId', 'name email position')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DetectionEvent.countDocuments(query);
   
    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single detection event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = async (req, res) => {
  try {
    const event = await DetectionEvent.findById(req.params.id)
      .populate('sessionId')
      .populate('candidateId', 'name email position');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Detection event not found'
      });
    }
        console.log("Event fetched:", event);
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new detection event
// @route   POST /api/events
// @access  Private
exports.createEvent = async (req, res) => {
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

    // Verify session exists and is active
    const session = await InterviewSession.findById(req.body.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }


    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add events to inactive session'
      });
    }

    const event = await DetectionEvent.create({
      ...req.body,
      candidateId: session.candidateId
    });

    const populatedEvent = await DetectionEvent.findById(event._id)
      .populate('sessionId', 'startTime status')
      .populate('candidateId', 'name email position');

    res.status(201).json({
      success: true,
      data: populatedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update detection event
// @route   PUT /api/events/:id
// @access  Private
exports.updateEvent = async (req, res) => {
  try {
    let event = await DetectionEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Detection event not found'
      });
    }

    // If marking as resolved, set resolved timestamp
    if (req.body.resolved === true && !event.resolved) {
      req.body.resolvedAt = new Date();
      req.body.resolvedBy = req.user?.id;
    }

    event = await DetectionEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('sessionId', 'startTime status')
     .populate('candidateId', 'name email position');
         console.log("Event updated:", event);
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete detection event
// @route   DELETE /api/events/:id
// @access  Private
exports.deleteEvent = async (req, res) => {
  try {
    const event = await DetectionEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Detection event not found'
      });
    }

    await event.deleteOne();
    console.log("Event deleted:", event);
    res.status(200).json({
      success: true,
      message: 'Detection event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get events by session
// @route   GET /api/events/session/:sessionId
// @access  Private
exports.getEventsBySession = async (req, res) => {
  try {
    const events = await DetectionEvent.find({ sessionId: req.params.sessionId })
      .populate('candidateId', 'name email')
      .sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private
exports.getEventStats = async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    const query = sessionId ? { sessionId } : {};

    // Get event counts by type
    const eventsByType = await DetectionEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    // Get event counts by severity
    const eventsBySeverity = await DetectionEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get events over time (last 24 hours)
    const eventsOverTime = await DetectionEvent.aggregate([
      {
        $match: {
          ...query,
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d %H:00',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const totalEvents = await DetectionEvent.countDocuments(query);
    const recentEvents = await DetectionEvent.countDocuments({
      ...query,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalEvents,
        recent: recentEvents,
        byType: eventsByType,
        bySeverity: eventsBySeverity,
        overTime: eventsOverTime
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

// @desc    Bulk create events
// @route   POST /api/events/bulk
// @access  Private
exports.bulkCreateEvents = async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Events array is required'
      });
    }

    // Validate each event
    for (const event of events) {
      if (!event.sessionId || !event.type || !event.description || !event.severity) {
        return res.status(400).json({
          success: false,
          message: 'Each event must have sessionId, type, description, and severity'
        });
      }
    }

    // Get session info to add candidateId
    const sessionIds = [...new Set(events.map(e => e.sessionId))];
    const sessions = await InterviewSession.find({ _id: { $in: sessionIds } });
    const sessionMap = sessions.reduce((acc, session) => {
      acc[session._id.toString()] = session.candidateId;
      return acc;
    }, {});

    // Add candidateId to each event
    const eventsWithCandidateId = events.map(event => ({
      ...event,
      candidateId: sessionMap[event.sessionId],
      timestamp: event.timestamp || new Date()
    }));

    const createdEvents = await DetectionEvent.insertMany(eventsWithCandidateId);

    res.status(201).json({
      success: true,
      count: createdEvents.length,
      data: createdEvents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};