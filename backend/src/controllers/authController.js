const { User } = require('../models');
const { registerUser, loginUser } = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Register
const register = async (req, res, next) => {
  try {
    const { username, email, password, phone } = req.body;

    // Validation
    if (!username || !email || !password) {
      return sendError(res, 'Username, email, and password are required', 400);
    }

    const result = await registerUser(username, email, password, 'user', phone);
    sendSuccess(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const result = await loginUser(email, password);
    
    // Check if 2FA is enabled
    if (result.user && result.user.two_factor_enabled) {
      return sendSuccess(res, {
        ...result,
        requires_2fa: true,
      }, 'OTP verification required', 200);
    }
    
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Invalid')) {
      return sendError(res, error.message, 401);
    }
    next(error);
  }
};

// Get current user
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

// Update user location
const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return sendError(res, 'Latitude and longitude are required', 400);
    }

    const user = await User.findByPk(req.user.id);
    user.lat = lat;
    user.lng = lng;
    await user.save();

    sendSuccess(res, user, 'Location updated');
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, phone } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Nếu là Google account - chỉ cho phép update phone
    if (user.google_id) {
      if (phone) user.phone = phone;
      await user.save();
      return sendSuccess(res, user, 'Phone updated successfully');
    }

    // Nếu là tài khoản thường - cho phép update tất cả
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const toggleDriverStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user.role !== 'driver') {
      return sendError(res, 'Only drivers can update this', 403);
    }

    user.is_online = !user.is_online;
    await user.save();

    sendSuccess(res, { is_online: user.is_online }, 'Driver status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  updateLocation,
  toggleDriverStatus,
};
