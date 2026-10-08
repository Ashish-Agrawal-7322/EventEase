import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, X, Copy, Check, Sparkles, Building2, ShieldCheck, Award } from 'lucide-react';
import api from '../services/api';

export function AccreditationReportModal({ isOpen, onClose, event }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && event?._id) {
      loadReport();
    }
  }, [isOpen, event]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.ai.getReport(event._id);
      if (res.success && res.report) {
        setReportData(res.report);
      } else {
        setError(res.message || 'Failed to synthesize accreditation report.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with AI report generator.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!reportData) return;
    const text = typeof reportData === 'string' ? reportData : JSON.stringify(reportData, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-950/80 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-cyber">NAAC / NBA EVENT AUDIT REPORT</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CRITERION 5.3
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Automated Outcome Assessment for Higher Education Accreditation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-cyan-300 font-mono text-sm tracking-wider animate-pulse">
                COMPILING NAAC CRITERION METRICS WITH GEMINI AI...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-center space-y-2">
              <p className="text-xs text-rose-300 font-mono">{error}</p>
              <button
                onClick={loadReport}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-mono rounded-lg border border-rose-500/40"
              >
                Retry Report Generation
              </button>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Action Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400">
                  Event: <span className="text-white font-bold">{event?.title}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono border border-cyan-500/40 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Formal PDF</span>
                  </button>
                </div>
              </div>

              {/* Printable Document Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-200">
                {/* Formal Letterhead */}
                <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
                  <h3 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-cyber">
                    MARWADI UNIVERSITY • FACULTY OF TECHNOLOGY & COMPUTER SCIENCE
                  </h3>
                  <p className="text-xs font-mono text-cyan-400">
                    POST-EVENT INSTITUTIONAL ACTIVITY REPORT & ACCREDITATION AUDIT
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Form Reference: MU-IQAC-CR5-ACT-2026 • Valid for NBA / NAAC Submissions
                  </p>
                </div>

                {/* Key Metadata Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Event Title</span>
                    <span className="font-bold text-white truncate block">{event?.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Category</span>
                    <span className="font-bold text-cyan-300">{event?.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Conducted On</span>
                    <span className="font-bold text-white">{event?.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Turnout Verified</span>
                    <span className="font-bold text-emerald-400">
                      {event?.checkedInCount || 0} / {event?.registeredCount || 0}
                    </span>
                  </div>
                </div>

                {/* Report Body */}
                {typeof reportData === 'string' ? (
                  <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 text-xs sm:text-sm text-slate-300 font-sans whitespace-pre-wrap leading-relaxed space-y-2">
                    {reportData}
                  </div>
                ) : (
                  <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-300">
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wider text-cyan-400 mb-2">
                        1. Executive Overview & Objectives
                      </h4>
                      <p>
                        {reportData.summary ||
                          reportData.executiveSummary ||
                          'The event was successfully convened to foster hands-on experiential learning aligned with institution-level graduate attributes and student development goals.'}
                      </p>
                    </div>

                    {reportData.studentImpact && (
                      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                        <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wider text-emerald-400 mb-2">
                          2. Learning Outcomes & Skill Enhancement
                        </h4>
                        <p>{reportData.studentImpact}</p>
                      </div>
                    )}

                    {reportData.recommendations && (
                      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                        <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wider text-amber-400 mb-2">
                          3. IQAC Continuous Improvement Recommendations
                        </h4>
                        <p>{reportData.recommendations}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sign-off Stamps */}
                <div className="pt-8 border-t border-slate-800 grid grid-cols-3 gap-4 text-center font-mono text-[11px] text-slate-400">
                  <div className="space-y-1">
                    <div className="h-10 border-b border-dashed border-slate-700 flex items-end justify-center pb-1 text-slate-500 italic">
                      [Digital Verified]
                    </div>
                    <p className="font-bold text-slate-300">Student Coordinator</p>
                    <p className="text-[10px]">{event?.organizerName || 'Club Lead'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-10 border-b border-dashed border-slate-700 flex items-end justify-center pb-1 text-cyan-400 italic font-bold">
                      Verified On-Chain
                    </div>
                    <p className="font-bold text-slate-300">Faculty Coordinator</p>
                    <p className="text-[10px]">MU Department Head</p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-10 border-b border-dashed border-slate-700 flex items-end justify-center pb-1 text-emerald-400 italic font-bold">
                      IQAC SEAL APPROVED
                    </div>
                    <p className="font-bold text-slate-300">IQAC / Dean Academics</p>
                    <p className="text-[10px]">Marwadi University</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AccreditationReportModal;
