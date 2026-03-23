const express = require('express');
const { body } = require('express-validator'); // Using 'body' for explicit body validation
const { analyzeUrl, getJobStatus, getJobResult } = require('../controllers/scrapingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Define the validation middleware explicitly using 'body'
const validateUrlMiddleware = body('url', 'Valid URL is required').isURL();
// Add a console log to check the type of the middleware
console.log('Type of validateUrlMiddleware:', typeof validateUrlMiddleware); // This should log 'function'

router.post('/analyze', authMiddleware, validateUrlMiddleware, analyzeUrl);

router.get('/status/:jobId', authMiddleware, getJobStatus);
router.get('/result/:jobId', authMiddleware, getJobResult);

module.exports = router;