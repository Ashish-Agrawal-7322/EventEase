import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { memoryStore } from '../config/dataStore.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['student', 'organizer', 'admin'],
      default: 'student',
    },
    rollNumber: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: 'Computer Science',
    },
    phone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    organization: {
      type: String,
      default: 'Campus Club Network',
    },
    organizerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    clubDetails: {
      clubName: { type: String, default: '' },
      clubCategory: { type: String, default: 'Technical' },
      clubRole: { type: String, default: 'Lead' },
      facultyAdvisor: { type: String, default: '' },
      reason: { type: String, default: '' },
      requestedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewNotes: { type: String, default: '' },
    },
    isFaculty: {
      type: Boolean,
      default: false,
    },
    designation: {
      type: String,
      default: '',
    },
    employeeId: {
      type: String,
      default: '',
    },
    cabinNumber: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


const MongooseUserModel = mongoose.models.User || mongoose.model('User', userSchema);
const memoryUserModel = memoryStore.createModel('users');

// Unified model proxy
export const User = new Proxy(MongooseUserModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    return memoryUserModel[prop];
  }
});

export default User;
