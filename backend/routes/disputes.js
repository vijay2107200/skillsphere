const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Dispute = require('../models/Dispute');

router.post('/', protect, async (req, res) => {
  try {
    const { against, gig, reason, description } = req.body;
    const dispute = await Dispute.create({ raisedBy: req.user._id, against, gig, reason, description });
    res.status(201).json({ success: true, dispute });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/my', protect, async (req, res) => {
  const disputes = await Dispute.find({
    $or: [{ raisedBy: req.user._id }, { against: req.user._id }],
  })
    .populate('raisedBy against', 'name email')
    .populate('gig', 'title')
    .sort({ createdAt: -1 });
  res.json({ success: true, disputes });
});

router.get('/all', protect, authorize('admin'), async (req, res) => {
  const disputes = await Dispute.find()
    .populate('raisedBy against', 'name email')
    .populate('gig', 'title')
    .sort({ createdAt: -1 });
  res.json({ success: true, disputes });
});

router.put('/:id/resolve', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status, resolution, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    res.json({ success: true, dispute });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
