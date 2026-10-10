import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [receivedOtp, setReceivedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please provide your registered university email');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.sendForgotPasswordOtp(email.trim());
      if (res.success) {
        setStep(2);
        setResendTimer(60);
        if (res.otp) {
          setReceivedOtp(res.otp);
        }
        setSuccess(res.message || `Password reset code sent to ${email}`);
      } else {
        setError(res.message || 'Failed to dispatch reset code');
      }
    } catch (err) {
      setError(err.message || 'No account found with this email or server error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.resetPasswordOtp({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      if (res.success) {
        setSuccess('Password successfully reset! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-grid flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md cyber-glass-glow rounded-3xl p-7 border border-red-500/30 shadow-[0_0_80px_rgba(239,68,68,0.15)] space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <KeyRound className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white font-cyber tracking-tight">
            ACCOUNT RECOVERY
          </h2>
          <p className="text-xs text-slate-400">
            Reset your password securely via one-time university Gmail verification.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-start gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        {step === 1 ? (
          /* Step 1: Request OTP */
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Registered University Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student123456@marwadiuniversity.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 font-mono text-xs"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                A 6-digit security OTP will be dispatched to this email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2 font-cyber tracking-wider active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching Reset Code...</span>
                </>
              ) : (
                <>
                  <span>Send Password Reset OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Enter OTP & New Password */
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Target Email: </span>
                <span className="font-mono text-red-300 font-bold">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] text-slate-400 hover:text-red-300 underline"
              >
                Change
              </button>
            </div>

            {receivedOtp && (
              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-center space-y-2">
                <span className="text-[11px] font-mono text-red-300 font-bold block">
                  Password Reset Passcode:
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-2xl font-black text-white tracking-[6px] bg-slate-900 px-3.5 py-1 rounded-xl border border-red-500/50">
                    {receivedOtp}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtp(receivedOtp)}
                    className="px-3 py-1 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs font-mono transition-all"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                6-Digit Security OTP *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-950 border-2 border-red-400/80 rounded-xl py-3 text-center text-2xl font-mono tracking-[12px] font-black text-red-300 placeholder-slate-600 focus:outline-none focus:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="•••••••• (Min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Code valid for 10 min</span>
              </div>

              {resendTimer > 0 ? (
                <span className="text-slate-500 font-mono">
                  Resend in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRequestOtp}
                  className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Resend OTP</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2 font-cyber tracking-wider active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP & Save New Password</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/5 flex items-center justify-between">
          <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
            ← Back to Sign In
          </Link>
          <Link to="/register" className="text-slate-400 hover:text-slate-200">
            Create New Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
