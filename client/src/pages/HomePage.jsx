import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HologramPassModal } from '../components/HologramPassModal';
import { ClubApplicationModal } from '../components/ClubApplicationModal';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Ticket,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  ScanLine,
  QrCode,
  Shield,
  Layers,
  BarChart3,
  FileSpreadsheet,
  Check,
  ChevronDown,
  GraduationCap,
  Building,
  Lock,
  Compass,
  Cpu,
  Radio,
  Sliders,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Tech Fest', 'Seminar', 'Cultural', 'Gaming'];

const TRUSTED_CLUBS = [
  { name: 'ACM Chapter', desc: 'Computer Science & AI Guild', icon: '💻' },
  { name: 'IEEE Student Branch', desc: 'Hardware & Systems Society', icon: '⚡' },
  { name: 'GDSC Campus', desc: 'Developer Community', icon: '🌐' },
  { name: 'Robotics Guild', desc: 'Autonomous Combat & Drones', icon: '🤖' },
  { name: 'E-Cell Incubator', desc: 'Startup & Innovation Lab', icon: '🚀' },
  { name: 'CyberShield CTF', desc: 'InfoSec & Ethical Hacking', icon: '🛡️' },
  { name: 'Design Collective', desc: 'UI/UX & Media Syndicate', icon: '🎨' },
];

const FAQS = [
  {
    q: 'How does the QR ticket prevent duplicate check-ins?',
    a: 'Every ticket contains a cryptographically signed payload generated with HMAC-SHA256. When scanned at the gate, the server atomically validates the ticket against the active event and records the check-in timestamp. If the exact same QR code is scanned again, the scanner HUD immediately sounds an alert and flashes "Already Checked In" with the original scan time.',
  },
  {
    q: 'Can students access their QR passes offline or without internet at the venue?',
    a: 'Yes! Once registered, passes are permanently cached in the student\'s "My Tickets" vault. Students can also click "Save Pass" to download or print their high-resolution pass with the scannable QR code ready on their phone before heading to the auditorium or hall.',
  },
  {
    q: 'How does capacity management work when an event is full?',
    a: 'Each event has a strict capacity limit. The platform continuously monitors registered attendees in real-time. The moment an event hits capacity, the system automatically locks further registrations, marks the badge as "Sold Out", and prevents any overbooking.',
  },
  {
    q: 'What equipment do club organizers need to scan tickets at the gate?',
    a: 'No special hardware is required! Organizers can simply open EventEase on any smartphone, tablet, or laptop browser, navigate to the Organizer Hub, and tap "Scan QR". The system uses the device camera with an integrated HUD laser sweep and Web Audio synthesizer for instant feedback.',
  },
  {
    q: 'Can attendance data be exported for college administration?',
    a: 'Yes. Organizers and college administrators can export a comprehensive attendance CSV spreadsheet with a single click, containing ticket codes, verified student names, roll numbers, departments, seat allocations, and exact check-in timestamps.',
  },
];

export const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTicketModal, setActiveTicketModal] = useState(null);
  const [registeringId, setRegisteringId] = useState(null);
  const [myRegistrations, setMyRegistrations] = useState({});
  const [personaTab, setPersonaTab] = useState('student'); // 'student' or 'organizer'
  const [openFaq, setOpenFaq] = useState(0);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      const res = await api.events.getAll(params);
      if (res.success) {
        setEvents(res.events);
      }

      if (user) {
        try {
          const ticketsRes = await api.registrations.getMyTickets();
          if (ticketsRes.success && Array.isArray(ticketsRes.registrations)) {
            const regMap = {};
            ticketsRes.registrations.forEach((r) => {
              const eid = typeof r.event === 'object' && r.event ? (r.event._id || r.event.id) : r.event;
              if (eid) {
                regMap[eid.toString()] = r;
              }
            });
            setMyRegistrations(regMap);
          }
        } catch {
          // Gracefully fallback
        }
      } else {
        setMyRegistrations({});
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId, e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    setRegisteringId(eventId);
    try {
      const res = await api.registrations.register(eventId);
      if (res.success) {
        setActiveTicketModal(res.registration);
        setMyRegistrations((prev) => ({
          ...prev,
          [eventId.toString()]: res.registration,
        }));
        loadEvents();
      }
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setRegisteringId(null);
    }
  };

  const scrollToEvents = () => {
    const el = document.getElementById('events-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.venue.toLowerCase().includes(q) ||
      (ev.tagline && ev.tagline.toLowerCase().includes(q)) ||
      (ev.tags && ev.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const totalRegistered = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
  const totalCheckedIn = events.reduce((sum, e) => sum + (e.checkedInCount || 0), 0);
  const turnoutRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 100;

  return (
    <div className="min-h-screen bg-cyber-grid pb-24 overflow-x-hidden">
      {/* ========================================================
          1. HERO SECTION (EXPANDED 2-COLUMN WITH FLOATING PASS)
         ======================================================== */}
      <section className="relative pt-10 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[550px] h-[350px] bg-gradient-to-bl from-purple-600/15 via-pink-500/10 to-transparent blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 7 Columns: Headlines, Badges, CTAs, Counters */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Next-Gen Campus Event Engine & Real-Time Gateways</span>
              </div>

              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-white font-cyber leading-[1.08]">
                SMART CAMPUS EVENTS <br />
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(0,240,255,0.3)]">
                  INSTANT QR ATTENDANCE
                </span>
              </h1>

              <p className="max-w-2xl text-slate-300 text-sm sm:text-base leading-relaxed mx-auto lg:mx-0">
                End-to-end collegiate event registration with cryptographic QR passes, laser gate scanning, duplicate check-in prevention, and live attendance metrics for students and organizers.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={scrollToEvents}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all flex items-center gap-2 font-cyber tracking-wider active:scale-95"
                >
                  <Compass className="w-4 h-4 text-cyan-200" />
                  <span>Explore Campus Events</span>
                </button>

                <Link
                  to={user?.role === 'organizer' ? '/organizer' : user ? '/organizer' : '/register'}
                  className="px-6 py-3.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all flex items-center gap-2 font-cyber tracking-wider"
                >
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>Host Club Event</span>
                </Link>
              </div>

              {/* Live Metric Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-xl mx-auto lg:mx-0">
                <div className="cyber-glass p-3 rounded-2xl border border-cyan-500/20 text-center lg:text-left">
                  <span className="text-2xl font-black text-cyan-400 font-mono">{events.length}</span>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono mt-0.5">Active Events</span>
                </div>
                <div className="cyber-glass p-3 rounded-2xl border border-purple-500/20 text-center lg:text-left">
                  <span className="text-2xl font-black text-purple-400 font-mono">{totalRegistered}</span>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono mt-0.5">Passes Issued</span>
                </div>
                <div className="cyber-glass p-3 rounded-2xl border border-emerald-500/20 text-center lg:text-left">
                  <span className="text-2xl font-black text-emerald-400 font-mono">{totalCheckedIn}</span>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono mt-0.5">Gate Check-Ins</span>
                </div>
                <div className="cyber-glass p-3 rounded-2xl border border-amber-500/20 text-center lg:text-left">
                  <span className="text-2xl font-black text-amber-400 font-mono">{turnoutRate}%</span>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono mt-0.5">Turnout Velocity</span>
                </div>
              </div>
            </motion.div>

            {/* Right 5 Columns: 3D Floating Interactive Hologram Pass Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="relative w-full max-w-md animate-float">
                {/* Backlit Glow Halo */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse-slow" />

                <div className="relative rounded-3xl bg-[#090f24] border border-cyan-400/40 p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
                  {/* Hologram Surface Shimmer */}
                  <div className="absolute inset-0 hologram-shimmer pointer-events-none opacity-40" />

                  {/* Laser Scan Sweep Line */}
                  <div className="scanner-laser pointer-events-none z-30" />

                  {/* Pass Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white tracking-wide block font-cyber">EVENTEASE PASS</span>
                        <span className="text-[9px] font-mono text-cyan-300">SECURE ADMISSION SYSTEM</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      ACTIVE
                    </span>
                  </div>

                  {/* Center QR Matrix with Laser Target */}
                  <div className="my-5 flex flex-col items-center justify-center relative z-10">
                    <div className="relative p-3.5 rounded-2xl bg-white border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                      <QRCodeSVG
                        value="https://eventease.college/verify/EE-DEMO-PASS"
                        size={140}
                        level="H"
                        fgColor="#050914"
                        bgColor="#ffffff"
                        includeMargin={false}
                      />
                      {/* Targeting Corner Brackets */}
                      <span className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-600" />
                      <span className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-600" />
                      <span className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-600" />
                      <span className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-600" />
                    </div>

                    <div className="mt-3 px-3 py-1 rounded-xl bg-slate-900/90 border border-white/10 font-mono text-[11px] text-cyan-300 font-bold tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PASS: EE-HACK-8F29C</span>
                    </div>
                  </div>

                  {/* Pass Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-2xl bg-slate-950/70 border border-white/5 relative z-10">
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-500 block">Attendee</span>
                      <span className="font-semibold text-white truncate block">Alex Rivera</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-500 block">Roll / ID</span>
                      <span className="font-mono text-cyan-300">CS2026-089</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-500 block">Gate / Venue</span>
                      <span className="text-slate-300 truncate block">Turing Innovation Hall</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-500 block">Seat Reserved</span>
                      <span className="font-mono font-bold text-purple-300">DESK-A12</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. CAMPUS PARTNERS / CLUBS TICKER MARQUEE
         ======================================================== */}
      <section className="border-y border-cyan-500/15 bg-slate-950/60 py-4 backdrop-blur-md overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 font-bold shrink-0">
            <Cpu className="w-4 h-4 animate-spin" />
            <span>Campus Chapters:</span>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-1 w-full">
            {TRUSTED_CLUBS.map((club, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/5 shrink-0 text-xs text-slate-300 hover:border-cyan-500/40 transition-colors"
              >
                <span className="text-base">{club.icon}</span>
                <span className="font-bold text-white">{club.name}</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">• {club.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          3. HOW IT WORKS: 3-STEP INTERACTIVE PIPELINE
         ======================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-widest px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
            VERIFIED ENTRY PIPELINE
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-cyber tracking-tight">
            HOW EVENTEASE WORKS
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-400">
            From discovering a collegiate hackathon to laser check-in at the entrance gate in less than 200 milliseconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <motion.div
            whileHover={{ y: -6 }}
            className="cyber-glass p-7 rounded-3xl border border-cyan-500/25 relative space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 text-lg font-mono font-black shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              01
            </div>
            <h3 className="text-lg font-bold text-white font-cyber">DISCOVER & RESERVE</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore college hackathons, technical workshops, and seminars. Reserve your spot with one click before the venue capacity locks.
            </p>
            <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-cyan-300 font-mono">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Concurrency Lock</span>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            whileHover={{ y: -6 }}
            className="cyber-glass p-7 rounded-3xl border border-purple-500/25 relative space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400 text-lg font-mono font-black shadow-[0_0_20px_rgba(168,85,247,0.25)]">
              02
            </div>
            <h3 className="text-lg font-bold text-white font-cyber">CRYPTOGRAPHIC MINTING</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              EventEase generates a unique Holographic QR Ticket with your student roll ID, seat allocation, and an HMAC-SHA256 tamper-evident digital signature.
            </p>
            <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-purple-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>SHA-256 Tamper Protection</span>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            whileHover={{ y: -6 }}
            className="cyber-glass p-7 rounded-3xl border border-emerald-500/25 relative space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 text-lg font-mono font-black shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              03
            </div>
            <h3 className="text-lg font-bold text-white font-cyber">LASER GATE SCAN</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Organizers point their device scanner at your QR code. Check-in triggers in &lt;200ms with haptic audio feedback while duplicate scans are immediately blocked.
            </p>
            <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-emerald-300 font-mono">
              <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Duplicate Toleration</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          4. STUDENT VS ORGANIZER INTERACTIVE PERSONA MATRIX
         ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="cyber-glass-glow rounded-3xl p-6 sm:p-10 border border-cyan-500/30 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-wider">
                ENGINE ARCHITECTURE PREVIEW
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white font-cyber mt-1">
                TAILORED FOR CAMPUS ROLES
              </h2>
            </div>

            {/* Persona Switcher Tabs */}
            <div className="flex p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 gap-1 text-xs font-semibold">
              <button
                onClick={() => setPersonaTab('student')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  personaTab === 'student'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>For Students</span>
              </button>

              <button
                onClick={() => setPersonaTab('organizer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  personaTab === 'organizer'
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>For Club Organizers</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {personaTab === 'student' ? (
              <motion.div
                key="student"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 w-fit">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white font-cyber">Holographic Pass Wallet</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All your event passes organized in one digital vault with live status badges and seat numbers.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 w-fit">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white font-cyber">Tamper-Evident QR</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Cryptographic signature ensures no one can forge or duplicate your admission credential.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 w-fit">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white font-cyber">Live Capacity Meter</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    View real-time spots remaining before registration closes so you never miss a popular hackathon.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 w-fit">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white font-cyber">Offline Ready</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Download or print your pass anytime for zero-stress admission even if college Wi-Fi is spotty.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="organizer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 w-fit">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white font-cyber">Laser Scanner HUD</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Turn any smartphone or laptop into an ultra-fast gate scanner with audio chimes and targeting reticle.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 w-fit">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white font-cyber">Anti-Duplicate Guard</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instant rejection when an already scanned ticket is presented again, showing original check-in time.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 w-fit">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white font-cyber">Recharts Telemetry</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Live check-in rush curve, attendance conversion %, and academic department breakdowns.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 w-fit">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white font-cyber">1-Click CSV Export</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Export verified attendance spreadsheets formatted with roll numbers, departments, and arrival timestamps.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ========================================================
          5. CORE ENGINE SPECS & CAPABILITIES GRID (4 CARDS)
         ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-widest px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
            SYSTEM SPECIFICATIONS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-cyber tracking-tight">
            ENGINE CAPABILITIES
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-400">
            Engineered specifically to solve the friction of college event gates, fraud, and attendance counting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="cyber-glass p-6 rounded-3xl border border-cyan-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-cyber">Cryptographic QR Minting</h4>
                <span className="text-[10px] text-cyan-300 font-mono">HMAC-SHA256 DIGITAL FINGERPRINT</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard event tickets are susceptible to screenshot sharing and tampering. EventEase encrypts the event ID, user ID, roll number, and secret hash into a compact scannable token that can only be validated against the official gate gateway.
            </p>
          </div>

          <div className="cyber-glass p-6 rounded-3xl border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
                <ScanLine className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-cyber">Ultra-Fast Camera HUD Scanner</h4>
                <span className="text-[10px] text-purple-300 font-mono">ZERO-LATENCY CAMERA ENGINE</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Equipped with front/back camera switching, responsive laser sweeps, and Web Audio API synthesized tones. Provides instantaneous green "Access Granted" chimes or amber "Duplicate Alert" warnings without downloading bulky media files.
            </p>
          </div>

          <div className="cyber-glass p-6 rounded-3xl border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-cyber">Atomic Capacity Enforcement</h4>
                <span className="text-[10px] text-emerald-300 font-mono">OVERBOOKING PREVENTION GUARD</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Prevents auditorium crowding and venue violations. When an event reaches maximum seating capacity, the registration engine rejects incoming attempts in real-time, displaying live spot counters to students.
            </p>
          </div>

          <div className="cyber-glass p-6 rounded-3xl border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-cyber">Live Telemetry & CSV Reports</h4>
                <span className="text-[10px] text-amber-300 font-mono">INTERACTIVE RECHARTS VISUALIZATION</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Club leads can monitor hourly check-in arrival rushes on interactive area charts, analyze department participation ratios, toggle manual attendance overrides, and export administrative spreadsheets with one click.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. CAMPUS EVENTS EXPLORER SECTION (#events-section)
         ======================================================== */}
      <section id="events-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <span className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-wider">
              CAMPUS SCHEDULE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-cyber mt-1">
              EXPLORE ACTIVE EVENTS
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hackathons, workshops, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all font-sans"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="cyber-glass rounded-2xl h-80 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="cyber-glass rounded-3xl p-12 text-center border border-cyan-500/20 max-w-lg mx-auto space-y-4 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white font-cyber">No Live Events Scheduled</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Currently, no active events are published on the campus matrix. Real events created by club organizers and faculty will appear here instantly!
              </p>
            </div>
            <button
              onClick={() => {
                if (!user) navigate('/login');
                else setShowEventModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 text-white font-bold text-xs font-cyber tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:brightness-110 transition-all mt-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Register & Publish Real Event</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const eventId = (event._id || event.id || '').toString();
              const userReg = myRegistrations[eventId] || event.userRegistration;
              const isRegistered = Boolean(userReg || event.isRegistered);
              const isFull = event.isFull;
              const fillRate = event.fillRate || 0;
              const spotsLeft = event.spotsLeft !== undefined ? event.spotsLeft : Math.max(0, event.capacity - event.registeredCount);

              return (
                <motion.div
                  key={event._id || event.id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate(`/events/${event._id || event.id}`)}
                  className="cyber-glass rounded-2xl overflow-hidden border border-cyan-500/20 hover:border-cyan-400/50 shadow-[0_4px_25px_rgba(0,0,0,0.5)] transition-all flex flex-col group cursor-pointer"
                >
                  {/* Banner Image with Badges */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={event.bannerImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                        {event.category}
                      </span>
                      {event.isFacultySponsored && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-900/80 backdrop-blur-md text-blue-300 border border-blue-400/40">
                          🏛️ Faculty Official
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      {user?.isFaculty ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                          <Briefcase className="w-3 h-3 text-emerald-400" />
                          <span>Academic Faculty</span>
                        </span>
                      ) : isRegistered ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Registered</span>
                        </span>
                      ) : event.isExpired ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900/90 text-slate-400 border border-slate-700/60 backdrop-blur-md">
                          Expired
                        </span>
                      ) : isFull ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-950/80 text-red-300 border border-red-500/40">
                          Sold Out
                        </span>
                      ) : spotsLeft <= 5 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse">
                          {spotsLeft} Spots Left!
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                          Available
                        </span>
                      )}
                    </div>

                    {/* Venue & Timing Ribbon */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-mono text-cyan-300">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{event.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 font-cyber">
                        {event.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {event.tagline || event.description}
                      </p>
                    </div>

                    {/* Capacity Management Visual Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Attendance Gauge:</span>
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {event.registeredCount} / {event.capacity} <span className="text-slate-400 font-normal">({fillRate}%)</span>
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, fillRate)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            fillRate >= 100
                              ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                              : fillRate >= 80
                              ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                              : 'bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <Link
                        to={`/events/${event._id || event.id}`}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {user?.isFaculty ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/organizer');
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 font-mono"
                          title="Open Faculty Academic Command & Event Supervision"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Faculty Hub</span>
                        </button>
                      ) : isRegistered ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (userReg) {
                              setActiveTicketModal(userReg);
                            } else {
                              navigate(`/events/${event._id || event.id}`);
                            }
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 font-cyber"
                          title="You are registered! Click to view your pass"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Registered</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleRegister(event._id || event.id, e)}
                          disabled={event.isExpired || isFull || registeringId === (event._id || event.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            event.isExpired
                              ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-white/5 font-mono'
                              : isFull
                              ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-white/5'
                              : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-95'
                          }`}
                        >
                          {event.isExpired ? (
                            <span>Expired</span>
                          ) : (
                            <>
                              <Ticket className="w-3.5 h-3.5" />
                              <span>
                                {registeringId === (event._id || event.id) ? 'Generating Pass...' : isFull ? 'Event Full' : 'Register & Get QR'}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================
          7. CAMPUS FAQ ACCORDION
         ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-widest px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
            KNOWLEDGE BASE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-cyber tracking-tight">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to know about EventEase cryptographic attendance and gate scanning.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="cyber-glass rounded-2xl border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-cyan-300 transition-colors"
                >
                  <span className="font-cyber">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          8. GRAND FUTURISTIC CALL-TO-ACTION (CTA) BANNER
         ======================================================== */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 bg-gradient-to-r from-cyan-950/80 via-[#0d163a] to-purple-950/80 border border-cyan-400/40 shadow-[0_0_80px_rgba(0,240,255,0.2)] text-center space-y-6">
          <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-400/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CAMPUS EVENT TRANSFORMATION</span>
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-white font-cyber tracking-tight max-w-3xl mx-auto leading-tight">
            READY TO SUPERCHARGE YOUR CAMPUS EVENTS?
          </h2>

          <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
            Eliminate paper rosters, long entry lines, and unverified attendance. Join hundreds of students and college societies using EventEase.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all font-cyber tracking-wider"
            >
              Get Started For Free
            </Link>

            <button
              onClick={scrollToEvents}
              className="px-8 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-white/10 font-bold text-xs transition-all font-cyber tracking-wider"
            >
              Browse Event Calendar
            </button>
          </div>
        </div>
      </section>

      {/* Hologram Pass Modal upon registration */}
      <HologramPassModal
        ticket={activeTicketModal}
        isOpen={!!activeTicketModal}
        onClose={() => setActiveTicketModal(null)}
        onSimulateScan={() => {
          navigate('/organizer');
        }}
      />

      {/* Event & Club Registration Modal */}
      <ClubApplicationModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSuccess={() => {
          loadEvents();
        }}
      />
    </div>
  );
};
