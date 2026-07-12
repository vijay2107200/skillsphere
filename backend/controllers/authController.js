const crypto = require('crypto');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// ─── helpers ──────────────────────────────────────────────────
const emailConfigured = () =>
  process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com' && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_app_password_here';

const trySendEmail = async (opts) => {
  if (!emailConfigured()) { console.log('[Email skipped] Not configured:', opts.subject); return false; }
  try { await sendEmail(opts); return true; } catch (err) { console.error('[Email error]', err.message); return false; }
};

const otpEmail = (name, otp, purpose) => `
  <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem;border:1px solid #fed7aa;border-radius:1rem">
    <h2 style="color:#ea580c;margin-top:0">SkillSphere</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>${purpose}</p>
    <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:0.75rem;padding:1.5rem;text-align:center;margin:1.5rem 0">
      <span style="font-size:2.5rem;font-weight:800;letter-spacing:0.4rem;color:#ea580c">${otp}</span>
    </div>
    <p style="color:#64748b;font-size:0.85rem">This code expires in <strong>10 minutes</strong>. Do not share it.</p>
  </div>`;

// ─── REGISTER ────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const needsVerify = emailConfigured();

  const user = await User.create({
    name, email, password,
    role: role === 'freelancer' ? 'freelancer' : 'client',
    isEmailVerified: !needsVerify,
    emailVerifyToken: crypto.createHash('sha256').update(verifyToken).digest('hex'),
    emailVerifyExpire: Date.now() + 24 * 60 * 60 * 1000,
  });

  if (user.role === 'freelancer') await FreelancerProfile.create({ user: user._id });
  else await ClientProfile.create({ user: user._id });

  if (needsVerify) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    const sent = await trySendEmail({
      to: user.email,
      subject: 'Verify your SkillSphere account',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem;border:1px solid #fed7aa;border-radius:1rem">
        <h2 style="color:#ea580c">SkillSphere</h2>
        <p>Hi <strong>${name}</strong>, welcome!</p>
        <p>Click the button below to verify your email:</p>
        <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#f97316);color:#fff;text-decoration:none;padding:0.75rem 2rem;border-radius:2rem;font-weight:700;margin:1rem 0">Verify Email</a>
        <p style="color:#64748b;font-size:0.85rem">Link expires in 24 hours.</p>
      </div>`,
    });
    if (sent) return res.status(201).json({ message: 'Account created! Check your email to verify.', requiresVerification: true });
  }

  res.status(201).json({ message: 'Account created! You can now login.', requiresVerification: false });
};

// ─── LOGIN ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  if (!user.isEmailVerified) return res.status(401).json({ message: 'Please verify your email first. Check your inbox.' });
  if (user.isBlocked) return res.status(403).json({ message: 'Account suspended. Contact support.' });

  // 2FA flow
  if (user.twoFactorEnabled) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorOTP = crypto.createHash('sha256').update(otp).digest('hex');
    user.twoFactorOTPExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await trySendEmail({
      to: user.email,
      subject: 'Your SkillSphere login code',
      html: otpEmail(user.name, otp, 'Here is your 2FA login code:'),
    });

    return res.json({ requiresTwoFactor: true, userId: user._id });
  }

  const token = generateToken(user._id, user.role);
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
};

// ─── VERIFY EMAIL ────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ emailVerifyToken: hashed, emailVerifyExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired verification link' });

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpire = undefined;
  await user.save();

  res.json({ message: 'Email verified! You can now login.' });
};

// ─── 2FA: VERIFY OTP ─────────────────────────────────────────
exports.verifyTwoFactor = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) return res.status(400).json({ message: 'User ID and OTP are required' });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (!user.twoFactorOTP || !user.twoFactorOTPExpire || user.twoFactorOTPExpire < Date.now()) {
    return res.status(400).json({ message: 'OTP expired. Please login again.' });
  }

  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashed !== user.twoFactorOTP) return res.status(400).json({ message: 'Incorrect code. Try again.' });

  user.twoFactorOTP = undefined;
  user.twoFactorOTPExpire = undefined;
  await user.save();

  const token = generateToken(user._id, user.role);
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
};

// ─── 2FA: TOGGLE ─────────────────────────────────────────────
exports.toggleTwoFactor = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.twoFactorEnabled = !user.twoFactorEnabled;
  await user.save();

  if (user.twoFactorEnabled) {
    await trySendEmail({
      to: user.email,
      subject: '2FA Enabled on your SkillSphere account',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem">
        <h2 style="color:#ea580c">2FA Enabled</h2>
        <p>Hi ${user.name}, Two-Factor Authentication is now <strong>enabled</strong> on your account.</p>
        <p>Each login will require a one-time code sent to this email.</p>
      </div>`,
    });
  }

  res.json({ success: true, twoFactorEnabled: user.twoFactorEnabled });
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: 'No user with that email' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const sent = await trySendEmail({
    to: user.email,
    subject: 'Password Reset — SkillSphere',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem">
      <h2 style="color:#ea580c">Reset Password</h2>
      <p>Hi ${user.name}, click below to reset your password (valid 1 hour):</p>
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#f97316);color:#fff;text-decoration:none;padding:0.75rem 2rem;border-radius:2rem;font-weight:700;margin:1rem 0">Reset Password</a>
    </div>`,
  });

  if (!sent) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return res.status(500).json({ message: 'Email not configured. Add EMAIL_USER and EMAIL_PASS to .env' });
  }
  res.json({ message: 'Password reset email sent' });
};

// ─── RESET PASSWORD ──────────────────────────────────────────
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

// ─── GET ME ──────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -twoFactorOTP');
  res.json({ user });
};
