const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createGig, getGigs, getGig, updateGig, deleteGig, getMyGigs,
} = require('../controllers/gigController');
const FreelancerProfile = require('../models/FreelancerProfile');
const Gig = require('../models/Gig');

router.get('/', getGigs);
router.get('/my', protect, getMyGigs);

router.get('/recommended', protect, authorize('freelancer'), async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({ user: req.user._id });
    if (!profile || !profile.skills.length) return res.json({ success: true, gigs: [] });

    const freelancerSkills = profile.skills.map((s) => (s.name || s).toLowerCase());
    const gigs = await Gig.find({ status: 'open' }).populate('client', 'name').lean();

    const scored = gigs
      .map((gig) => {
        const gigSkills = (gig.skills || []).map((s) => s.toLowerCase());
        const matched = gigSkills.filter((s) =>
          freelancerSkills.some((fs) => fs.includes(s) || s.includes(fs))
        );
        return { ...gig, matchScore: matched.length, matchedSkills: matched };
      })
      .filter((g) => g.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    res.json({ success: true, gigs: scored });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', getGig);
router.post('/', protect, authorize('client', 'admin'), createGig);
router.put('/:id', protect, authorize('client', 'admin'), updateGig);
router.delete('/:id', protect, authorize('client', 'admin'), deleteGig);

module.exports = router;
