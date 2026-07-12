import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGig, submitProposal, fetchGigProposals, updateProposalStatus } from '../../store/slices/gigSlice';
import toast from 'react-hot-toast';
import LeaveReview from '../reviews/LeaveReview';

const card = { background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' };
const inputStyle = { width: '100%', background: '#fffbf5', border: '1px solid #fed7aa', color: '#1e293b', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box' };

export default function GigDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentGig, gigProposals, loading } = useSelector((s) => s.gigs);
  const { user } = useSelector((s) => s.auth);

  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposal, setProposal] = useState({ coverLetter: '', bidAmount: '', deliveryDays: '' });
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    dispatch(fetchGig(id));
    if (user?.role === 'client') dispatch(fetchGigProposals(id));
  }, [dispatch, id, user]);

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(submitProposal({ gigId: id, coverLetter: proposal.coverLetter, bidAmount: Number(proposal.bidAmount), deliveryDays: Number(proposal.deliveryDays) }));
    if (submitProposal.fulfilled.match(result)) { toast.success('Proposal submitted!'); setShowProposalForm(false); }
    else toast.error(result.payload || 'Failed to submit proposal');
  };

  const handleProposalAction = async (proposalId, status) => {
    const result = await dispatch(updateProposalStatus({ id: proposalId, status }));
    if (updateProposalStatus.fulfilled.match(result)) { toast.success(`Proposal ${status}`); dispatch(fetchGig(id)); }
    else toast.error(result.payload || 'Action failed');
  };

  if (loading && !currentGig) return <div className="text-center py-20" style={{ color: '#94a3b8' }}>Loading...</div>;
  if (!currentGig) return null;

  const isOwner = String(user?._id) === String(currentGig.client?._id);
  const isFreelancer = user?.role === 'freelancer';
  const deadline = currentGig.deadline ? new Date(currentGig.deadline).toLocaleDateString('en-IN') : 'Flexible';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-sm mb-6 block font-medium" style={{ color: '#c2410c', background: 'none', border: 'none', cursor: 'pointer' }}>
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">

          {/* Gig info */}
          <div className="p-6" style={card}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#ffedd5', color: '#c2410c' }}>
                {currentGig.category}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full"
                style={currentGig.status === 'open'
                  ? { background: '#d1fae5', color: '#047857' }
                  : { background: '#f1f5f9', color: '#64748b' }}>
                {currentGig.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#0f172a' }}>{currentGig.title}</h1>
            <p className="leading-relaxed whitespace-pre-wrap" style={{ color: '#475569' }}>{currentGig.description}</p>
            {currentGig.skills?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2" style={{ color: '#475569' }}>Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {currentGig.skills.map((s) => (
                    <span key={s} className="text-sm px-3 py-1 rounded-full" style={{ background: '#fff7ed', color: '#c2410c' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Proposal form for freelancer */}
          {isFreelancer && currentGig.status === 'open' && (
            <div className="p-6" style={card}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f172a' }}>Submit a Proposal</h2>
              {!showProposalForm ? (
                <button onClick={() => setShowProposalForm(true)} className="text-white px-6 py-2 rounded-lg font-medium"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                  Apply Now
                </button>
              ) : (
                <form onSubmit={handleProposalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Cover Letter *</label>
                    <textarea rows={5} required value={proposal.coverLetter}
                      onChange={(e) => setProposal((p) => ({ ...p, coverLetter: e.target.value }))}
                      placeholder="Explain why you're the best fit..."
                      style={{ ...inputStyle, resize: 'none' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Your Bid (Rs.) *</label>
                      <input type="number" required min={1} value={proposal.bidAmount}
                        onChange={(e) => setProposal((p) => ({ ...p, bidAmount: e.target.value }))}
                        placeholder="e.g. 8000" style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Delivery (days) *</label>
                      <input type="number" required min={1} value={proposal.deliveryDays}
                        onChange={(e) => setProposal((p) => ({ ...p, deliveryDays: e.target.value }))}
                        placeholder="e.g. 14" style={inputStyle} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={loading} className="text-white px-6 py-2 rounded-lg font-medium"
                      style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', opacity: loading ? 0.7 : 1 }}>
                      {loading ? 'Submitting...' : 'Submit Proposal'}
                    </button>
                    <button type="button" onClick={() => setShowProposalForm(false)} className="px-6 py-2 rounded-lg"
                      style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Review form for client on in_progress gig */}
          {isOwner && currentGig.status === 'in_progress' && currentGig.hiredFreelancer && !reviewDone && (
            <LeaveReview
              gigId={currentGig._id}
              revieweeId={currentGig.hiredFreelancer._id || currentGig.hiredFreelancer}
              revieweeName={currentGig.hiredFreelancer.name || 'Freelancer'}
              onDone={() => setReviewDone(true)}
            />
          )}

          {reviewDone && (
            <div className="p-5 text-center rounded-xl" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }}>
              Review submitted - thank you!
            </div>
          )}

          {/* Proposals list for owner */}
          {isOwner && (
            <div className="p-6" style={card}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f172a' }}>Proposals ({gigProposals.length})</h2>
              {gigProposals.length === 0 && <p className="text-sm" style={{ color: '#94a3b8' }}>No proposals yet.</p>}
              <div className="space-y-4">
                {gigProposals.map((p) => (
                  <div key={p._id} className="p-4 rounded-xl" style={{ background: '#fffbf5', border: '1px solid #fed7aa' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium" style={{ color: '#0f172a' }}>{p.freelancer?.name}</p>
                        <p className="text-sm" style={{ color: '#64748b' }}>{p.freelancer?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: '#0f172a' }}>Rs.{p.bidAmount?.toLocaleString()}</p>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>{p.deliveryDays} days</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3" style={{ color: '#475569' }}>{p.coverLetter}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={p.status === 'pending'
                          ? { background: '#fef3c7', color: '#b45309' }
                          : p.status === 'accepted'
                          ? { background: '#d1fae5', color: '#047857' }
                          : { background: '#fee2e2', color: '#dc2626' }}>
                        {p.status}
                      </span>
                      {p.status === 'pending' && currentGig.status === 'open' && (
                        <>
                          <button onClick={() => handleProposalAction(p._id, 'accepted')} className="text-xs text-white px-3 py-1 rounded-lg"
                            style={{ background: '#059669', border: '1px solid #047857' }}>
                            Accept
                          </button>
                          <button onClick={() => handleProposalAction(p._id, 'rejected')} className="text-xs px-3 py-1 rounded-lg"
                            style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="p-5" style={card}>
            <h3 className="font-semibold mb-3" style={{ color: '#475569' }}>Budget</h3>
            <p className="text-2xl font-bold" style={{ color: '#0f172a' }}>Rs.{currentGig.budgetMin?.toLocaleString()}  -  Rs.{currentGig.budgetMax?.toLocaleString()}</p>
            <p className="text-sm capitalize mt-1" style={{ color: '#64748b' }}>{currentGig.budgetType}</p>
          </div>
          <div className="p-5" style={card}>
            <h3 className="font-semibold mb-3" style={{ color: '#475569' }}>Details</h3>
            <dl className="space-y-2 text-sm">
              {[
                { label: 'Deadline', value: deadline },
                { label: 'Proposals', value: currentGig.proposalCount },
                { label: 'Client', value: currentGig.client?.name },
                { label: 'Posted', value: new Date(currentGig.createdAt).toLocaleDateString('en-IN') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt style={{ color: '#64748b' }}>{label}</dt>
                  <dd className="font-medium" style={{ color: '#0f172a' }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
