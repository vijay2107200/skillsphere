import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, verifyTwoFactor, clearError, cancelTwoFactor } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const BACKEND = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user, requiresTwoFactor, twoFactorUserId } = useSelector((s) => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [otp, setOtp] = useState('');

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const onSubmit = (data) => dispatch(loginUser(data));

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    dispatch(verifyTwoFactor({ userId: twoFactorUserId, otp }));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8faf8', padding: '1rem' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: '860px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {/* LEFT PANEL */}
        <div style={{ flex: '0 0 45%', background: 'linear-gradient(145deg, #0dd3f0 0%, #00d68c 100%)', position: 'relative', overflow: 'hidden', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} viewBox="0 0 400 500" preserveAspectRatio="none">
            {[0,30,60,90,120,150,180,210,240,270,300,330,360,390,420,450,480].map((y, i) => (
              <path key={i} d={`M0 ${y} Q100 ${y - 15} 200 ${y} Q300 ${y + 15} 400 ${y}`} fill="none" stroke="#fff" strokeWidth="1.5" />
            ))}
          </svg>
          <div style={{ position: 'absolute', top: '-60px', right: '-50px', width: '180px', height: '170px', background: '#c8ff47', borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%', opacity: 0.9 }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '160px', background: '#c8ff47', borderRadius: '45% 55% 40% 60% / 60% 40% 55% 45%', opacity: 0.85 }} />
          <div style={{ position: 'absolute', bottom: '120px', right: '-20px', width: '80px', height: '70px', background: '#c8ff47', borderRadius: '50% 50% 40% 60% / 55% 45% 60% 40%', opacity: 0.7 }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              {requiresTwoFactor ? 'Check your email' : 'Welcome back!'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '200px' }}>
              {requiresTwoFactor
                ? 'We sent a 6-digit code to your email. Enter it to complete login.'
                : 'Sign in to access your SkillSphere account.'}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: '0 0 55%', background: '#ffffff', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {requiresTwoFactor ? (
            /* ── 2FA STEP ── */
            <>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem' }}>Two-Factor Auth</h1>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.75rem' }}>Enter the 6-digit code sent to your email</p>
              <form onSubmit={handleOtpSubmit}>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid #e5e7eb', borderRadius: '2rem', outline: 'none', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', letterSpacing: '0.4rem', color: '#374151', background: '#f9fafb', boxSizing: 'border-box', marginBottom: '1rem' }}
                />
                <button type="submit" disabled={loading || otp.length !== 6} style={{ width: '100%', padding: '0.8rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #0dd3f0 0%, #00d68c 100%)', color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', opacity: (loading || otp.length !== 6) ? 0.65 : 1, boxShadow: '0 4px 15px rgba(0,214,140,0.35)' }}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
              <button onClick={() => { dispatch(cancelTwoFactor()); setOtp(''); }} style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}>
                ← Back to login
              </button>
            </>
          ) : (
            /* ── NORMAL LOGIN ── */
            <>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '1.75rem' }}>Sign In</h1>

              {/* Google OAuth */}
              <a href={`${BACKEND}/api/auth/google`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '2rem', background: '#ffffff', color: '#374151', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', marginBottom: '1.25rem', transition: 'border-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00d68c'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <GoogleIcon />
                Continue with Google
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span style={{ color: '#9ca3af', fontSize: '0.78rem', fontWeight: 500 }}>or sign in with email</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input {...register('email', { required: 'Email is required' })} type="email" placeholder="Email address" style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.7rem', paddingBottom: '0.7rem', border: '1px solid #e5e7eb', borderRadius: '2rem', outline: 'none', fontSize: '0.875rem', color: '#374151', background: '#f9fafb', boxSizing: 'border-box' }} />
                  {errors.email && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>{errors.email.message}</p>}
                </div>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input {...register('password', { required: 'Password is required' })} type="password" placeholder="Password" style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.7rem', paddingBottom: '0.7rem', border: '1px solid #e5e7eb', borderRadius: '2rem', outline: 'none', fontSize: '0.875rem', color: '#374151', background: '#f9fafb', boxSizing: 'border-box' }} />
                  {errors.password && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>{errors.password.message}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#6b7280', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#00d68c' }} />
                    Remember me
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#6b7280', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.8rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #0dd3f0 0%, #00d68c 100%)', color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', opacity: loading ? 0.75 : 1, boxShadow: '0 4px 15px rgba(0,214,140,0.35)' }}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b7280', marginTop: '1.25rem' }}>
                New here?{' '}
                <Link to="/register" style={{ color: '#00b87a', fontWeight: 600, textDecoration: 'none' }}>Create an Account</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
