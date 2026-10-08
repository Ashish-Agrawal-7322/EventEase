import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { cyberAudio } from '../utils/soundEffects';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  QrCode,
  ScanLine,
  RefreshCw,
  Zap,
  User,
  Hash,
  Clock,
  ArrowRight,
  ShieldCheck,
  SwitchCamera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const QRScannerModal = ({ event, isOpen, onClose, onCheckInSuccess }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'simulate'
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { status: 'success' | 'already_checked_in' | 'wrong_event' | 'invalid', message, ticket }
  const [processing, setProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Load participants for the simulation list so evaluators can test instantly without a physical camera!
  useEffect(() => {
    if (isOpen && event?._id) {
      loadEventParticipants();
    }
  }, [isOpen, event?._id]);

  const loadEventParticipants = async () => {
    setLoadingParticipants(true);
    try {
      const res = await api.registrations.getParticipants(event._id);
      if (res.success) {
        setParticipants(res.participants);
      }
    } catch (err) {
      console.error('Error fetching participants for simulation:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Initialize and stop HTML5 Camera Scanner
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      // Small delay to ensure DOM element is mounted
      setTimeout(async () => {
        const readerElement = document.getElementById('qr-reader');
        if (!readerElement) return;

        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch {}
        }

        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        };

        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              handleQRScanned(decodedText);
            },
            () => {} // Ignore scan failure frames
          );
          setIsScanning(true);
        } catch (camErr) {
          console.warn('Camera start issue, falling back to any camera:', camErr);
          try {
            await html5QrCode.start(
              true,
              config,
              (decodedText) => {
                handleQRScanned(decodedText);
              },
              () => {}
            );
            setIsScanning(true);
          } catch (finalCamErr) {
            setCameraError('Camera access unavailable or blocked. You can use the "Instant Attendee Simulation" tab or type ticket code manually!');
            setIsScanning(false);
          }
        }
      }, 300);
    } catch (err) {
      setCameraError('Could not initialize camera: ' + err.message);
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        // Ignored
      }
      setIsScanning(false);
    }
  };

  // Central Check-in verification handler
  const handleQRScanned = async (rawCode) => {
    if (processing || !rawCode) return;
    setProcessing(true);

    try {
      const res = await api.registrations.checkIn({
        rawInput: rawCode,
        eventId: event._id,
      });

      if (res.status === 'success') {
        cyberAudio.playSuccess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00ff9d', '#00f0ff', '#a855f7'],
        });

        setScanResult({
          status: 'success',
          message: res.message,
          ticket: res.ticket,
        });

        if (onCheckInSuccess) onCheckInSuccess();
        loadEventParticipants();
      }
    } catch (err) {
      const data = err.data || {};
      if (data.status === 'already_checked_in') {
        cyberAudio.playWarning();
        setScanResult({
          status: 'already_checked_in',
          message: data.message || 'Already Checked In!',
          ticket: data.ticket,
        });
      } else if (data.status === 'wrong_event') {
        cyberAudio.playError();
        setScanResult({
          status: 'wrong_event',
          message: data.message,
          ticket: data.ticket,
        });
      } else {
        cyberAudio.playError();
        setScanResult({
          status: 'invalid',
          message: data.message || 'Invalid QR code or unrecognized ticket format.',
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleQRScanned(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative w-full max-w-2xl bg-[#090e1f] rounded-3xl overflow-hidden border border-cyan-500/40 shadow-[0_0_90px_rgba(0,240,255,0.2)] my-auto"
      >
        {/* HUD Scanner Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0d1736] to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white font-cyber tracking-wide">
                  ATTENDANCE SCANNER HUD
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-xs text-cyan-300/80 truncate max-w-[280px] sm:max-w-md">
                Validating Entry for: <span className="text-white font-semibold">{event?.title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Real Camera vs Instant Hackathon Simulator */}
        <div className="flex border-b border-white/10 bg-slate-950/60 p-1.5 gap-1.5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'camera'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('simulate')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'simulate'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Instant Attendee Simulator ({participants.length})</span>
          </button>
        </div>

        {/* Scanner Content Area */}
        <div className="p-5">
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {/* Camera Viewfinder with Cyber HUD overlay */}
              <div className="relative mx-auto max-w-sm aspect-square rounded-2xl overflow-hidden bg-black/90 border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col items-center justify-center">
                <div id="qr-reader" className="w-full h-full" />

                {/* Laser Sweep Line */}
                {isScanning && !scanResult && (
                  <div className="scanner-laser pointer-events-none z-20" />
                )}

                {/* HUD Reticle Corners */}
                <div className="absolute inset-4 pointer-events-none border border-cyan-500/20 rounded-xl z-10 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                    <span className="w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  </div>
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                    <span className="w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
                    <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                    <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab('simulate')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg"
                    >
                      Switch to Instant Simulator Tab
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Ticket Input */}
              <form onSubmit={handleManualSubmit} className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  placeholder="Enter Ticket Code (e.g. EE-HACK-...)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={processing || !manualCode.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all font-mono"
                >
                  Verify
                </button>
              </form>
            </div>
          )}

          {activeTab === 'simulate' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 bg-purple-950/30 p-3 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    Click any attendee below to <strong>simulate scanning their QR ticket code</strong>!
                  </span>
                </div>
                <button
                  onClick={loadEventParticipants}
                  className="p-1 text-purple-300 hover:text-white"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingParticipants ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No participants registered for this event yet.
                  </div>
                ) : (
                  participants.map((p) => {
                    const isCheckedIn = p.status === 'checked_in';
                    return (
                      <div
                        key={p.ticketCode}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                          isCheckedIn
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-slate-900/60 border-cyan-500/20 hover:border-cyan-400/50 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-[10px] ${
                              isCheckedIn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {isCheckedIn ? '✓' : p.seatNumber || '01'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{p.studentName}</span>
                              <span className="text-[10px] font-mono text-cyan-400">{p.studentRollNumber}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{p.ticketCode}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleQRScanned(p.ticketCode)}
                          disabled={processing}
                          className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1.5 ${
                            isCheckedIn
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          }`}
                        >
                          <ScanLine className="w-3 h-3" />
                          <span>{isCheckedIn ? 'Scan Again (Duplicate Test)' : 'Simulate Scan QR'}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Dynamic Result Feedback Modal / Card */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10 }}
                className={`mt-4 p-4 rounded-2xl border ${
                  scanResult.status === 'success'
                    ? 'bg-gradient-to-r from-emerald-950/80 to-[#07241d] border-emerald-400/60 shadow-[0_0_40px_rgba(0,255,157,0.25)]'
                    : scanResult.status === 'already_checked_in'
                    ? 'bg-gradient-to-r from-amber-950/80 to-[#2c1d07] border-amber-400/60 shadow-[0_0_40px_rgba(255,183,3,0.25)]'
                    : 'bg-gradient-to-r from-red-950/80 to-[#2c0b0b] border-red-400/60 shadow-[0_0_40px_rgba(255,0,80,0.25)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {scanResult.status === 'success' && (
                      <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                    )}
                    {scanResult.status === 'already_checked_in' && (
                      <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/50">
                        <AlertTriangle className="w-6 h-6 text-amber-400 animate-bounce" />
                      </div>
                    )}
                    {(scanResult.status === 'invalid' || scanResult.status === 'wrong_event') && (
                      <div className="p-2 rounded-xl bg-red-500/20 border border-red-400/50">
                        <XCircle className="w-6 h-6 text-red-400" />
                      </div>
                    )}

                    <div>
                      <h4
                        className={`text-sm font-extrabold uppercase font-cyber tracking-wider ${
                          scanResult.status === 'success'
                            ? 'text-emerald-300'
                            : scanResult.status === 'already_checked_in'
                            ? 'text-amber-300'
                            : 'text-red-300'
                        }`}
                      >
                        {scanResult.status === 'success' && '✓ Check-in Successful! Access Granted'}
                        {scanResult.status === 'already_checked_in' && '⚠ Duplicate Alert: Already Checked In'}
                        {scanResult.status === 'wrong_event' && '✕ Mismatched Event Pass'}
                        {scanResult.status === 'invalid' && '✕ Invalid Ticket Code'}
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">{scanResult.message}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setScanResult(null)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Attendee Details Card if Ticket Found */}
                {scanResult.ticket && (
                  <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Student</span>
                      <span className="font-semibold text-white truncate block">{scanResult.ticket.studentName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Roll / ID</span>
                      <span className="font-mono text-cyan-300">{scanResult.ticket.studentRollNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Department</span>
                      <span className="text-slate-300 truncate block">{scanResult.ticket.studentDepartment}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Seat Assigned</span>
                      <span className="font-mono font-bold text-purple-300">{scanResult.ticket.seatNumber}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
