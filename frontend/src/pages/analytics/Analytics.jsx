import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const card = { background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' };

export default function Analytics() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'freelancer') { navigate('/dashboard'); return; }
    api.get('/profile/analytics')
      .then(({ data }) => { setStats(data.stats); setMonthly(data.monthlyEarnings); })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8' }}>
      Loading analytics...
    </div>
  );

  const maxEarnings = Math.max(...monthly.map((m) => m.earnings), 1);

  const STAT_CARDS = [
    { label: 'Total Earnings', value: `Rs.${(stats?.totalEarnings || 0).toLocaleString()}`, color: '#ea580c', bg: '#ffedd5', icon: '₹' },
    { label: 'Completed Jobs', value: stats?.completedJobs || 0, color: '#059669', bg: '#ecfdf5', icon: '✓' },
    { label: 'Success Rate', value: `${stats?.successRate || 0}%`, color: '#7c3aed', bg: '#f5f3ff', icon: '⭐' },
    { label: 'Reputation Score', value: stats?.reputationScore || 0, color: '#b45309', bg: '#fffbeb', icon: '🏅' },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>My Analytics</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>Track your performance and earnings on SkillSphere</p>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {STAT_CARDS.map(({ label, value, color, bg, icon }) => (
          <div key={label} style={{ ...card, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <p style={{ fontSize: '1.7rem', fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.3rem 0 0' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Proposals Breakdown */}
        <div style={{ ...card, padding: '1.5rem' }}>
          <h3 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Proposal Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Total Sent', value: stats?.totalProposals || 0, color: '#64748b', bg: '#f1f5f9' },
              { label: 'Accepted', value: stats?.acceptedProposals || 0, color: '#047857', bg: '#d1fae5' },
              { label: 'Pending', value: stats?.pendingProposals || 0, color: '#b45309', bg: '#fef3c7' },
              { label: 'Rejected', value: stats?.rejectedProposals || 0, color: '#dc2626', bg: '#fee2e2' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderRadius: '0.5rem', background: bg }}>
                <span style={{ color, fontWeight: 600, fontSize: '0.875rem' }}>{label}</span>
                <span style={{ color, fontWeight: 800, fontSize: '1.1rem' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Ring */}
        <div style={{ ...card, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem', alignSelf: 'flex-start' }}>Success Rate</h3>
          <div style={{ position: 'relative', width: '140px', height: '140px' }}>
            <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '140px', height: '140px' }}>
              <circle cx="70" cy="70" r="54" fill="none" stroke="#ffedd5" strokeWidth="14" />
              <circle cx="70" cy="70" r="54" fill="none" stroke="#ea580c" strokeWidth="14"
                strokeDasharray={`${(stats?.successRate || 0) * 3.39} 339`}
                strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ea580c' }}>{stats?.successRate || 0}%</span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>success</span>
            </div>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.75rem', textAlign: 'center' }}>
            {stats?.acceptedProposals || 0} of {stats?.totalProposals || 0} proposals accepted
          </p>
        </div>
      </div>

      {/* Monthly Earnings Chart */}
      <div style={{ ...card, padding: '1.5rem' }}>
        <h3 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem' }}>Monthly Earnings (Last 6 Months)</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '160px', paddingBottom: '0.5rem', borderBottom: '1px solid #fed7aa' }}>
          {monthly.map((m) => {
            const pct = (m.earnings / maxEarnings) * 100;
            return (
              <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                  {m.earnings > 0 ? `Rs.${m.earnings.toLocaleString()}` : '—'}
                </span>
                <div style={{
                  width: '100%', maxWidth: '48px',
                  height: `${Math.max(pct, m.earnings > 0 ? 8 : 0)}%`,
                  background: m.earnings > 0 ? 'linear-gradient(180deg,#f97316,#ea580c)' : '#ffedd5',
                  borderRadius: '0.35rem 0.35rem 0 0',
                  transition: 'height 0.5s ease',
                  minHeight: m.earnings > 0 ? '8px' : '2px',
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          {monthly.map((m) => (
            <div key={m.label} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
              {m.label}
            </div>
          ))}
        </div>
        {monthly.every((m) => m.earnings === 0) && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '1rem' }}>
            No earnings recorded yet. Accepted proposals will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
