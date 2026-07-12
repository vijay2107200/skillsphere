const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  against: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
  reason: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'under_review', 'resolved', 'dismissed'], default: 'open' },
  resolution: { type: String, default: '' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
