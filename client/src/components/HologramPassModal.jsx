import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Download,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  ScanLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HologramPassModal = ({ ticket, isOpen, onClose, onSimulateScan }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ticket) return null;

  const event = ticket.event || {};
  const isCheckedIn = ticket.status === 'checked_in';

  const copyCode = () => {
    navigator.clipboard.writeText(ticket.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-xl flex justify-center items-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#0a1024] rounded-3xl border border-cyan-500/40 shadow-[0_0_80px_rgba(0,240,255,0.25)] my-auto max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Hologram Gradient Header - Pinned at top (shrink-0) */}
          <div className="relative p-5 pb-4 bg-gradient-to-br from-cyan-950/90 via-[#0d1633] to-purple-950/90 border-b border-white/10 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-white/10 shadow-lg"
              title="Close Pass"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                {event.category || 'EVENT'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono tracking-widest uppercase">
                DIGITAL PASS
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight font-cyber pr-8">
              {event.title || 'College Event Pass'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">{event.tagline || 'Official Campus Entry Credential'}</p>
          </div>

          {/* Central Holographic QR & Details - Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-center scrollbar-thin">
            <div className="relative inline-block mx-auto">
              <div className="p-3.5 rounded-2xl bg-white border-4 border-cyan-400 shadow-[0_0_35px_rgba(0,240,255,0.4)]">
                <QRCodeSVG
                  value={ticket.qrPayload || ticket.ticketCode}
                  size={175}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                  includeMargin={true}
                />
              </div>

              {isCheckedIn && (
                <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-emerald-400">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                  <span className="text-sm font-extrabold text-emerald-300 uppercase tracking-widest mt-2 font-cyber">
                    Admitted
                  </span>
                  <span className="text-xs text-emerald-200 mt-1 font-mono">
                    Checked in at {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString() : 'Venue'}
                  </span>
                </div>
              )}
            </div>

            {/* Ticket Code Bar */}
            <div className="flex items-center justify-center gap-2 bg-slate-900/90 py-1.5 px-3.5 rounded-xl border border-white/10 w-fit mx-auto">
              <span className="text-[11px] uppercase font-mono text-slate-400">TICKET:</span>
              <span className="font-mono font-bold text-cyan-300 text-xs sm:text-sm tracking-wider">
                {ticket.ticketCode}
              </span>
              <button
                onClick={copyCode}
                className="text-slate-400 hover:text-cyan-300 transition-colors ml-1"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Attendee Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-left p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Student</span>
                <span className="font-semibold text-white truncate block">{ticket.studentName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Roll Number</span>
                <span className="font-mono text-cyan-300">{ticket.studentRollNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Venue</span>
                <span className="text-slate-300 truncate block">{event.venue || 'Campus Hall'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Seat Number</span>
                <span className="font-mono font-bold text-purple-300">{ticket.seatNumber || 'OPEN'}</span>
              </div>
            </div>

            {/* Team Squad Banner if Registered as Team */}
            {ticket.teamName && (
              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-left text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-purple-300 uppercase font-bold">
                    Squad: {ticket.teamName}
                  </span>
                  <span className="text-[10px] text-cyan-400">
                    {ticket.teamMembers?.length ? `${ticket.teamMembers.length + 1} Members` : 'Team Pass'}
                  </span>
                </div>
                {ticket.teamMembers && ticket.teamMembers.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-300 truncate">
                    Co-Members: {ticket.teamMembers.map((m) => m.name).join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Quick Demo Scan Trigger */}
            {onSimulateScan && (
              <button
                onClick={() => {
                  onClose();
                  onSimulateScan(ticket);
                }}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
              >
                <ScanLine className="w-4 h-4" />
                <span>Simulate Scanning This Ticket in Organizer Hub</span>
              </button>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              <button
                onClick={handlePrint}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-white/10 flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save Pass</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
