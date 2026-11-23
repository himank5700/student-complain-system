const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public authentication routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (Requires valid JWT)
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
