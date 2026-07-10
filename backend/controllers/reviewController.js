const Review = require('../models/Review');
const Gig = require('../models/Gig');
const Notification = require('../models/Notification');

exports.createReview = async (req, res) => {
  const { gigId, revieweeId, rating, comment } = req.body;

  const gig = await Gig.findById(gigId);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (gig.status !== 'in_progress' && gig.status !== 'completed') {
    return res.status(400).json({ message: 'Can only review active or completed gigs' });
  }

  const existing = await Review.findOne({ gig: gigId, reviewer: req.user._id });
  if (existing) return res.status(400).json({ message: 'You already reviewed this gig' });

  const review = await Review.create({
    gig: gigId,
    reviewer: req.user._id,
    reviewee: revieweeId,
    rating,
    comment,
  });

  await review.populate('reviewer', 'name avatar');

  await Notification.create({
    user: revieweeId,
    type: 'review_received',
    message: `${req.user.name} left you a ${rating}-star review`,
    link: `/gigs/${gigId}`,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(revieweeId.toString()).emit('notification', {
      type: 'review_received',
      message: `${req.user.name} left you a ${rating}-star review`,
    });
  }

  res.status(201).json({ success: true, review });
};

exports.getUserReviews = async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate('reviewer', 'name avatar')
    .populate('gig', 'title')
    .sort({ createdAt: -1 });

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  res.json({ success: true, reviews, averageRating: Number(avg), total: reviews.length });
};

exports.getGigReviews = async (req, res) => {
  const reviews = await Review.find({ gig: req.params.gigId })
    .populate('reviewer', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews });
};
