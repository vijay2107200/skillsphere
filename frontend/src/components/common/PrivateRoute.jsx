import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, roles }) {
  const { user, token } = useSelector((s) => s.auth);

  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}
