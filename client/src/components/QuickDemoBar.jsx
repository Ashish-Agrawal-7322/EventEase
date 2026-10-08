import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, RefreshCw, UserCheck, Shield, GraduationCap, Building, HelpCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const QuickDemoBar = () => {
  const { user, quickSwitchUser, resetAllDemoData } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSwitch = async (role) => {
    setSwitching(true);
    await quickSwitchUser(role);
    setSwitching(false);
  };

  const handleReset = async () => {
    if (window.confirm('Reset all demo events, tickets, and check-in statuses to factory state?')) {
      setSwitching(true);
      const res = await resetAllDemoData();
      setSwitching(false);
      if (res.success) {
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 2500);
        window.location.reload();
      }
    }
  };

  return (
    <div className="bg-[#0b1329]/90 border-b border-cyan-500/20 backdrop-blur-md px-4 py-2 sticky top-0 z-50 text-xs shadow-[0_4px_20px_rgba(0,240,255,0.06)]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Hackathon Judge Quick Switch */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="tracking-wide uppercase text-[10px]">Hackathon Demo Mode</span>
          </div>

          <span className="text-slate-400 hidden sm:inline">Instant Switch:</span>

          <button
            onClick={() => handleSwitch('student')}
            disabled={switching}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-medium ${
              user?.role === 'student'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-white/5'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Student (Alex)</span>
          </button>

          <button
            onClick={() => handleSwitch('organizer')}
            disabled={switching}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-medium ${
              user?.role === 'organizer'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-white/5'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-purple-400" />
            <span>Organizer (Sarah)</span>
          </button>

          <button
            onClick={() => handleSwitch('admin')}
            disabled={switching}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-medium ${
              user?.role === 'admin'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin (Dean Thorne)</span>
          </button>
        </div>

        {/* Right: Quick Guide & Reset */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1 text-slate-300 hover:text-cyan-400 transition-colors px-2 py-1 rounded bg-slate-800/60 border border-white/5"
            title="View 4-Step Hackathon Demo Flow"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Demo Flow Guide</span>
          </button>

          <button
            onClick={handleReset}
            disabled={switching}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/50 border border-red-500/30 transition-all"
            title="Reset database to initial demo state"
          >
            <RefreshCw className={`w-3 h-3 ${switching ? 'animate-spin' : ''}`} />
            <span>{resetSuccess ? 'Reset Complete!' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* Guide Dropdown Modal */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-4xl mx-auto mt-2 p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl text-slate-200"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4" /> Recommended 4-Step Demo Evaluation Flow:
              </span>
              <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800">
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-cyan-500/20">
                <div className="font-semibold text-cyan-300 mb-1">1. Student Registration</div>
                <p>Click "Student (Alex)". Go to Explore Events, register for "Quantum Leap" or "ApexHack", get instant Holographic QR Ticket.</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-purple-500/20">
                <div className="font-semibold text-purple-300 mb-1">2. My Digital Tickets</div>
                <p>Go to "My Tickets" to inspect Alex's animated cyber pass with verifiable QR and seat allocation.</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-emerald-500/20">
                <div className="font-semibold text-emerald-300 mb-1">3. Scan QR (Organizer)</div>
                <p>Click "Organizer (Sarah)". Open Organizer Hub &rarr; Launch QR Scanner. Use webcam OR the "One-Click Attendee Simulator"!</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-amber-500/20">
                <div className="font-semibold text-amber-300 mb-1">4. Verify Duplicate Prevention</div>
                <p>Scan Alex's ticket again: system flags "Already Checked In" with exact timestamp and audio warning! Check Recharts live analytics.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
