import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, X, ExternalLink, Printer, Calendar, MapPin, Building, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export function CertificateVaultModal({ isOpen, onClose }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCertificates();
    }
  }, [isOpen]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.certificates.getMyCertificates();
      if (res.success) {
        setCertificates(res.certificates || []);
        if (res.certificates?.length > 0 && !selectedCert) {
          setSelectedCert(res.certificates[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve your certificates.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-cyan-950/80 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-cyber">DIGITAL CREDENTIAL VAULT</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {certificates.length} ISSUED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Cryptographically verifiable certificates issued for physical campus event attendance
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

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-mono text-cyan-300 animate-pulse">DECRYPTING CREDENTIAL VAULT...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl text-center text-rose-300 text-xs font-mono">
              {error}
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white font-cyber">NO CERTIFICATES ISSUED YET</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Certificates are issued exclusively after you physically attend a campus event and complete gate check-in with your QR pass.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left List of Certificates */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-2">
                  Select Credential:
                </span>
                {certificates.map((c) => (
                  <button
                    key={c.certificateId}
                    onClick={() => setSelectedCert(c)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      selectedCert?.certificateId === c.certificateId
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-950/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-450 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {c.eventCategory || 'Event'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(c.issuedAt || c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1 font-cyber">{c.eventTitle}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{c.certificateId}</p>
                  </button>
                ))}
              </div>

              {/* Right Certificate Full Preview */}
              {selectedCert && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> VERIFIED ON MARWADI UNIVERSITY REGISTRY
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to={`/verify-certificate/${selectedCert.certificateId}`}
                        target="_blank"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono border border-cyan-500/40"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Public Link</span>
                      </Link>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>

                  {/* Certificate preview document */}
                  <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-2xl p-6 relative shadow-xl text-center space-y-4">
                    <div className="space-y-1">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Award className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-400 uppercase">
                        Marwadi University
                      </p>
                      <h3 className="text-lg font-black text-white font-cyber tracking-tight">
                        CERTIFICATE OF PARTICIPATION
                      </h3>
                    </div>

                    <div className="py-2 space-y-1">
                      <p className="text-[11px] font-mono uppercase text-slate-400">Awarded To</p>
                      <p className="text-xl font-black text-cyan-300 font-cyber">{selectedCert.studentName}</p>
                      <p className="text-xs font-mono text-slate-400">
                        Roll: {selectedCert.studentRollNumber || 'N/A'} • Dept: {selectedCert.studentDepartment}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      for verified gate entrance and active participation in the campus event:
                    </p>

                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
                      <h4 className="text-sm font-bold text-white font-cyber">{selectedCert.eventTitle}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        {selectedCert.venue} • {selectedCert.organizerName}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-left">
                      <div>
                        <p className="text-[9px] font-mono text-slate-500 uppercase">Registry Token</p>
                        <p className="text-xs font-mono font-bold text-cyan-400">{selectedCert.certificateId}</p>
                      </div>

                      {selectedCert.qrCodeData && (
                        <img
                          src={selectedCert.qrCodeData}
                          alt="QR Verification"
                          className="w-14 h-14 bg-white p-1 rounded-lg shadow"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CertificateVaultModal;
