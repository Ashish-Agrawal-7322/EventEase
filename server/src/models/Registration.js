import mongoose from 'mongoose';
import { memoryStore } from '../config/dataStore.js';

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    qrPayload: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    },
    studentRollNumber: {
      type: String,
      default: '',
    },
    studentDepartment: {
      type: String,
      default: 'Computer Science',
    },
    status: {
      type: String,
      enum: ['registered', 'checked_in', 'cancelled'],
      default: 'registered',
    },
    seatNumber: {
      type: String,
      default: 'OPEN-01',
    },
    isTeamRegistration: {
      type: Boolean,
      default: false,
    },
    teamName: {
      type: String,
      default: '',
    },
    teamMembers: [
      {
        name: { type: String, required: true },
        rollNumber: { type: String, default: '' },
        email: { type: String, default: '' },
      },
    ],
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseRegistrationModel = mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
const memoryRegistrationModel = memoryStore.createModel('registrations');

export const Registration = new Proxy(MongooseRegistrationModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    return memoryRegistrationModel[prop];
  }
});

export default Registration;
