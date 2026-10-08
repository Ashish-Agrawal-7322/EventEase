import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  getOrganizerRequests,
  reviewOrganizerRequest,
  getPendingEvents,
  reviewEvent,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.get('/organizer-requests', getOrganizerRequests);
router.put('/organizer-requests/:userId/review', reviewOrganizerRequest);
router.get('/pending-events', getPendingEvents);
router.put('/pending-events/:eventId/review', reviewEvent);

export default router;
