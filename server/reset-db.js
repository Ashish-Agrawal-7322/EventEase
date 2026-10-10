import dns from 'dns';
dns.setDefaultResultOrder('verbatim');

import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './src/config/db.js';
import { User } from './src/models/User.js';
import { Event } from './src/models/Event.js';
import { Registration } from './src/models/Registration.js';
import { Otp } from './src/models/Otp.js';
import { ensureAdminUser } from './src/seeds/seedData.js';

async function resetAll() {
  await connectDB();

  // 1. Delete all events
  const delEvents = await Event.deleteMany({});
  console.log('🗑️ Deleted Events:', delEvents.deletedCount);

  // 2. Delete all registrations / tickets
  const delRegs = await Registration.deleteMany({});
  console.log('🗑️ Deleted Registrations:', delRegs.deletedCount);

  // 3. Delete all OTPs
  const delOtps = await Otp.deleteMany({});
  console.log('🗑️ Deleted OTPs:', delOtps.deletedCount);

  // 4. Delete all users except Dean/Admin
  const delUsers = await User.deleteMany({ email: { $ne: 'admin@marwadiuniversity.ac.in' } });
  console.log('🗑️ Deleted Users (non-admin):', delUsers.deletedCount);

  // 5. Ensure Dean/Admin account is active with password123
  await ensureAdminUser();

  const users = await User.find({});
  console.log('👥 Remaining Users in DB:', users.map(u => ({ email: u.email, role: u.role, name: u.name })));
  console.log('✨ Database is now 100% clean and ready for fresh testing!');
  process.exit(0);
}

resetAll().catch(err => {
  console.error('Reset error:', err);
  process.exit(1);
});
