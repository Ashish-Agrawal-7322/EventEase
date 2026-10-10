import dns from 'dns';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

// Prefer IPv6 if available, which allows connecting to smtp.gmail.com reliably
if (dns && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('verbatim');
}

// Cache transporter instance
let transporter = null;

const getAppUrl = () => (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : 'http://localhost:5173');

const getTransporter = async () => {
  if (transporter) return transporter;

  // 1. If custom SMTP or Gmail credentials exist in process.env
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        connectionTimeout: 10000,
        socketTimeout: 10000,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Direct Gmail SMTP over SSL on port 465
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        connectionTimeout: 15000,
        socketTimeout: 15000,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
    return transporter;
  }

  // 2. Fallback: Ethereal test account for instant testing without setup
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Email] Running with Ethereal SMTP test account: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn('[Email] Could not create Ethereal account, falling back to simulated logger:', err.message);
    return null;
  }
};

/**
 * Send Instant QR Ticket Confirmation Email upon Registration
 */
export const sendTicketConfirmationEmail = async ({
  to,
  studentName,
  event,
  ticketCode,
  qrPayload,
  seatNumber,
}) => {
  try {
    const transport = await getTransporter();

    // Generate high-resolution PNG QR Buffer for CID attachment
    const qrBuffer = await QRCode.toBuffer(qrPayload || ticketCode, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 250,
      color: {
        dark: '#050914',
        light: '#ffffff',
      },
    });

    const mailOptions = {
      from: `"${event.organizerName || 'EventEase Gate'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'tickets@eventease.college'}>`,
      to,
      subject: `⚡ Your Entry Pass: ${event.title} [${ticketCode}]`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060a12; color: #e2e8f0; margin: 0; padding: 20px; }
            .container { max-width: 550px; margin: 0 auto; background: #0c142c; border: 1px solid #00f0ff40; border-radius: 20px; overflow: hidden; box-shadow: 0 0 40px rgba(0,240,255,0.15); }
            .header { background: linear-gradient(135deg, #081d3d 0%, #1e1140 100%); padding: 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .badge { display: inline-block; padding: 4px 12px; background: rgba(0,240,255,0.15); border: 1px solid #00f0ff; color: #00f0ff; font-size: 11px; font-weight: bold; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; }
            .title { font-size: 20px; font-weight: 800; color: #ffffff; margin: 12px 0 4px; }
            .content { padding: 24px; text-align: center; }
            .qr-card { background: #ffffff; padding: 16px; border-radius: 16px; display: inline-block; margin: 16px auto; border: 4px solid #00f0ff; box-shadow: 0 0 25px rgba(0,240,255,0.3); }
            .qr-card img { display: block; margin: 0 auto; width: 200px; height: 200px; }
            .ticket-code { background: #050914; color: #00f0ff; font-family: monospace; font-size: 14px; font-weight: bold; padding: 8px 16px; border-radius: 8px; display: inline-block; border: 1px solid #00f0ff40; margin-top: 8px; letter-spacing: 2px; }
            .details-table { width: 100%; margin-top: 20px; border-collapse: collapse; text-align: left; background: #070b18; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
            .details-table td { padding: 12px 16px; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .details-label { color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 10px; width: 35%; }
            .details-value { color: #ffffff; font-weight: bold; }
            .footer { padding: 18px 24px; background: #050811; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">Official Digital Pass</span>
              <div class="title">${event.title}</div>
              <div style="font-size: 12px; color: #94a3b8;">${event.tagline || 'College Admission Credential'}</div>
            </div>

            <div class="content">
              <p style="font-size: 13px; color: #cbd5e1; margin-top: 0;">
                Hello <strong>${studentName}</strong>, your seat has been reserved! Present the QR code below at the entry gate scanner.
              </p>

              <!-- QR Code Card -->
              <div class="qr-card">
                <img src="cid:qrcode@eventease" alt="Entry QR Ticket" />
              </div>

              <div>
                <div class="ticket-code">${ticketCode}</div>
              </div>

              <!-- Metadata Table -->
              <table class="details-table">
                <tr>
                  <td class="details-label">Date</td>
                  <td class="details-value">${event.date}</td>
                </tr>
                <tr>
                  <td class="details-label">Time</td>
                  <td class="details-value">${event.startTime} - ${event.endTime}</td>
                </tr>
                <tr>
                  <td class="details-label">Venue / Gate</td>
                  <td class="details-value">${event.venue}</td>
                </tr>
                <tr>
                  <td class="details-label">Assigned Seat</td>
                  <td class="details-value" style="color: #a855f7;">${seatNumber || 'OPEN-01'}</td>
                </tr>
                <tr>
                  <td class="details-label">Organizer</td>
                  <td class="details-value">${event.organizerName || 'Campus Technical Council'}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              ⚡ Powered by <strong>EventEase</strong> • Cryptographic Gate Management System<br>
              Screenshot or save this email for rapid gate validation.
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `ticket-${ticketCode}.png`,
          content: qrBuffer,
          cid: 'qrcode@eventease',
        },
      ],
    };

    if (transport) {
      const info = await transport.sendMail(mailOptions);
      console.log(`[Email] Ticket sent to ${to}: ${info.messageId}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Email] Ethereal Preview URL: ${previewUrl}`);
      }
      return { success: true, previewUrl, messageId: info.messageId };
    } else {
      console.log(`[Email-Simulated] Ticket confirmation created for ${to} (${ticketCode})`);
      return { success: true, simulated: true };
    }
  } catch (err) {
    console.error(`[Email] Failed to send ticket confirmation to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send "Event Starts in 2 Hours" Alert Email
 */
export const sendEventReminderEmail = async ({
  to,
  studentName,
  event,
  ticketCode,
  qrPayload,
  seatNumber,
  alertTitle = 'Event Starts in 2 Hours!',
}) => {
  try {
    const transport = await getTransporter();

    const qrBuffer = await QRCode.toBuffer(qrPayload || ticketCode, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 250,
      color: {
        dark: '#050914',
        light: '#ffffff',
      },
    });

    const mailOptions = {
      from: `"${event.organizerName || 'EventEase Gate'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'reminders@eventease.college'}>`,
      to,
      subject: `🚨 REMINDER: ${alertTitle} — ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060a12; color: #e2e8f0; margin: 0; padding: 20px; }
            .container { max-width: 550px; margin: 0 auto; background: #0c142c; border: 1px solid #ffb70360; border-radius: 20px; overflow: hidden; box-shadow: 0 0 40px rgba(255,183,3,0.15); }
            .header { background: linear-gradient(135deg, #3d2b08 0%, #1e1140 100%); padding: 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .badge { display: inline-block; padding: 4px 12px; background: rgba(255,183,3,0.2); border: 1px solid #ffb703; color: #ffb703; font-size: 11px; font-weight: bold; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; }
            .title { font-size: 20px; font-weight: 800; color: #ffffff; margin: 12px 0 4px; }
            .content { padding: 24px; text-align: center; }
            .qr-card { background: #ffffff; padding: 14px; border-radius: 16px; display: inline-block; margin: 16px auto; border: 4px solid #ffb703; box-shadow: 0 0 25px rgba(255,183,3,0.3); }
            .qr-card img { display: block; margin: 0 auto; width: 190px; height: 190px; }
            .ticket-code { background: #050914; color: #ffb703; font-family: monospace; font-size: 14px; font-weight: bold; padding: 8px 16px; border-radius: 8px; display: inline-block; border: 1px solid #ffb70340; letter-spacing: 2px; }
            .alert-box { background: rgba(255,183,3,0.1); border-left: 4px solid #ffb703; padding: 12px 16px; text-align: left; font-size: 12px; color: #fde68a; border-radius: 8px; margin: 16px 0; }
            .details-table { width: 100%; margin-top: 16px; border-collapse: collapse; text-align: left; background: #070b18; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
            .details-table td { padding: 10px 14px; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .details-label { color: #94a3b8; font-weight: 600; font-size: 10px; text-transform: uppercase; width: 35%; }
            .details-value { color: #ffffff; font-weight: bold; }
            .footer { padding: 16px 24px; background: #050811; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">⏰ Starting Soon Alert</span>
              <div class="title">${event.title}</div>
              <div style="font-size: 12px; color: #fde68a;">Gate Check-In Opens Shortly</div>
            </div>

            <div class="content">
              <div class="alert-box">
                👋 <strong>Hi ${studentName}</strong>, this is an automated alert from ${event.organizerName || 'your event organizers'}. The event starts in approximately 2 hours!
              </div>

              <p style="font-size: 12px; color: #cbd5e1; margin-bottom: 4px;">
                Have your QR pass ready on your screen when you reach the gate:
              </p>

              <div class="qr-card">
                <img src="cid:qrcode@eventease" alt="Entry QR Ticket" />
              </div>

              <div>
                <div class="ticket-code">${ticketCode}</div>
              </div>

              <table class="details-table">
                <tr>
                  <td class="details-label">Date & Time</td>
                  <td class="details-value">${event.date} • ${event.startTime}</td>
                </tr>
                <tr>
                  <td class="details-label">Venue Location</td>
                  <td class="details-value" style="color: #38bdf8;">${event.venue}</td>
                </tr>
                <tr>
                  <td class="details-label">Seat Assigned</td>
                  <td class="details-value" style="color: #a855f7;">${seatNumber || 'OPEN'}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              ⚡ EventEase Gate Operations • Have a great event!
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `ticket-${ticketCode}.png`,
          content: qrBuffer,
          cid: 'qrcode@eventease',
        },
      ],
    };

    if (transport) {
      const info = await transport.sendMail(mailOptions);
      console.log(`[Reminder] Sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`[Reminder-Simulated] Sent to ${to} for event ${event.title}`);
      return { success: true, simulated: true };
    }
  } catch (err) {
    console.error(`[Reminder] Failed to send reminder to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send official notification when Admin approves student's club organizer application
 */
export const sendOrganizerApprovalEmail = async ({ to, studentName, clubName, role }) => {
  try {
    const transport = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"EventEase Campus Administration" <noreply@eventease.edu>',
      to,
      subject: `🏛️ Approved: Your Club Lead Access for ${clubName} is Activated!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #050811; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; }
            .card { max-width: 580px; margin: 0 auto; background: #0c1222; border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 20px; padding: 28px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
            .badge { display: inline-block; background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 14px; }
            h1 { color: #ffffff; font-size: 22px; margin: 0 0 10px 0; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
            .highlight-box { background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px; padding: 16px; margin: 20px 0; }
            .btn { display: inline-block; background: linear-gradient(135deg, #a855f7, #00f0ff); color: #000; font-weight: bold; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 13px; margin-top: 10px; }
            .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Official Verification • Approved</div>
            <h1>Congratulations, ${studentName}! 🚀</h1>
            <p>The College Administration has reviewed and <strong>approved</strong> your application to host events on EventEase.</p>
            
            <div class="highlight-box">
              <div style="font-size: 12px; color: #38bdf8; font-weight: bold; text-transform: uppercase; margin-bottom: 6px;">Verified Organization</div>
              <div style="font-size: 18px; font-weight: bold; color: #ffffff;">${clubName}</div>
              <div style="font-size: 12px; color: #c084fc; margin-top: 4px;">Role: ${role || 'Club Lead'}</div>
            </div>

            <p>Your account now has access to the <strong>Organizer Command Hub</strong>:</p>
            <ul style="color: #cbd5e1; font-size: 13px; line-height: 1.8;">
              <li>Host & publish campus workshops, hackathons, and fests</li>
              <li>Scan attendee passes with the high-speed QR camera scanner</li>
              <li>Track live check-in telemetry and export CSV attendance sheets</li>
              <li>Broadcast 2-hour gate alerts to registered attendees</li>
            </ul>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${getAppUrl()}/organizer" class="btn">Go to Organizer Command Hub →</a>
            </div>

            <div class="footer">
              🏛️ EventEase Campus Administration & Governance • Official Notification
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (transport) {
      const info = await transport.sendMail(mailOptions);
      console.log(`[ApprovalEmail] Sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`[ApprovalEmail-Simulated] Sent to ${to} for ${clubName}`);
      return { success: true, simulated: true };
    }
  } catch (err) {
    console.error(`[ApprovalEmail] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send 6-Digit Registration OTP Verification Email
 */
export const sendRegistrationOtpEmail = async ({ to, name, otp }) => {
  try {
    const transport = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"EventEase Security Gate" <noreply@eventease.edu>',
      to,
      subject: `🔐 Marwadi University Verification: Your 6-Digit Code is ${otp}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #050811; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; }
            .card { max-width: 540px; margin: 0 auto; background: #0c1222; border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 20px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); }
            .badge { display: inline-block; background: rgba(0, 240, 255, 0.15); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.4); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; font-family: monospace; }
            h1 { color: #ffffff; font-size: 22px; margin: 0 0 8px 0; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0; }
            .otp-box { background: rgba(0, 240, 255, 0.08); border: 2px dashed rgba(0, 240, 255, 0.5); border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #00f0ff; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(0,240,255,0.6); }
            .otp-timer { font-size: 11px; color: #f59e0b; margin-top: 8px; font-family: monospace; }
            .info-box { background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 12px; padding: 14px; margin-top: 20px; font-size: 12px; color: #cbd5e1; }
            .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Marwadi University • Campus Identity Verification</div>
            <h1>Welcome, ${name || 'Student'}! 🎓</h1>
            <p>You are registering an official account on <strong>EventEase</strong>. Please use the 6-digit one-time verification passcode below to complete your enrollment:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-timer">⏱️ Valid for 10 minutes • Do not share this code</div>
            </div>

            <div class="info-box">
              🛡️ <strong>Institutional Proof:</strong> This code verifies your institutional affiliation with Marwadi University. If you did not initiate this registration, please disregard this email.
            </div>

            <div class="footer">
              ⚡ EventEase Security Gate • Marwadi University Campus Operations
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (transport) {
      const info = await transport.sendMail(mailOptions);
      console.log(`[RegistrationOtp] Sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.error(`[RegistrationOtp] No email transport configured for sending OTP to ${to}`);
      return { success: false, error: 'Email transport is not configured' };
    }
  } catch (err) {
    console.error(`[RegistrationOtp] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send 6-Digit Password Reset OTP Email
 */
export const sendForgotPasswordOtpEmail = async ({ to, name, otp }) => {
  try {
    const transport = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"EventEase Security Gate" <noreply@eventease.edu>',
      to,
      subject: `🔑 Password Reset OTP: ${otp} [EventEase Security]`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #050811; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; }
            .card { max-width: 540px; margin: 0 auto; background: #0c1222; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); }
            .badge { display: inline-block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; font-family: monospace; }
            h1 { color: #ffffff; font-size: 22px; margin: 0 0 8px 0; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0; }
            .otp-box { background: rgba(239, 68, 68, 0.08); border: 2px dashed rgba(239, 68, 68, 0.5); border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #f87171; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(239,68,68,0.6); }
            .otp-timer { font-size: 11px; color: #f59e0b; margin-top: 8px; font-family: monospace; }
            .warning-box { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 14px; margin-top: 20px; font-size: 12px; color: #fbbf24; }
            .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Security Override • Password Reset</div>
            <h1>Password Reset Request</h1>
            <p>Hello ${name || 'User'}, we received a request to reset the password for your EventEase university account. Use this 6-digit OTP code:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-timer">⏱️ Expires in 10 minutes • Never share your OTP</div>
            </div>

            <div class="warning-box">
              ⚠️ If you did NOT request a password reset, someone may be attempting to access your account. Your password remains safe unless they have this code.
            </div>

            <div class="footer">
              🔒 EventEase Authentication Sentinel • Marwadi University
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (transport) {
      const info = await transport.sendMail(mailOptions);
      console.log(`[ForgotOtp] Sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.error(`[ForgotOtp] No email transport configured for sending OTP to ${to}`);
      return { success: false, error: 'Email transport is not configured' };
    }
  } catch (err) {
    console.error(`[ForgotOtp] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send Welcome Email upon successful Account Creation
 */
export const sendWelcomeAccountEmail = async ({ to, name, role, department, rollNumber }) => {
  try {
    const transport = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"EventEase Campus Gate" <noreply@eventease.edu>',
      to,
      subject: `🎉 Welcome to EventEase, ${name}! Your Campus Identity is Activated`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #050811; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; }
            .card { max-width: 580px; margin: 0 auto; background: #0c1222; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 20px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); }
            .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; font-family: monospace; }
            h1 { color: #ffffff; font-size: 24px; margin: 0 0 10px 0; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
            .profile-card { background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 14px; padding: 18px; margin: 24px 0; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #00f0ff, #a855f7); color: #000; font-weight: bold; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-size: 13px; margin-top: 12px; }
            .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Marwadi University Verified Account</div>
            <h1>Welcome aboard, ${name}! 🚀</h1>
            <p>Your official EventEase campus account has been successfully created and verified via institutional email.</p>
            
            <div class="profile-card">
              <div class="row">
                <span style="color: #64748b;">Full Name</span>
                <strong style="color: #ffffff;">${name}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">University Email</span>
                <strong style="color: #00f0ff; font-family: monospace;">${to}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">Role</span>
                <strong style="color: #a855f7; text-transform: uppercase;">${role || 'Student'}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">Roll / ID</span>
                <strong style="color: #cbd5e1; font-family: monospace;">${rollNumber || 'N/A'}</strong>
              </div>
              <div class="row" style="border: none;">
                <span style="color: #64748b;">Department</span>
                <strong style="color: #34d399;">${department || 'General'}</strong>
              </div>
            </div>

            <p>You can now browse campus hackathons, technical workshops, cultural fests, and get instant digital holographic passes sent directly to this inbox.</p>

            <div style="text-align: center; margin-top: 20px;">
              <a href="${getAppUrl()}" class="btn">Explore Campus Events →</a>
            </div>

            <div class="footer">
              🎓 EventEase Campus Platform • Marwadi University
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (transport) {
      const info = await transport.sendMail(mailOptions);
      console.log(`[WelcomeEmail] Sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`[WelcomeEmail-Simulated] Sent to ${to}`);
      return { success: true, simulated: true };
    }
  } catch (err) {
    console.error(`[WelcomeEmail] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send Event Approval Email to Organizer
 */
export const sendEventApprovalEmail = async ({ to, studentName, event, adminFeedback }) => {
  try {
    const transport = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"EventEase Administration" <admin@eventease.edu>',
      to,
      subject: `🎉 Approved: Your Event "${event.title}" is Now Live on Campus Schedule!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #050811; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; }
            .card { max-width: 580px; margin: 0 auto; background: #0c1222; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 20px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); }
            .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; font-family: monospace; }
            h1 { color: #ffffff; font-size: 22px; margin: 0 0 10px 0; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
            .event-box { background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 14px; padding: 18px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #00f0ff, #a855f7); color: #000; font-weight: bold; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-size: 13px; margin-top: 16px; }
            .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Official Event Sanctioned</div>
            <h1>Congratulations, ${studentName || 'Organizer'}! 🚀</h1>
            <p>Your campus event proposal for <strong>"${event.title}"</strong> has been reviewed and <span style="color: #34d399; font-weight: bold;">APPROVED</span> by Campus Administration.</p>
            <p>It is now officially published on the Marwadi University EventEase schedule and open for student ticket registration.</p>

            <div class="event-box">
              <div class="row">
                <span style="color: #64748b;">Event Title</span>
                <strong style="color: #ffffff;">${event.title}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">Category</span>
                <strong style="color: #00f0ff;">${event.category}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">Date & Time</span>
                <strong style="color: #cbd5e1;">${event.date} • ${event.startTime} - ${event.endTime}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">Venue / Hall</span>
                <strong style="color: #cbd5e1;">${event.venue}</strong>
              </div>
              <div class="row" style="border: none;">
                <span style="color: #64748b;">Max Capacity</span>
                <strong style="color: #a855f7;">${event.capacity} Attendees</strong>
              </div>
            </div>

            ${adminFeedback ? `<p style="font-size: 13px; color: #cbd5e1; background: rgba(255,255,255,0.04); padding: 12px; border-radius: 8px; border-left: 3px solid #34d399;"><strong>Admin Note:</strong> ${adminFeedback}</p>` : ''}

            <p style="font-size: 13px; color: #94a3b8;">You now have access to the Organizer Hub to view registrations, scan attendee QR passes with the HUD laser scanner, and download attendance spreadsheets.</p>

            <div style="text-align: center; margin-top: 16px;">
              <a href="${getAppUrl()}/events/${event._id}" class="btn">View Live Event Page →</a>
            </div>

            <div class="footer">
              🎓 EventEase Campus Platform • Marwadi University Administration
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (transport) {
      const info = await transport.sendMail(mailOptions);
      console.log(`[EventApprovalEmail] Sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`[EventApprovalEmail-Simulated] Sent to ${to} for event ${event.title}`);
      return { success: true, simulated: true };
    }
  } catch (err) {
    console.error(`[EventApprovalEmail] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send Event Rejection / Decline Email to Organizer
 */
export const sendEventRejectionEmail = async ({ to, studentName, event, adminFeedback }) => {
  try {
    const transport = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"EventEase Administration" <admin@eventease.edu>',
      to,
      subject: `⚠️ Update on Your Event Proposal: "${event.title}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #050811; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; }
            .card { max-width: 580px; margin: 0 auto; background: #0c1222; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); }
            .badge { display: inline-block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; font-family: monospace; }
            h1 { color: #ffffff; font-size: 22px; margin: 0 0 10px 0; }
            p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
            .event-box { background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 14px; padding: 18px; margin: 20px 0; }
            .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Proposal Review Update</div>
            <h1>Dear ${studentName || 'Student Organizer'},</h1>
            <p>Thank you for submitting your event proposal <strong>"${event.title}"</strong> to the campus matrix.</p>
            <p>After review, the Campus Administration was unable to approve this proposal at this time.</p>

            <div class="event-box">
              <p style="margin: 0 0 8px 0; color: #ffffff;"><strong>Event:</strong> ${event.title} (${event.category})</p>
              <p style="margin: 0; color: #f87171;"><strong>Reason / Administration Feedback:</strong></p>
              <p style="margin: 6px 0 0 0; color: #e2e8f0; font-style: italic;">
                "${adminFeedback || 'Venue scheduling conflict or incomplete proposal details. Please contact the Student Affairs department for more information.'}"
              </p>
            </div>

            <p>You are welcome to revise the proposal details or speak with your department faculty mentor to re-submit.</p>

            <div class="footer">
              🎓 EventEase Campus Platform • Marwadi University Administration
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (transport) {
      const info = await transport.sendMail(mailOptions);
      console.log(`[EventRejectionEmail] Sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`[EventRejectionEmail-Simulated] Sent to ${to} for event ${event.title}`);
      return { success: true, simulated: true };
    }
  } catch (err) {
    console.error(`[EventRejectionEmail] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};



