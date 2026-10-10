import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Award,
  RefreshCw,
  Search,
  Sparkles,
  BarChart2,
  Building,
  Check,
  XCircle,
  Clock,
  MapPin,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const COLORS = ['#00f0ff', '#a855f7', '#00ff9d', '#ffb703', '#f43f5e', '#38bdf8'];

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [organizerRequests, setOrganizerRequests] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [processingReqId, setProcessingReqId] = useState(null);
  const [reviewingEventId, setReviewingEventId] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, reqRes, eventsRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(),
        api.admin.getOrganizerRequests(),
        api.admin.getPendingEvents(),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
      if (reqRes.success) setOrganizerRequests(reqRes.requests || []);
      if (eventsRes?.success) setPendingEvents(eventsRes.events || []);
    } catch (err) {
      console.error('Admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewEvent = async (eventId, action) => {
    setReviewingEventId(eventId);
    try {
      const res = await api.admin.reviewEvent(eventId, action);
      if (res.success) {
        alert(res.message);
        loadAdminData();
      }
    } catch (err) {
      alert(err.message || 'Error reviewing event');
    } finally {
      setReviewingEventId(null);
    }
  };

  const handleReviewRequest = async (userId, action) => {
    setProcessingReqId(userId);
    try {
      const res = await api.admin.reviewOrganizerRequest(userId, action);
      if (res.success) {
        alert(res.message);
        loadAdminData();
      }
    } catch (err) {
      alert(err.message || 'Error reviewing request');
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const res = await api.admin.updateRole(userId, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId || u._id === userId ? { ...u, role: newRole } : u))
        );
        loadAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handlePurgeDummyData = async () => {
    if (!window.confirm('Are you sure you want to completely purge all legacy dummy events, sample tickets, and demo users from the database? Real campus records will be preserved.')) return;
    try {
      const res = await api.admin.purgeDummyData();
      alert(res.message || 'Dummy data successfully purged!');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Error purging dummy data');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-grid pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-cyber">
                CAMPUS OVERSIGHT & GOVERNANCE
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dean of Student Affairs system audit • College-wide event metrics & identity governance
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePurgeDummyData}
              className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 hover:text-white hover:bg-red-900/60 transition-all text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="Purge legacy dummy data"
            >
              <span>🧹 Purge Dummy Data</span>
            </button>
            <button
              onClick={loadAdminData}
              className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
              title="Refresh All"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="cyber-glass p-5 rounded-2xl border border-cyan-500/20">
              <span className="text-xs text-slate-400 font-mono">Total Verified Users</span>
              <div className="text-3xl font-black text-white mt-1 font-mono">{stats.totalUsers}</div>
              <span className="text-[10px] text-cyan-400 font-mono mt-1 block">
                {stats.studentsCount} Students • {stats.facultyCount || 1} Faculty • {stats.adminCount || 1} Admin
              </span>
            </div>

            <div className="cyber-glass p-5 rounded-2xl border border-purple-500/20">
              <span className="text-xs text-slate-400 font-mono">College Events</span>
              <div className="text-3xl font-black text-purple-300 mt-1 font-mono">{stats.totalEvents}</div>
              <span className="text-[10px] text-purple-400 font-mono mt-1 block">Across All Departments</span>
            </div>

            <div className="cyber-glass p-5 rounded-2xl border border-emerald-500/20">
              <span className="text-xs text-slate-400 font-mono">Issued QR Passes</span>
              <div className="text-3xl font-black text-emerald-400 mt-1 font-mono">
                {stats.totalRegistrations}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                {stats.totalCheckedIn} Verified Gate Check-ins
              </span>
            </div>

            <div className="cyber-glass p-5 rounded-2xl border border-amber-500/20">
              <span className="text-xs text-slate-400 font-mono">Overall Turnout Rate</span>
              <div className="text-3xl font-black text-amber-300 mt-1 font-mono">{stats.overallTurnout}%</div>
              <span className="text-[10px] text-amber-400 font-mono mt-1 block">Campus Attendance Metric</span>
            </div>
          </div>
        )}

        {/* Analytics Charts & Campus Intelligence */}
        {stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Category Breakdown */}
              <div className="cyber-glass p-6 rounded-3xl border border-cyan-500/20 space-y-5 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-extrabold text-sm text-white font-cyber flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    EVENT DISTRIBUTION BY CATEGORY
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                    {stats.totalEvents} Active Events
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categoryStats} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="barGradient0" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#0077b6" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00ff9d" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="barGradient3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffb703" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#d97706" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="barGradient4" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#be123c" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                        axisLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#334155' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#090e1f]/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-3 shadow-[0_0_25px_rgba(0,240,255,0.25)] font-mono text-xs space-y-1">
                                <p className="font-bold text-white flex items-center gap-1.5 font-cyber">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: COLORS[payload[0].payload?.__index % COLORS.length] || '#00f0ff' }}
                                  />
                                  <span>{label}</span>
                                </p>
                                <p className="text-slate-300">
                                  Campus Events: <strong className="text-cyan-300 font-cyber text-sm">{payload[0].value}</strong>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" name="Events Count" radius={[8, 8, 2, 2]}>
                        {stats.categoryStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#barGradient${index % 5})`}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={1.5}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Legend Badges */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                  {stats.categoryStats.map((entry, idx) => (
                    <div
                      key={entry.name}
                      className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-2 text-xs"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-slate-300 font-medium">{entry.name}</span>
                      <span className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                        {entry.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Engagement Leaderboard */}
              <div className="cyber-glass p-6 rounded-3xl border border-emerald-500/20 space-y-5 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-extrabold text-sm text-white font-cyber flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    DEPARTMENT ENGAGEMENT LEADERBOARD
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {stats.totalRegistrations} Registrations
                  </span>
                </div>

                {/* Department Ranked Cards */}
                <div className="space-y-3">
                  {stats.deptStats.map((dept, idx) => {
                    const percentage = stats.totalRegistrations > 0
                      ? Math.round((dept.count / stats.totalRegistrations) * 100)
                      : 0;
                    return (
                      <div
                        key={dept.name}
                        className="p-3 rounded-2xl bg-slate-900/70 border border-white/5 space-y-2 hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              #{idx + 1}
                            </span>
                            <span className="font-semibold text-white">{dept.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-emerald-300 font-bold">{dept.count} seats</span>
                            <span className="text-slate-400 text-[10px]">({percentage}%)</span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all duration-700"
                            style={{ width: `${Math.max(5, percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Attendance Metric Footnote */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Total Verified Students:</span>
                  <span className="font-bold text-emerald-400">{stats.studentsCount} Students</span>
                </div>
              </div>
            </div>

            {/* Turnout & Verification Funnel Banner */}
            <div className="cyber-glass p-5 rounded-2xl border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-cyber text-white">COLLEGE-WIDE ATTENDANCE FUNNEL</h4>
                  <p className="text-[11px] text-slate-400">
                    Real-time ratio of distributed QR passes versus physical gate laser scan check-ins
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Scanned / Issued</span>
                  <span className="text-base font-bold font-mono text-white">
                    {stats.totalCheckedIn} <span className="text-slate-500 font-normal">/</span> {stats.totalRegistrations}
                  </span>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  {stats.overallTurnout}% Turnout
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Approvals Queue */}
        <div className="cyber-glass rounded-3xl p-6 border border-cyan-500/30 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-cyber flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  EVENT PROPOSALS APPROVAL QUEUE
                </h3>
                {pendingEvents.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold animate-pulse">
                    {pendingEvents.length} AWAITING APPROVAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and approve student-created campus events before they are published live on the schedule.
              </p>
            </div>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 font-mono">
                No event proposals pending approval. All submitted events are up to date!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="rounded-2xl bg-slate-900/70 border border-cyan-500/20 overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-slate-950">
                    <img
                      src={ev.bannerImage}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                        {ev.category}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-3 right-3">
                      <h4 className="font-bold text-white text-sm line-clamp-1 font-cyber">{ev.title}</h4>
                      {ev.tagline && (
                        <p className="text-[11px] text-slate-300 line-clamp-1">{ev.tagline}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-2">
                      {/* Submitter info */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Proposed By:</span>
                          <span className="font-bold text-cyan-300">{ev.organizer?.name || ev.organizerName}</span>
                        </div>
                        {ev.organizer?.rollNumber && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Roll / Dept:</span>
                            <span className="font-mono text-slate-200">
                              {ev.organizer.rollNumber} ({ev.organizer.department || 'N/A'})
                            </span>
                          </div>
                        )}
                        {ev.organizer?.email && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Email:</span>
                            <span className="font-mono text-slate-300">{ev.organizer.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Event timing and venue details */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-950/40 border border-white/5 flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{ev.date}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/40 border border-white/5 flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Max Capacity: <strong className="text-white font-mono">{ev.capacity}</strong> attendees</span>
                        <span>Timing: <strong className="text-cyan-300 font-mono">{ev.startTime} - {ev.endTime}</strong></span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 italic pt-1 border-t border-white/5">
                        "{ev.description}"
                      </p>
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleReviewEvent(ev._id, 'reject')}
                        disabled={reviewingEventId === ev._id}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-red-950/50 hover:text-red-300 hover:border-red-500/40 text-slate-400 text-xs font-semibold border border-white/5 transition-all disabled:opacity-50"
                      >
                        Decline Proposal
                      </button>
                      <button
                        onClick={() => handleReviewEvent(ev._id, 'approve')}
                        disabled={reviewingEventId === ev._id}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:brightness-110 text-white text-xs font-bold font-cyber tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                        {reviewingEventId === ev._id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Publish</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Club Lead Verification Applications Queue */}
        <div className="cyber-glass rounded-3xl p-6 border border-purple-500/30 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-cyber flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-400" />
                  CLUB LEAD VERIFICATION QUEUE
                </h3>
                {organizerRequests.filter((r) => r.organizerStatus === 'pending').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold animate-pulse">
                    {organizerRequests.filter((r) => r.organizerStatus === 'pending').length} PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review student applications to organize campus clubs and host sanctioned events.
              </p>
            </div>
          </div>

          {organizerRequests.filter((r) => r.organizerStatus === 'pending').length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 font-mono">
                Verification queue clear. No pending student club applications.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizerRequests
                .filter((r) => r.organizerStatus === 'pending')
                .map((req) => (
                  <div
                    key={req.userId}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{req.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                            {req.clubDetails?.clubCategory || 'Technical'}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-cyan-300">{req.email}</p>
                        <p className="text-[11px] text-slate-400">
                          Roll: <strong className="text-slate-200">{req.rollNumber || 'N/A'}</strong> • Dept: {req.department}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 text-xs">
                      <div className="text-purple-300 font-semibold flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-purple-400" />
                        <span>{req.clubDetails?.clubName || 'Requested Club'}</span>
                        <span className="text-[10px] text-slate-400">({req.clubDetails?.clubRole || 'Lead'})</span>
                      </div>
                      {req.clubDetails?.facultyAdvisor && (
                        <p className="text-[11px] text-slate-400">
                          Mentor: <strong className="text-slate-300">{req.clubDetails.facultyAdvisor}</strong>
                        </p>
                      )}
                      {req.clubDetails?.reason && (
                        <p className="text-[11px] text-slate-300 italic pt-1 border-t border-white/5">
                          "{req.clubDetails.reason}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleReviewRequest(req.userId, 'reject')}
                        disabled={processingReqId === req.userId}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-red-950/50 text-slate-400 hover:text-red-300 border border-white/10 text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleReviewRequest(req.userId, 'approve')}
                        disabled={processingReqId === req.userId}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white text-xs font-bold font-cyber tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{processingReqId === req.userId ? 'Approving...' : 'Approve Lead'}</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* User Directory & Role Promotion Table */}
        <div className="cyber-glass-emerald rounded-3xl p-6 border border-emerald-500/30 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white font-cyber flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                CAMPUS IDENTITY DIRECTORY
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Promote students to club organizers, adjust administrative privileges, and inspect college records.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user, roll, department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Roll / ID</th>
                  <th className="py-3 px-4">Department / Org</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4 text-right">Privilege Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/40">
                {filteredUsers.map((u) => (
                  <tr key={u.id || u._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-cyan-300">{u.email}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{u.rollNumber || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-400">{u.department || u.organization}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : u.role === 'organizer'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.role}
                        disabled={updatingUserId === (u.id || u._id)}
                        onChange={(e) => handleRoleChange(u.id || u._id, e.target.value)}
                        className="bg-slate-950 border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-400 font-mono"
                      >
                        <option value="student">Student</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
