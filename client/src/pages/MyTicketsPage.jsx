import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TicketCard } from '../components/TicketCard';
import { HologramPassModal } from '../components/HologramPassModal';
import { CertificateVaultModal } from '../components/CertificateVaultModal';
import {
  Ticket,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Compass,
  Zap,
  Filter,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

export const MyTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'registered', 'checked_in'
  const [activeModalTicket, setActiveModalTicket] = useState(null);
  const [showVaultModal, setShowVaultModal] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.registrations.getMyTickets();
      if (res.success) {
        setTickets(res.tickets);
      }
    } catch (err) {
      console.error('Error fetching student tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const event = t.event || {};
    const matchesSearch =
      (event.title && event.title.toLowerCase().includes(search.toLowerCase())) ||
      (t.ticketCode && t.ticketCode.toLowerCase().includes(search.toLowerCase())) ||
      (event.venue && event.venue.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'registered') return t.status === 'registered';
    if (filterStatus === 'checked_in') return t.status === 'checked_in';
    return true;
  });

  const checkedInCount = tickets.filter((t) => t.status === 'checked_in').length;
  const activeCount = tickets.filter((t) => t.status === 'registered').length;

  return (
    <div className="min-h-screen bg-cyber-grid pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Ticket className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-cyber">
                MY DIGITAL PASSES
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Your cryptographic QR tickets for verified college entry. Present these at the scanner gates.
            </p>
          </div>

          {/* Quick Metrics & Vault Button */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setShowVaultModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold font-mono flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Digital Vault</span>
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 flex items-center gap-2">
              <span className="text-slate-400">Total:</span>
              <span className="font-mono font-bold text-white">{tickets.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{checkedInCount} Checked In</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{activeCount} Active</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="cyber-glass p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by event or ticket code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['all', 'registered', 'checked_in'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  filterStatus === status
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {status === 'all' ? 'All Passes' : status === 'registered' ? 'Active Entry' : 'Checked In'}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((n) => (
              <div key={n} className="cyber-glass rounded-2xl h-56 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="cyber-glass rounded-3xl p-12 text-center border border-white/10 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Ticket className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Tickets Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                {tickets.length === 0
                  ? "You haven't registered for any events yet. Check out the explore page to get your first holographic pass!"
                  : 'No tickets match your search filter.'}
              </p>
            </div>
            {tickets.length === 0 && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all font-cyber"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Events</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.ticketCode}
                ticket={ticket}
                onOpenModal={(t) => setActiveModalTicket(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hologram Pass Modal */}
      <HologramPassModal
        ticket={activeModalTicket}
        isOpen={!!activeModalTicket}
        onClose={() => setActiveModalTicket(null)}
      />

      {/* Digital Certificate Credential Vault Modal */}
      <CertificateVaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
      />
    </div>
  );
};
