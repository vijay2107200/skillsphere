import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const card = { background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' };

const STAT_CONFIG = [
  { key: 'totalUsers',     label: 'Total Users',     color: '#ea580c', bg: '#ffedd5', icon: 'U' },
  { key: 'totalGigs',      label: 'Total Gigs',      color: '#059669', bg: '#ecfdf5', icon: 'G' },
  { key: 'totalProposals', label: 'Total Proposals', color: '#b45309', bg: '#fffbeb', icon: 'P' },
  { key: 'totalReviews',   label: 'Total Reviews',   color: '#db2777', bg: '#fdf2f8', icon: 'R' },
  { key: 'freelancers',    label: 'Freelancers',     color: '#7c3aed', bg: '#f5f3ff', icon: 'F' },
  { key: 'clients',        label: 'Clients',         color: '#0284c7', bg: '#f0f9ff', icon: 'C' },
];

const STATUS_COLOR = {
  open:        { bg: '#d1fae5', color: '#047857', dot: '#059669' },
  in_progress: { bg: '#ffedd5', color: '#c2410c', dot: '#ea580c' },
  completed:   { bg: '#fef3c7', color: '#b45309', dot: '#d97706' },
};

const ROLE_COLOR = {
  admin:      { bg: '#fee2e2', color: '#dc2626' },
  freelancer: { bg: '#ffedd5', color: '#c2410c' },
  client:     { bg: '#d1fae5', color: '#047857' },
};

const DISPUTE_STATUS = {
  open:         { bg: '#fef3c7', color: '#b45309', label: 'Open' },
  under_review: { bg: '#dbeafe', color: '#1d4ed8', label: 'Under Review' },
  resolved:     { bg: '#d1fae5', color: '#047857', label: 'Resolved' },
  dismissed:    { bg: '#f1f5f9', color: '#64748b', label: 'Dismissed' },
};

export default function AdminDashboard() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveForm, setResolveForm] = useState({ status: 'resolved', resolution: '' });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') { navigate('/dashboard'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, g, d] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/gigs'),
        api.get('/disputes/all'),
      ]);
      setStats(s.data.stats);
      setUsers(u.data.users);
      setGigs(g.data.gigs);
      setDisputes(d.data.disputes);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (id, isBlocked) => {
    try {
      await api.put(`/admin/users/${id}/block`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBlocked: !isBlocked } : u));
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    } catch { toast.error('Action failed'); }
  };

  const handleVerify = async (id, currentVerified) => {
    try {
      await api.put(`/admin/users/${id}/verify`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, _isVerified: !currentVerified } : u));
      toast.success(currentVerified ? 'Verification removed' : 'Freelancer verified!');
    } catch { toast.error('Failed to verify'); }
  };

  const handleDeleteGig = async (id) => {
    if (!window.confirm('Delete this gig?')) return;
    try {
      await api.delete(`/admin/gigs/${id}`);
      setGigs((prev) => prev.filter((g) => g._id !== id));
      toast.success('Gig deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleResolveDispute = async (id) => {
    if (!resolveForm.resolution.trim()) { toast.error('Please provide a resolution'); return; }
    try {
      const { data } = await api.put(`/disputes/${id}/resolve`, resolveForm);
      setDisputes((prev) => prev.map((d) => d._id === id ? data.dispute : d));
      setResolvingId(null);
      setResolveForm({ status: 'resolved', resolution: '' });
      toast.success('Dispute resolved');
    } catch { toast.error('Failed to resolve dispute'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#ea580c' }}>...</div>
        <p>Loading admin data</p>
      </div>
    </div>
  );

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'users',    label: `Users (${users.length})` },
    { key: 'gigs',     label: `Gigs (${gigs.length})` },
    { key: 'disputes', label: `Disputes (${disputes.filter(d => d.status === 'open').length} open)` },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Admin Dashboard</h1>
          <p style={{ color: '#64748b', marginTop: '0.35rem', fontSize: '0.9rem' }}>Platform management &amp; analytics</p>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.4rem 1rem', borderRadius: '2rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', letterSpacing: '0.05em' }}>
          ADMIN ACCESS
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #fed7aa' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.6rem 1.25rem', borderRadius: '0.5rem 0.5rem 0 0', fontSize: '0.875rem', fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: tab === t.key ? 'linear-gradient(135deg,#ea580c,#f97316)' : 'transparent',
            color: tab === t.key ? '#fff' : '#78350f',
            borderBottom: tab === t.key ? '2px solid #f97316' : '2px solid transparent',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {STAT_CONFIG.slice(0, 4).map(({ key, label, color, bg, icon }) => (
              <StatCard key={key} label={label} value={stats[key]} color={color} bg={bg} icon={icon} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {STAT_CONFIG.slice(4).map(({ key, label, color, bg, icon }) => (
              <StatCard key={key} label={label} value={stats[key]} color={color} bg={bg} icon={icon} />
            ))}
          </div>
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Gigs by Status</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {stats.gigsByStatus.map((s) => {
                const sc = STATUS_COLOR[s._id] || STATUS_COLOR.completed;
                return (
                  <div key={s._id} style={{ padding: '0.6rem 1.25rem', borderRadius: '2rem', background: sc.bg, border: `1px solid ${sc.dot}44`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc.dot, display: 'inline-block' }}></span>
                    <span style={{ color: sc.color, fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{s._id?.replace('_', ' ')}</span>
                    <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.85rem' }}>{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>{users.length} registered users</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map((u) => {
              const rc = ROLE_COLOR[u.role] || ROLE_COLOR.client;
              const initials = u.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={u._id} style={{ ...card, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#ea580c,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ color: '#0f172a', fontWeight: 600, margin: 0 }}>{u.name}</p>
                        {u.role === 'freelancer' && u._isVerified && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '2rem', background: '#d1fae5', color: '#047857' }}>✓ Verified</span>
                        )}
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>{u.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.8rem', borderRadius: '2rem', background: rc.bg, color: rc.color, textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                    {u.isBlocked && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '2rem', background: '#fee2e2', color: '#dc2626' }}>Blocked</span>
                    )}
                    {u.role === 'freelancer' && (
                      <button
                        onClick={() => handleVerify(u._id, u._isVerified)}
                        style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.85rem', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid', background: u._isVerified ? '#fffbeb' : '#ecfdf5', borderColor: u._isVerified ? '#fde68a' : '#a7f3d0', color: u._isVerified ? '#b45309' : '#047857' }}
                      >
                        {u._isVerified ? 'Unverify' : 'Verify'}
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleBlock(u._id, u.isBlocked)}
                        style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid', background: u.isBlocked ? '#ecfdf5' : '#fee2e2', borderColor: u.isBlocked ? '#a7f3d0' : '#fca5a5', color: u.isBlocked ? '#047857' : '#dc2626' }}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GIGS */}
      {tab === 'gigs' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>{gigs.length} total gigs</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {gigs.map((g) => {
              const sc = STATUS_COLOR[g.status] || STATUS_COLOR.completed;
              return (
                <div key={g._id} style={{ ...card, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#0f172a', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</p>
                    <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>By {g.client?.name} &nbsp;|&nbsp; {g.category}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.8rem', borderRadius: '2rem', background: sc.bg, color: sc.color, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, display: 'inline-block' }}></span>
                      {g.status?.replace('_', ' ')}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
                      Rs.{g.budgetMin?.toLocaleString()} - Rs.{g.budgetMax?.toLocaleString()}
                    </span>
                    <button onClick={() => handleDeleteGig(g._id)} style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DISPUTES */}
      {tab === 'disputes' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>{disputes.length} total disputes • {disputes.filter((d) => d.status === 'open').length} open</p>
          {disputes.length === 0 ? (
            <div style={{ ...card, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚖️</div>
              <p style={{ color: '#0f172a', fontWeight: 600 }}>No disputes filed yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {disputes.map((d) => {
                const ds = DISPUTE_STATUS[d.status] || DISPUTE_STATUS.open;
                return (
                  <div key={d._id} style={{ ...card, padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{d.reason}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '2rem', background: ds.bg, color: ds.color }}>{ds.label}</span>
                        </div>
                        <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0 0 0.4rem' }}>{d.description}</p>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <span>By: <strong style={{ color: '#475569' }}>{d.raisedBy?.name}</strong></span>
                          <span>Against: <strong style={{ color: '#475569' }}>{d.against?.name}</strong></span>
                          {d.gig && <span>Gig: <strong style={{ color: '#475569' }}>{d.gig?.title}</strong></span>}
                          <span>{new Date(d.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        {d.resolution && (
                          <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: '#d1fae5', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#047857' }}>
                            <strong>Resolution:</strong> {d.resolution}
                          </div>
                        )}
                      </div>
                      {(d.status === 'open' || d.status === 'under_review') && (
                        <button
                          onClick={() => setResolvingId(resolvingId === d._id ? null : d._id)}
                          style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', background: '#ffedd5', border: '1px solid #fed7aa', color: '#c2410c', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                    {resolvingId === d._id && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#fffbf5', borderRadius: '0.75rem', border: '1px solid #fed7aa' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <select value={resolveForm.status} onChange={(e) => setResolveForm((f) => ({ ...f, status: e.target.value }))} style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', color: '#1e293b', fontSize: '0.875rem' }}>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                            <option value="under_review">Mark Under Review</option>
                          </select>
                        </div>
                        <textarea
                          value={resolveForm.resolution}
                          onChange={(e) => setResolveForm((f) => ({ ...f, resolution: e.target.value }))}
                          placeholder="Describe the resolution..."
                          rows={2}
                          style={{ width: '100%', background: '#fff', border: '1px solid #fed7aa', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: '#1e293b', fontSize: '0.875rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handleResolveDispute(d._id)} style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.45rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                            Confirm
                          </button>
                          <button onClick={() => setResolvingId(null)} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.45rem 1rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                            Cancel
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
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg, icon }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '2rem', fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>{label}</p>
      </div>
    </div>
  );
}
