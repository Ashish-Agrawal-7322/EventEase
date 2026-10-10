import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  Ticket,
  LayoutDashboard,
  ShieldAlert,
  Zap,
  LogOut,
  LogIn,
  UserPlus,
  Sparkles,
  ChevronDown,
  Building,
  Clock,
  Briefcase,
  CalendarPlus
} from 'lucide-react';
import { ClubApplicationModal } from './ClubApplicationModal';

export const Navbar = () => {
  const { user, logout, isOrganizer, isAdmin } = useAuth();
  const [showClubModal, setShowClubModal] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="cyber-glass sticky top-0 z-40 border-b border-cyan-500/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1.5px] shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400 group-hover:animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent font-cyber">
                  EVENT<span className="text-white">SYNC</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-medium">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                Campus Attendance Matrix
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/')
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Explore Events</span>
            </Link>

            {/* Student Tickets Link (Only for students) */}
            {user && !user.isFaculty && user.role === 'student' && (
              <Link
                to="/my-tickets"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/my-tickets')
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Ticket className="w-4 h-4 text-purple-400" />
                <span>My Tickets</span>
              </Link>
            )}

            {/* Faculty Dedicated Academic Hub Link */}
            {user?.isFaculty ? (
              <Link
                to="/organizer"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/organizer')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>Faculty Hub</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </Link>
            ) : isOrganizer ? (
              <Link
                to="/organizer"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/organizer')
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                <span>Organizer Hub</span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              </Link>
            ) : null}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/admin')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>Admin Oversight</span>
              </Link>
            )}
          </div>

          {/* User Profile / Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Faculty Host Event vs Club Application Button */}
                {user.isFaculty ? (
                  <Link
                    to="/organizer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] group"
                    title="Open Faculty Academic Command & Host Event"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Host Department Event</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowClubModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] group"
                    title="Register and host a campus event"
                  >
                    <Building className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>Register Event / Club</span>
                  </button>
                )}

                <div className="hidden sm:flex flex-col text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-semibold text-xs text-slate-100">{user.name}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                        user.role === 'admin'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : user.isFaculty
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : user.role === 'organizer'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {user.role === 'admin'
                        ? 'ADMIN'
                        : user.isFaculty
                        ? 'FACULTY'
                        : user.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {user.isFaculty && user.designation
                      ? `${user.designation} • ${user.department || 'Academic'}`
                      : user.rollNumber || user.department || user.email}
                  </span>
                </div>

                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-9 h-9 rounded-xl border border-cyan-500/40 bg-slate-900 object-cover shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                />

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-500/20 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event & Club Registration Modal */}
      <ClubApplicationModal
        isOpen={showClubModal}
        onClose={() => setShowClubModal(false)}
        onSuccess={() => {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }}
      />
    </nav>
  );
};
