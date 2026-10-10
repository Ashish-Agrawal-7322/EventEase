import { Certificate } from '../models/Certificate.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import QRCode from 'qrcode';

// Helper to generate a single certificate for a checked-in registration
export const createCertificateForRegistration = async (registration, event) => {
  try {
    const userId = registration.user?._id || registration.user;
    if (!userId || !event) return null;

    const existing = await Certificate.findOne({ event: event._id, user: userId });
    if (existing) {
      return existing;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certificateId = `MU-CERT-2026-${randomSuffix}-${Date.now().toString().slice(-4)}`;
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-certificate/${certificateId}`;

    // Generate Data URL QR code
    const qrCodeData = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: { dark: '#050914', light: '#ffffff' },
    });

    const cert = await Certificate.create({
      certificateId,
      event: event._id,
      user: userId,
      studentName: registration.studentName || registration.user?.name || 'Student Attendee',
      studentRollNumber: registration.studentRollNumber || registration.user?.rollNumber || 'N/A',
      studentDepartment: registration.studentDepartment || registration.user?.department || 'General',
      eventTitle: event.title,
      eventCategory: event.category || 'Collegiate Event',
      eventDate: event.date || 'Official Campus Event',
      venue: event.venue || 'Marwadi University Campus',
      organizerName: event.organizerName || 'Campus Technical Council',
      qrCodeData,
      verificationUrl,
    });

    return cert;
  } catch (error) {
    console.error('createCertificateForRegistration error:', error);
    return null;
  }
};

export const issueCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only issue certificates to physically checked-in attendees
    const checkedInRegistrations = await Registration.find({
      event: eventId,
      status: 'checked_in',
    }).populate('user', 'name email rollNumber department');

    if (checkedInRegistrations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No checked-in attendees found for this event. Certificates can only be issued to students verified at the gate entrance.',
      });
    }

    let issuedCount = 0;
    const certificates = [];

    for (const reg of checkedInRegistrations) {
      const existing = await Certificate.findOne({ event: eventId, user: reg.user._id });
      if (existing) {
        certificates.push(existing);
        continue;
      }

      const cert = await createCertificateForRegistration(reg, event);
      if (cert) {
        certificates.push(cert);
        issuedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Successfully issued ${issuedCount} verified Certificate(s) of Participation!`,
      totalIssued: certificates.length,
      newlyIssued: issuedCount,
      certificates,
    });
  } catch (error) {
    console.error('issueCertificates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to issue certificates' });
  }
};

export const getMyCertificates = async (req, res) => {
  try {
    const userId = req.user._id;

    // Auto-generate certificates for any checked-in registration of this user that doesn't have one yet
    const checkedInRegs = await Registration.find({
      user: userId,
      status: 'checked_in',
    }).populate('event');

    for (const reg of checkedInRegs) {
      if (reg.event) {
        await createCertificateForRegistration(reg, reg.event);
      }
    }

    const certs = await Certificate.find({ user: userId }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: certs.length,
      certificates: certs,
    });
  } catch (error) {
    console.error('getMyCertificates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve certificates' });
  }
};

export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId }).populate('event', 'title category date venue organizerName');

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Certificate ID. No matching credential found in the Marwadi University registry.',
      });
    }

    return res.json({
      success: true,
      valid: true,
      certificate: cert,
    });
  } catch (error) {
    console.error('verifyCertificate error:', error);
    return res.status(500).json({ success: false, message: 'Certificate verification failed' });
  }
};
