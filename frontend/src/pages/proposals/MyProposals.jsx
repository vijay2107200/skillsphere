import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyProposals, updateProposalStatus } from '../../store/slices/gigSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const card = { background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' };

const STATUS_STYLE = {
  pending:   { background: '#fef3c7', color: '#b45309' },
  accepted:  { background: '#d1fae5', color: '#047857' },
  rejected:  { background: '#fee2e2', color: '#dc2626' },
  withdrawn: { background: '#f1f5f9', color: '#64748b' },
};

const emptyMilestone = { title: '', description: '', dueDate: '' };

export default function MyProposals() {
  const dispatch = useDispatch();
  const { myProposals, loading } = useSelector((s) => s.gigs);
  const [activePanel, setActivePanel] = useState(null);
  const [newMilestone, setNewMilestone] = useState(emptyMilestone);
  const [msLoading, setMsLoading] = useState(false);

  useEffect(() => { dispatch(fetchMyProposals()); }, [dispatch]);

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this proposal?')) return;
    const result = await dispatch(updateProposalStatus({ id, status: 'withdrawn' }));
    if (updateProposalStatus.fulfilled.match(result)) {
      toast.success('Proposal withdrawn');
      dispatch(fetchMyProposals());
    } else {
      toast.error(result.payload || 'Failed to withdraw');
    }
  };

  const addMilestone = async (proposalId) => {
    if (!newMilestone.title.trim()) { toast.error('Milestone title is required'); return; }
    setMsLoading(true);
    try {
      await api.post(`/proposals/${proposalId}/milestones`, newMilestone);
      toast.success('Milestone added');
      setNewMilestone(emptyMilestone);
      dispatch(fetchMyProposals());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add milestone');
    } finally { setMsLoading(false); }
  };

  const toggleMilestone = async (proposalId, milestoneId) => {
    try {
      await api.put(`/proposals/${proposalId}/milestones/${milestoneId}`);
      dispatch(fetchMyProposals());
    } catch { toast.error('Failed to update milestone'); }
  };

  const deleteMilestone = async (proposalId, milestoneId) => {
    try {
      await api.delete(`/proposals/${proposalId}/milestones/${milestoneId}`);
      toast.success('Milestone removed');
      dispatch(fetchMyProposals());
    } catch { toast.error('Failed to remove milestone'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1" style={{ color: '#0f172a' }}>My Proposals</h1>
      <p className="mb-8" style={{ color: '#64748b' }}>{myProposals.length} proposal{myProposals.length !== 1 ? 's' : ''} submitted</p>

      {loading ? (
        <div className="text-center py-16" style={{ color: '#94a3b8' }}>Loading...</div>
      ) : myProposals.length === 0 ? (
        <div className="text-center py-16">
          <p className="mb-4" style={{ color: '#94a3b8' }}>You haven't submitted any proposals yet.</p>
          <Link to="/gigs" className="text-white px-6 py-3 rounded-lg font-medium"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
            Browse Gigs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myProposals.map((p) => {
            const milestones = p.milestones || [];
            const done = milestones.filter((m) => m.completed).length;
            const showPanel = activePanel === p._id;

            return (
              <div key={p._id} style={card}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link to={`/gigs/${p.gig?._id}`} className="font-semibold transition" style={{ color: '#0f172a' }}
                        onMouseEnter={e => e.target.style.color = '#ea580c'}
                        onMouseLeave={e => e.target.style.color = '#0f172a'}>
                        {p.gig?.title}
                      </Link>
                      <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{p.gig?.category}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={STATUS_STYLE[p.status] || STATUS_STYLE.withdrawn}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: '#475569' }}>{p.coverLetter}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-4 text-sm" style={{ color: '#64748b' }}>
                      <span>Bid: <strong style={{ color: '#0f172a' }}>Rs.{p.bidAmount?.toLocaleString()}</strong></span>
                      <span>Delivery: <strong style={{ color: '#0f172a' }}>{p.deliveryDays} days</strong></span>
                      <span>{new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {p.status === 'accepted' && (
                        <button
                          onClick={() => setActivePanel(showPanel ? null : p._id)}
                          style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.8rem', borderRadius: '2rem', cursor: 'pointer', background: showPanel ? '#ffedd5' : '#f8fafc', color: showPanel ? '#c2410c' : '#334155', border: `1px solid ${showPanel ? '#fed7aa' : '#e2e8f0'}` }}>
                          {milestones.length > 0 ? `Milestones (${done}/${milestones.length})` : '+ Milestones'}
                        </button>
                      )}
                      {p.status === 'pending' && (
                        <button onClick={() => handleWithdraw(p._id)} className="text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  {p.status === 'accepted' && !showPanel && (
                    <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }}>
                      Your proposal was accepted! {milestones.length > 0 ? `${done}/${milestones.length} milestones complete.` : 'Add milestones to track progress.'}
                    </div>
                  )}
                </div>

                {/* Milestone Panel */}
                {showPanel && p.status === 'accepted' && (
                  <div style={{ borderTop: '1px solid #fed7aa', background: '#fffbf5', padding: '1.25rem 1.5rem', borderRadius: '0 0 1rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', margin: 0 }}>Project Milestones</p>
                      {milestones.length > 0 && (
                        <div style={{ flex: 1, maxWidth: '200px' }}>
                          <div style={{ height: '6px', background: '#fed7aa', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round((done / milestones.length) * 100)}%`, background: 'linear-gradient(90deg,#059669,#10b981)', borderRadius: '3px', transition: 'width 0.3s' }} />
                          </div>
                          <p style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem' }}>{done}/{milestones.length} complete ({Math.round((done / milestones.length) * 100)}%)</p>
                        </div>
                      )}
                    </div>

                    {milestones.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {milestones.map((m) => (
                          <div key={m._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: '#ffffff', border: `1px solid ${m.completed ? '#a7f3d0' : '#fed7aa'}`, borderRadius: '0.6rem' }}>
                            <button onClick={() => toggleMilestone(p._id, m._id)}
                              style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${m.completed ? '#059669' : '#d97706'}`, background: m.completed ? '#059669' : 'transparent', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
                              {m.completed && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
                            </button>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 600, color: m.completed ? '#059669' : '#0f172a', fontSize: '0.85rem', margin: 0, textDecoration: m.completed ? 'line-through' : 'none' }}>{m.title}</p>
                              {m.description && <p style={{ color: '#64748b', fontSize: '0.76rem', margin: '0.15rem 0 0' }}>{m.description}</p>}
                              {m.dueDate && <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>Due: {new Date(m.dueDate).toLocaleDateString('en-IN')}</p>}
                            </div>
                            <button onClick={() => deleteMilestone(p._id, m._id)}
                              style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add milestone form */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.6rem' }}>Add Milestone</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          placeholder="Milestone title *"
                          value={newMilestone.title}
                          onChange={(e) => setNewMilestone((f) => ({ ...f, title: e.target.value }))}
                          style={{ background: '#fffbf5', border: '1px solid #fed7aa', borderRadius: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '0.82rem', color: '#1e293b', outline: 'none' }}
                        />
                        <input
                          type="date"
                          value={newMilestone.dueDate}
                          onChange={(e) => setNewMilestone((f) => ({ ...f, dueDate: e.target.value }))}
                          style={{ background: '#fffbf5', border: '1px solid #fed7aa', borderRadius: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '0.82rem', color: '#1e293b', outline: 'none' }}
                        />
                      </div>
                      <input
                        placeholder="Description (optional)"
                        value={newMilestone.description}
                        onChange={(e) => setNewMilestone((f) => ({ ...f, description: e.target.value }))}
                        style={{ width: '100%', background: '#fffbf5', border: '1px solid #fed7aa', borderRadius: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '0.82rem', color: '#1e293b', outline: 'none', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                      />
                      <button onClick={() => addMilestone(p._id)} disabled={msLoading}
                        style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', border: 'none', borderRadius: '0.4rem', padding: '0.4rem 1.25rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', opacity: msLoading ? 0.7 : 1 }}>
                        {msLoading ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
