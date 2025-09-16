const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Candidate ID is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
    default: Date.now
  },
  endTime: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated', 'paused'],
    default: 'active'
  },
  actualDuration: {
    type: Number, // in minutes
    min: 0
  },
  integrityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  totalEvents: {
    type: Number,
    default: 0,
    min: 0
  },
  focusViolations: {
    type: Number,
    default: 0,
    min: 0
  },
  objectViolations: {
    type: Number,
    default: 0,
    min: 0
  },
  multiplePersonViolations: {
    type: Number,
    default: 0,
    min: 0
  },
  sessionNotes: {
    type: String,
    maxlength: [1000, 'Session notes cannot exceed 1000 characters']
  },
  recordingPath: {
    type: String
  },
  metadata: {
    browserInfo: String,
    deviceInfo: String,
    networkInfo: String,
    cameraResolution: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for events
interviewSessionSchema.virtual('events', {
  ref: 'DetectionEvent',
  localField: '_id',
  foreignField: 'sessionId'
});

// Virtual for duration calculation
interviewSessionSchema.virtual('calculatedDuration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Pre-save middleware to calculate actual duration
interviewSessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.actualDuration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  next();
});

// Index for better query performance
interviewSessionSchema.index({ candidateId: 1 });
interviewSessionSchema.index({ startTime: 1 });
interviewSessionSchema.index({ status: 1 });
interviewSessionSchema.index({ integrityScore: 1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);