import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const card = { background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' };
const inputStyle = { width: '100%', background: '#fffbf5', border: '1px solid #fed7aa', color: '#1e293b', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.875rem' };
const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#334155' };

const REASONS = ['Payment dispute', 'Work quality issue', 'Deadline missed', 'Fraud or scam', 'Harassment', 'Other'];

const STATUS_STYLE = {
  open:         { bg: '#fef3c7', color: '#b45309', label: 'Open' },
  under_review: { bg: '#dbeafe', color: '#1d4ed8', label: 'Under Review' },
  resolved:     { bg: '#d1fae5', color: '#047857', label: 'Resolved' },
  dismissed:    { bg: '#f1f5f9', color: '#64748b', label: 'Dismissed' },
};

export default function Disputes() {
  const { user } = useSelector((s) => s.auth);
  const [disputes, setDisputes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ against: '', reason: REASONS[0], description: '' });

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/disputes/my');
      setDisputes(data.disputes);
    } catch {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.against.trim() || !form.description.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/disputes', form);
      toast.success('Dispute filed successfully');
      setShowForm(false);
      setForm({ against: '', reason: REASONS[0], description: '' });
      loadDisputes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to file dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Dispute Resolution</h1>
          <p style={{ color: '#64748b', marginTop: '0.35rem', fontSize: '0.9rem' }}>File and track disputes with other users</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{ background: showForm ? '#f1f5f9' : 'linear-gradient(135deg,#ea580c,#f97316)', color: showForm ? '#334155' : '#fff', border: 'none', borderRadius: '0.75rem', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : '+ File a Dispute'}
        </button>
      </div>

      {/* File Dispute Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ ...card, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.25rem' }}>File a New Dispute</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Against (User Email)</label>
              <input
                value={form.against}
                onChange={(e) => setForm((f) => ({ ...f, against: e.target.value }))}
                placeholder="email@example.com"
                style={inputStyle}
              />
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>Enter the email of the user you're filing against</p>
            </div>
            <div>
              <label style={labelStyle}>Reason</label>
              <select
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                style={inputStyle}
              >
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the issue in detail..."
              rows={4}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.65rem 1.5rem', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </form>
      )}

      {/* Disputes List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <div style={{ ...card, padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚖️</div>
          <p style={{ color: '#0f172a', fontWeight: 600, fontSize: '1rem' }}>No disputes filed</p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            If you have an issue with another user, file a dispute above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {disputes.map((d) => {
            const ss = STATUS_STYLE[d.status] || STATUS_STYLE.open;
            const isMine = d.raisedBy?._id === user?._id;
            return (
              <div key={d._id} style={{ ...card, padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{d.reason}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '2rem', background: ss.bg, color: ss.color }}>
                        {ss.label}
                      </span>
                      {isMine ? (
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Filed by you</span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#dc2626' }}>Filed against you</span>
                      )}
                    </div>
                    <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{d.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                      {isMine && d.against && (
                        <span>Against: <strong style={{ color: '#475569' }}>{d.against.name}</strong></span>
                      )}
                      {!isMine && d.raisedBy && (
                        <span>From: <strong style={{ color: '#475569' }}>{d.raisedBy.name}</strong></span>
                      )}
                      {d.gig && <span>Gig: <strong style={{ color: '#475569' }}>{d.gig.title}</strong></span>}
                      <span>{new Date(d.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    {d.resolution && (
                      <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#d1fae5', borderRadius: '0.5rem', border: '1px solid #a7f3d0' }}>
                        <p style={{ color: '#047857', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.2rem' }}>Resolution</p>
                        <p style={{ color: '#065f46', fontSize: '0.8rem', margin: 0 }}>{d.resolution}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
