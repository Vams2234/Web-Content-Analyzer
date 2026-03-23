const express = require('express');
const { getHistory, getAnalysisById, deleteAnalysis, exportAnalysis } = require('../controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/history', authMiddleware, getHistory);
router.get('/:id', authMiddleware, getAnalysisById);
router.delete('/:id', authMiddleware, deleteAnalysis);
router.post('/:id/export', authMiddleware, exportAnalysis);

module.exports = router;