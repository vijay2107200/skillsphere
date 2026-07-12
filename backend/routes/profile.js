const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile, getFreelancerProfile, getAllFreelancers } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const FreelancerProfile = require('../models/FreelancerProfile');
const Proposal = require('../models/Proposal');

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.get('/freelancers', getAllFreelancers);
router.get('/freelancer/:id', getFreelancerProfile);

router.get('/analytics', protect, async (req, res) => {
  if (req.user.role !== 'freelancer') return res.status(403).json({ message: 'Freelancers only' });
  const [profile, proposals] = await Promise.all([
    FreelancerProfile.findOne({ user: req.user._id }),
    Proposal.find({ freelancer: req.user._id }),
  ]);

  const accepted = proposals.filter((p) => p.status === 'accepted');
  const stats = {
    totalEarnings: profile?.totalEarnings || 0,
    completedJobs: profile?.completedJobs || 0,
    reputationScore: profile?.reputationScore || 0,
    totalProposals: proposals.length,
    pendingProposals: proposals.filter((p) => p.status === 'pending').length,
    acceptedProposals: accepted.length,
    rejectedProposals: proposals.filter((p) => p.status === 'rejected').length,
    successRate: proposals.length > 0 ? Math.round((accepted.length / proposals.length) * 100) : 0,
  };

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleString('default', { month: 'short' }), month: d.getMonth(), year: d.getFullYear(), earnings: 0 });
  }
  accepted.forEach((p) => {
    const d = new Date(p.createdAt);
    const m = months.find((x) => x.month === d.getMonth() && x.year === d.getFullYear());
    if (m) m.earnings += p.bidAmount || 0;
  });

  res.json({ success: true, stats, monthlyEarnings: months });
});

module.exports = router;
