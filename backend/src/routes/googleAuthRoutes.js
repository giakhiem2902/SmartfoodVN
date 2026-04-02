const express = require('express');
const passport = require('passport');
const googleAuthController = require('../controllers/googleAuthController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Google OAuth Routes
 */

// Initiate Google OAuth
router.get(
  '/login',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Google OAuth Callback
router.get(
  '/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login?error=auth_failed',
    session: false 
  }),
  googleAuthController.googleCallback
);

// Verify Google Token (for Mobile and Web)
router.post('/verify', googleAuthController.verifyGoogleToken);

/**
 * Two-Factor Authentication Routes
 */

// Generate 2FA Secret and QR Code
router.post('/2fa/generate', auth, googleAuthController.generate2FASecret);

// Verify OTP Token
router.post('/2fa/verify', auth, googleAuthController.verify2FAToken);

// Confirm 2FA Setup
router.post('/2fa/confirm', auth, googleAuthController.confirm2FA);

// Disable 2FA
router.post('/2fa/disable', auth, googleAuthController.disable2FA);

// Get Backup Codes
router.post('/2fa/backup-codes', auth, googleAuthController.getBackupCodes);

// Login with Backup Code (không cần auth vì chưa đăng nhập được)
router.post('/2fa/backup-codes/verify', googleAuthController.verifyBackupCode);

// Check 2FA Status
router.get('/2fa/status', auth, googleAuthController.check2FAStatus);

module.exports = router;
