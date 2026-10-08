import mongoose from 'mongoose';
import { memoryStore } from '../config/dataStore.js';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    studentName: {
      type: String,
      required: true,
    },
    studentRollNumber: {
      type: String,
      default: 'N/A',
    },
    studentDepartment: {
      type: String,
      default: 'General Engineering',
    },
    eventTitle: {
      type: String,
      required: true,
    },
    eventCategory: {
      type: String,
      default: 'Hackathon',
    },
    eventDate: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      default: 'Marwadi University Campus',
    },
    organizerName: {
      type: String,
      default: 'Campus Organizers',
    },
    qrCodeData: {
      type: String,
    },
    verificationUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseCertificateModel = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
const memoryCertificateModel = memoryStore.createModel('certificates');

export const Certificate = new Proxy(MongooseCertificateModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    return memoryCertificateModel[prop];
  },
});

export default Certificate;
