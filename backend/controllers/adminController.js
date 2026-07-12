const User = require('../models/User');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const Review = require('../models/Review');

exports.getStats = async (req, res) => {
  const [totalUsers, totalGigs, totalProposals, totalReviews, freelancers, clients] = await Promise.all([
    User.countDocuments(),
    Gig.countDocuments(),
    Proposal.countDocuments(),
    Review.countDocuments(),
    User.countDocuments({ role: 'freelancer' }),
    User.countDocuments({ role: 'client' }),
  ]);

  const gigsByStatus = await Gig.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  res.json({ success: true, stats: { totalUsers, totalGigs, totalProposals, totalReviews, freelancers, clients, gigsByStatus } });
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, users });
};

exports.getAllGigs = async (req, res) => {
  const gigs = await Gig.find().populate('client', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, gigs });
};

exports.blockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ success: true, isBlocked: user.isBlocked });
};

exports.deleteGig = async (req, res) => {
  await Gig.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.verifyFreelancer = async (req, res) => {
  const FreelancerProfile = require('../models/FreelancerProfile');
  const profile = await FreelancerProfile.findOne({ user: req.params.id });
  if (!profile) return res.status(404).json({ message: 'Freelancer profile not found' });
  profile.isVerified = !profile.isVerified;
  await profile.save();
  res.json({ success: true, isVerified: profile.isVerified });
};
