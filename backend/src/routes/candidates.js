const express = require('express');
const { body } = require('express-validator');
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidateStats
} = require('../controllers/candidateController');

const router = express.Router();

// Validation middleware
const candidateValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('position')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters'),
  body('duration')
    .isInt({ min: 5, max: 300 })
    .withMessage('Duration must be between 5 and 300 minutes'),
  body('interviewDate')
    .isISO8601()
    .withMessage('Please provide a valid interview date')
];

// Routes
router.route('/')
  .get(getCandidates)
  .post(candidateValidation, createCandidate);

router.route('/stats')
  .get(getCandidateStats);

router.route('/:id')
  .get(getCandidate)
  .put(candidateValidation, updateCandidate)
  .delete(deleteCandidate);

module.exports = router;