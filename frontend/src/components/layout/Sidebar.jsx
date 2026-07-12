import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const clientLinks = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/gigs', label: 'Browse Gigs' },
  { to: '/my-gigs', label: 'My Projects' },
  { to: '/messages', label: 'Messages' },
  { to: '/profile', label: 'Profile' },
];

const freelancerLinks = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/find-work', label: 'Find Work' },
  { to: '/my-proposals', label: 'My Proposals' },
  { to: '/messages', label: 'Messages' },
  { to: '/profile', label: 'Profile' },
];

export default function Sidebar() {
  const { user } = useSelector((s) => s.auth);
  const links = user?.role === 'freelancer' ? freelancerLinks : clientLinks;

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 p-4">
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
