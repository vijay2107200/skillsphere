const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  gig:              { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  proposal:         { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
  client:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:           { type: Number, required: true },
  currency:         { type: String, default: 'INR' },
  status:           { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  razorpayOrderId:  { type: String },
  razorpayPaymentId:{ type: String },
  razorpaySignature:{ type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
