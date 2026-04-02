const { User } = require('../models');

/**
 * Middleware to check if 2FA is required
 * Should be used after successful login
 * Returns 429 if 2FA is enabled but not verified
 */
const require2FA = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body?.userId;

    if (!userId) {
      return res.status(401).json({ 
        error: 'User not authenticated' 
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    if (user.two_factor_enabled && !req.session?.verified_2fa) {
      // 2FA is enabled but not verified in this session
      return res.status(429).json({
        error: 'Two-factor authentication required',
        requires_otp: true,
        userId: user.id,
      });
    }

    next();
  } catch (error) {
    console.error('2FA check error:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

/**
 * Middleware to verify 2FA in session
 * After OTP verification, call this to mark session as verified
 */
const mark2FAVerified = (req, res, next) => {
  req.session = req.session || {};
  req.session.verified_2fa = true;
  next();
};

/**
 * Middleware to check 2FA requirement on login
 */
const check2FARequirement = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next();
    }

    const user = await User.findOne({ where: { email } });

    if (user && user.two_factor_enabled) {
      // Attach info to request
      req.two_factor_required = true;
      req.user_id_for_2fa = user.id;
    }

    next();
  } catch (error) {
    console.error('2FA requirement check error:', error);
    next(); // Don't block, continue with login
  }
};

module.exports = {
  require2FA,
  mark2FAVerified,
  check2FARequirement,
};
