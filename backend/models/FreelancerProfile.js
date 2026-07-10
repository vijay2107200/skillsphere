const mongoose = require('mongoose');

const freelancerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, default: '' },
  skills: [{ name: String, level: { type: String, enum: ['beginner', 'intermediate', 'expert'] } }],
  hourlyRate: { type: Number, default: 0 },
  location: { type: String, default: '' },
  portfolio: [{ title: String, description: String, imageUrl: String, projectUrl: String }],
  certifications: [{ name: String, issuer: String, year: Number }],
  experience: [{ title: String, company: String, from: Date, to: Date, description: String }],
  isVerified: { type: Boolean, default: false },
  reputationScore: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('FreelancerProfile', freelancerProfileSchema);
