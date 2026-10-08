import express from 'express';
import {
  handleGenerateEventCopilot,
  handleChatEventBot,
  handleGenerateAccreditationReport,
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public: EventBot Q&A is open for all students exploring the campus
router.post('/chat', handleChatEventBot);

// Protected: AI Event Copilot (organizers & students creating events)
router.post('/generate-event', protect, handleGenerateEventCopilot);

// Protected: Post-Event Accreditation Report (organizers & admins)
router.post('/report/:eventId', protect, handleGenerateAccreditationReport);

export default router;
