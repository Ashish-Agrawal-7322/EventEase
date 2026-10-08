import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentsCount = await User.countDocuments({ role: 'student' });
    const organizersCount = await User.countDocuments({ role: 'organizer' });
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const totalCheckedIn = await Registration.countDocuments({ status: 'checked_in' });

    // Events by category
    const allEvents = await Event.find({});
    const categoryMap = {};
    allEvents.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + 1;
    });
    const categoryStats = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

    // Department engagement from registrations
    const allRegistrations = await Registration.find({});
    const deptMap = {};
    allRegistrations.forEach(r => {
      const dept = r.studentDepartment || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const deptStats = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        studentsCount,
        organizersCount,
        totalEvents,
        totalRegistrations,
        totalCheckedIn,
        overallTurnout: totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0,
        categoryStats,
        deptStats,
      },
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving admin metrics' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const sanitized = users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      rollNumber: u.rollNumber,
      organization: u.organization,
      organizerStatus: u.organizerStatus || 'none',
      clubDetails: u.clubDetails || {},
      createdAt: u.createdAt,
    }));

    return res.json({
      success: true,
      count: sanitized.length,
      users: sanitized,
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['student', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    return res.status(500).json({ success: false, message: 'Error updating user role' });
  }
};

/**
 * Fetch all pending organizer applications for Admin review
 */
export const getOrganizerRequests = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      $or: [
        { organizerStatus: 'pending' },
        { 'clubDetails.requestedAt': { $exists: true } }
      ]
    }).sort({ 'clubDetails.requestedAt': -1 });

    const requests = pendingUsers.map(u => ({
      userId: u._id,
      name: u.name,
      email: u.email,
      rollNumber: u.rollNumber,
      department: u.department,
      currentRole: u.role,
      organizerStatus: u.organizerStatus,
      clubDetails: u.clubDetails,
    }));

    return res.json({
      success: true,
      requests,
      count: requests.filter(r => r.organizerStatus === 'pending').length,
    });
  } catch (error) {
    console.error('getOrganizerRequests error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching organizer requests' });
  }
};

/**
 * Admin review: Approve or Reject a student's Club Lead application
 */
export const reviewOrganizerRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reviewNotes } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (action === 'approve') {
      user.role = 'organizer';
      user.organizerStatus = 'approved';
      if (user.clubDetails?.clubName) {
        user.organization = user.clubDetails.clubName;
      }
      user.clubDetails = {
        ...user.clubDetails,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || 'Approved by Campus Administration',
      };
      await user.save();

      // Dispatch automated notification email asynchronously
      import('../utils/emailService.js').then(({ sendOrganizerApprovalEmail }) => {
        sendOrganizerApprovalEmail({
          to: user.email,
          studentName: user.name,
          clubName: user.clubDetails?.clubName || 'Campus Club',
          role: user.clubDetails?.clubRole || 'Club Lead',
        }).catch(e => console.error('Approval email err:', e.message));
      });

      return res.json({
        success: true,
        message: `Approved! ${user.name} is now verified as Club Organizer.`,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          organizerStatus: user.organizerStatus,
        },
      });
    } else {
      user.organizerStatus = 'rejected';
      user.clubDetails = {
        ...user.clubDetails,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || 'Application declined by Campus Administration',
      };
      await user.save();

      return res.json({
        success: true,
        message: `Application for ${user.name} has been rejected.`,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          organizerStatus: user.organizerStatus,
        },
      });
    }
  } catch (error) {
    console.error('reviewOrganizerRequest error:', error);
    return res.status(500).json({ success: false, message: 'Error reviewing request' });
  }
};

/**
 * Fetch all events awaiting admin approval
 */
export const getPendingEvents = async (req, res) => {
  try {
    const pendingEvents = await Event.find({ approvalStatus: 'pending' })
      .populate('organizer', 'name email rollNumber department role')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: pendingEvents.length,
      events: pendingEvents,
    });
  } catch (error) {
    console.error('getPendingEvents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pending events' });
  }
};

/**
 * Admin review: Approve or reject an event proposal
 */
export const reviewEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { action, feedback } = req.body; // 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    const event = await Event.findById(eventId).populate('organizer');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (action === 'approve') {
      event.approvalStatus = 'approved';
      event.adminFeedback = feedback || 'Approved by Campus Administration';
      await event.save();

      // If submitted by a student, grant them organizer rights
      let organizerEmail = null;
      let organizerName = event.organizerName;

      if (event.organizer) {
        const studentUser = await User.findById(event.organizer._id);
        if (studentUser) {
          organizerEmail = studentUser.email;
          organizerName = studentUser.name;
          if (studentUser.role === 'student') {
            studentUser.role = 'organizer';
            studentUser.organizerStatus = 'approved';
            await studentUser.save();
          }
        }
      }

      // Dispatch Approval Email to the organizer's university inbox
      if (organizerEmail || event.organizer?.email) {
        import('../utils/emailService.js').then(({ sendEventApprovalEmail }) => {
          sendEventApprovalEmail({
            to: organizerEmail || event.organizer.email,
            studentName: organizerName,
            event,
            adminFeedback: event.adminFeedback,
          }).catch(e => console.error('[EventApprovalEmail Error]:', e.message));
        });
      }

      return res.json({
        success: true,
        message: `Event "${event.title}" approved and published to the campus schedule! Notification email sent.`,
        event,
      });
    } else {
      event.approvalStatus = 'rejected';
      event.adminFeedback = feedback || 'Event proposal declined by Campus Administration';
      await event.save();

      // Dispatch Rejection / Decline Email to the organizer's university inbox
      const organizerEmail = event.organizer?.email;
      const organizerName = event.organizer?.name || event.organizerName;

      if (organizerEmail) {
        import('../utils/emailService.js').then(({ sendEventRejectionEmail }) => {
          sendEventRejectionEmail({
            to: organizerEmail,
            studentName: organizerName,
            event,
            adminFeedback: event.adminFeedback,
          }).catch(e => console.error('[EventRejectionEmail Error]:', e.message));
        });
      }

      return res.json({
        success: true,
        message: `Event "${event.title}" proposal rejected. Notification email sent.`,
        event,
      });
    }
  } catch (error) {
    console.error('reviewEvent error:', error);
    return res.status(500).json({ success: false, message: 'Error reviewing event' });
  }
};

