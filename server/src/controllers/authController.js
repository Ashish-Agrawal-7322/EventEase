import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import {
  sendRegistrationOtpEmail,
  sendForgotPasswordOtpEmail,
  sendWelcomeAccountEmail,
} from '../utils/emailService.js';
import { seedDatabase } from '../seeds/seedData.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'eventease_secret_key_hackathon_2026', {
    expiresIn: '30d',
  });
};

/**
 * Validates if the given email is an authorized Marwadi University address (@marwadiuniversity.ac.in)
 */
export const isUniversityEmail = (email) => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean.endsWith('@marwadiuniversity.ac.in');
};

/**
 * Step 1: Send 6-Digit Verification OTP to Marwadi University Email for Registration
 */
export const sendRegistrationOtp = async (req, res) => {
  try {
    const { email, name, role, facultyPasscode } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Enforce Marwadi University domain
    if (!isUniversityEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your official Marwadi University email address (@marwadiuniversity.ac.in). Personal emails like Gmail or Yahoo are not allowed.',
      });
    }

    // 1.5 If registering as Faculty, strictly validate the Faculty Institutional Access Key
    if (role === 'faculty') {
      const validFacultyCodes = [
        (process.env.FACULTY_ACCESS_CODE || 'MU-FAC-2026').trim().toUpperCase(),
        'MU-FAC-2026',
        'FACULTY2026',
        'MU-FACULTY',
        'MARWADI2026',
        'DEAN-OFFICE-2026',
      ];
      const code = (facultyPasscode || '').trim().toUpperCase();
      if (!code || !validFacultyCodes.includes(code)) {
        return res.status(400).json({
          success: false,
          message: 'Wrong Faculty Access Key! The access key provided is invalid. Please enter the official Dean / Registrar key (MU-FAC-2026).',
        });
      }
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account is already registered with this university email. Please sign in.',
      });
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Overwrite previous registration OTP for this email
    await Otp.deleteMany({ email: cleanEmail, type: 'registration' });
    await Otp.create({
      email: cleanEmail,
      otp,
      type: 'registration',
    });

    // 5. Dispatch email
    const emailResult = await sendRegistrationOtpEmail({
      to: cleanEmail,
      name: name || 'Student',
      otp,
    });

    return res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox.`,
      email: cleanEmail,
      simulated: emailResult.simulated || false,
    });
  } catch (error) {
    console.error('sendRegistrationOtp error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch university verification OTP',
    });
  }
};

/**
 * Step 2: Verify OTP and Complete Account Registration
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      otp,
      role,
      rollNumber,
      department,
      phone,
      organization,
      collegePasscode,
      facultyPasscode,
      clubName,
      employeeId,
      designation,
      cabinNumber,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Enforce Marwadi University domain check
    if (!isUniversityEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your official Marwadi University email address (@marwadiuniversity.ac.in). Personal emails like Gmail or Yahoo are not allowed.',
      });
    }

    // Verify OTP
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the 6-digit OTP sent to your university email.',
      });
    }

    const validOtpDoc = await Otp.findOne({
      email: cleanEmail,
      otp: otp.trim(),
      type: 'registration',
    });

    if (!validOtpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please request a new verification code.',
      });
    }

    // OTP is valid - consume it
    await Otp.deleteMany({ email: cleanEmail, type: 'registration' });

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Verification check for direct organizer or faculty signups
    const validCodes = ['MARWADI2026', 'CAMPUS2026', 'CLUB_LEAD', 'EVENT2026'];
    let finalRole = role || 'student';
    let organizerStatus = 'none';
    let clubDetails = {};
    let isFacultyUser = role === 'faculty';

    if (role === 'faculty') {
      // 1. Validate Employee ID
      if (!employeeId || employeeId.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid official Faculty / Employee ID (e.g. MU-FAC-1049).',
        });
      }

      // 3. Mandatory Faculty Institutional Access Key
      const providedCode = (facultyPasscode || collegePasscode || '').trim().toUpperCase();
      const validFacultyCodes = [
        (process.env.FACULTY_ACCESS_CODE || 'MU-FAC-2026').toUpperCase(),
        'MU-FAC-2026',
        'FACULTY2026',
        'MU-FACULTY',
        'MARWADI2026',
        'DEAN-OFFICE-2026',
      ];

      if (!providedCode || !validFacultyCodes.includes(providedCode)) {
        return res.status(400).json({
          success: false,
          message: 'Wrong Faculty Access Key! The access key provided is invalid. Please enter the official Dean / Registrar key (MU-FAC-2026).',
        });
      }

      finalRole = 'organizer';
      organizerStatus = 'approved';
      isFacultyUser = true;
      clubDetails = {
        clubName: `Department of ${department || 'Engineering'}`,
        clubCategory: 'Academic',
        clubRole: designation || 'Faculty Coordinator',
        requestedAt: new Date(),
        reviewedAt: new Date(),
        reviewNotes: 'Verified University Faculty / Staff Member with Institutional Access Key',
      };
    } else if (role === 'organizer') {
      const isPasscodeValid = collegePasscode && validCodes.includes(collegePasscode.trim().toUpperCase());
      if (isPasscodeValid) {
        finalRole = 'organizer';
        organizerStatus = 'approved';
        clubDetails = {
          clubName: clubName || organization || 'Campus Club',
          clubCategory: 'Technical',
          clubRole: 'Club Lead',
          requestedAt: new Date(),
          reviewedAt: new Date(),
          reviewNotes: 'Instant Verified via Authorized College Passcode',
        };
      } else {
        // Enrolled as student with pending club application
        finalRole = 'student';
        organizerStatus = 'pending';
        clubDetails = {
          clubName: clubName || organization || 'Campus Club',
          clubCategory: 'Technical',
          clubRole: 'Club Lead',
          requestedAt: new Date(),
          reviewNotes: 'Pending review by Campus Administration',
        };
      }
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole,
      organizerStatus,
      clubDetails,
      isFaculty: isFacultyUser,
      designation: designation || '',
      employeeId: employeeId || '',
      cabinNumber: cabinNumber || '',
      rollNumber: isFacultyUser ? (employeeId || 'FACULTY') : (rollNumber || ''),
      department: department || 'General Engineering',
      phone: phone || '',
      organization: isFacultyUser
        ? `Department of ${department || 'Engineering'}`
        : (clubName || organization || 'Campus Community'),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    });

    const token = generateToken(user._id);

    // Send Welcome / Account Activation Email to user's real inbox
    sendWelcomeAccountEmail({
      to: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      rollNumber: user.rollNumber,
    }).catch((err) => console.error('[WelcomeEmail Error]:', err.message));

    let welcomeMessage = 'Student account created successfully!';
    if (isFacultyUser) {
      welcomeMessage = `Welcome, ${designation || 'Professor'} ${name}! Your official faculty event hosting account is activated.`;
    } else if (finalRole === 'organizer') {
      welcomeMessage = 'Organizer account verified and activated!';
    } else if (organizerStatus === 'pending') {
      welcomeMessage = 'Student account created. Your Club Lead verification is pending Admin review.';
    }

    return res.status(201).json({
      success: true,
      message: welcomeMessage,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFaculty: user.isFaculty,
        designation: user.designation,
        employeeId: user.employeeId,
        organizerStatus: user.organizerStatus,
        clubDetails: user.clubDetails,
        rollNumber: user.rollNumber,
        department: user.department,
        avatar: user.avatar,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

/**
 * Step 1 (Forgot Password): Send 6-Digit Password Reset OTP to Email
 */
export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered university email' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Overwrite previous forgot_password OTP
    await Otp.deleteMany({ email: cleanEmail, type: 'forgot_password' });
    await Otp.create({
      email: cleanEmail,
      otp,
      type: 'forgot_password',
    });

    // Send Reset OTP email
    await sendForgotPasswordOtpEmail({
      to: cleanEmail,
      name: user.name,
      otp,
    });

    return res.json({
      success: true,
      message: `Password reset OTP has been sent to ${cleanEmail}. Please check your inbox.`,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('sendForgotPasswordOtp error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to dispatch password reset OTP' });
  }
};

/**
 * Step 2 (Forgot Password): Verify OTP and Set New Password
 */
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP code, and your new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP
    const validOtpDoc = await Otp.findOne({
      email: cleanEmail,
      otp: otp.trim(),
      type: 'forgot_password',
    });

    if (!validOtpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please request a new password reset code.',
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Encrypt and update new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Delete used OTP
    await Otp.deleteMany({ email: cleanEmail, type: 'forgot_password' });

    return res.json({
      success: true,
      message: 'Password successfully reset! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('resetPasswordWithOtp error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFaculty: user.isFaculty || false,
        designation: user.designation || '',
        employeeId: user.employeeId || '',
        organizerStatus: user.organizerStatus || 'none',
        clubDetails: user.clubDetails || {},
        rollNumber: user.rollNumber,
        department: user.department,
        avatar: user.avatar,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFaculty: user.isFaculty || false,
        designation: user.designation || '',
        employeeId: user.employeeId || '',
        organizerStatus: user.organizerStatus || 'none',
        clubDetails: user.clubDetails || {},
        rollNumber: user.rollNumber,
        department: user.department,
        avatar: user.avatar,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

/**
 * Student requests promotion to Club Organizer
 */
export const applyForOrganizer = async (req, res) => {
  try {
    const { clubName, clubCategory, clubRole, facultyAdvisor, reason, collegePasscode } = req.body;

    if (!clubName) {
      return res.status(400).json({ success: false, message: 'Please provide your club or organization name' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Secret College Passcode shortcut for instant activation:
    // (e.g., MARWADI2026, CAMPUS2026, CLUB_LEAD)
    const validCodes = ['MARWADI2026', 'CAMPUS2026', 'CLUB_LEAD', 'EVENT2026'];
    const isInstant = collegePasscode && validCodes.includes(collegePasscode.trim().toUpperCase());

    if (isInstant) {
      user.role = 'organizer';
      user.organizerStatus = 'approved';
      user.organization = clubName;
      user.clubDetails = {
        clubName,
        clubCategory: clubCategory || 'Technical',
        clubRole: clubRole || 'Club Lead',
        facultyAdvisor: facultyAdvisor || 'Academic Coordinator',
        reason: reason || 'Instant verified with Authorized College Passcode',
        requestedAt: new Date(),
        reviewedAt: new Date(),
        reviewNotes: 'Instant Verified via Authorized College Passcode',
      };
      await user.save();

      return res.json({
        success: true,
        instantApproved: true,
        message: `🎉 Passcode verified! You are now an authorized Club Organizer for ${clubName}.`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizerStatus: user.organizerStatus,
          clubDetails: user.clubDetails,
          organization: user.organization,
        },
      });
    }

    // Standard Admin Review Workflow
    user.organizerStatus = 'pending';
    user.clubDetails = {
      clubName,
      clubCategory: clubCategory || 'Technical',
      clubRole: clubRole || 'Club Lead',
      facultyAdvisor: facultyAdvisor || '',
      reason: reason || '',
      requestedAt: new Date(),
      reviewNotes: 'Pending review by Campus Administration',
    };
    await user.save();

    return res.json({
      success: true,
      instantApproved: false,
      message: `Your application to lead "${clubName}" has been submitted to Campus Administration for verification.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizerStatus: user.organizerStatus,
        clubDetails: user.clubDetails,
      },
    });
  } catch (error) {
    console.error('applyForOrganizer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit organizer application' });
  }
};

export const getDemoAccounts = (req, res) => {
  return res.json({
    success: true,
    accounts: [
      {
        role: 'student',
        label: 'Student',
        name: 'Alex Rivera',
        email: 'alex.student@campus.edu',
        password: 'password123',
        desc: 'Browse events, book tickets, holographic QR pass'
      },
      {
        role: 'organizer',
        label: 'Organizer',
        name: 'Sarah Chen',
        email: 'sarah.organizer@campus.edu',
        password: 'password123',
        desc: 'Create events, QR laser scanner, live analytics'
      },
      {
        role: 'admin',
        label: 'Campus Admin',
        name: 'Dr. Rajesh Patel',
        email: 'admin@marwadiuniversity.ac.in',
        password: 'password123',
        desc: 'Dean of Student Affairs • College-wide oversight, user roles, system metrics'
      }
    ]
  });
};

export const resetSeed = async (req, res) => {
  try {
    const { User: UserModel } = await import('../models/User.js');
    await UserModel.deleteMany({});
    await seedDatabase();
    return res.json({ success: true, message: 'Demo data re-seeded successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
