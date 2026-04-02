const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * Local Strategy for Email/Password
 */
passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return done(null, false, { message: 'Email not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

/**
 * Google OAuth Strategy
 */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists by Google ID
      let user = await User.findOne({ 
        where: { google_id: profile.id } 
      });

      if (user) {
        return done(null, user);
      }

      // Check if user exists by email
      user = await User.findOne({ 
        where: { email: profile.emails[0].value } 
      });

      if (user) {
        // Link Google ID to existing account
        user.google_id = profile.id;
        if (!user.image_url && profile.photos[0]) {
          user.image_url = profile.photos[0].value;
        }
        await user.save();
        return done(null, user);
      }

      // Create new user
      const newUser = await User.create({
        google_id: profile.id,
        email: profile.emails[0].value,
        username: profile.displayName,
        password: await bcrypt.hash(Math.random().toString(), 10),
        role: 'user',
        image_url: profile.photos[0] ? profile.photos[0].value : null,
      });

      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }
));

/**
 * Serialize User
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize User
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
