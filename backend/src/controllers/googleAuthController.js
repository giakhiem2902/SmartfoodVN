const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Google OAuth Callback Handler
 * Called after successful Google authentication
 */
exports.googleCallback = async (req, res) => {
  try {
    const { id, email, displayName, photos } = req.user;
    
    let user = await User.findOne({ where: { google_id: id } });
    
    if (!user) {
      // Create new user from Google profile
      user = await User.create({
        email,
        username: displayName || email.split('@')[0],
        password: await bcrypt.hash(Math.random().toString(), 10),
        role: 'user',
        google_id: id,
        image_url: photos && photos[0] ? photos[0].value : null,
      });
    } else {
      // Update existing user with latest Google info
      if (!user.image_url && photos && photos[0]) {
        user.image_url = photos[0].value;
        await user.save();
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send back user data and token
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        image_url: user.image_url,
        two_factor_enabled: user.two_factor_enabled,
      },
      requiresOTP: user.two_factor_enabled,
    });
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Google authentication failed' 
    });
  }
};

/**
 * Verify Google Access Token (for Web & Mobile)
 * Frontend sends access_token from useGoogleLogin → fetch userinfo from Google API
 */
exports.verifyGoogleToken = async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Use Google userinfo endpoint — works with access_token (not id_token)
    // Node 18+ has built-in fetch
    const googleRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!googleRes.ok) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired Google access token' 
      });
    }

    const { sub, email, name, picture } = await googleRes.json();

    // Find or create user
    let user = await User.findOne({ where: { google_id: sub } });

    if (!user) {
      // Check if email already registered (non-Google account)
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        // Link Google account to existing user
        existingUser.google_id = sub;
        if (!existingUser.image_url) existingUser.image_url = picture;
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new user
        user = await User.create({
          google_id: sub,
          email,
          username: name || email.split('@')[0],
          password: null,
          role: 'user',
          image_url: picture,
        });
      }
    } else {
      // Update avatar if missing
      if (!user.image_url && picture) {
        user.image_url = picture;
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        image_url: user.image_url,
        two_factor_enabled: user.two_factor_enabled,
      },
      requiresOTP: user.two_factor_enabled,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false,
      error: 'Google authentication failed' 
    });
  }
};

/**
 * Generate 2FA Secret and QR Code
 */
exports.generate2FASecret = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (user.two_factor_enabled) {
      return res.status(400).json({ 
        error: '2FA is already enabled. Disable it first.' 
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `SmartFood (${user.email})`,
      issuer: 'SmartFood',
      length: 32,
    });

    // Generate QR Code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode,
      manual_entry_key: secret.base32,
      message: 'Scan QR code with Google Authenticator, Authy, or Microsoft Authenticator',
    });
  } catch (error) {
    console.error('2FA generation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Verify OTP Token
 */
exports.verify2FAToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || token.length !== 6) {
      return res.status(400).json({ 
        error: 'Invalid OTP format' 
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user.two_factor_secret) {
      return res.status(400).json({ 
        error: '2FA not setup' 
      });
    }

    // Verify OTP
    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: parseInt(process.env.TWO_FACTOR_WINDOW || 2),
    });

    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid OTP token',
        retry: true 
      });
    }

    res.json({ 
      success: true, 
      message: 'OTP verified' 
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Confirm and Enable 2FA
 */
exports.confirm2FA = async (req, res) => {
  try {
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({ 
        error: 'Secret and OTP token required' 
      });
    }

    // Verify OTP with provided secret
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: parseInt(process.env.TWO_FACTOR_WINDOW || 2),
    });

    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid OTP token' 
      });
    }

    // Save to user
    const user = await User.findByPk(req.user.id);
    user.two_factor_secret = secret;
    user.two_factor_enabled = true;
    await user.save();

    res.json({ 
      success: true, 
      message: '2FA enabled successfully',
      user: {
        id: user.id,
        two_factor_enabled: user.two_factor_enabled,
      }
    });
  } catch (error) {
    console.error('2FA confirmation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Disable 2FA
 */
exports.disable2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        error: 'OTP token required to disable 2FA' 
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user.two_factor_enabled) {
      return res.status(400).json({ 
        error: '2FA is not enabled' 
      });
    }

    // Verify OTP before disabling
    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: parseInt(process.env.TWO_FACTOR_WINDOW || 2),
    });

    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid OTP token' 
      });
    }

    // Disable 2FA
    user.two_factor_enabled = false;
    user.two_factor_secret = null;
    await user.save();

    res.json({ 
      success: true, 
      message: '2FA disabled successfully',
      user: {
        id: user.id,
        two_factor_enabled: user.two_factor_enabled,
      }
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Get backup codes (for account recovery)
 */
exports.getBackupCodes = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user.two_factor_enabled) {
      return res.status(400).json({ 
        error: '2FA must be enabled first' 
      });
    }

    // Generate 10 backup codes (8 ký tự mỗi code)
    const plainCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Hash từng code trước khi lưu vào DB
    const hashedCodes = await Promise.all(
      plainCodes.map(code => bcrypt.hash(code, 10))
    );

    // Lưu hashed codes vào database
    user.backup_codes = JSON.stringify(hashedCodes);
    await user.save();

    res.json({
      success: true,
      backup_codes: plainCodes, // Chỉ trả về plain text 1 lần duy nhất
      message: 'Lưu các mã này ở nơi an toàn. Mỗi mã chỉ dùng được 1 lần khi mất quyền truy cập vào app xác thực.',
    });
  } catch (error) {
    console.error('Backup codes error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Login using a backup code (thay thế OTP khi mất thiết bị)
 */
exports.verifyBackupCode = async (req, res) => {
  try {
    const { userId, backupCode } = req.body;

    if (!userId || !backupCode) {
      return res.status(400).json({ error: 'userId và backupCode là bắt buộc' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.backup_codes) {
      return res.status(400).json({ error: 'Không có backup codes' });
    }

    const hashedCodes = JSON.parse(user.backup_codes);
    let matchIndex = -1;

    // Kiểm tra từng code
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(backupCode.toUpperCase(), hashedCodes[i]);
      if (isMatch) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex === -1) {
      return res.status(401).json({ error: 'Backup code không hợp lệ' });
    }

    // Xóa code đã dùng (mỗi code chỉ dùng 1 lần)
    hashedCodes.splice(matchIndex, 1);
    user.backup_codes = JSON.stringify(hashedCodes);
    await user.save();

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
      remaining_codes: hashedCodes.length,
      message: `Đăng nhập thành công. Còn ${hashedCodes.length} backup codes.`,
    });
  } catch (error) {
    console.error('Backup code verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Check if user has 2FA enabled
 */
exports.check2FAStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    res.json({
      success: true,
      two_factor_enabled: user.two_factor_enabled,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
