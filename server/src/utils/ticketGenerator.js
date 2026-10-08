import crypto from 'crypto';
import QRCode from 'qrcode';

export const generateTicketCode = (category = 'EVT') => {
  const prefix = (category.substring(0, 4) || 'EVT').toUpperCase().replace(/[^A-Z]/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  const timeSuffix = Date.now().toString(36).slice(-3).toUpperCase();
  return `EE-${prefix}-${randomHex}${timeSuffix}`;
};

export const generateQRPayload = (ticketCode, eventId, userId, studentRoll) => {
  return JSON.stringify({
    app: 'EventEase',
    ticketCode,
    eventId: eventId.toString(),
    userId: userId.toString(),
    roll: studentRoll || 'N/A',
    sig: crypto.createHash('sha256').update(`${ticketCode}:${eventId}:${process.env.JWT_SECRET || 'eventease_secret_key'}`).digest('hex').substring(0, 12),
    issuedAt: Date.now(),
  });
};

export const generateQRCodeDataURL = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#00f0ff',
        light: '#070b14',
      },
    });
  } catch (err) {
    console.error('Error generating QR code image:', err);
    return null;
  }
};
