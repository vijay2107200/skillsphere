import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications, markAllRead, addSocketNotification } from '../../store/slices/notificationSlice';
import socket from '../../api/socket';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { items: notifications, unread } = useSelector((s) => s.notifications);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
      if (!socket.connected) {
        socket.connect();
        socket.emit('join', user._id);
      }
      socket.on('notification', (notif) => {
        dispatch(addSocketNotification(notif));
      });
    }
    return () => socket.off('notification');
  }, [user, dispatch]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    socket.disconnect();
    dispatch(logout());
    navigate('/login');
  };

  const handleNotifClick = () => {
    setShowNotifs((v) => !v);
    if (unread > 0) dispatch(markAllRead());
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinkStyle = (path) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    padding: '0.4rem 1rem',
    borderRadius: '2rem',
    textDecoration: 'none',
    transition: 'all 0.2s',
    background: isActive(path) ? 'rgba(234,88,12,0.1)' : 'transparent',
    color: isActive(path) ? '#ea580c' : '#78350f',
    border: isActive(path) ? '1px solid rgba(234,88,12,0.2)' : '1px solid transparent',
  });

  return (
    <nav style={{ background: '#ffffff', borderBottom: '1px solid #fed7aa', boxShadow: '0 1px 4px rgba(234,88,12,0.06)' }} className="px-6 py-3 flex items-center justify-between relative z-50">
      <Link to="/" className="text-xl font-bold" style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SkillSphere</Link>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <span className="text-sm capitalize mr-2" style={{ color: '#94a3b8' }}>{user.role}</span>

            <Link to="/dashboard" style={navLinkStyle('/dashboard')}>Dashboard</Link>
            <Link to="/messages" style={navLinkStyle('/messages')}>Messages</Link>

            {user.role === 'client' && (
              <>
                <Link to="/gigs" style={navLinkStyle('/gigs')}>Browse Gigs</Link>
                <Link to="/my-gigs" style={navLinkStyle('/my-gigs')}>My Gigs</Link>
              </>
            )}
            {user.role === 'freelancer' && (
              <>
                <Link to="/find-work" style={navLinkStyle('/find-work')}>Find Work</Link>
                <Link to="/my-proposals" style={navLinkStyle('/my-proposals')}>My Proposals</Link>
                <Link to="/analytics" style={navLinkStyle('/analytics')}>Analytics</Link>
              </>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" style={{
                ...navLinkStyle('/admin'),
                color: isActive('/admin') ? '#dc2626' : '#dc2626',
                background: isActive('/admin') ? 'rgba(220,38,38,0.1)' : 'transparent',
                border: isActive('/admin') ? '1px solid rgba(220,38,38,0.2)' : '1px solid transparent',
              }}>Admin Panel</Link>
            )}

            {/* Bell notification */}
            <div className="relative" ref={notifRef}>
              <button onClick={handleNotifClick} className="relative" style={{ color: '#facc15', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #fed7aa' }}>
                  <div className="px-4 py-3 font-semibold text-sm" style={{ borderBottom: '1px solid #fed7aa', color: '#0f172a' }}>
                    Notifications
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No notifications</p>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} className="px-4 py-3 text-sm" style={{ borderBottom: '1px solid #fff7ed', background: n.read ? 'transparent' : '#fff7ed', color: n.read ? '#64748b' : '#0f172a' }}>
                          {n.message}
                          <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                            {new Date(n.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="text-sm font-semibold px-4 py-1.5 rounded-2xl transition ml-1" style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={navLinkStyle('/login')}>Login</Link>
            <Link to="/register" className="text-sm font-semibold px-4 py-2 rounded-2xl text-white ml-1" style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
