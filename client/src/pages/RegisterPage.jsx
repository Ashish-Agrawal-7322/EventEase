import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  GraduationCap,
  Zap,
  KeyRound,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight,
  ArrowLeft,
  School,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    rollNumber: '',
    department: 'Computer Science',
    employeeId: '',
    designation: 'Assistant Professor',
    facultyPasscode: '',
    cabinNumber: '',
  });

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Detect student emails containing enrollment numbers (e.g. 128212 in amankumar.tiwari128212@...)
  const isStudentEmailFormat = (email) => {
    if (!email) return false;
    const local = email.split('@')[0] || '';
    return /\d{4,}/.test(local);
  };

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

  const isMarwadiEmail = (email) => {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return clean.endsWith('@marwadiuniversity.ac.in');
  };

  const handleStep1Submit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your university email');
      return;
    }

    if (!isMarwadiEmail(formData.email)) {
      setError('Please enter your official Marwadi University email address (@marwadiuniversity.ac.in). Personal emails like Gmail or Yahoo are not allowed.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.role === 'student' && !formData.rollNumber.trim()) {
      setError('Please enter your student Roll / Enrollment number');
      return;
    }

    if (formData.role === 'faculty') {
      if (isStudentEmailFormat(formData.email)) {
        setError('⚠️ Student enrollment number detected in email! Student accounts cannot register for Faculty/Staff privileges. Please select Student role.');
        return;
      }
      if (!formData.employeeId.trim()) {
        setError('Please enter your Faculty / Employee ID (e.g. MU-FAC-1049)');
        return;
      }
      if (!formData.cabinNumber.trim()) {
        setError('Please enter your Faculty Office / Cabin Location (e.g. Room 304, Block A)');
        return;
      }
      if (!formData.facultyPasscode.trim()) {
        setError('Please enter the confidential Faculty Institutional Access Key issued by the Dean / Registrar Office.');
        return;
      }
    }

    setOtpLoading(true);
    try {
      const res = await api.auth.sendRegistrationOtp(formData.email.trim(), formData.name.trim(), formData.role);
      if (res.success) {
        setOtpSent(true);
        setResendTimer(60);
        setSuccessNotice(res.message || `Verification code sent to ${formData.email}!`);
      } else {
        setError(res.message || 'Failed to dispatch verification code');
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code. Please check your network.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleStep2VerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your university email.');
      return;
    }

    setLoading(true);
    const res = await register({
      ...formData,
      email: formData.email.trim(),
      otp: otp.trim(),
    });
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'organizer') {
        navigate('/organizer');
      } else if (res.user.organizerStatus === 'pending') {
        alert('🎉 Account created! Your Club Lead verification is pending Admin review. In the meantime, you can explore events and purchase tickets as a student.');
        navigate('/');
      } else {
        navigate('/');
      }
    } else {
      setError(res.message || 'Verification failed. Please re-check the OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-grid flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg cyber-glass-glow rounded-3xl p-7 border border-cyan-500/30 shadow-[0_0_80px_rgba(0,240,255,0.15)] space-y-6"
      >
        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-start gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Success Notification */}
        {successNotice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>{successNotice}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {otpSent ? (
            /* ============================================================ */
            /* STEP 2: STANDALONE OTP VERIFICATION SECTION ONLY             */
            /* ============================================================ */
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Step 2 Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                  <ShieldCheck className="w-7 h-7 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-black text-white font-cyber tracking-tight">
                  UNIVERSITY IDENTITY VERIFICATION
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-[11px] font-mono text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>STEP 2 OF 2: CONFIRM EMAIL PASSCODE</span>
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  We dispatched a 6-digit verification code to your Marwadi University Gmail inbox.
                </p>
              </div>

              {/* Target Email Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    Target Email
                  </span>
                  <div className="font-mono text-cyan-300 font-bold text-xs truncate max-w-[240px]">
                    {formData.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError('');
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change Email</span>
                </button>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleStep2VerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-2 text-center text-xs">
                    Enter 6-Digit Verification OTP *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-slate-950 border-2 border-cyan-400 rounded-2xl py-3.5 text-center text-3xl font-mono tracking-[14px] font-black text-cyan-300 placeholder-slate-700 focus:outline-none focus:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px]">OTP valid for 10 minutes</span>
                  </div>

                  {resendTimer > 0 ? (
                    <span className="text-slate-500 font-mono text-[11px]">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={otpLoading}
                      onClick={handleStep1Submit}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-[11px] disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${otpLoading ? 'animate-spin' : ''}`} />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 font-cyber tracking-wider active:scale-95 disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Activating Campus Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Verify OTP & Create Verified Account</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError('');
                  }}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs font-mono transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Edit Details</span>
                </button>
              </form>
            </motion.div>
          ) : (
            /* ============================================================ */
            /* STEP 1: INITIAL ENROLLMENT FORM                              */
            /* ============================================================ */
            <motion.div
              key="step-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                  <School className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-black text-white font-cyber tracking-tight">
                  CAMPUS IDENTITY ENROLLMENT
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-[11px] font-mono text-cyan-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>@marwadiuniversity.ac.in Verified Domain</span>
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  Fill in your details below to register your official Marwadi University account.
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4 text-xs">
                {/* Role selector pills */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Campus Identity Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all ${
                        formData.role === 'student'
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      <span className="text-[11px]">Student</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'faculty' })}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all ${
                        formData.role === 'faculty'
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 shrink-0" />
                      <span className="text-[11px]">Faculty / Staff</span>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ashish Agrawal"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Marwadi University Email */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">Marwadi University Email *</label>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-all ${
                        !formData.email
                          ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30'
                          : isMarwadiEmail(formData.email)
                          ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/50'
                          : 'text-red-400 bg-red-950/60 border border-red-500/50 animate-pulse'
                      }`}
                    >
                      @marwadiuniversity.ac.in
                    </span>
                  </div>
                  <div className="relative">
                    <Mail
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                        !formData.email
                          ? 'text-slate-400'
                          : isMarwadiEmail(formData.email)
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    />
                    <input
                      type="email"
                      required
                      placeholder={
                        formData.role === 'faculty'
                          ? 'firstname.lastname@marwadiuniversity.ac.in'
                          : 'student123456@marwadiuniversity.ac.in'
                      }
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full bg-slate-900 border rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono transition-all ${
                        !formData.email
                          ? 'border-white/10 focus:border-cyan-400'
                          : formData.role === 'faculty' && isStudentEmailFormat(formData.email)
                          ? 'border-amber-500/80 focus:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : isMarwadiEmail(formData.email)
                          ? 'border-emerald-500/60 focus:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'border-red-500/80 focus:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                      }`}
                    />
                  </div>
                  {formData.email && !isMarwadiEmail(formData.email) ? (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] text-red-300 mt-2 flex items-start gap-1.5 font-medium bg-red-950/60 p-2 rounded-xl border border-red-500/40"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                      <span>
                        Please enter your official Marwadi University email (must end with{' '}
                        <strong className="font-mono text-red-200">@marwadiuniversity.ac.in</strong>). Personal emails like Gmail or Yahoo are not allowed.
                      </span>
                    </motion.div>
                  ) : formData.role === 'faculty' && formData.email && isStudentEmailFormat(formData.email) ? (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] text-amber-300 mt-2 flex items-start gap-1.5 font-medium bg-amber-950/70 p-2.5 rounded-xl border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        <strong>Student Enrollment ID Detected:</strong> This email contains student roll numbers. Student emails cannot register for Faculty/Staff privileges. Please select <strong>Student</strong> or enter your official staff email.
                      </span>
                    </motion.div>
                  ) : formData.email && isMarwadiEmail(formData.email) ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1.5 font-mono"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Verified Marwadi University email format</span>
                    </motion.p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">
                      An institutional OTP passcode will be dispatched to this inbox to verify student/faculty authenticity.
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="•••••••• (Min 6 characters)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                {/* Student & Organizer Identification */}
                {formData.role !== 'faculty' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Roll / Enrollment No *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 92100103045"
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Comm">Electronics & Comm</option>
                        <option value="Data Science & AI">Data Science & AI</option>
                        <option value="Mechanical Eng">Mechanical Eng</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Pharmacy & Sciences">Pharmacy & Sciences</option>
                        <option value="Management Studies">Management Studies</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Faculty specific fields */
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3.5 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20">
                      <span className="text-[11px] font-bold text-emerald-400 font-mono flex items-center gap-1.5 uppercase tracking-wide">
                        <Briefcase className="w-3.5 h-3.5" />
                        Faculty Credential Verification
                      </span>
                      <span className="text-[10px] text-emerald-300/80 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        Staff Restricted
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-emerald-300 font-semibold mb-1">
                          Faculty / Employee ID *
                        </label>
                        <input
                          type="text"
                          required={formData.role === 'faculty'}
                          placeholder="e.g. MU-FAC-1049"
                          value={formData.employeeId}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value, rollNumber: e.target.value })}
                          className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-emerald-300 font-semibold mb-1">Designation</label>
                        <select
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400 text-xs"
                        >
                          <option value="Assistant Professor">Assistant Professor</option>
                          <option value="Associate Professor">Associate Professor</option>
                          <option value="Professor">Professor</option>
                          <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                          <option value="Dean / Principal">Dean / Principal</option>
                          <option value="Faculty Event Coordinator">Faculty Event Coordinator</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-emerald-300 font-semibold mb-1">Academic Department</label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400 text-xs"
                        >
                          <option value="Computer Science">Computer Science</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Electronics & Comm">Electronics & Comm</option>
                          <option value="Data Science & AI">Data Science & AI</option>
                          <option value="Mechanical Eng">Mechanical Eng</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Management Studies">Management Studies</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-emerald-300 font-semibold mb-1">
                          Faculty Cabin / Office *
                        </label>
                        <input
                          type="text"
                          required={formData.role === 'faculty'}
                          placeholder="e.g. Room 304, Block A"
                          value={formData.cabinNumber}
                          onChange={(e) => setFormData({ ...formData, cabinNumber: e.target.value })}
                          className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-emerald-300 font-semibold flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                          Faculty Institutional Access Key *
                        </label>
                        <span className="text-[10px] text-emerald-400 font-mono">Dean Office Key</span>
                      </div>
                      <input
                        type="text"
                        required={formData.role === 'faculty'}
                        placeholder="e.g. MU-FAC-2026"
                        value={formData.facultyPasscode}
                        onChange={(e) => setFormData({ ...formData, facultyPasscode: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-200 placeholder-emerald-500/30 font-mono text-xs focus:outline-none focus:border-emerald-400 tracking-wider"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300/90 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Anti-Impersonation Protection</span>
                      </div>
                      <p className="text-slate-300 text-[10.5px] leading-relaxed">
                        Faculty accounts receive instant event hosting rights. To prevent students from registering under faculty, an official authorization key issued by the Registrar or Dean is required.
                      </p>
                    </div>
                  </motion.div>
                )}
                {/* Submit Step 1 Button */}
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 font-cyber tracking-wider active:scale-95 disabled:opacity-60"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending OTP to University Gmail...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register Account & Verify Email</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/5">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
            Sign In Here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
