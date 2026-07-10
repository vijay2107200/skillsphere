const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile Development', 'Design', 'Writing', 'Marketing', 'Data Science', 'Video & Animation', 'Other'],
  },
  skills: [{ type: String, trim: true }],
  budgetType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
  budgetMin: { type: Number, required: true },
  budgetMax: { type: Number, required: true },
  deadline: { type: Date },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
  proposalCount: { type: Number, default: 0 },
  hiredFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

gigSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Gig', gigSchema);
