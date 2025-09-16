const InterviewSession = require('../models/InterviewSession');
const DetectionEvent = require('../models/DetectionEvent');
const Candidate = require('../models/Candidate');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

// @desc    Generate proctoring report
// @route   GET /api/reports/:sessionId
// @access  Private
exports.generateReport = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.sessionId)
      .populate('candidateId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    const events = await DetectionEvent.find({ sessionId: req.params.sessionId })
      .sort({ timestamp: 1 });

    // Calculate statistics
    const focusEvents = events.filter(e => 
      ['focus_lost', 'no_face', 'drowsiness'].includes(e.type)
    );
    
    const objectEvents = events.filter(e => 
      ['phone', 'book', 'notes', 'device'].includes(e.type)
    );

    const multiplePersonEvents = events.filter(e => 
      e.type === 'multiple_faces'
    );

    const behaviorEvents = events.filter(e => 
      ['suspicious_behavior', 'background_voice'].includes(e.type)
    );

    // Calculate integrity score if not already calculated
    let integrityScore = session.integrityScore;
    if (integrityScore === undefined || integrityScore === null) {
      integrityScore = 100;
      integrityScore -= focusEvents.length * 5;
      integrityScore -= objectEvents.length * 10;
      integrityScore -= multiplePersonEvents.length * 15;
      integrityScore -= behaviorEvents.length * 8;
      integrityScore = Math.max(0, integrityScore);
    }

    // Calculate actual duration
    const actualDuration = session.actualDuration || 
      (session.endTime && session.startTime ? 
        Math.round((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60)) : 
        0);

    // Event distribution
    const eventDistribution = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    // Severity distribution
    const severityDistribution = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});

    // Timeline analysis
    const timeline = events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      severity: event.severity,
      description: event.description,
      duration: event.duration,
      confidence: event.confidence
    }));

    const report = {
      candidate: {
        id: session.candidateId._id,
        name: session.candidateId.name,
        email: session.candidateId.email,
        position: session.candidateId.position,
        interviewDate: session.startTime,
        duration: actualDuration
      },
      session: {
        id: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        actualDuration
      },
      summary: {
        totalEvents: events.length,
        focusViolations: focusEvents.length,
        objectViolations: objectEvents.length,
        multiplePersonViolations: multiplePersonEvents.length,
        behaviorViolations: behaviorEvents.length,
        integrityScore: Math.round(integrityScore),
        duration: actualDuration
      },
      analytics: {
        eventDistribution,
        severityDistribution,
        averageConfidence: events.length > 0 ? 
          events.reduce((sum, e) => sum + (e.confidence || 0), 0) / events.length : 0
      },
      timeline,
      recommendations: generateRecommendations(integrityScore, events)
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Generate PDF report
// @route   GET /api/reports/:sessionId/pdf
// @access  Private
exports.generatePDFReport = async (req, res) => {
  try {
    console.log('Generating PDF report...');
    const session = await InterviewSession.findById(req.params.sessionId)
      .populate('candidateId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    const events = await DetectionEvent.find({ sessionId: req.params.sessionId })
      .sort({ timestamp: 1 });

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="proctoring-report-${session.candidateId.name.replace(/\s+/g, '-')}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Video Proctoring Report', 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);

    // Candidate Information
    doc.fontSize(16).text('Candidate Information', 50, 120);
    doc.fontSize(12)
       .text(`Name: ${session.candidateId.name}`, 50, 145)
       .text(`Email: ${session.candidateId.email}`, 50, 160)
       .text(`Position: ${session.candidateId.position}`, 50, 175)
       .text(`Interview Date: ${new Date(session.startTime).toLocaleDateString()}`, 50, 190);

    // Session Summary
    const focusEvents = events.filter(e => ['focus_lost', 'no_face'].includes(e.type));
    const objectEvents = events.filter(e => ['phone', 'book', 'notes', 'device'].includes(e.type));
    const integrityScore = session.integrityScore || 
      Math.max(0, 100 - focusEvents.length * 5 - objectEvents.length * 10);

    doc.fontSize(16).text('Session Summary', 50, 230);
    doc.fontSize(12)
       .text(`Total Events: ${events.length}`, 50, 255)
       .text(`Focus Violations: ${focusEvents.length}`, 50, 270)
       .text(`Object Violations: ${objectEvents.length}`, 50, 285)
       .text(`Integrity Score: ${Math.round(integrityScore)}/100`, 50, 300);

    // Event Timeline
    if (events.length > 0) {
      doc.fontSize(16).text('Event Timeline', 50, 340);
      let yPosition = 365;
      
      events.slice(0, 15).forEach((event, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(10)
           .text(`${index + 1}. ${new Date(event.timestamp).toLocaleTimeString()} - ${event.type} (${event.severity})`, 50, yPosition)
           .text(`   ${event.description}`, 50, yPosition + 12);
        yPosition += 30;
      });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Generate CSV report
// @route   GET /api/reports/:sessionId/csv
// @access  Private
exports.generateCSVReport = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.sessionId)
      .populate('candidateId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    const events = await DetectionEvent.find({ sessionId: req.params.sessionId })
      .sort({ timestamp: 1 });

    // Prepare CSV data
    const csvData = events.map(event => ({
      timestamp: new Date(event.timestamp).toISOString(),
      type: event.type,
      severity: event.severity,
      description: event.description,
      duration: event.duration || '',
      confidence: event.confidence ? Math.round(event.confidence * 100) : '',
      candidateName: session.candidateId.name,
      candidateEmail: session.candidateId.email,
      position: session.candidateId.position
    }));

    // Create temporary file
    const fileName = `proctoring-report-${session.candidateId.name.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../../temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'type', title: 'Event Type' },
        { id: 'severity', title: 'Severity' },
        { id: 'description', title: 'Description' },
        { id: 'duration', title: 'Duration (ms)' },
        { id: 'confidence', title: 'Confidence (%)' },
        { id: 'candidateName', title: 'Candidate Name' },
        { id: 'candidateEmail', title: 'Candidate Email' },
        { id: 'position', title: 'Position' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    // Send file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending CSV file:', err);
      }
      // Clean up temporary file
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temporary file:', unlinkErr);
        }
      });
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get report statistics
// @route   GET /api/reports/stats
// @access  Private
exports.getReportStats = async (req, res) => {
  try {
    const totalSessions = await InterviewSession.countDocuments({ status: 'completed' });
    
    // Average integrity score
    const avgScoreResult = await InterviewSession.aggregate([
      { $match: { status: 'completed', integrityScore: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$integrityScore' } } }
    ]);
    
    const avgIntegrityScore = avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;

    // Most common violations
    const commonViolations = await DetectionEvent.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Sessions by integrity score ranges
    const scoreDistribution = await InterviewSession.aggregate([
      { $match: { status: 'completed', integrityScore: { $exists: true } } },
      {
        $bucket: {
          groupBy: '$integrityScore',
          boundaries: [0, 50, 70, 85, 100],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        avgIntegrityScore: Math.round(avgIntegrityScore * 100) / 100,
        commonViolations,
        scoreDistribution
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

// Helper function to generate recommendations
function generateRecommendations(integrityScore, events) {
  const recommendations = [];

  if (integrityScore < 50) {
    recommendations.push({
      type: 'critical',
      message: 'Multiple serious violations detected. Consider additional verification measures.'
    });
  } else if (integrityScore < 70) {
    recommendations.push({
      type: 'warning',
      message: 'Several violations detected. Review individual events for context.'
    });
  } else if (integrityScore < 85) {
    recommendations.push({
      type: 'caution',
      message: 'Minor violations detected. Generally acceptable performance.'
    });
  } else {
    recommendations.push({
      type: 'success',
      message: 'Excellent integrity score. No significant violations detected.'
    });
  }

  // Specific recommendations based on event types
  const focusEvents = events.filter(e => ['focus_lost', 'no_face'].includes(e.type));
  const objectEvents = events.filter(e => ['phone', 'book', 'notes', 'device'].includes(e.type));
  const multiplePersonEvents = events.filter(e => e.type === 'multiple_faces');

  if (focusEvents.length > 5) {
    recommendations.push({
      type: 'attention',
      message: 'Frequent attention lapses detected. Consider environment setup guidance.'
    });
  }

  if (objectEvents.length > 0) {
    recommendations.push({
      type: 'security',
      message: 'Unauthorized objects detected. Verify candidate workspace setup.'
    });
  }

  if (multiplePersonEvents.length > 0) {
    recommendations.push({
      type: 'identity',
      message: 'Multiple persons detected. Verify candidate identity and privacy.'
    });
  }

  return recommendations;
}