const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', auth, authController.getCurrentUser);
router.put('/location', auth, authController.updateLocation);
router.post('/driver/toggle-status', auth, authController.toggleDriverStatus);

module.exports = router;
