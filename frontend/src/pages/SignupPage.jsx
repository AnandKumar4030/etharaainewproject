import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.signup(form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md animate-fade-in relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Create an account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Join TaskFlow and start managing tasks</p>
        </div>

        <div className="card" style={{ background: 'var(--surface)' }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm flex items-start gap-2 accent-red" style={{ background: 'var(--accent-red-bg)', color: 'var(--accent-red-text)', border: '1px solid var(--accent-red-border)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="signup-name">Full name</label>
              <input
                id="signup-name"
                name="name"
                type="text"
                required
                className="input"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label" htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  className="input pr-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-3)' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3].map((l) => (
                    <div
                      key={l}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength >= l
                          ? l === 1 ? 'bg-red-500' : l === 2 ? 'bg-yellow-500' : 'bg-green-500'
                          : ''
                      }`}
                      style={passwordStrength < l ? { background: 'var(--surface-3)' } : {}}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              id="signup-submit"
              disabled={loading}
              className="btn-primary w-full h-11 text-base mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Already have an account?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
