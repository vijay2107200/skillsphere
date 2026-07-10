const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createReview, getUserReviews, getGigReviews } = require('../controllers/reviewController');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.get('/gig/:gigId', getGigReviews);

module.exports = router;
