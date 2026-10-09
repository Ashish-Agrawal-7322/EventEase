import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { QRScannerModal } from '../components/QRScannerModal';
import { AICopilotModal } from '../components/AICopilotModal';
import {
  Plus,
  ScanLine,
  BarChart3,
  Users,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Check,
  AlertTriangle,
  X,
  TrendingUp,
  FileSpreadsheet,
  Bell,
  Mail,
  Upload,
  Image as ImageIcon,
  Zap,
  BookOpen,
  Cpu,
  Mic,
  Music,
  Gamepad2,
  Award,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_CATEGORIES = [
  { id: 'Hackathon', label: 'Hackathon', icon: Zap, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40', defaultBanner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Workshop', label: 'Workshop', icon: BookOpen, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40', defaultBanner: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Tech Fest', label: 'Tech Fest', icon: Cpu, color: 'text-blue-400 bg-blue-500/10 border-blue-500/40', defaultBanner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Seminar', label: 'Seminar', icon: Mic, color: 'text-purple-400 bg-purple-500/10 border-purple-500/40', defaultBanner: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Cultural', label: 'Cultural', icon: Music, color: 'text-amber-400 bg-amber-500/10 border-amber-500/40', defaultBanner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Gaming', label: 'Gaming', icon: Gamepad2, color: 'text-rose-400 bg-rose-500/10 border-rose-500/40', defaultBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80' },
];

export const OrganizerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScannerEvent, setActiveScannerEvent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showCopilotModal, setShowCopilotModal] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [issuingCertificates, setIssuingCertificates] = useState(false);
  const [certSuccessMsg, setCertSuccessMsg] = useState('');
  const [adminViewScope, setAdminViewScope] = useState('mine'); // 'mine' or 'all' (only for admin)

  const handleApplyCopilotData = (aiData) => {
    setFormData((prev) => ({
      ...prev,
      title: aiData.title || prev.title,
      tagline: aiData.tagline || prev.tagline,
      description: aiData.description
        ? `${aiData.description}${aiData.agenda ? `\n\nAgenda:\n${aiData.agenda}` : ''}${aiData.prerequisites ? `\n\nPrerequisites: ${aiData.prerequisites}` : ''}`
        : prev.description,
      category: aiData.category || prev.category,
      capacity: aiData.capacity || prev.capacity,
      tags: Array.isArray(aiData.tags) ? aiData.tags.join(', ') : (aiData.tags || prev.tags),
    }));
  };

  const handleIssueCertificates = async () => {
    if (!selectedEventForParticipants) return;
    try {
      setIssuingCertificates(true);
      setCertSuccessMsg('');
      const res = await api.certificates.issue(selectedEventForParticipants._id);
      if (res.success) {
        setCertSuccessMsg(res.message || 'Certificates successfully issued to checked-in attendees!');
        setTimeout(() => setCertSuccessMsg(''), 6000);
      }
    } catch (err) {
      alert(err.message || 'Failed to issue certificates. Ensure at least one attendee is checked in at the gate.');
    } finally {
      setIssuingCertificates(false);
    }
  };

  // New Event Form State
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    description: '',
    category: 'Hackathon',
    venue: '',
    date: '',
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    registrationDeadline: '',
    capacity: 100,
    tags: 'Campus, Tech',
    bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
  });
  const [creating, setCreating] = useState(false);
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = React.useRef(null);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 675;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, bannerImage: compressedBase64 }));
          setIsCustomImage(true);
        } catch (err) {
          console.error('Image compression failed:', err);
          setFormData((prev) => ({ ...prev, bannerImage: event.target.result }));
          setIsCustomImage(true);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectCategory = (catId) => {
    const selectedCat = EVENT_CATEGORIES.find((c) => c.id === catId);
    setFormData((prev) => ({
      ...prev,
      category: catId,
      bannerImage: !isCustomImage && selectedCat ? selectedCat.defaultBanner : prev.bannerImage,
    }));
  };

  const handleResetBanner = () => {
    const selectedCat = EVENT_CATEGORIES.find((c) => c.id === formData.category) || EVENT_CATEGORIES[0];
    setFormData((prev) => ({ ...prev, bannerImage: selectedCat.defaultBanner }));
    setIsCustomImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    loadOrganizerEvents();
  }, [user, adminViewScope]);

  const loadOrganizerEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      // Individual Organizer Hub: non-admins only see events they personally created
      if (user?.role !== 'admin' || adminViewScope === 'mine') {
        params.organizerOnly = 'true';
      }
      const res = await api.events.getAll(params);
      if (res.success) {
        setEvents(res.events);
        if (res.events.length > 0) {
          if (!selectedEventForParticipants || !res.events.some((e) => e._id === selectedEventForParticipants._id)) {
            setSelectedEventForParticipants(res.events[0]);
            loadParticipants(res.events[0]._id);
          }
        } else {
          setSelectedEventForParticipants(null);
          setParticipants([]);
        }
      }
    } catch (err) {
      console.error('Error fetching organizer events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (eventId) => {
    setLoadingParticipants(true);
    try {
      const res = await api.registrations.getParticipants(eventId);
      if (res.success) {
        setParticipants(res.participants);
      }
    } catch (err) {
      console.error('Error loading participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEventForParticipants(event);
    loadParticipants(event._id);
  };

  const handleToggleCheckIn = async (regId) => {
    try {
      const res = await api.registrations.toggleManual(regId);
      if (res.success) {
        setParticipants((prev) =>
          prev.map((p) => (p._id === regId || p.id === regId ? { ...p, status: res.registration.status } : p))
        );
        loadOrganizerEvents();
      }
    } catch (err) {
      alert(err.message || 'Check-in toggle failed');
    }
  };

  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this event and all associated tickets?')) {
      try {
        await api.events.delete(eventId);
        loadOrganizerEvents();
      } catch (err) {
        alert(err.message || 'Failed to delete event');
      }
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.events.create(formData);
      if (res.success) {
        setShowCreateModal(false);
        loadOrganizerEvents();
      }
    } catch (err) {
      alert(err.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const [sendingReminder, setSendingReminder] = useState(false);
  const handleBroadcastReminder = async () => {
    if (!selectedEventForParticipants) return;
    const confirmMsg = `Send automated "Event Starts in 2 Hours" alert & QR ticket pass to all registered attendees for "${selectedEventForParticipants.title}"?`;
    if (!window.confirm(confirmMsg)) return;

    setSendingReminder(true);
    try {
      const res = await api.registrations.sendReminders(
        selectedEventForParticipants._id,
        'Event Starts in 2 Hours - Gate Opening Alert'
      );
      if (res.success) {
        alert(`🚀 Reminders dispatched successfully!\nSent to: ${res.count} of ${res.total ?? res.count} registered attendees.`);
      } else {
        alert(res.message || 'Failed to dispatch reminders');
      }
    } catch (err) {
      alert(err.message || 'Error broadcasting reminders');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleExportCSV = async (event) => {
    if (!event) return;
    try {
      setExportingCsv(true);
      await api.registrations.exportCSV(event._id, event.title);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert(err.message || 'Failed to export CSV attendance');
    } finally {
      setExportingCsv(false);
    }
  };

  const totalRegistered = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
  const totalCheckedIn = events.reduce((sum, e) => sum + (e.checkedInCount || 0), 0);
  const avgTurnout = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

  const filteredParticipants = participants.filter((p) => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase();
    return (
      p.studentName.toLowerCase().includes(q) ||
      p.studentRollNumber.toLowerCase().includes(q) ||
      p.ticketCode.toLowerCase().includes(q) ||
      p.studentDepartment.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-cyber-grid pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-cyber">
                ORGANIZER OPERATIONS COMMAND
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time attendance gate management, QR laser scanning, capacity oversight, and export.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadOrganizerEvents}
              className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all font-cyber"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Global KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="cyber-glass p-5 rounded-2xl border border-cyan-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Managed Events</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2 font-mono">{events.length}</div>
            <span className="text-[10px] text-cyan-300/80 font-mono mt-1 block">Live On Campus</span>
          </div>

          <div className="cyber-glass p-5 rounded-2xl border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Total Registrations</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-purple-300 mt-2 font-mono">{totalRegistered}</div>
            <span className="text-[10px] text-purple-300/80 font-mono mt-1 block">QR Passes Issued</span>
          </div>

          <div className="cyber-glass p-5 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Total Checked In</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">{totalCheckedIn}</div>
            <span className="text-[10px] text-emerald-300/80 font-mono mt-1 block">Scanned At Entry Gate</span>
          </div>

          <div className="cyber-glass p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Check-in Turnout</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-300 mt-2 font-mono">{avgTurnout}%</div>
            <span className="text-[10px] text-amber-300/80 font-mono mt-1 block">Conversion Velocity</span>
          </div>
        </div>

        {/* Managed Events Cards */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white font-cyber tracking-wider">
                  YOUR MANAGED EVENTS ({events.length})
                </h2>
                {user && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Host: {user.name}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {user?.role === 'admin' && adminViewScope === 'all'
                  ? 'Showing all college events across the institution (Admin Oversight)'
                  : `Displaying events created and operated under ${user?.name || 'your'} profile`}
              </span>
            </div>

            {user?.role === 'admin' && (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setAdminViewScope('mine')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    adminViewScope === 'mine'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  My Events
                </button>
                <button
                  onClick={() => setAdminViewScope('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    adminViewScope === 'all'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Campus Events
                </button>
              </div>
            )}
          </div>

          {events.length === 0 ? (
            <div className="cyber-glass rounded-3xl p-10 text-center border border-white/10 max-w-lg mx-auto space-y-4 my-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-cyber">No Events Published Yet</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  You haven't created any events under your account (<strong className="text-white">{user?.name}</strong>). Each organizer has their own individual hub.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all font-cyber"
              >
                <Plus className="w-4 h-4" />
                <span>Launch New Event</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => {
              const isSelected = selectedEventForParticipants?._id === ev._id;
              const fillRate = ev.fillRate || 0;
              const checkInRate = ev.checkInRate || 0;

              return (
                <div
                  key={ev._id}
                  onClick={() => handleSelectEvent(ev)}
                  className={`cyber-glass rounded-2xl p-5 border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-cyan-400/80 shadow-[0_0_30px_rgba(0,240,255,0.25)] bg-[#0c1630]'
                      : 'border-white/10 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        {ev.category}
                      </span>
                      {ev.isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-slate-900/80 text-slate-400 border border-slate-700/60">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteEvent(ev._id, e)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-1 font-cyber">
                    {ev.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      {ev.date}
                    </span>
                    <span>•</span>
                    <span className="truncate">{ev.venue}</span>
                  </div>

                  {/* Registered & Check-in Counters */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">Registered</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {ev.registeredCount} / {ev.capacity}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">Checked In</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {ev.checkedInCount} ({checkInRate}%)
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveScannerEvent(ev);
                      }}
                      className="py-2 px-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all font-mono"
                    >
                      <ScanLine className="w-3.5 h-3.5" />
                      <span>Scan QR</span>
                    </button>

                    <Link
                      to={`/analytics/${ev._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="py-2 px-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all font-mono text-center"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Analytics</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Selected Event Attendee Management Panel */}
        {selectedEventForParticipants && (
          <div className="cyber-glass-glow rounded-3xl p-6 border border-cyan-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white font-cyber">
                    ATTENDEE MANAGEMENT: {selectedEventForParticipants.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live participant roster. Toggle check-in status or download CSV attendance audit.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleIssueCertificates}
                  disabled={issuingCertificates || participants.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                  title="Issue Verifiable QR Certificates exclusively to physically checked-in students"
                >
                  <Award className={`w-4 h-4 text-cyan-400 ${issuingCertificates ? 'animate-spin' : ''}`} />
                  <span>{issuingCertificates ? 'Issuing...' : 'Issue QR Certificates'}</span>
                </button>

                <button
                  onClick={handleBroadcastReminder}
                  disabled={sendingReminder || participants.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send 2-Hour Gate Opening reminder emails with QR ticket pass to all registered attendees"
                >
                  <Bell className={`w-4 h-4 text-amber-400 ${sendingReminder ? 'animate-bounce' : ''}`} />
                  <span>{sendingReminder ? 'Sending Alerts...' : 'Broadcast 2h Alert'}</span>
                </button>

                <button
                  onClick={() => handleExportCSV(selectedEventForParticipants)}
                  disabled={exportingCsv}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                  title="Download CSV attendance roster"
                >
                  <FileSpreadsheet className={`w-4 h-4 text-emerald-400 ${exportingCsv ? 'animate-spin' : ''}`} />
                  <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
                </button>

                <button
                  onClick={() => setActiveScannerEvent(selectedEventForParticipants)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all font-cyber"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Launch QR Scanner</span>
                </button>
              </div>
            </div>

            {certSuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs font-mono text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{certSuccessMsg}</span>
              </div>
            )}

            {/* Filter / Search Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, roll no, ticket code..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Showing <strong className="text-cyan-300">{filteredParticipants.length}</strong> Attendees
              </div>
            </div>

            {/* Attendee Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/5">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Ticket Code</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Seat</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-900/40">
                  {loadingParticipants ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-500">
                        Loading attendee records...
                      </td>
                    </tr>
                  ) : filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-500">
                        No attendees match criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => {
                      const isCheckedIn = p.status === 'checked_in';
                      return (
                        <tr key={p._id || p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                            {p.ticketCode}
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            {p.studentName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {p.studentRollNumber || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-slate-400">{p.studentDepartment}</td>
                          <td className="py-3 px-4 font-mono text-purple-300">{p.seatNumber}</td>
                          <td className="py-3 px-4">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                <Check className="w-3 h-3" /> Checked In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                Registered
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleToggleCheckIn(p._id || p.id)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                isCheckedIn
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                              }`}
                            >
                              {isCheckedIn ? 'Undo Check-in' : 'Mark Checked In'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#090e1f] rounded-3xl p-6 border border-cyan-500/40 shadow-2xl my-auto space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-extrabold text-lg text-white font-cyber flex items-center gap-2">
                      <Plus className="w-5 h-5 text-cyan-400" />
                      CREATE CAMPUS EVENT
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCopilotModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ AI Copilot Blueprint</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Event Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ApexHack 2026: AI Hackathon"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Short Tagline</label>
                    <input
                      type="text"
                      placeholder="Brief one-line catchy summary"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Category Selection (6 exact options) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                      <span>Event Category / Type *</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Select category</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {EVENT_CATEGORIES.map((cat) => {
                        const IconComponent = cat.icon;
                        const isSelected = formData.category === cat.id;
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            onClick={() => handleSelectCategory(cat.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center gap-1 ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-bold'
                                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <IconComponent className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                            <span className="text-[11px] leading-tight">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Banner / Picture of Event Upload Section */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Event Picture / Banner *</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WEBP</span>
                    </label>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    {/* Banner Preview Box */}
                    <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 group bg-slate-950/80 h-36">
                      <img
                        src={formData.bannerImage}
                        alt="Event Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                              isCustomImage
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}>
                              {isCustomImage ? '✓ Custom Upload' : 'Default Preset'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg transition-all"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isCustomImage ? 'Change Photo' : 'Upload Event Pic'}</span>
                            </button>
                            {isCustomImage && (
                              <button
                                type="button"
                                onClick={handleResetBanner}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-white/10 transition-all"
                                title="Reset to Category Preset"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {uploadError && (
                      <p className="text-[11px] text-red-400 mt-1">{uploadError}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Max Capacity *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Registration Deadline (Optional)</label>
                      <input
                        type="date"
                        value={formData.registrationDeadline}
                        onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                        placeholder="Leave blank to expire on event date"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Event Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                      <input
                        type="text"
                        placeholder="10:00 AM"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                      <input
                        type="text"
                        placeholder="04:00 PM"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Venue / Hall *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Auditorium Hall A or Turing Lab"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Event Description *</label>
                    <textarea
                      required
                      rows="3"
                      placeholder="Detailed schedule, speaker info, prerequisites..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold shadow-lg hover:brightness-110 font-cyber"
                    >
                      {creating ? 'Publishing...' : 'Publish Event'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* QR Scanner HUD Modal */}
        <QRScannerModal
          event={activeScannerEvent}
          isOpen={!!activeScannerEvent}
          onClose={() => setActiveScannerEvent(null)}
          onCheckInSuccess={() => {
            loadOrganizerEvents();
            if (selectedEventForParticipants) {
              loadParticipants(selectedEventForParticipants._id);
            }
          }}
        />

        {/* AI Copilot Blueprint Generator Modal */}
        <AICopilotModal
          isOpen={showCopilotModal}
          onClose={() => setShowCopilotModal(false)}
          onApplyGeneratedData={handleApplyCopilotData}
        />
      </div>
    </div>
  );
};
