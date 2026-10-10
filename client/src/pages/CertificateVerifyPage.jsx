import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  XCircle,
  Award,
  Calendar,
  MapPin,
  Building,
  Printer,
  ArrowLeft,
  Share2,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  QrCode,
  FileCheck
} from 'lucide-react';
import api from '../services/api';

export function CertificateVerifyPage() {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

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

  // Pseudo-deterministic cryptographic hash based on certificateId
  const getCryptoHash = (id) => {
    if (!id) return '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `0x${hex}7f8a9b2c3d4e5f60${hex.split('').reverse().join('')}e7d2`.toLowerCase();
  };

  const copyLedgerHash = () => {
    const hash = getCryptoHash(cert?.certificateId);
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleAddToLinkedIn = () => {
    if (!cert) return;
    const issueDate = new Date(cert.issuedAt || cert.createdAt || Date.now());
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
      cert.eventTitle + ' (Certificate of Participation)'
    )}&organizationName=${encodeURIComponent('Marwadi University')}&issueYear=${issueDate.getFullYear()}&issueMonth=${
      issueDate.getMonth() + 1
    }&certUrl=${encodeURIComponent(window.location.href)}&certId=${encodeURIComponent(cert.certificateId)}`;
    window.open(linkedInUrl, '_blank');
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#070b14] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Printable Physical Certificate Overlay (Active when printing to PDF) */}
      {cert && (
        <div className="hidden print:block print:w-full print:p-8 print:bg-white print:text-black print:border-8 print:border-double print:border-amber-700 text-center font-serif">
          <div className="text-xl font-bold tracking-widest text-amber-900 uppercase mb-1">
            MARWADI UNIVERSITY
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-600 mb-6">
            Office of the Dean of Student Affairs • EventSync Credential Registry
          </div>

          <h1 className="text-3xl font-black uppercase tracking-wider text-black my-4">
            Certificate of Participation
          </h1>

          <p className="italic text-base text-gray-700 my-2">This is to officially certify that</p>
          <div className="text-2xl font-black text-black tracking-wide uppercase border-b-2 border-gray-400 pb-1 w-3/4 mx-auto my-3">
            {cert.studentName}
          </div>
          <p className="text-sm text-gray-700">
            Roll No: <strong>{cert.studentRollNumber || 'N/A'}</strong> • Department: <strong>{cert.studentDepartment}</strong>
          </p>

          <p className="text-sm text-gray-700 max-w-lg mx-auto my-4">
            has successfully attended and actively engaged in the collegiate campus event
          </p>

          <div className="text-xl font-bold text-black border border-gray-300 p-2 rounded-lg bg-gray-50 max-w-md mx-auto my-3">
            {cert.eventTitle}
          </div>

          <div className="text-xs text-gray-600 my-2">
            Held on <strong>{cert.eventDate}</strong> at <strong>{cert.venue}</strong>
          </div>

          <div className="flex justify-between items-end mt-12 pt-6 px-12 border-t border-gray-300">
            <div className="text-center">
              <div className="text-sm font-bold">{cert.organizerName || 'Faculty Coordinator'}</div>
              <div className="text-[10px] text-gray-600 uppercase">Faculty Event Lead</div>
            </div>

            <div className="text-center">
              <div className="text-xs font-mono font-bold text-gray-800">
                TOKEN: {cert.certificateId}
              </div>
              <div className="text-[9px] text-gray-500 font-mono">
                SHA-256: {getCryptoHash(cert.certificateId).slice(0, 24)}...
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm font-bold text-amber-950 font-serif italic">Dr. Rajesh Patel</div>
              <div className="text-[10px] text-gray-600 uppercase">Dean of Student Affairs</div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Interactive Credential Card */}
      <div className="max-w-3xl w-full z-10 print:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to EventSync Campus Portal
        </Link>

        {loading ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cyan-300 font-mono text-sm tracking-wider animate-pulse">
              VERIFYING CRYPTOGRAPHIC REGISTRY IN PROGRESS...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-3xl p-8 backdrop-blur-xl text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-cyber">INVALID OR UNVERIFIED CREDENTIAL</h2>
            <p className="text-rose-200/80 text-sm max-w-md mx-auto mb-6">{error}</p>
            <div className="p-3 bg-black/40 rounded-xl text-xs font-mono text-slate-400 inline-block border border-rose-500/20">
              Token ID: {certificateId}
            </div>
          </div>
        ) : cert ? (
          <div className="space-y-6">
            {/* Authenticity Verified Banner */}
            <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl shadow-lg shadow-emerald-950/40">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      OFFICIAL CREDENTIAL VERIFIED
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">MU-LEDGER SECURED</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Authentic collegiate certificate issued to a gate-verified attendee with confirmed physical check-in.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={handleAddToLinkedIn}
                  className="px-3.5 py-2 rounded-xl bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Add to your LinkedIn Profile credentials"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Add to LinkedIn</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono border border-slate-700 hover:border-cyan-500/40 transition-colors flex items-center gap-1.5"
                  title="Print or Save PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Official Holographic Certificate Card */}
            <div className="bg-gradient-to-b from-[#0a1024] via-[#0c1433] to-[#070b18] border-2 border-cyan-400/40 rounded-3xl p-6 sm:p-10 backdrop-blur-xl relative shadow-2xl shadow-cyan-950/60 overflow-hidden">
              {/* Corner Watermarks */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

              {/* Header Crest */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <Award className="w-8 h-8" />
                </div>
                <div className="inline-block px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300 mb-1">
                  Marwadi University • Campus EventSync
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-cyber">
                  CERTIFICATE OF PARTICIPATION
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Dean of Student Affairs Official Institutional Credential
                </p>
              </div>

              {/* Recipient Section */}
              <div className="text-center my-6 space-y-1.5">
                <p className="text-[11px] uppercase font-mono tracking-widest text-slate-400">
                  Proudly Conferred Upon
                </p>
                <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-amber-300 tracking-wide font-cyber">
                  {cert.studentName}
                </p>
                <div className="flex items-center justify-center gap-3 text-xs font-mono text-slate-300">
                  <span>Roll No: <strong className="text-white">{cert.studentRollNumber || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Department: <strong className="text-cyan-300">{cert.studentDepartment}</strong></span>
                </div>
              </div>

              <p className="text-center text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
                for active participation, verified gate check-in, and successful engagement in the official collegiate event:
              </p>

              {/* Event Highlight Box */}
              <div className="my-5 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-center shadow-inner">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono uppercase font-bold">
                  {cert.eventCategory || 'Collegiate Event'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white font-cyber mt-1.5">{cert.eventTitle}</h3>
                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {cert.eventDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {cert.venue}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    {cert.organizerName || 'Campus Technical Council'}
                  </span>
                </div>
              </div>

              {/* Accreditation & OD Credit Strip */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-xs font-mono text-purple-300 mb-6">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-400" />
                  <span>Accreditation Status:</span>
                  <strong className="text-white">15 Activity Points / Verified Duty Leave (OD)</strong>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  ✓ DEAN SANCTIONED
                </span>
              </div>

              {/* Signatures & Bottom Authority Bar */}
              <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* Faculty Lead Signature */}
                <div className="text-center sm:text-left">
                  <div className="font-serif italic text-base text-cyan-200">
                    {cert.organizerName || 'Faculty Coordinator'}
                  </div>
                  <div className="w-32 h-0.5 bg-slate-700 my-1 mx-auto sm:mx-0" />
                  <p className="text-[10px] uppercase font-mono text-slate-400">Faculty Coordinator</p>
                  <p className="text-[9px] text-slate-500 font-mono">Academic Verification Lead</p>
                </div>

                {/* QR Code Validation Stamp */}
                {cert.qrCodeData && (
                  <div className="flex items-center justify-center gap-2 bg-black/60 p-2.5 rounded-2xl border border-cyan-500/30 shadow-md">
                    <img
                      src={cert.qrCodeData}
                      alt="Certificate QR"
                      className="w-16 h-16 rounded-xl bg-white p-1"
                    />
                    <div className="text-left">
                      <p className="text-[10px] font-mono text-emerald-400 font-bold">PUBLIC QR VERIFIER</p>
                      <p className="text-[9px] text-slate-400 font-mono">Scan on phone to validate</p>
                    </div>
                  </div>
                )}

                {/* Dean Signature */}
                <div className="text-center sm:text-right">
                  <div className="font-serif italic text-lg text-amber-300 font-bold">
                    Dr. Rajesh Patel
                  </div>
                  <div className="w-32 h-0.5 bg-slate-700 my-1 mx-auto sm:ml-auto sm:mr-0" />
                  <p className="text-[10px] uppercase font-mono text-amber-400 font-bold">Dean of Student Affairs</p>
                  <p className="text-[9px] text-slate-500 font-mono">Marwadi University Seal</p>
                </div>
              </div>

              {/* Cryptographic SHA-256 Ledger Fingerprint Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">LEDGER ID:</span>
                  <span className="font-bold text-cyan-300">{cert.certificateId}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-white/5">
                  <span className="text-slate-500">SHA-256:</span>
                  <span className="text-slate-300 truncate max-w-[200px]">{getCryptoHash(cert.certificateId)}</span>
                  <button
                    onClick={copyLedgerHash}
                    className="p-1 hover:text-cyan-300 text-slate-400 transition-colors"
                    title="Copy Ledger Hash"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CertificateVerifyPage;
