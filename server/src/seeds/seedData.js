import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';

export const seedDatabase = async () => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`[Seed] Database already has ${existingUsers} users. Skipping auto-seed.`);
      return;
    }

    console.log('[Seed] Seeding database with clean demo accounts (No dummy events)...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Core Platform Accounts
    await User.create({
      name: 'Dr. Aris Thorne',
      email: 'admin@campus.edu',
      password: passwordHash,
      role: 'admin',
      department: 'Dean of Student Affairs',
      organization: 'College Academic & Event Council',
      phone: '+1 (555) 019-2831',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    });

    await User.create({
      name: 'Sarah Chen',
      email: 'sarah.organizer@campus.edu',
      password: passwordHash,
      role: 'organizer',
      department: 'Computer Science & AI',
      organization: 'ACM & IEEE Student Chapter',
      phone: '+1 (555) 302-8819',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    });

    await User.create({
      name: 'Alex Rivera',
      email: 'alex.student@campus.edu',
      password: passwordHash,
      role: 'student',
      rollNumber: 'CS2026-089',
      department: 'Computer Science',
      phone: '+1 (555) 782-9901',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    });

    console.log('[Seed] Database successfully initialized with demo user accounts. Only real user-created events will be displayed.');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
};
