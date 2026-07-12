const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, minlength: 6 },
  role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'client' },
  avatar: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerifyToken: String,
  emailVerifyExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  googleId: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorOTP: String,
  twoFactorOTPExpire: Date,
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
