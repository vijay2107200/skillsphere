import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/auth/verify-email/${token}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed'); });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFBF5', padding: '1rem' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1.5rem', boxShadow: '0 4px 24px rgba(234,88,12,0.08)', padding: '3rem 2.5rem', textAlign: 'center' }}>

        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.5rem' }}>Verifying your email…</h2>
            <p style={{ color: '#64748b' }}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2rem' }}>✓</div>
            <h2 style={{ color: '#065f46', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.5rem' }}>Email Verified!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.75rem' }}>{message}</p>
            <button onClick={() => navigate('/login')} style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', border: 'none', borderRadius: '2rem', padding: '0.75rem 2rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2rem' }}>✕</div>
            <h2 style={{ color: '#991b1b', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.5rem' }}>Verification Failed</h2>
            <p style={{ color: '#64748b', marginBottom: '1.75rem' }}>{message}</p>
            <Link to="/register" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', textDecoration: 'none', borderRadius: '2rem', padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.95rem' }}>
              Register Again
            </Link>
          </>
        )}

        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <Link to="/login" style={{ color: '#ea580c', textDecoration: 'none' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
