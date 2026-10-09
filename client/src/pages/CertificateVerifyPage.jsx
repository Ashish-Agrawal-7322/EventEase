import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, XCircle, Award, Calendar, MapPin, Building, Printer, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export function CertificateVerifyPage() {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        setLoading(true);
        const res = await api.certificates.verify(certificateId);
        if (res.valid && res.certificate) {
          setCert(res.certificate);
        } else {
          setError(res.message || 'Credential record not found.');
        }
      } catch (err) {
        setError(err.message || 'Verification failed. Invalid or unrecognized certificate token.');
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchVerification();
    }
  }, [certificateId]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-[#070b14] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to EventEase Portal
        </Link>

        {loading ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center backdrop-blur-xl">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cyan-300 font-mono text-sm tracking-wider animate-pulse">
              CRYPTOGRAPHIC REGISTRY LOOKUP IN PROGRESS...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-8 backdrop-blur-xl text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-cyber">INVALID OR UNVERIFIED CREDENTIAL</h2>
            <p className="text-rose-200/80 text-sm max-w-md mx-auto mb-6">{error}</p>
            <div className="p-3 bg-black/40 rounded-lg text-xs font-mono text-slate-400 inline-block border border-rose-500/20">
              Token ID: {certificateId}
            </div>
          </div>
        ) : cert ? (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex items-center justify-between backdrop-blur-xl shadow-lg shadow-emerald-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      AUTHENTICITY VERIFIED
                    </span>
                    <span className="text-[10px] text-emerald-400/70 font-mono hidden sm:inline">MU-LEDGER SECURED</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    This certificate is genuine and issued to a gate-verified attendee.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono border border-slate-700 hover:border-cyan-500/40 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </button>
            </div>

            {/* Official Certificate Card */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-10 backdrop-blur-xl relative shadow-2xl shadow-cyan-950/50">
              {/* Corner Watermark Accents */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

              <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Award className="w-8 h-8" />
                </div>
                <p className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400">Marwadi University • Campus EventEase</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight font-cyber">
                  CERTIFICATE OF PARTICIPATION
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Official Collegiate Verification & Institutional Credential
                </p>
              </div>

              <div className="text-center my-6 space-y-2">
                <p className="text-xs uppercase font-mono text-slate-400">Proudly Conferred Upon</p>
                <p className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-wide font-cyber">
                  {cert.studentName}
                </p>
                <div className="flex items-center justify-center gap-3 text-xs font-mono text-slate-300">
                  <span>Roll No: <span className="text-white font-bold">{cert.studentRollNumber || 'N/A'}</span></span>
                  <span>•</span>
                  <span>Dept: <span className="text-white font-bold">{cert.studentDepartment}</span></span>
                </div>
              </div>

              <p className="text-center text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
                for active participation, verified physical check-in, and successful engagement in the collegiate campus event:
              </p>

              <div className="my-6 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-center">
                <h3 className="text-lg sm:text-xl font-bold text-white font-cyber">{cert.eventTitle}</h3>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {cert.eventDate ? new Date(cert.eventDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Event Day'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {cert.venue}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    {cert.organizerName}
                  </span>
                </div>
              </div>

              {/* Bottom Credential Bar */}
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] uppercase font-mono text-slate-500">Registry ID</p>
                  <p className="text-xs font-mono font-bold text-cyan-300">{cert.certificateId}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Issued: {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {cert.qrCodeData && (
                  <div className="flex items-center gap-3 bg-black/60 p-2 rounded-xl border border-cyan-500/20">
                    <img
                      src={cert.qrCodeData}
                      alt="Certificate QR"
                      className="w-16 h-16 rounded-lg bg-white p-1"
                    />
                    <div className="text-left pr-2">
                      <p className="text-[10px] font-mono text-emerald-400 font-bold">VERIFIABLE</p>
                      <p className="text-[9px] text-slate-400 font-mono">Scan to validate credential</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CertificateVerifyPage;
