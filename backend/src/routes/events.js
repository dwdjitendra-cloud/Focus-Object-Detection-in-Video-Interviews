const express = require('express');
const { body } = require('express-validator');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsBySession,
  getEventStats,
  bulkCreateEvents
} = require('../controllers/eventController');

const router = express.Router();

// Validation middleware
const eventValidation = [
  body('sessionId')
    .isMongoId()
    .withMessage('Please provide a valid session ID'),
  body('type')
    .isIn([
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
    ])
    .withMessage('Please provide a valid event type'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be one of: low, medium, high, critical'),
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid timestamp'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive number'),
  body('confidence')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence must be between 0 and 1')
];

const eventUpdateValidation = [
  body('resolved')
    .optional()
    .isBoolean()
    .withMessage('Resolved must be a boolean'),
  body('additionalData')
    .optional()
    .isObject()
    .withMessage('Additional data must be an object')
];

// Routes
router.route('/')
  .get(getEvents)
  .post(eventValidation, createEvent);

router.route('/bulk')
  .post(bulkCreateEvents);

router.route('/stats')
  .get(getEventStats);

router.route('/session/:sessionId')
  .get(getEventsBySession);

router.route('/:id')
  .get(getEvent)
  .put(eventUpdateValidation, updateEvent)
  .delete(deleteEvent);

module.exports = router;