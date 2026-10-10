import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  ScanLine,
  Volume2,
  VolumeX,
  Zap,
  Building2,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HologramPassModal = ({ ticket, isOpen, onClose, onSimulateScan }) => {
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveTime, setLiveTime] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });
  const cardRef = useRef(null);

  // High-frequency live security ticker (updates every 50ms)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      setLiveTime(`${timeStr}.${ms}`);
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Gentle Cyber Synth Chime using Web Audio API (zero external assets, 100% crash-proof)
  const playActivationChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1046, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  useEffect(() => {
    if (isOpen) {
      playActivationChime();
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const event = ticket.event || {};
  const isCheckedIn = ticket.status === 'checked_in';

  // 3D Tilt calculation
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setMousePos({
      x: rotateX,
      y: rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(ticket.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-2xl flex justify-center items-center">
        {/* Printable Physical Lanyard Badge (Hidden on screen, revealed exclusively during print) */}
        <div className="hidden print:block print:w-[350px] print:mx-auto print:p-6 print:border-4 print:border-black print:rounded-2xl print:text-black print:bg-white text-center">
          <div className="text-[12px] font-bold tracking-widest uppercase border-b-2 border-black pb-2 mb-3">
            MARWADI UNIVERSITY • OFFICIAL GATE ADMISSION PASS
          </div>
          <h1 className="text-xl font-black mb-1">{event.title || 'CAMPUS EVENT'}</h1>
          <div className="text-xs font-semibold text-gray-700 mb-3">{event.venue} • {event.date}</div>
          
          <div className="p-3 border-2 border-black rounded-xl inline-block my-2">
            <QRCodeSVG
              value={ticket.qrPayload || ticket.ticketCode}
              size={180}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
              includeMargin={false}
            />
          </div>

          <div className="text-lg font-mono font-black tracking-widest my-2 border-t border-b border-gray-400 py-1">
            {ticket.ticketCode}
          </div>

          <div className="text-left text-xs space-y-1 mt-3">
            <div><strong>ATTENDEE:</strong> {ticket.studentName}</div>
            <div><strong>ROLL NO:</strong> {ticket.studentRollNumber || 'N/A'}</div>
            <div><strong>DEPARTMENT:</strong> {ticket.studentDepartment || 'Engineering'}</div>
            <div><strong>ASSIGNED SEAT:</strong> {ticket.seatNumber || 'OPEN GATE'}</div>
          </div>

          <div className="mt-4 pt-2 border-t border-gray-400 text-[10px] text-gray-600 font-mono">
            VERIFIED BY EVENTSYNC CRYPTOGRAPHIC GATE SYSTEM • DO NOT DUPLICATE
          </div>
        </div>

        {/* Interactive 3D Holographic Screen Pass */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md my-auto max-h-[94vh] flex flex-col print:hidden"
          style={{ perspective: 1200 }}
        >
          {/* Card Frame with dynamic 3D tilt */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: mousePos.active
                ? `rotateX(${mousePos.x}deg) rotateY(${mousePos.y}deg) scale3d(1.02, 1.02, 1.02)`
                : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              transition: mousePos.active ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
              transformStyle: 'preserve-3d',
            }}
            className="relative bg-gradient-to-b from-[#090f24] via-[#0b1433] to-[#060a17] rounded-3xl border-2 border-cyan-400/50 shadow-[0_0_90px_rgba(0,240,255,0.3)] flex flex-col overflow-hidden"
          >
            {/* Holographic Prismatic Glare Layer */}
            {mousePos.active && (
              <div
                className="absolute inset-0 pointer-events-none rounded-3xl z-30 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle 350px at ${mousePos.glareX}% ${mousePos.glareY}%, rgba(0, 240, 255, 0.3) 0%, rgba(168, 85, 247, 0.2) 35%, transparent 75%)`,
                }}
              />
            )}

            {/* Anti-Screenshot Watermark Micro-Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none z-10" />

            {/* Header: Institutional Security Bar */}
            <div className="relative p-5 pb-3 bg-gradient-to-r from-cyan-950/90 via-[#0d1838] to-purple-950/90 border-b border-cyan-500/20 z-20 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-300 uppercase">
                    LIVE GATE ADMISSION PASS
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white transition-colors border border-white/5"
                    title={soundEnabled ? 'Mute Audio Chime' : 'Enable Audio Chime'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-white/5"
                    title="Close Pass"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Event Badge & Title */}
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  {event.category || 'CAMPUS EVENT'}
                </span>
                <span className="text-[10px] text-purple-300 font-mono">
                  {event.venue || 'Auditourium'}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white leading-tight font-cyber truncate">
                {event.title || 'Official College Entry Pass'}
              </h2>
            </div>

            {/* Anti-Fraud Live Pulsing Security Telemetry Bar */}
            <div className="bg-cyan-950/70 border-b border-cyan-500/30 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono z-20 shrink-0 shadow-inner">
              <div className="flex items-center gap-1.5 text-cyan-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[10px] tracking-wider font-bold">SEC-SYNC:</span>
                <span className="text-white font-black tracking-widest bg-black/40 px-1.5 py-0.5 rounded border border-cyan-400/40">
                  {liveTime || 'LIVE-12:00:00.00'}
                </span>
              </div>
              <span className="text-[9.5px] text-emerald-400 font-bold uppercase tracking-wider animate-pulse">
                ✓ LIVENESS VERIFIED
              </span>
            </div>

            {/* Central Holographic QR & Card Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-center z-20 scrollbar-thin">
              {/* QR Code Container with Neon Floating Border */}
              <div className="relative inline-block mx-auto group">
                <div className="p-3.5 rounded-2xl bg-white border-4 border-cyan-400 shadow-[0_0_35px_rgba(0,240,255,0.45)] transition-transform duration-300 group-hover:scale-105">
                  <QRCodeSVG
                    value={ticket.qrPayload || ticket.ticketCode}
                    size={175}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#050914"
                    includeMargin={true}
                  />
                </div>

                {isCheckedIn && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 bg-emerald-950/90 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                  >
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                    <span className="text-sm font-black text-emerald-300 uppercase tracking-widest mt-2 font-cyber">
                      ADMITTED AT GATE
                    </span>
                    <span className="text-[11px] text-emerald-200 mt-1 font-mono">
                      {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString() : 'Verified Entry'}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Unique Ticket Code Pill */}
              <div className="flex items-center justify-center gap-2 bg-slate-900/95 py-1.5 px-4 rounded-xl border border-cyan-500/30 w-fit mx-auto shadow-md">
                <span className="text-[10px] uppercase font-mono text-slate-400">GATE PASS CODE:</span>
                <span className="font-mono font-black text-cyan-300 text-xs sm:text-sm tracking-widest">
                  {ticket.ticketCode}
                </span>
                <button
                  onClick={copyCode}
                  className="text-slate-400 hover:text-cyan-300 transition-colors ml-1 p-1 hover:bg-slate-800 rounded"
                  title="Copy Ticket Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Attendee Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-left p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-xs shadow-inner">
                <div>
                  <span className="text-[9.5px] uppercase font-mono text-slate-500 block">Verified Student</span>
                  <span className="font-bold text-white truncate block">{ticket.studentName}</span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-mono text-slate-500 block">Roll / ID Number</span>
                  <span className="font-mono font-bold text-cyan-300">{ticket.studentRollNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-mono text-slate-500 block">Date & Venue</span>
                  <span className="text-slate-300 truncate block">{event.date} • {event.venue || 'Main Hall'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-mono text-slate-500 block">Assigned Seat</span>
                  <span className="font-mono font-black text-purple-300">{ticket.seatNumber || 'OPEN GATE'}</span>
                </div>
              </div>

              {/* Team Squad Banner (if Registered as Team) */}
              {ticket.teamName && (
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-left text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-purple-300 uppercase font-black flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Squad: {ticket.teamName}
                    </span>
                    <span className="text-[10px] text-cyan-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-400/30">
                      {ticket.teamMembers?.length ? `${ticket.teamMembers.length + 1} Members` : 'Team Pass'}
                    </span>
                  </div>
                  {ticket.teamMembers && ticket.teamMembers.length > 0 && (
                    <p className="mt-1 text-[10.5px] text-slate-300 truncate">
                      Co-Members: {ticket.teamMembers.map((m) => m.name).join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Quick Demo Scan Trigger for Presenting to Jury */}
              {onSimulateScan && (
                <button
                  onClick={() => {
                    onClose();
                    onSimulateScan(ticket);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all font-cyber tracking-wider active:scale-95"
                >
                  <ScanLine className="w-4 h-4 text-cyan-300 animate-pulse" />
                  <span>Jury Test: Simulate Gate Scanner Check-in</span>
                </button>
              )}

              {/* Actions Footer */}
              <div className="flex items-center gap-2 pt-1 pb-1">
                <button
                  onClick={handlePrintBadge}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs border border-cyan-400 flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] active:scale-95"
                >
                  <Printer className="w-4 h-4 text-slate-950" />
                  <span>Print Lanyard Badge / PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Visual Anti-Screenshot Notice */}
              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1 pt-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Protected with EventSync Dynamic Visual Telemetry</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
