const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
require('dotenv').config();

const sequelize = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/authRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const storeRoutes = require('./src/routes/storeRoutes');
const googleAuthRoutes = require('./src/routes/googleAuthRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
require('./src/config/passport'); // Load passport strategies

const app = express();

// Middleware
app.use(helmet({
  crossOriginOpenerPolicy: false,      // Allow Google OAuth popup to work properly
  contentSecurityPolicy: false,        // Disable CSP so static images load from localhost:5000
  crossOriginResourcePolicy: false,    // Allow cross-origin image loading from React app
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Passport initialization
app.use(passport.initialize());

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/google', googleAuthRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'API running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Database sync and server start
const PORT = process.env.PORT || 5000;

sequelize.sync().then(async () => {
  // Check and create default store if needed
  try {
    const { Store, User } = require('./src/models');
    const storeCount = await Store.count();
    if (storeCount === 0) {
      console.log('📌 No stores found. Creating default store...');
      const firstUser = await User.findOne({ where: { role: 'admin' } });
      if (firstUser) {
        await Store.create({
          owner_id: firstUser.id,
          name: 'Default Store',
          address: 'Default Address',
          phone: '0000000000',
          lat: 10.7769,
          lng: 106.6966,
          is_active: true,
        });
        console.log('✅ Default store created');
      }
    }
  } catch (error) {
    console.error('⚠️ Error checking stores:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
