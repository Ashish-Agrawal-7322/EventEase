import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Sparkles,
  QrCode,
  Download,
  ShieldCheck,
  User,
  Hash,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

export const TicketCard = ({ ticket, onOpenModal, onOpenVault }) => {
  const [copied, setCopied] = useState(false);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl overflow-hidden backdrop-blur-xl border transition-all duration-300 ${
        isCheckedIn
          ? 'bg-gradient-to-b from-[#091e1d] to-[#071318] border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
          : 'bg-gradient-to-b from-[#0c142c] to-[#080d1d] border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.12)]'
      }`}
    >
      {/* Hologram Light Sheen */}
      <div className="absolute inset-0 hologram-shimmer pointer-events-none opacity-40" />

      {/* Top Banner & Status Header */}
      <div className="p-5 border-b border-white/10 relative z-10">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {event.category || 'College Event'}
          </span>

          {isCheckedIn ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Checked In</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Pass Active</span>
            </div>
          )}
        </div>

        <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
          {event.title || 'Campus Event Pass'}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
          {event.tagline || 'Official College Entry Credential'}
        </p>
      </div>

      {/* Ticket Details & QR Core */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative z-10">
        {/* Left: Event & Student Info */}
        <div className="sm:col-span-2 space-y-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium text-slate-200">{event.date || 'TBD'}</span>
            <span className="text-slate-500">•</span>
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{event.startTime || '10:00 AM'}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{event.venue || 'Campus Auditorium'}</span>
          </div>

          <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-mono">Attendee</span>
              <span className="font-semibold text-white truncate block">{ticket.studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-mono">Roll / ID</span>
              <span className="font-mono text-cyan-300">{ticket.studentRollNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-mono">Department</span>
              <span className="text-slate-300 truncate block">{ticket.studentDepartment}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-mono">Seat / Spot</span>
              <span className="font-mono font-bold text-purple-300">{ticket.seatNumber || 'GEN-01'}</span>
            </div>
          </div>
        </div>

        {/* Right: Scannable Holographic QR Code Box */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 shadow-[inset_0_0_20px_rgba(0,240,255,0.1)]">
          <div className="p-2 rounded-lg bg-[#050914] border border-cyan-400/40 relative group">
            <QRCodeSVG
              value={ticket.qrPayload || ticket.ticketCode}
              size={110}
              bgColor="#050914"
              fgColor={isCheckedIn ? "#00ff9d" : "#00f0ff"}
              level="M"
              includeMargin={false}
            />
            {isCheckedIn && (
              <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
              </div>
            )}
          </div>
          <span className="text-[10px] text-cyan-400/80 font-mono mt-2 tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> Tamper Evident
          </span>
        </div>
      </div>

      {/* Ticket Footer / Barcode Code Bar */}
      <div className="px-5 py-3 bg-black/40 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono text-slate-400">Pass Code:</span>
          <span className="font-mono font-bold text-cyan-300 tracking-wider">
            {ticket.ticketCode}
          </span>
          <button
            onClick={copyCode}
            className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Copy Ticket Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isCheckedIn && onOpenVault && (
            <button
              onClick={onOpenVault}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/40 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              title="View your verified Certificate of Participation"
            >
              <Award className="w-3 h-3 text-amber-400" /> Certificate
            </button>
          )}
          {onOpenModal && (
            <button
              onClick={() => onOpenModal(ticket)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] font-medium border border-cyan-500/30 transition-all flex items-center gap-1"
            >
              <QrCode className="w-3 h-3" /> Full Pass
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-white/5 transition-all flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Save
          </button>
        </div>
      </div>
    </motion.div>
  );
};
