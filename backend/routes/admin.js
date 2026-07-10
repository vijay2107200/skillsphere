const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, getAllGigs, blockUser, deleteGig } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/gigs', getAllGigs);
router.put('/users/:id/block', blockUser);
router.delete('/gigs/:id', deleteGig);

module.exports = router;
