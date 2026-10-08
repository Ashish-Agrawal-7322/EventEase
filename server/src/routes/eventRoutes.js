import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Optional auth middleware so public endpoints can know who is browsing if a token exists
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventease_secret_key_hackathon_2026');
      req.user = await User.findById(decoded.id);
    } catch {
      // Proceed as unauthenticated guest
    }
  }
  next();
};

router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);
router.post('/', protect, createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

export default router;
