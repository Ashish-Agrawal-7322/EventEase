import express from 'express';
import {
  registerForEvent,
  getMyTickets,
  getTicketByCode,
  checkInTicket,
  toggleManualCheckIn,
  getEventParticipants,
  getEventAnalytics,
  exportParticipantsCSV,
  sendEventReminders,
} from '../controllers/registrationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student endpoints
router.post('/register/:eventId', protect, registerForEvent);
router.get('/my-tickets', protect, getMyTickets);
router.get('/ticket/:ticketCode', getTicketByCode);

// Organizer / Admin QR Check-in & Participant Management
router.post('/check-in', protect, authorize('organizer', 'admin'), checkInTicket);
router.post('/manual-check-in/:registrationId', protect, authorize('organizer', 'admin'), toggleManualCheckIn);
router.get('/event/:eventId/participants', protect, authorize('organizer', 'admin'), getEventParticipants);
router.get('/event/:eventId/analytics', protect, authorize('organizer', 'admin'), getEventAnalytics);
router.get('/event/:eventId/export-csv', protect, authorize('organizer', 'admin'), exportParticipantsCSV);
router.post('/event/:eventId/send-reminders', protect, authorize('organizer', 'admin'), sendEventReminders);

export default router;
