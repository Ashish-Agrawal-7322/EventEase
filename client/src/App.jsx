import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { QuickDemoBar } from './components/QuickDemoBar';

import { HomePage } from './pages/HomePage';
import { EventDetailPage } from './pages/EventDetailPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { EventAnalyticsPage } from './pages/EventAnalyticsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { CertificateVerifyPage } from './pages/CertificateVerifyPage';
import { EventBotWidget } from './components/EventBotWidget';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
          {/* Futuristic Cyber-Glass Navigation */}
          <Navbar />

          {/* Main Routing Viewport */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />

              {/* Student Passes */}
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute allowedRoles={['student', 'organizer', 'admin']}>
                    <MyTicketsPage />
                  </ProtectedRoute>
                }
              />

              {/* Organizer Hub & QR Scanner */}
              <Route
                path="/organizer"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <OrganizerDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Recharts Analytics Dashboard */}
              <Route
                path="/analytics/:eventId"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventAnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* Campus Admin Oversight */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Public Verifiable Digital Certificate */}
              <Route path="/verify-certificate/:certificateId" element={<CertificateVerifyPage />} />
              <Route path="/verify/:certificateId" element={<CertificateVerifyPage />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* AI Campus Assistant Floating Concierge */}
          <EventBotWidget />

          {/* Futuristic Footer */}
          <footer className="border-t border-cyan-500/10 py-6 bg-slate-950/80 text-center text-xs text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-slate-400 font-cyber">EVENTSYNC PROTOCOL v2.6</span>
                <span>• Cryptographic Attendance & Gate Management</span>
              </div>
              <div>
                <span>College Event Operations • Hackathon Ready</span>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
