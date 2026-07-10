const Proposal = require('../models/Proposal');
const Gig = require('../models/Gig');
const Notification = require('../models/Notification');

exports.submitProposal = async (req, res) => {
  const gig = await Gig.findById(req.params.gigId);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (gig.status !== 'open') return res.status(400).json({ message: 'This gig is no longer accepting proposals' });
  if (gig.client.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot bid on your own gig' });
  }

  const existing = await Proposal.findOne({ gig: req.params.gigId, freelancer: req.user._id });
  if (existing) return res.status(400).json({ message: 'You already submitted a proposal for this gig' });

  const { coverLetter, bidAmount, deliveryDays } = req.body;
  const proposal = await Proposal.create({
    gig: req.params.gigId,
    freelancer: req.user._id,
    coverLetter, bidAmount, deliveryDays,
  });

  await Gig.findByIdAndUpdate(req.params.gigId, { $inc: { proposalCount: 1 } });

  const notification = await Notification.create({
    user: gig.client,
    type: 'proposal_received',
    message: `${req.user.name} submitted a proposal for "${gig.title}"`,
    link: `/gigs/${gig._id}`,
  });

  const io = req.app.get('io');
  io.to(gig.client.toString()).emit('notification', notification);

  res.status(201).json({ success: true, proposal });
};

exports.getGigProposals = async (req, res) => {
  const gig = await Gig.findById(req.params.gigId);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const proposals = await Proposal.find({ gig: req.params.gigId })
    .populate('freelancer', 'name avatar email')
    .sort({ createdAt: -1 });

  res.json({ success: true, proposals });
};

exports.getMyProposals = async (req, res) => {
  const proposals = await Proposal.find({ freelancer: req.user._id })
    .populate('gig', 'title category budgetMin budgetMax status client')
    .sort({ createdAt: -1 });
  res.json({ success: true, proposals });
};

exports.getMyGigsAccepted = async (req, res) => {
  const proposals = await Proposal.find({ status: 'accepted' })
    .populate({ path: 'gig', match: { client: req.user._id }, select: 'title status client' })
    .populate('freelancer', 'name email')
    .sort({ createdAt: -1 });
  const filtered = proposals.filter((p) => p.gig !== null);
  res.json({ success: true, proposals: filtered });
};

exports.updateProposalStatus = async (req, res) => {
  const proposal = await Proposal.findById(req.params.id).populate('gig');
  if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

  const { status } = req.body;

  if (status === 'withdrawn') {
    if (proposal.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  } else {
    if (proposal.gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (status === 'accepted') {
      await Gig.findByIdAndUpdate(proposal.gig._id, {
        status: 'in_progress',
        hiredFreelancer: proposal.freelancer,
      });
      await Proposal.updateMany(
        { gig: proposal.gig._id, _id: { $ne: proposal._id } },
        { status: 'rejected' }
      );
    }

    const notifMsg = status === 'accepted'
      ? `Your proposal for "${proposal.gig.title}" was accepted!`
      : `Your proposal for "${proposal.gig.title}" was rejected.`;

    const notif = await Notification.create({
      user: proposal.freelancer,
      type: status === 'accepted' ? 'proposal_accepted' : 'proposal_rejected',
      message: notifMsg,
      link: `/gigs/${proposal.gig._id}`,
    });

    const io = req.app.get('io');
    io.to(proposal.freelancer.toString()).emit('notification', notif);
  }

  proposal.status = status;
  await proposal.save();
  res.json({ success: true, proposal });
};
