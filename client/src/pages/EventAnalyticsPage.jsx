import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowLeft,
  Download,
  Sparkles,
  TrendingUp,
  Percent,
  RefreshCw,
  FileSpreadsheet,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

const PIE_COLORS = ['#00ff9d', '#00f0ff', '#334155'];
const BAR_COLORS = ['#00f0ff', '#a855f7', '#00ff9d', '#f43f5e', '#ffb703', '#38bdf8'];

export const EventAnalyticsPage = () => {
  const { eventId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evRes, anRes] = await Promise.all([
        api.events.getById(eventId),
        api.registrations.getAnalytics(eventId),
      ]);
      if (evRes.success) setEvent(evRes.event);
      if (anRes.success) setAnalytics(anRes.analytics);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const [sendingReminder, setSendingReminder] = useState(false);
  const handleBroadcastReminder = async () => {
    if (!event) return;
    const confirmMsg = `Send automated "Event Starts in 2 Hours" alert & QR ticket pass to all registered attendees for "${event.title}"?`;
    if (!window.confirm(confirmMsg)) return;

    setSendingReminder(true);
    try {
      const res = await api.registrations.sendReminders(
        event._id,
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

  const [exportingCsv, setExportingCsv] = useState(false);
  const handleExportCSV = async () => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event || !analytics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">Analytics Not Found</h2>
        <Link to="/organizer" className="text-cyan-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Organizer Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-grid pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/organizer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Organizer Command</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-cyber tracking-tight">
                ATTENDANCE ANALYTICS MATRIX
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Event: <strong className="text-cyan-300">{event.title}</strong> • Gate Check-in Telemetry
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBroadcastReminder}
              disabled={sendingReminder || (analytics && analytics.registeredCount === 0)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send 2-Hour Gate Opening reminder emails with QR ticket pass to all registered attendees"
            >
              <Bell className={`w-4 h-4 text-amber-400 ${sendingReminder ? 'animate-bounce' : ''}`} />
              <span>{sendingReminder ? 'Sending Alerts...' : 'Broadcast 2h Alert'}</span>
            </button>

            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={exportingCsv}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition-all font-mono disabled:opacity-50"
              title="Download CSV attendance roster"
            >
              <FileSpreadsheet className={`w-4 h-4 text-emerald-400 ${exportingCsv ? 'animate-spin' : ''}`} />
              <span>{exportingCsv ? 'Exporting...' : 'Export CSV Attendance'}</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="cyber-glass p-5 rounded-2xl border border-cyan-500/20">
            <span className="text-xs text-slate-400 font-mono">Event Capacity</span>
            <div className="text-3xl font-black text-white mt-1 font-mono">{analytics.capacity}</div>
            <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Max Venue Limit</span>
          </div>

          <div className="cyber-glass p-5 rounded-2xl border border-purple-500/20">
            <span className="text-xs text-slate-400 font-mono">Total Registered</span>
            <div className="text-3xl font-black text-purple-300 mt-1 font-mono">
              {analytics.registeredCount}
            </div>
            <span className="text-[10px] text-purple-400 font-mono mt-1 block">
              {analytics.fillPercentage}% Capacity Fill
            </span>
          </div>

          <div className="cyber-glass p-5 rounded-2xl border border-emerald-500/20">
            <span className="text-xs text-slate-400 font-mono">Checked In (Admitted)</span>
            <div className="text-3xl font-black text-emerald-400 mt-1 font-mono">
              {analytics.checkedInCount}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
              {analytics.pendingCount} Pending Entry
            </span>
          </div>

          <div className="cyber-glass p-5 rounded-2xl border border-amber-500/20">
            <span className="text-xs text-slate-400 font-mono">Attendance Conversion</span>
            <div className="text-3xl font-black text-amber-300 mt-1 font-mono">
              {analytics.turnoutPercentage}%
            </div>
            <span className="text-[10px] text-amber-400 font-mono mt-1 block">
              Checked-in vs Registered
            </span>
          </div>
        </div>

        {/* Charts Row 1: Check-in Rush Timeline & Status Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Check-in Rush Curve (AreaChart) */}
          <div className="lg:col-span-2 cyber-glass p-6 rounded-3xl border border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-white font-cyber flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  GATE CHECK-IN RUSH TIMELINE
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Scanned QR check-ins distributed across operational hours</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rushGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090e1f',
                      borderColor: 'rgba(0,240,255,0.3)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="checkIns"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#rushGradient)"
                    name="Attendees Checked In"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Donut (PieChart) */}
          <div className="cyber-glass p-6 rounded-3xl border border-purple-500/20 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-white font-cyber flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ADMISSION RATIO
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Checked-in vs Pending vs Unfilled</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090e1f',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-mono pt-2 border-t border-white/5">
              <div>
                <span className="w-2 h-2 rounded-full inline-block bg-[#00ff9d] mr-1" />
                <span className="text-slate-300">Checked: {analytics.checkedInCount}</span>
              </div>
              <div>
                <span className="w-2 h-2 rounded-full inline-block bg-[#00f0ff] mr-1" />
                <span className="text-slate-300">Pending: {analytics.pendingCount}</span>
              </div>
              <div>
                <span className="w-2 h-2 rounded-full inline-block bg-[#334155] mr-1" />
                <span className="text-slate-400">Open: {Math.max(0, analytics.capacity - analytics.registeredCount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Department Demographics (BarChart) */}
        <div className="cyber-glass p-6 rounded-3xl border border-white/10 space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-white font-cyber flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              DEPARTMENT-WISE REGISTRATION DEMOGRAPHICS
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Attendee participation across college academic departments</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090e1f',
                    borderColor: 'rgba(168, 85, 247, 0.3)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#ffffff',
                  }}
                />
                <Bar dataKey="value" name="Students Registered" radius={[8, 8, 0, 0]}>
                  {analytics.departmentData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
