const crypto = require('crypto');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    name, email, password,
    role: role === 'freelancer' ? 'freelancer' : 'client',
    isEmailVerified: true,
    emailVerifyToken: crypto.createHash('sha256').update(verifyToken).digest('hex'),
    emailVerifyExpire: Date.now() + 24 * 60 * 60 * 1000,
  });

  if (user.role === 'freelancer') await FreelancerProfile.create({ user: user._id });
  else await ClientProfile.create({ user: user._id });

  try {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your SkillSphere account',
      html: `<p>Hi ${user.name},</p><p>Click below to verify your email:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
    });
  } catch (err) {
    console.log('Email not configured, skipping verification email.');
  }

  res.status(201).json({ message: 'Registration successful! You can now login.' });
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  if (!user.isEmailVerified) return res.status(401).json({ message: 'Please verify your email first' });
  if (!user.isActive) return res.status(403).json({ message: 'Account suspended. Contact support.' });

  const token = generateToken(user._id, user.role);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
};

// @GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ emailVerifyToken: hashed, emailVerifyExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpire = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully. You can now login.' });
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: 'No user with that email' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  await user.save();

  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - SkillSphere',
      html: `<p>Reset your password here (valid 1 hour):</p><a href="${resetUrl}">${resetUrl}</a>`,
    });
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({ message: 'Email could not be sent. Configure email settings.' });
  }
};

// @POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};
