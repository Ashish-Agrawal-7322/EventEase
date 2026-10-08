import mongoose from 'mongoose';
import { memoryStore } from '../config/dataStore.js';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['registration', 'forgot_password'],
      default: 'registration',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes TTL
    },
  },
  {
    timestamps: true,
  }
);

const MongooseOtpModel = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
const memoryOtpModel = memoryStore.createModel('otps');

export const Otp = new Proxy(MongooseOtpModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    return memoryOtpModel[prop];
  },
});

export default Otp;
