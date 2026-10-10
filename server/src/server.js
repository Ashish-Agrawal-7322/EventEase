import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import { connectDB, getDBStatus } from './config/db.js';
import { seedDatabase, ensureAdminUser, purgeDummyData } from './seeds/seedData.js';

// Prefer IPv6 on modern networks to avoid ISP-blocked IPv4 SMTP ports
dns.setDefaultResultOrder('verbatim');

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logger
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/certificates', certificateRoutes);

// System Index & API Directory
const apiIndexHandler = (req, res) => {
  res.json({
    status: 'online',
    app: 'EventEase API Gateway',
    version: '1.0.0',
    db: getDBStatus(),
    endpoints: {
      health: '/api/health',
      events: '/api/events',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me',
        demoAccounts: 'GET /api/auth/demo-accounts',
      },
      registrations: {
        register: 'POST /api/registrations/register/:eventId',
        myTickets: 'GET /api/registrations/my-tickets',
        checkIn: 'POST /api/registrations/check-in',
        analytics: 'GET /api/registrations/event/:eventId/analytics',
        participants: 'GET /api/registrations/event/:eventId/participants',
      },
      admin: {
        stats: 'GET /api/admin/stats',
        users: 'GET /api/admin/users',
      }
    },
    message: 'EventEase backend is running! Open the frontend web app at http://localhost:5173'
  });
};

app.get('/', apiIndexHandler);
app.get('/api', apiIndexHandler);

// System Health & Engine Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'EventEase API',
    version: '1.0.0',
    db: getDBStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server & Initialize Database
const startServer = async () => {
  try {
    await connectDB();
    await purgeDummyData();
    await ensureAdminUser();

    app.listen(PORT, () => {
      console.log(`🚀 EventEase Server active on http://localhost:${PORT}`);
      console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
  }
};

startServer();
// Server ready
