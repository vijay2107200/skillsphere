const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');
const {
  register, login, verifyEmail, verifyTwoFactor, toggleTwoFactor,
  forgotPassword, resetPassword, getMe,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/2fa/verify', verifyTwoFactor);
router.put('/2fa/toggle', protect, toggleTwoFactor);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`, session: false }),
  (req, res) => {
    const token = generateToken(req.user._id, req.user.role);
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
  }
);

module.exports = router;
