const express = require('express');
const { check } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming this path is correct

const router = express.Router();

router.post('/register', [
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
], register); // This array of validation middleware is correct

router.post('/login', login);
router.get('/me', authMiddleware, getMe);

module.exports = router;