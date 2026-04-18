import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AuthPage() {
  const [mode,    setMode]    = useState('login'); // 'login' | 'register'
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const { user, login, register } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (user) nav('/dashboard');
  }, [user, nav]);

  const handle = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login')    await login(form.email, form.password);
      else                     await register(form.name, form.email, form.password);
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      
      {/* Animated background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="auth-grid">
        {/* ── Left hero panel ── */}
        <motion.div
          className="auth-hero"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="auth-brand">
            <Activity size={32} className="brand-icon" />
            <span>Nexus</span>
          </div>
          <h1 className="auth-headline">
            Your money,<br />
            <span className="gradient-text">unified.</span>
          </h1>
          <p className="auth-sub">
            Connect every bank account, card, and wallet. Get a real-time, intelligent view of your complete financial life.
          </p>

          <div className="auth-stats">
            {[
              { value: '100%', label: 'Bank-grade encryption' },
              { value: 'Live', label: 'Real-time data' },
              { value: '0 ads', label: 'No data selling' },
            ].map((s) => (
              <div key={s.label} className="auth-stat">
                <span className="auth-stat-val">{s.value}</span>
                <span className="auth-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>

          {/* floating card preview */}
          <motion.div
            className="auth-card-preview"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <div className="preview-row">
              <span className="preview-label">Net Worth</span>
              <span className="preview-change positive">+2.4%</span>
            </div>
            <div className="preview-amount">$128,540.00</div>
            <div className="preview-bars">
              {[60, 80, 45, 90, 70, 85, 55, 95, 65, 75].map((h, i) => (
                <div key={i} className="preview-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Right form panel ── */}
        <motion.div
          className="auth-form-wrap"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="glass-card auth-form-card">
            <div className="auth-tabs">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  className={`auth-tab ${mode === m ? 'active' : ''}`}
                  onClick={() => { setMode(m); setError(''); }}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={submit}
                className="auth-fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {mode === 'register' && (
                  <div className="field-group">
                    <label className="field-label">Full Name</label>
                    <input className="field-input" type="text" placeholder="Alex Johnson" value={form.name} onChange={handle('name')} required />
                  </div>
                )}
                <div className="field-group">
                  <label className="field-label">Email</label>
                  <input className="field-input" type="email" placeholder="you@example.com" value={form.email} onChange={handle('email')} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className="pw-wrap">
                    <input className="field-input" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handle('password')} required />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div className="auth-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {error}
                  </motion.div>
                )}

                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? <Loader2 size={18} className="spin" /> : (
                    <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
                  )}
                </button>
              </motion.form>
            </AnimatePresence>

            <p className="auth-footer">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button className="auth-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
