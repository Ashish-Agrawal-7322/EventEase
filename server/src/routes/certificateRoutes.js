import express from 'express';
import {
  issueCertificates,
  getMyCertificates,
  verifyCertificate,
} from '../controllers/certificateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public: QR Code scanner verification endpoint
router.get('/verify/:certificateId', verifyCertificate);

// Protected: Student gets all their issued certificates
router.get('/my-certificates', protect, getMyCertificates);

// Protected: Organizer or Admin issues certificates to checked-in attendees
router.post('/issue/:eventId', protect, authorize('admin', 'faculty', 'club_lead'), issueCertificates);

export default router;
