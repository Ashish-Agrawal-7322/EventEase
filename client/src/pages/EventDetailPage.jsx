import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HologramPassModal } from '../components/HologramPassModal';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Building,
  Tag,
  ScanLine,
  UserPlus,
  Trash2,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [ticketModal, setTicketModal] = useState(null);
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([{ name: '', rollNumber: '' }]);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const res = await api.events.getById(id);
      if (res.success) {
        setEvent(res.event);
        if (res.event.userRegistration) {
          setTicketModal(res.event.userRegistration);
        }
      }
    } catch (err) {
      console.error('Error loading event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    if (teamMembers.length < 3) {
      setTeamMembers([...teamMembers, { name: '', rollNumber: '' }]);
    }
  };

  const handleRemoveMember = (idx) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== idx));
  };

  const handleUpdateMember = (idx, field, value) => {
    const updated = [...teamMembers];
    updated[idx][field] = value;
    setTeamMembers(updated);
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isTeamMode && !teamName.trim()) {
      alert('Please provide a Team Name for squad registration.');
      return;
    }

    setRegistering(true);
    try {
      const payload = isTeamMode
        ? {
            isTeamRegistration: true,
            teamName: teamName.trim(),
            teamMembers: teamMembers.filter((m) => m.name.trim()),
          }
        : {};

      const res = await api.registrations.register(id, payload);
      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#a855f7', '#00ff9d'],
        });
        setTicketModal(res.registration);
        loadEvent();
      }
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">Event Not Found</h2>
        <Link to="/" className="text-cyan-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Return to Events
        </Link>
      </div>
    );
  }

  const isFull = event.isFull;
  const isExpired = event.isExpired;
  const isRegistered = !!event.userRegistration;
  const spotsLeft = event.spotsLeft !== undefined ? event.spotsLeft : Math.max(0, event.capacity - event.registeredCount);

  return (
    <div className="min-h-screen bg-cyber-grid pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>

        {/* Hero Event Card */}
        <div className="cyber-glass rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.6)]">
          {/* Banner */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden">
            <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090e1f] via-[#090e1f]/50 to-transparent" />

            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 backdrop-blur-md">
                {event.category}
              </span>
              {isExpired ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900/90 text-slate-400 border border-slate-700/60 backdrop-blur-md">
                  CONCLUDED / EXPIRED
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40 backdrop-blur-md">
                  {event.status.toUpperCase()}
                </span>
              )}
              {event.isFacultySponsored && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40 backdrop-blur-md">
                  🏛️ FACULTY OFFICIAL
                </span>
              )}
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-2xl sm:text-4xl font-black text-white font-cyber drop-shadow-md">
                {event.title}
              </h1>
              <p className="text-sm text-cyan-300/90 mt-1 max-w-2xl">{event.tagline}</p>
            </div>
          </div>

          {/* Details & Registration Matrix */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Description, Agenda, Organizer */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timing & Location Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Date & Timing</span>
                    <span className="text-xs font-bold text-white block">{event.date}</span>
                    <span className="text-[11px] text-slate-400">{event.startTime} - {event.endTime}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Venue & Location</span>
                    <span className="text-xs font-bold text-white block">{event.venue}</span>
                    <span className="text-[11px] text-slate-400">Campus Check-in Gate</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-cyber mb-2">
                  Event Briefing & Scope
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase font-mono mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" /> Focus Highlights:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-300 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Organizer Card */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Hosted by:</span>
                  <span className="text-xs font-bold text-white">{event.organizerName}</span>
                </div>
              </div>
            </div>

            {/* Right Col: Registration & Capacity Panel */}
            <div className="space-y-5">
              <div className="cyber-glass-glow p-6 rounded-2xl border border-cyan-500/30 space-y-4">
                <h3 className="text-sm font-extrabold text-white uppercase font-cyber tracking-wide flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-cyan-400" /> Registration Terminal
                </h3>

                {/* Capacity Counter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Capacity Fill:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {event.registeredCount} / {event.capacity} ({event.fillRate}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        event.fillRate >= 100
                          ? 'bg-red-500'
                          : event.fillRate >= 80
                          ? 'bg-amber-400'
                          : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, event.fillRate)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block text-right">
                    {spotsLeft} remaining allocations
                  </span>
                </div>

                {/* State: Registered */}
                {isRegistered ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                      <span className="text-xs font-bold text-emerald-300 block">You Are Registered!</span>
                      <span className="text-[10px] font-mono text-slate-300">
                        Ticket: {event.userRegistration.ticketCode}
                      </span>
                    </div>

                    <button
                      onClick={() => setTicketModal(event.userRegistration)}
                      className="w-full py-3 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 font-cyber"
                    >
                      <ScanLine className="w-4 h-4" />
                      <span>Display Digital QR Pass</span>
                    </button>
                  </div>
                ) : isExpired ? (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/60 text-center space-y-2">
                    <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block font-cyber">REGISTRATION CLOSED</span>
                      <span className="text-[10px] text-slate-500 font-mono">DEADLINE PASSED</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      This event was scheduled for <strong className="text-slate-200">{event.date}</strong> and has concluded. Registration is closed.
                    </p>
                  </div>
                ) : isFull ? (
                  <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-center space-y-1">
                    <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
                    <span className="text-xs font-bold text-red-300 block">Event is Full</span>
                    <p className="text-[11px] text-slate-400">All registered spots for this event have been filled.</p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {/* Solo vs Team Registration Toggle */}
                    <div className="flex rounded-xl bg-slate-900/90 p-1 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsTeamMode(false)}
                        className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all ${
                          !isTeamMode
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Solo Entry
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTeamMode(true)}
                        className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-1 ${
                          isTeamMode
                            ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Team Squad</span>
                      </button>
                    </div>

                    {isTeamMode && (
                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                        <div>
                          <label className="block text-[11px] font-mono uppercase text-purple-300 mb-1">
                            Team / Squad Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. CyberKnights"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono uppercase text-slate-400">
                              Squad Members ({teamMembers.length}/3)
                            </label>
                            {teamMembers.length < 3 && (
                              <button
                                type="button"
                                onClick={handleAddMember}
                                className="text-[10px] text-purple-300 hover:text-purple-200 font-mono flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add Member
                              </button>
                            )}
                          </div>

                          {teamMembers.map((m, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center">
                              <input
                                type="text"
                                placeholder={`Member ${idx + 2} Name`}
                                value={m.name}
                                onChange={(e) => handleUpdateMember(idx, 'name', e.target.value)}
                                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                              />
                              <input
                                type="text"
                                placeholder="Roll No"
                                value={m.rollNumber}
                                onChange={(e) => handleUpdateMember(idx, 'rollNumber', e.target.value)}
                                className="w-24 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                              />
                              {teamMembers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(idx)}
                                  className="text-slate-500 hover:text-rose-400 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Instant Pass Issuance
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Free admission for verified campus students. An encrypted, verifiable QR ticket is instantly created upon registration.
                      </p>
                    </div>

                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-teal-400 to-purple-600 hover:brightness-110 text-white shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 font-cyber tracking-wider"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {registering
                          ? 'Minting QR Ticket...'
                          : isTeamMode
                          ? 'Register Squad & Get Pass'
                          : 'Register & Get Pass'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hologram Pass Modal */}
      <HologramPassModal
        ticket={ticketModal}
        isOpen={!!ticketModal}
        onClose={() => setTicketModal(null)}
        onSimulateScan={() => navigate('/organizer')}
      />
    </div>
  );
};
