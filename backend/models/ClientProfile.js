const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, default: '' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  totalSpent: { type: Number, default: 0 },
  postedGigs: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
