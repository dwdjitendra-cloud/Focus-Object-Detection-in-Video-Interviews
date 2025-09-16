const express = require('express');
const {
  generateReport,
  generatePDFReport,
  generateCSVReport,
  getReportStats
} = require('../controllers/reportController');

const router = express.Router();

// Routes
router.route('/stats')
  .get(getReportStats);

router.route('/:sessionId')
  .get(generateReport);

router.route('/:sessionId/pdf')
  .get(generatePDFReport);

router.route('/:sessionId/csv')
  .get(generateCSVReport);

module.exports = router;