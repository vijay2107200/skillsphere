const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile, getFreelancerProfile, getAllFreelancers } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.get('/freelancers', getAllFreelancers);
router.get('/freelancer/:id', getFreelancerProfile);

module.exports = router;
