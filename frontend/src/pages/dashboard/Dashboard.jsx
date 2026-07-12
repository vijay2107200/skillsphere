import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyGigs, fetchMyProposals } from '../../store/slices/gigSlice';

const clientLinks = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/gigs', label: 'Browse Gigs' },
  { to: '/my-gigs', label: 'My Gigs' },
  { to: '/post-gig', label: '+ Post a Gig' },
  { to: '/payments', label: 'Payments' },
  { to: '/messages', label: 'Messages' },
  { to: '/disputes', label: 'Disputes' },
  { to: '/profile', label: 'Profile' },
];

const freelancerLinks = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/find-work', label: 'Find Work' },
  { to: '/my-proposals', label: 'My Proposals' },
  { to: '/messages', label: 'Messages' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/disputes', label: 'Disputes' },
  { to: '/profile', label: 'Profile' },
];

const card = { background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' };

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { myGigs, myProposals } = useSelector((s) => s.gigs);

  const links = user?.role === 'freelancer' ? freelancerLinks : clientLinks;

  useEffect(() => {
    if (user?.role === 'client') dispatch(fetchMyGigs());
    if (user?.role === 'freelancer') dispatch(fetchMyProposals());
  }, [dispatch, user]);

  const activeGigs = myGigs.filter((g) => g.status === 'open' || g.status === 'in_progress').length;
  const activeProposals = myProposals.filter((p) => p.status === 'pending').length;
  const acceptedProposals = myProposals.filter((p) => p.status === 'accepted').length;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex-shrink-0 p-4" style={{ background: '#ffffff', borderRight: '1px solid #fed7aa' }}>
        <nav className="space-y-1 mt-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-3 py-2 rounded-lg text-sm font-medium transition"
              style={{ color: '#78350f' }}
              onMouseEnter={e => { e.target.style.background = '#fff7ed'; e.target.style.color = '#ea580c'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#78350f'; }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>Welcome back, {user?.name}!</h1>
        <p className="mb-8 capitalize" style={{ color: '#64748b' }}>Role: {user?.role}</p>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {user?.role === 'freelancer' ? (
            <>
              <StatCard title="Active Proposals" value={activeProposals} color="#ea580c" />
              <StatCard title="Accepted Proposals" value={acceptedProposals} color="#059669" />
              <StatCard title="Total Proposals" value={myProposals.length} color="#7c3aed" />
            </>
          ) : (
            <>
              <StatCard title="Active Gigs" value={activeGigs} color="#ea580c" />
              <StatCard title="Total Gigs Posted" value={myGigs.length} color="#059669" />
              <StatCard title="Total Proposals Received" value={myGigs.reduce((acc, g) => acc + (g.proposalCount || 0), 0)} color="#7c3aed" />
            </>
          )}
        </div>

        {/* Quick Actions + Team Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6" style={card}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f172a' }}>Quick Actions</h2>
            <div className="space-y-2">
              {user?.role === 'freelancer' ? (
                <>
                  <ActionBtn label="Browse Available Gigs" onClick={() => navigate('/find-work')} primary />
                  <ActionBtn label="View My Proposals" onClick={() => navigate('/my-proposals')} />
                  <ActionBtn label="View Analytics" onClick={() => navigate('/analytics')} />
                  <ActionBtn label="Check Messages" onClick={() => navigate('/messages')} />
                </>
              ) : (
                <>
                  <ActionBtn label="Post a New Gig" onClick={() => navigate('/post-gig')} primary />
                  <ActionBtn label="Browse Gig Marketplace" onClick={() => navigate('/gigs')} />
                  <ActionBtn label="Manage My Gigs" onClick={() => navigate('/my-gigs')} />
                  <ActionBtn label="View Payments" onClick={() => navigate('/payments')} />
                </>
              )}
            </div>
          </div>

          {/* Team / Community Image Card */}
          <div style={{ ...card, overflow: 'hidden', padding: 0, position: 'relative' }}>
            <img
              src="/team.jpg"
              alt="SkillSphere Community"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '220px' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'linear-gradient(135deg,#fff7ed,#ffedd5)';
                e.target.parentElement.innerHTML = `
                  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:220px;padding:2rem;text-align:center">
                    <div style="font-size:3rem;margin-bottom:1rem">👥</div>
                    <p style="font-weight:700;color:#0f172a;font-size:1.1rem;margin:0 0 0.5rem">Join the Community</p>
                    <p style="color:#64748b;font-size:0.85rem;margin:0">Connect with top freelancers and clients on SkillSphere</p>
                  </div>`;
              }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, transparent 100%)',
              padding: '1.5rem 1.25rem 1rem',
            }}>
              <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem', margin: 0 }}>SkillSphere Community</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                Connect with top talent across India
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="p-6" style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' }}>
      <p className="text-sm mb-1" style={{ color: '#64748b' }}>{title}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function ActionBtn({ label, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition"
      style={primary
        ? { background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#ffffff' }
        : { background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }
      }
    >
      {label}
    </button>
  );
}
