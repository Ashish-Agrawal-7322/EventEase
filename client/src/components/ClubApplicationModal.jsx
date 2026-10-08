import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AICopilotModal } from './AICopilotModal';
import {
  X,
  Building,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Zap,
  BookOpen,
  Cpu,
  Mic,
  Music,
  Gamepad2,
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const EVENT_CATEGORIES = [
  { id: 'Hackathon', label: 'Hackathon', icon: Zap, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40', defaultBanner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Workshop', label: 'Workshop', icon: BookOpen, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40', defaultBanner: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Tech Fest', label: 'Tech Fest', icon: Cpu, color: 'text-blue-400 bg-blue-500/10 border-blue-500/40', defaultBanner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Seminar', label: 'Seminar', icon: Mic, color: 'text-purple-400 bg-purple-500/10 border-purple-500/40', defaultBanner: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Cultural', label: 'Cultural', icon: Music, color: 'text-amber-400 bg-amber-500/10 border-amber-500/40', defaultBanner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80' },
  { id: 'Gaming', label: 'Gaming', icon: Gamepad2, color: 'text-rose-400 bg-rose-500/10 border-rose-500/40', defaultBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80' },
];

export const ClubApplicationModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
    bannerImage: EVENT_CATEGORIES[0].defaultBanner,
  });

  const [isCustomImage, setIsCustomImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [showCopilotModal, setShowCopilotModal] = useState(false);

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

  if (!isOpen) return null;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide an event title.');
      return;
    }
    if (!formData.venue.trim()) {
      setError('Please specify the event venue or hall.');
      return;
    }
    if (!formData.date) {
      setError('Please choose the event date.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.events.create(formData);
      if (res.success) {
        setCreatedEvent(res.event);
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        if (onSuccess) {
          onSuccess(res.event);
        }
      } else {
        setError(res.message || 'Failed to publish event');
      }
    } catch (err) {
      setError(err.message || 'Error publishing event');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#090e1f] rounded-3xl p-6 sm:p-7 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.25)] my-auto space-y-4"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white font-cyber tracking-tight">
                  REGISTER CAMPUS EVENT
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCopilotModal(true)}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-[10px] font-bold shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>✨ AI Copilot</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Host Hackathons, Workshops & Fests for Marwadi University
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success or Pending Approval View */}
        {createdEvent ? (
          <div className="py-6 space-y-5 text-center">
            {createdEvent.requiresApproval || createdEvent.approvalStatus === 'pending' ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white font-cyber">
                    PROPOSAL SUBMITTED FOR ADMIN APPROVAL!
                  </h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    "{createdEvent.title}" has been successfully forwarded to Campus Administration for review.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
                  <span>⏳ Status: Awaiting Admin Verification</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white font-cyber">
                    EVENT REGISTERED & PUBLISHED!
                  </h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    "{createdEvent.title}" is now active in the campus schedule under{' '}
                    <span className="font-bold text-cyan-300">{createdEvent.category}</span>.
                  </p>
                </div>
              </>
            )}

            <div className="rounded-2xl overflow-hidden border border-cyan-500/30 max-w-md mx-auto relative h-36">
              <img
                src={createdEvent.bannerImage}
                alt={createdEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <div className="text-left">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {createdEvent.category}
                  </span>
                  <div className="text-sm font-bold text-white mt-1">{createdEvent.title}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 max-w-md mx-auto">
              {!(createdEvent.requiresApproval || createdEvent.approvalStatus === 'pending') && (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/events/${createdEvent._id}`);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs font-cyber tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                >
                  <span>View Event Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
                className="w-full py-3 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
              >
                {createdEvent.requiresApproval || createdEvent.approvalStatus === 'pending'
                  ? 'Done (Awaiting Approval)'
                  : 'Back to Schedule'}
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ApexHack 2026: AI & Web3 Hackathon"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Short Tagline
              </label>
              <input
                type="text"
                placeholder="Catchy one-line summary for students"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Category / Type of Event Options */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                <span>Event Type / Category *</span>
                <span className="text-[10px] text-cyan-400 font-mono">Select matching category</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {EVENT_CATEGORIES.map((cat) => {
                  const IconComp = cat.icon;
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
                      <IconComp className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="text-[11px] leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Picture / Banner Upload Option */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>Pic of Event (Banner Upload) *</span>
                <span className="text-[10px] text-slate-400">JPG, PNG, WEBP from device</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 group bg-slate-950/80 h-36">
                <img
                  src={formData.bannerImage}
                  alt="Event Banner Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isCustomImage
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {isCustomImage ? '✓ Custom Upload' : 'Default Preset'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isCustomImage ? 'Change Photo' : 'Upload Banner Pic'}</span>
                      </button>
                      {isCustomImage && (
                        <button
                          type="button"
                          onClick={handleResetBanner}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-white/10 transition-all"
                          title="Reset to category preset"
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
                <label className="block text-slate-300 font-semibold mb-1">
                  Max Capacity *
                </label>
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
                <label className="block text-slate-300 font-semibold mb-1">
                  Registration Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Expires on event date if empty"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  placeholder="10:00 AM"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  End Time
                </label>
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
              <label className="block text-slate-300 font-semibold mb-1">
                Venue / Hall *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Auditorium Hall A or Turing Lab"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Event Description *
              </label>
              <textarea
                required
                rows="3"
                placeholder="Detailed schedule, speaker info, prerequisites..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="pt-2 flex items-center gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold border border-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 hover:brightness-110 text-white font-bold font-cyber tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                {loading ? (
                  <span>Publishing Event...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Publish Event</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Embedded AI Copilot Blueprint Modal */}
      <AICopilotModal
        isOpen={showCopilotModal}
        onClose={() => setShowCopilotModal(false)}
        onApplyGeneratedData={handleApplyCopilotData}
      />
    </div>,
    document.body
  );
};
