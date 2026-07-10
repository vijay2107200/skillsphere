const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const User = require('../models/User');

// @GET /api/profile/me
exports.getMyProfile = async (req, res) => {
  const Model = req.user.role === 'freelancer' ? FreelancerProfile : ClientProfile;
  const profile = await Model.findOne({ user: req.user._id }).populate('user', 'name email avatar role');
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json(profile);
};

// @PUT /api/profile/me
exports.updateMyProfile = async (req, res) => {
  const Model = req.user.role === 'freelancer' ? FreelancerProfile : ClientProfile;
  const profile = await Model.findOneAndUpdate(
    { user: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('user', 'name email avatar role');
  res.json(profile);
};

// @GET /api/profile/freelancer/:id  (public)
exports.getFreelancerProfile = async (req, res) => {
  const profile = await FreelancerProfile.findOne({ user: req.params.id })
    .populate('user', 'name email avatar');
  if (!profile) return res.status(404).json({ message: 'Freelancer not found' });
  res.json(profile);
};

// @GET /api/profile/freelancers  (public - list all)
exports.getAllFreelancers = async (req, res) => {
  const { skill, location, minRate, maxRate } = req.query;
  let filter = {};
  if (skill) filter['skills.name'] = { $regex: skill, $options: 'i' };
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (minRate || maxRate) filter.hourlyRate = {};
  if (minRate) filter.hourlyRate.$gte = Number(minRate);
  if (maxRate) filter.hourlyRate.$lte = Number(maxRate);

  const freelancers = await FreelancerProfile.find(filter)
    .populate('user', 'name email avatar')
    .sort({ reputationScore: -1 });
  res.json(freelancers);
};
