const mongoose = require('mongoose');

const detectionEventSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: [true, 'Session ID is required']
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Candidate ID is required']
  },
  type: {
    type: String,
    required: [true, 'Event type is required'],
    enum: [
      'focus_lost',
      'no_face',
      'multiple_faces',
      'phone',
      'book',
      'notes',
      'device',
      'unauthorized_person',
      'suspicious_behavior',
      'drowsiness',
      'background_voice'
    ]
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  },
  duration: {
    type: Number, // in milliseconds
    min: 0
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  severity: {
    type: String,
    required: [true, 'Severity is required'],
    enum: ['low', 'medium', 'high', 'critical']
  },
  coordinates: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  additionalData: {
    type: mongoose.Schema.Types.Mixed
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
detectionEventSchema.index({ sessionId: 1, timestamp: 1 });
detectionEventSchema.index({ candidateId: 1 });
detectionEventSchema.index({ type: 1 });
detectionEventSchema.index({ severity: 1 });
detectionEventSchema.index({ timestamp: 1 });

// Static method to get events by session
detectionEventSchema.statics.getEventsBySession = function(sessionId) {
  return this.find({ sessionId }).sort({ timestamp: 1 });
};

// Static method to get violation summary
detectionEventSchema.statics.getViolationSummary = function(sessionId) {
  return this.aggregate([
    { $match: { sessionId: mongoose.Types.ObjectId(sessionId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        severity: { $first: '$severity' }
      }
    }
  ]);
};

module.exports = mongoose.model('DetectionEvent', detectionEventSchema);