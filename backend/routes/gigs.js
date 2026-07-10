const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createGig, getGigs, getGig, updateGig, deleteGig, getMyGigs,
} = require('../controllers/gigController');

router.get('/', getGigs);
router.get('/my', protect, getMyGigs);
router.get('/:id', getGig);
router.post('/', protect, authorize('client', 'admin'), createGig);
router.put('/:id', protect, authorize('client', 'admin'), updateGig);
router.delete('/:id', protect, authorize('client', 'admin'), deleteGig);

module.exports = router;
