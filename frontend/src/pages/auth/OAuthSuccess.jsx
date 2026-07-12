import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserFromOAuth } from '../../store/slices/authSlice';
import { fetchMe } from '../../store/slices/authSlice';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    localStorage.setItem('token', token);
    dispatch(fetchMe()).then(() => navigate('/dashboard'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFBF5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔑</div>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Signing you in with Google…</p>
      </div>
    </div>
  );
}
