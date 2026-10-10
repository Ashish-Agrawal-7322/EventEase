import { Registration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import { generateTicketCode, generateQRPayload, generateQRCodeDataURL } from '../utils/ticketGenerator.js';
import { sendTicketConfirmationEmail, sendEventReminderEmail } from '../utils/emailService.js';
import { checkEventExpired } from '../utils/eventUtils.js';
import { Certificate } from '../models/Certificate.js';
import { createCertificateForRegistration } from './certificateController.js';

export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Expiry / Deadline check
    if (checkEventExpired(event)) {
      return res.status(400).json({
        success: false,
        message: 'Registration Closed: This event date/deadline has expired! You cannot enroll in a past event.',
        isExpired: true,
      });
    }

    if (event.status === 'completed' || event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: `Registration closed: Event is ${event.status}` });
    }

    // Capacity management check
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Registration full: Event has reached maximum capacity!',
        capacity: event.capacity,
        registeredCount: event.registeredCount,
      });
    }

    // Duplicate check for this user
    const existingRegistration = await Registration.findOne({
      event: event._id,
      user: userId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this event! View your pass in My Tickets.',
        ticketCode: existingRegistration.ticketCode,
      });
    }

    // Generate unique ticket and QR
    const ticketCode = generateTicketCode(event.category);
    const qrPayload = generateQRPayload(ticketCode, event._id, userId, req.user.rollNumber);
    const seatNumber = `SEAT-${(event.registeredCount + 1).toString().padStart(3, '0')}`;

    const { isTeamRegistration, teamName, teamMembers } = req.body || {};

    const registration = await Registration.create({
      event: event._id,
      user: userId,
      ticketCode,
      qrPayload,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentRollNumber: req.user.rollNumber || 'N/A',
      studentDepartment: req.user.department || 'General',
      seatNumber,
      isTeamRegistration: Boolean(isTeamRegistration),
      teamName: teamName || '',
      teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
      status: 'registered',
      registeredAt: new Date(),
    });

    // Update event registration count
    await Event.findByIdAndUpdate(event._id, {
      $inc: { registeredCount: 1 },
    });

    const qrDataUrl = await generateQRCodeDataURL(qrPayload);

    // Asynchronously dispatch automated QR ticket confirmation email with embedded pass attachment
    sendTicketConfirmationEmail({
      to: req.user.email,
      studentName: req.user.name,
      event,
      ticketCode,
      qrPayload,
      seatNumber,
    }).catch(err => console.error('[Email Error]:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Your digital QR ticket is ready.',
      registration: {
        ...registration.toObject ? registration.toObject() : registration,
        eventTitle: event.title,
        venue: event.venue,
        date: event.date,
        startTime: event.startTime,
        qrDataUrl,
      },
    });
  } catch (error) {
    console.error('registerForEvent error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error processing registration' });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const registrations = await Registration.find({ user: userId }).sort({ registeredAt: -1 }).populate('event');

    const certificates = await Certificate.find({ user: userId });
    const certMap = new Map();
    certificates.forEach((c) => certMap.set(c.event.toString(), c));

    const enrichedTickets = await Promise.all(
      registrations.map(async (reg) => {
        const item = reg.toObject ? reg.toObject() : reg;
        const qrDataUrl = await generateQRCodeDataURL(item.qrPayload || item.ticketCode);

        const eventIdStr = (item.event?._id || item.event)?.toString();
        let cert = certMap.get(eventIdStr);

        // Auto-generate certificate if checked in and not yet issued
        if (!cert && item.status === 'checked_in' && item.event) {
          try {
            cert = await createCertificateForRegistration(reg, item.event);
            if (cert) {
              certMap.set(eventIdStr, cert);
            }
          } catch (e) {
            console.warn('Auto cert in getMyTickets:', e.message);
          }
        }

        return {
          ...item,
          qrDataUrl,
          certificateId: cert?.certificateId || null,
          verificationUrl: cert?.verificationUrl || null,
        };
      })
    );

    return res.json({
      success: true,
      count: enrichedTickets.length,
      tickets: enrichedTickets,
    });
  } catch (error) {
    console.error('getMyTickets error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tickets' });
  }
};

export const getTicketByCode = async (req, res) => {
  try {
    const { ticketCode } = req.params;
    const registration = await Registration.findOne({ ticketCode }).populate('event').populate('user');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const qrDataUrl = await generateQRCodeDataURL(registration.qrPayload || registration.ticketCode);

    return res.json({
      success: true,
      ticket: {
        ...registration.toObject ? registration.toObject() : registration,
        qrDataUrl,
      },
    });
  } catch (error) {
    console.error('getTicketByCode error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving ticket' });
  }
};

// Core QR Check-in Endpoint
export const checkInTicket = async (req, res) => {
  try {
    const { rawInput, eventId } = req.body;
    const scannerUser = req.user;

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: 'No QR code or ticket code provided.',
      });
    }

    let parsedTicketCode = rawInput.trim();
    let parsedEventId = null;

    // Check if input is a JSON string from QR scanner
    try {
      if (rawInput.startsWith('{') && rawInput.endsWith('}')) {
        const parsed = JSON.parse(rawInput);
        if (parsed.ticketCode) parsedTicketCode = parsed.ticketCode.trim();
        if (parsed.eventId) parsedEventId = parsed.eventId.trim();
      }
    } catch {
      // Raw string format
    }

    // Find ticket by ticketCode or qrPayload
    let registration = await Registration.findOne({
      $or: [
        { ticketCode: parsedTicketCode },
        { qrPayload: rawInput },
      ],
    }).populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        status: 'not_found',
        message: 'Invalid Ticket: No registration found for this QR code in the system.',
      });
    }

    const event = registration.event;

    // 1. Verify Event Match
    if (eventId && event._id.toString() !== eventId.toString()) {
      return res.status(400).json({
        success: false,
        status: 'wrong_event',
        message: `Mismatched Event! This pass is registered for "${event.title}", not the selected event.`,
        ticket: {
          ticketCode: registration.ticketCode,
          studentName: registration.studentName,
          registeredEvent: event.title,
        },
      });
    }

    // 2. Prevent Duplicate Check-ins
    if (registration.status === 'checked_in') {
      const checkedInTime = new Date(registration.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return res.status(409).json({
        success: false,
        status: 'already_checked_in',
        message: `Already Checked In! Scanned previously at ${checkedInTime}.`,
        ticket: {
          ticketCode: registration.ticketCode,
          studentName: registration.studentName,
          studentRollNumber: registration.studentRollNumber,
          studentDepartment: registration.studentDepartment,
          checkedInAt: registration.checkedInAt,
          seatNumber: registration.seatNumber,
          eventTitle: event.title,
        },
      });
    }

    // 3. Mark Check-in Successful!
    const checkInTime = new Date();
    registration.status = 'checked_in';
    registration.checkedInAt = checkInTime;
    registration.checkedInBy = scannerUser._id;
    await registration.save();

    // Increment event check-in count
    await Event.findByIdAndUpdate(event._id, {
      $inc: { checkedInCount: 1 },
    });

    // Auto-generate Certificate of Participation upon gate check-in
    let certificate = null;
    try {
      certificate = await createCertificateForRegistration(registration, event);
    } catch (certErr) {
      console.warn('Auto certificate generation warning:', certErr.message);
    }

    const timeStr = checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Check-in Successful! Certificate of Participation generated.',
      certificateId: certificate?.certificateId || null,
      ticket: {
        ticketCode: registration.ticketCode,
        studentName: registration.studentName,
        studentEmail: registration.studentEmail,
        studentRollNumber: registration.studentRollNumber,
        studentDepartment: registration.studentDepartment,
        seatNumber: registration.seatNumber,
        checkedInAt: checkInTime,
        checkedInTimeStr: timeStr,
        eventTitle: event.title,
      },
    });
  } catch (error) {
    console.error('checkInTicket error:', error);
    return res.status(500).json({ success: false, message: 'Server error during check-in validation' });
  }
};

// Toggle manual check-in from participant list
export const toggleManualCheckIn = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }

    const wasCheckedIn = registration.status === 'checked_in';
    const newStatus = wasCheckedIn ? 'registered' : 'checked_in';
    const newCheckInTime = wasCheckedIn ? null : new Date();

    registration.status = newStatus;
    registration.checkedInAt = newCheckInTime;
    registration.checkedInBy = wasCheckedIn ? null : req.user._id;
    await registration.save();

    await Event.findByIdAndUpdate(registration.event, {
      $inc: { checkedInCount: wasCheckedIn ? -1 : 1 },
    });

    // Auto-generate certificate if marked as checked in
    if (newStatus === 'checked_in') {
      try {
        const eventDoc = await Event.findById(registration.event);
        if (eventDoc) {
          await createCertificateForRegistration(registration, eventDoc);
        }
      } catch (certErr) {
        console.warn('Manual check-in certificate error:', certErr.message);
      }
    }

    return res.json({
      success: true,
      message: wasCheckedIn ? 'Check-in reverted to registered' : 'Participant marked as checked-in & certificate generated',
      registration,
    });
  } catch (error) {
    console.error('toggleManualCheckIn error:', error);
    return res.status(500).json({ success: false, message: 'Error updating check-in status' });
  }
};

export const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { search, status } = req.query;

    let filter = { event: eventId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    let participants = await Registration.find(filter).sort({ registeredAt: -1 });

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      participants = participants.filter(p =>
        (p.studentName && p.studentName.toLowerCase().includes(q)) ||
        (p.studentEmail && p.studentEmail.toLowerCase().includes(q)) ||
        (p.studentRollNumber && p.studentRollNumber.toLowerCase().includes(q)) ||
        (p.ticketCode && p.ticketCode.toLowerCase().includes(q)) ||
        (p.studentDepartment && p.studentDepartment.toLowerCase().includes(q))
      );
    }

    // Fetch event and certificates to attach credential info
    const eventDoc = await Event.findById(eventId);
    const certificates = await Certificate.find({ event: eventId });
    const certMap = new Map();
    certificates.forEach((c) => certMap.set(c.user.toString(), c));

    const enrichedParticipants = await Promise.all(
      participants.map(async (p) => {
        const pObj = p.toObject ? p.toObject() : { ...p };
        const userIdStr = (p.user?._id || p.user)?.toString();
        let cert = certMap.get(userIdStr);

        // Auto-generate certificate if checked in and not yet created
        if (!cert && p.status === 'checked_in' && eventDoc) {
          try {
            cert = await createCertificateForRegistration(p, eventDoc);
            if (cert) {
              certMap.set(userIdStr, cert);
            }
          } catch (e) {
            console.warn('Auto cert generation error in getParticipants:', e.message);
          }
        }

        pObj.certificateId = cert?.certificateId || null;
        pObj.verificationUrl = cert?.verificationUrl || null;
        return pObj;
      })
    );

    return res.json({
      success: true,
      count: enrichedParticipants.length,
      participants: enrichedParticipants,
    });
  } catch (error) {
    console.error('getEventParticipants error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching participant list' });
  }
};

export const getEventAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const participants = await Registration.find({ event: eventId });

    // 1. Department Distribution
    const deptMap = {};
    participants.forEach(p => {
      const dept = p.studentDepartment || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departmentData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // 2. Status distribution
    const checkedInCount = participants.filter(p => p.status === 'checked_in').length;
    const pendingCount = participants.filter(p => p.status === 'registered').length;
    const statusData = [
      { name: 'Checked In', value: checkedInCount, fill: '#00ff9d' },
      { name: 'Pending Arrival', value: pendingCount, fill: '#00f0ff' },
      { name: 'Unfilled Spots', value: Math.max(0, event.capacity - participants.length), fill: '#1e293b' },
    ];

    // 3. Hourly Check-in Rush curve
    const hoursMap = {
      '09:00 AM': 0,
      '10:00 AM': 0,
      '11:00 AM': 0,
      '12:00 PM': 0,
      '01:00 PM': 0,
      '02:00 PM': 0,
      '03:00 PM': 0,
      '04:00 PM': 0,
    };

    participants.forEach(p => {
      if (p.checkedInAt) {
        const d = new Date(p.checkedInAt);
        const hour = d.getHours();
        const hourStr = (hour > 12 ? `${(hour - 12).toString().padStart(2, '0')}:00 PM` : `${hour.toString().padStart(2, '0')}:00 AM`);
        if (hoursMap[hourStr] !== undefined) {
          hoursMap[hourStr] += 1;
        } else {
          hoursMap['10:00 AM'] = (hoursMap['10:00 AM'] || 0) + 1;
        }
      }
    });

    const timelineData = Object.entries(hoursMap).map(([time, checkIns]) => ({
      time,
      checkIns,
      cumulative: checkIns,
    }));

    return res.json({
      success: true,
      analytics: {
        capacity: event.capacity,
        registeredCount: participants.length,
        checkedInCount,
        pendingCount,
        turnoutPercentage: participants.length > 0 ? Math.round((checkedInCount / participants.length) * 100) : 0,
        fillPercentage: Math.round((participants.length / event.capacity) * 100),
        departmentData,
        statusData,
        timelineData,
      },
    });
  } catch (error) {
    console.error('getEventAnalytics error:', error);
    return res.status(500).json({ success: false, message: 'Error compiling analytics' });
  }
};

export const exportParticipantsCSV = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const participants = await Registration.find({ event: eventId }).sort({ registeredAt: 1 });

    const headers = ['Ticket Code', 'Student Name', 'Email', 'Roll Number', 'Department', 'Seat Number', 'Registration Status', 'Registered At', 'Checked In At'];
    
    const rows = participants.map(p => [
      `"${p.ticketCode}"`,
      `"${p.studentName.replace(/"/g, '""')}"`,
      `"${p.studentEmail}"`,
      `"${p.studentRollNumber || 'N/A'}"`,
      `"${p.studentDepartment || 'General'}"`,
      `"${p.seatNumber || 'N/A'}"`,
      `"${p.status === 'checked_in' ? 'Checked In' : 'Registered'}"`,
      `"${new Date(p.registeredAt).toLocaleString()}"`,
      `"${p.checkedInAt ? new Date(p.checkedInAt).toLocaleString() : 'N/A'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('exportCSV error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate CSV export' });
  }
};

/**
 * Broadcast "Event Starts in 2 Hours" / Gate Opening Alert to all registered students
 */
export const sendEventReminders = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Role check: Organizer who created event or Admin
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to send alerts for this event' });
    }

    const participants = await Registration.find({ event: eventId, status: 'registered' });
    if (participants.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'No registered attendees with pending entry to notify.',
      });
    }

    const alertTitle = req.body.alertTitle || 'Event Starts in 2 Hours!';

    // Send emails in parallel
    const emailPromises = participants.map((p) =>
      sendEventReminderEmail({
        to: p.studentEmail,
        studentName: p.studentName,
        event,
        ticketCode: p.ticketCode,
        qrPayload: p.qrPayload,
        seatNumber: p.seatNumber,
        alertTitle,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const sentCount = results.filter((r) => r.status === 'fulfilled' && r.value?.success).length;

    return res.json({
      success: true,
      count: sentCount,
      total: participants.length,
      message: `2-Hour Gate Reminder sent to ${sentCount} registered attendee(s)!`,
    });
  } catch (error) {
    console.error('sendEventReminders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to broadcast reminders' });
  }
};
