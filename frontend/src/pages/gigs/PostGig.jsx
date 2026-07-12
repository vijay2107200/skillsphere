import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createGig } from '../../store/slices/gigSlice';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Design',
  'Writing', 'Marketing', 'Data Science', 'Video & Animation', 'Other',
];

const inputStyle = {
  width: '100%', background: '#fffbf5', border: '1px solid #fed7aa',
  color: '#1e293b', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box',
};

export default function PostGig() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.gigs);

  const [form, setForm] = useState({
    title: '', description: '', category: 'Web Development',
    skillsInput: '', budgetType: 'fixed', budgetMin: '', budgetMax: '', deadline: '',
  });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.budgetMin) > Number(form.budgetMax)) { toast.error('Min budget cannot exceed max budget'); return; }
    const skills = form.skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const result = await dispatch(createGig({
      title: form.title, description: form.description, category: form.category, skills,
      budgetType: form.budgetType, budgetMin: Number(form.budgetMin), budgetMax: Number(form.budgetMax),
      deadline: form.deadline || undefined,
    }));
    if (createGig.fulfilled.match(result)) { toast.success('Gig posted successfully!'); navigate('/my-gigs'); }
    else toast.error(result.payload || 'Failed to post gig');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1" style={{ color: '#0f172a' }}>Post a Gig</h1>
      <p className="mb-8" style={{ color: '#64748b' }}>Describe your project and find the perfect freelancer</p>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #fed7aa', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' }}>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Build a React e-commerce website" style={inputStyle} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={5}
            placeholder="Describe your project in detail..." style={{ ...inputStyle, resize: 'none' }} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Category *</label>
          <select name="category" value={form.category} onChange={handleChange} style={{ ...inputStyle, background: '#ffffff' }}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Required Skills</label>
          <input name="skillsInput" value={form.skillsInput} onChange={handleChange}
            placeholder="e.g. React, Node.js, MongoDB (comma separated)" style={inputStyle} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#334155' }}>Budget Type</label>
          <div className="flex gap-4">
            {['fixed', 'hourly'].map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="budgetType" value={t} checked={form.budgetType === t} onChange={handleChange} />
                <span className="text-sm capitalize" style={{ color: '#334155' }}>{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Min Budget (Rs.) *</label>
            <input type="number" name="budgetMin" value={form.budgetMin} onChange={handleChange} required min={1} placeholder="e.g. 5000" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Max Budget (Rs.) *</label>
            <input type="number" name="budgetMax" value={form.budgetMax} onChange={handleChange} required min={1} placeholder="e.g. 15000" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Deadline (optional)</label>
          <input type="date" name="deadline" value={form.deadline} onChange={handleChange}
            min={new Date().toISOString().split('T')[0]} style={{ ...inputStyle, colorScheme: 'light' }} />
        </div>

        {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}

        <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Posting...' : 'Post Gig'}
        </button>
      </form>
    </div>
  );
}
