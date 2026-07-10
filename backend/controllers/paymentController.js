const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Proposal = require('../models/Proposal');
const Gig = require('../models/Gig');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
exports.createOrder = async (req, res) => {
  const { proposalId } = req.body;

  const proposal = await Proposal.findById(proposalId).populate('gig');
  if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
  if (proposal.status !== 'accepted') return res.status(400).json({ message: 'Proposal is not accepted' });

  const gig = proposal.gig;
  if (gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the client can initiate payment' });
  }

  const existing = await Payment.findOne({ proposal: proposalId, status: 'paid' });
  if (existing) return res.status(400).json({ message: 'Payment already completed for this proposal' });

  const amount = proposal.bidAmount * 100; // Razorpay uses paise

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `receipt_${proposalId}`,
  });

  const payment = await Payment.create({
    gig: gig._id,
    proposal: proposalId,
    client: req.user._id,
    freelancer: proposal.freelancer,
    amount: proposal.bidAmount,
    razorpayOrderId: order.id,
  });

  res.json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    paymentId: payment._id,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
};

// POST /api/payments/verify
exports.verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    await Payment.findByIdAndUpdate(paymentId, { status: 'failed' });
    return res.status(400).json({ message: 'Payment verification failed' });
  }

  const payment = await Payment.findByIdAndUpdate(
    paymentId,
    { status: 'paid', razorpayPaymentId, razorpaySignature },
    { new: true }
  );

  res.json({ success: true, payment });
};

// POST /api/payments/mock-pay
exports.mockPay = async (req, res) => {
  const { proposalId, gigId, freelancerId, amount, txnId } = req.body;
  const existing = await Payment.findOne({ proposal: proposalId, status: 'paid' });
  if (existing) return res.json({ success: true, payment: existing });
  const payment = await Payment.create({
    gig: gigId, proposal: proposalId,
    client: req.user._id, freelancer: freelancerId,
    amount, status: 'paid',
    razorpayOrderId: txnId, razorpayPaymentId: txnId,
  });
  res.json({ success: true, payment });
};

// GET /api/payments/my
exports.getMyPayments = async (req, res) => {
  const payments = await Payment.find({
    $or: [{ client: req.user._id }, { freelancer: req.user._id }],
  })
    .populate('gig', 'title')
    .populate('client', 'name email')
    .populate('freelancer', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, payments });
};
