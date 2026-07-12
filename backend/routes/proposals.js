const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  submitProposal, getGigProposals, getMyProposals, updateProposalStatus, getMyGigsAccepted,
} = require('../controllers/proposalController');
const Proposal = require('../models/Proposal');

router.post('/gig/:gigId', protect, authorize('freelancer'), submitProposal);
router.get('/gig/:gigId', protect, authorize('client', 'admin'), getGigProposals);
router.get('/my', protect, authorize('freelancer'), getMyProposals);
router.put('/:id/status', protect, updateProposalStatus);
router.get('/my-gigs-accepted', protect, authorize('client'), getMyGigsAccepted);

router.post('/:id/milestones', protect, authorize('freelancer'), async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    if (proposal.freelancer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (!req.body.title?.trim()) return res.status(400).json({ message: 'Title is required' });

    proposal.milestones.push({ title: req.body.title, description: req.body.description || '', dueDate: req.body.dueDate || undefined });
    await proposal.save();
    res.json({ success: true, proposal });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/milestones/:milestoneId', protect, authorize('freelancer'), async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    if (proposal.freelancer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const milestone = proposal.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    milestone.completed = !milestone.completed;
    milestone.completedAt = milestone.completed ? new Date() : undefined;
    await proposal.save();
    res.json({ success: true, proposal });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/milestones/:milestoneId', protect, authorize('freelancer'), async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    if (proposal.freelancer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    proposal.milestones.pull(req.params.milestoneId);
    await proposal.save();
    res.json({ success: true, proposal });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
