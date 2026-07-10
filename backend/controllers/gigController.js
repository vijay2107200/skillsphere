const Gig = require('../models/Gig');

exports.createGig = async (req, res) => {
  const { title, description, category, skills, budgetType, budgetMin, budgetMax, deadline } = req.body;
  const gig = await Gig.create({
    client: req.user._id,
    title, description, category,
    skills: skills || [],
    budgetType: budgetType || 'fixed',
    budgetMin, budgetMax,
    deadline: deadline || null,
  });
  res.status(201).json({ success: true, gig });
};

exports.getGigs = async (req, res) => {
  const { search, category, budgetMin, budgetMax, page = 1, limit = 10 } = req.query;
  const filter = { status: 'open' };

  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (budgetMin || budgetMax) {
    filter.budgetMax = {};
    if (budgetMin) filter.budgetMax.$gte = Number(budgetMin);
    if (budgetMax) filter.budgetMin = { $lte: Number(budgetMax) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [gigs, total] = await Promise.all([
    Gig.find(filter)
      .populate('client', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Gig.countDocuments(filter),
  ]);

  res.json({ success: true, gigs, total, pages: Math.ceil(total / limit), page: Number(page) });
};

exports.getGig = async (req, res) => {
  const gig = await Gig.findById(req.params.id).populate('client', 'name avatar email');
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  res.json({ success: true, gig });
};

exports.updateGig = async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const updated = await Gig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, gig: updated });
};

exports.deleteGig = async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  if (gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  await gig.deleteOne();
  res.json({ success: true, message: 'Gig deleted' });
};

exports.getMyGigs = async (req, res) => {
  const gigs = await Gig.find({ client: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, gigs });
};
