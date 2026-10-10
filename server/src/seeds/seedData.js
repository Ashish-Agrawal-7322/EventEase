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

    // 1. Create Core Platform Admin Account if empty
    await User.create({
      name: 'Dr. Rajesh Patel',
      email: 'admin@marwadiuniversity.ac.in',
      password: passwordHash,
      role: 'admin',
      department: 'Dean of Student Affairs',
      organization: 'Marwadi University Event & Academic Council',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    });

    console.log('[Seed] Database successfully initialized with demo user accounts. Only real user-created events will be displayed.');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
};

export const ensureAdminUser = async () => {
  try {
    const adminEmail = 'admin@marwadiuniversity.ac.in';
    let admin = await User.findOne({ email: adminEmail });
    const passwordHash = await bcrypt.hash('password123', 10);

    if (!admin) {
      admin = await User.create({
        name: 'Dr. Rajesh Patel',
        email: adminEmail,
        password: passwordHash,
        role: 'admin',
        department: 'Dean of Student Affairs',
        organization: 'Marwadi University Event & Academic Council',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      });
      console.log('🏛️ [Admin] Dean / Admin account created: admin@marwadiuniversity.ac.in (Dr. Rajesh Patel)');
    } else {
      admin.name = 'Dr. Rajesh Patel';
      admin.role = 'admin';
      admin.password = passwordHash;
      await admin.save();
      console.log('🏛️ [Admin] Dean / Admin account verified and password reset to password123');
    }
    return admin;
  } catch (err) {
    console.error('[Admin] Error ensuring admin account:', err.message);
    return null;
  }
};
