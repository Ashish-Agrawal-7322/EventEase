import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  Mail,
  Lock,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'organizer' || res.user.isFaculty) navigate('/organizer');
      else if (res.user.role === 'admin') navigate('/admin');
      else navigate('/my-tickets');
    } else {
      setError(res.message || 'Login failed');
    }
  };

  const handleQuickLogin = async (role) => {
    setLoading(true);
    const res = await quickSwitchUser(role);
    setLoading(false);
    if (res.success) {
      if (res.user.role === 'organizer' || res.user.isFaculty) navigate('/organizer');
      else if (res.user.role === 'admin') navigate('/admin');
      else navigate('/my-tickets');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-grid flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md cyber-glass-glow rounded-3xl p-7 border border-cyan-500/30 shadow-[0_0_80px_rgba(0,240,255,0.15)] space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Zap className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-black text-white font-cyber tracking-tight">
            SIGN IN TO EVENTSYNC
          </h2>
          <p className="text-xs text-slate-400">
            Access your encrypted college event credentials and entry passes.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Campus Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="alex.student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-semibold">Password</label>
              <Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300 text-[11px] font-mono hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 font-cyber tracking-wider active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/5">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
            Create Campus Profile
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
