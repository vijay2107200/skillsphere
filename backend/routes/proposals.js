const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  submitProposal, getGigProposals, getMyProposals, updateProposalStatus, getMyGigsAccepted,
} = require('../controllers/proposalController');

router.post('/gig/:gigId', protect, authorize('freelancer'), submitProposal);
router.get('/gig/:gigId', protect, authorize('client', 'admin'), getGigProposals);
router.get('/my', protect, authorize('freelancer'), getMyProposals);
router.put('/:id/status', protect, updateProposalStatus);
router.get('/my-gigs-accepted', protect, authorize('client'), getMyGigsAccepted);

module.exports = router;
