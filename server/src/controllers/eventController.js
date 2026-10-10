import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { checkEventExpired } from '../utils/eventUtils.js';

export const getEvents = async (req, res) => {
  try {
    const { search, category, status, organizerOnly } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (organizerOnly === 'true' && req.user) {
      filter.organizer = req.user._id;
    } else if (!req.user || req.user.role !== 'admin') {
      filter.$or = [
        { approvalStatus: 'approved' },
        { approvalStatus: { $exists: false } }
      ];
    }

    let events = await Event.find(filter).sort({ createdAt: -1 });

    // Exclude dummy test/sample events (show ONLY real student & faculty events)
    events = events.filter(e => {
      const title = (e.title || '').toLowerCase();
      const org = (e.organizerName || '').toLowerCase();
      if (title.includes('cybersync') || org.includes('sarah chen') || org.includes('campus technical council')) {
        return false;
      }
      return true;
    });

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      events = events.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q)) ||
        (e.tags && e.tags.some(tag => tag.toLowerCase().includes(q))) ||
        (e.category && e.category.toLowerCase().includes(q))
      );
    }

    // If user is authenticated, query their registrations to identify which events they have joined
    let userRegistrationsMap = {};
    if (req.user) {
      const userRegs = await Registration.find({ user: req.user._id });
      userRegs.forEach(r => {
        const evId = r.event ? r.event.toString() : '';
        if (evId) {
          userRegistrationsMap[evId] = r;
        }
      });
    }

    // Enhance events with dynamic stats, expiration status, and user registration state
    const enrichedEvents = events.map(e => {
      const ev = e.toObject ? e.toObject() : { ...e };
      const eventIdStr = (ev._id || ev.id || '').toString();
      const userRegistration = userRegistrationsMap[eventIdStr] || null;
      const capacity = Number(ev.capacity) || 100;
      const registered = Number(ev.registeredCount) || 0;
      const checkedIn = Number(ev.checkedInCount) || 0;
      const isExpired = checkEventExpired(ev);
      return {
        ...ev,
        isExpired,
        isRegistered: !!userRegistration,
        userRegistration,
        spotsLeft: Math.max(0, capacity - registered),
        isFull: registered >= capacity,
        fillRate: Math.min(100, Math.round((registered / capacity) * 100)),
        checkInRate: registered > 0 ? Math.round((checkedIn / registered) * 100) : 0,
      };
    });

    return res.json({
      success: true,
      count: enrichedEvents.length,
      events: enrichedEvents,
    });
  } catch (error) {
    console.error('getEvents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve events' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const ev = event.toObject ? event.toObject() : { ...event };
    const capacity = Number(ev.capacity) || 100;
    const registered = Number(ev.registeredCount) || 0;
    const checkedIn = Number(ev.checkedInCount) || 0;

    let userRegistration = null;
    if (req.user) {
      const reg = await Registration.findOne({
        event: event._id,
        user: req.user._id,
      });
      if (reg) {
        userRegistration = reg;
      }
    }

    const isExpired = checkEventExpired(ev);

    return res.json({
      success: true,
      event: {
        ...ev,
        isExpired,
        isRegistered: !!userRegistration,
        spotsLeft: Math.max(0, capacity - registered),
        isFull: registered >= capacity,
        fillRate: Math.min(100, Math.round((registered / capacity) * 100)),
        checkInRate: registered > 0 ? Math.round((checkedIn / registered) * 100) : 0,
        userRegistration,
      },
    });
  } catch (error) {
    console.error('getEventById error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching event details' });
  }
};

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      tagline,
      description,
      category,
      venue,
      date,
      startTime,
      endTime,
      registrationDeadline,
      capacity,
      bannerImage,
      tags,
    } = req.body;

    if (!title || !description || !venue || !date || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, venue, date, capacity',
      });
    }

    // Default banners based on category if not provided
    const bannerPresets = {
      Hackathon: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      Workshop: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
      'Tech Fest': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      Seminar: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80',
      Cultural: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
      Gaming: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    };

    const finalBanner = bannerImage || bannerPresets[category] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';

    const event = await Event.create({
      title,
      tagline: tagline || '',
      description,
      category: category || 'Workshop',
      venue,
      date,
      startTime: startTime || '10:00 AM',
      endTime: endTime || '04:00 PM',
      registrationDeadline: registrationDeadline || '',
      capacity: Number(capacity),
      registeredCount: 0,
      checkedInCount: 0,
      organizer: req.user._id,
      organizerName: req.user.isFaculty
        ? `${req.user.designation ? `${req.user.designation} ` : 'Prof. '}${req.user.name} (${req.user.organization || req.user.department})`
        : req.user.name + (req.user.organization ? ` (${req.user.organization})` : ''),
      isFacultySponsored: req.user.isFaculty || false,
      bannerImage: finalBanner,
      status: 'upcoming',
      approvalStatus: req.user.role === 'student' ? 'pending' : 'approved',
      submittedByRole: req.user.role,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['Campus', category]),
    });

    const isStudent = req.user.role === 'student';

    return res.status(201).json({
      success: true,
      requiresApproval: isStudent,
      message: isStudent
        ? 'Event proposal submitted for Admin review! It will be published once verified by Campus Administration.'
        : 'Event published successfully',
      event,
    });
  } catch (error) {
    console.error('createEvent error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error creating event' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Role check: Admin can edit any event; Organizer can only edit their own
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this event' });
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });

    return res.json({
      success: true,
      message: 'Event updated successfully',
      event: updated,
    });
  } catch (error) {
    console.error('updateEvent error:', error);
    return res.status(500).json({ success: false, message: 'Error updating event' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ event: req.params.id });

    return res.json({
      success: true,
      message: 'Event and associated tickets removed successfully',
    });
  } catch (error) {
    console.error('deleteEvent error:', error);
    return res.status(500).json({ success: false, message: 'Error deleting event' });
  }
};
