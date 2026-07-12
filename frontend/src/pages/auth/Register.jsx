import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const BACKEND = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const inputStyle = {
  width: '100%', background: '#fffbf5', border: '1px solid #fed7aa',
  color: '#1e293b', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box',
};

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    const result = await dispatch(registerUser({ name: data.name, email: data.email, password: data.password, role: data.role }));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Account created! Check your email to verify.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg" style={{ background: '#ffffff', border: '1px solid #fed7aa', boxShadow: '0 4px 24px rgba(234,88,12,0.08)' }}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SkillSphere</h1>
          <h2 className="text-xl font-semibold" style={{ color: '#0f172a' }}>Create Account</h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Join the freelance ecosystem</p>
        </div>
        {/* Google OAuth */}
        <a href={`${BACKEND}/api/auth/google`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%', padding: '0.65rem 1rem', border: '1.5px solid #fed7aa', borderRadius: '0.5rem', background: '#fffbf5', color: '#374151', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign up with Google
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#fed7aa' }} />
          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>or with email</span>
          <div style={{ flex: 1, height: '1px', background: '#fed7aa' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Full Name</label>
            <input {...register('name', { required: 'Name is required' })} style={inputStyle} placeholder="John Doe" />
            {errors.name && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Email</label>
            <input {...register('email', { required: 'Email is required' })} type="email" style={inputStyle} placeholder="you@example.com" />
            {errors.email && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>I am a...</label>
            <select {...register('role')} style={{ ...inputStyle, background: '#ffffff' }}>
              <option value="client">Client (I want to hire)</option>
              <option value="freelancer">Freelancer (I want to work)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Password</label>
            <input {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })} type="password" style={inputStyle} placeholder="Enter your password" />
            {errors.password && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Confirm Password</label>
            <input {...register('confirmPassword', { validate: v => v === watch('password') || 'Passwords do not match' })} type="password" style={inputStyle} placeholder="Confirm your password" />
            {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg font-semibold text-white mt-2"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm mt-4" style={{ color: '#64748b' }}>
          Already have an account? <Link to="/login" style={{ color: '#ea580c', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
