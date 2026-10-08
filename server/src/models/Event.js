import mongoose from 'mongoose';
import { memoryStore } from '../config/dataStore.js';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an event title'],
      trim: true,
      maxlength: 120,
    },
    tagline: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    category: {
      type: String,
      required: [true, 'Please specify category'],
      enum: ['Hackathon', 'Workshop', 'Tech Fest', 'Seminar', 'Cultural', 'Sports', 'Gaming', 'Networking'],
      default: 'Workshop',
    },
    venue: {
      type: String,
      required: [true, 'Please add event venue'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Please add event date'],
    },
    startTime: {
      type: String,
      required: [true, 'Please add start time'],
    },
    endTime: {
      type: String,
      required: [true, 'Please add end time'],
    },
    registrationDeadline: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify event capacity'],
      min: [1, 'Capacity must be at least 1'],
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    checkedInCount: {
      type: Number,
      default: 0,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizerName: {
      type: String,
      default: 'Campus Organizers',
    },
    bannerImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    submittedByRole: {
      type: String,
      default: 'student',
    },
    adminFeedback: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: ['College', 'Tech'],
    },
    isFacultySponsored: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseEventModel = mongoose.models.Event || mongoose.model('Event', eventSchema);
const memoryEventModel = memoryStore.createModel('events');

export const Event = new Proxy(MongooseEventModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    return memoryEventModel[prop];
  }
});

export default Event;
