const express = require('express');
const { body } = require('express-validator');
const {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  getSessionStats,
  endSession
} = require('../controllers/sessionController');

const router = express.Router();

// Validation middleware
const sessionValidation = [
  body('candidateId')
    .isMongoId()
    .withMessage('Please provide a valid candidate ID'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start time'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end time')
];

const sessionUpdateValidation = [
  body('status')
    .optional()
    .isIn(['active', 'completed', 'terminated', 'paused'])
    .withMessage('Status must be one of: active, completed, terminated, paused'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end time'),
  body('sessionNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Session notes cannot exceed 1000 characters')
];

// Routes
router.route('/')
  .get(getSessions)
  .post(sessionValidation, createSession);

router.route('/stats')
  .get(getSessionStats);

router.route('/:id')
  .get(getSession)
  .put(sessionUpdateValidation, updateSession)
  .delete(deleteSession);

router.route('/:id/end')
  .post(endSession);

module.exports = router;