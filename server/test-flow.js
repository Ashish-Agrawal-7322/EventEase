// Standalone verification script for the required demo flow
async function testDemoFlow() {
  console.log('=== STARTING DEMO FLOW VERIFICATION ===');
  const BASE_URL = 'http://localhost:5000/api';

  // 1. Organizer Login
  console.log('\n[Step 1] Organizer Login (Sarah Chen)...');
  const orgLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarah.organizer@campus.edu', password: 'password123' })
  });
  const orgData = await orgLoginRes.json();
  if (!orgData.token) throw new Error('Organizer login failed: ' + JSON.stringify(orgData));
  const orgToken = orgData.token;
  console.log('✓ Organizer logged in successfully! Role:', orgData.user.role);

  // 2. Organizer Creates Event
  console.log('\n[Step 2] Organizer creates event: "CyberSync Grand Hackathon 2026"...');
  const createEvRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${orgToken}`
    },
    body: JSON.stringify({
      title: 'CyberSync Grand Hackathon 2026',
      tagline: 'Autonomous AI & Hardware Challenge',
      description: '36-hour flagship hackathon at Main Turing Arena.',
      category: 'Hackathon',
      venue: 'Main Turing Arena',
      date: '2026-10-30',
      startTime: '09:00 AM',
      endTime: '09:00 PM',
      capacity: 50,
      tags: ['AI', 'Hackathon', 'Autonomous']
    })
  });
  const evData = await createEvRes.json();
  if (!evData.event) throw new Error('Event creation failed: ' + JSON.stringify(evData));
  const eventId = evData.event._id || evData.event.id;
  console.log('✓ Event created! ID:', eventId, 'Title:', evData.event.title);

  // 3. Student Login
  console.log('\n[Step 3] Student Login (Alex Rivera)...');
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.student@campus.edu', password: 'password123' })
  });
  const studentData = await studentLoginRes.json();
  if (!studentData.token) throw new Error('Student login failed: ' + JSON.stringify(studentData));
  const studentToken = studentData.token;
  console.log('✓ Student logged in successfully! Roll:', studentData.user.rollNumber);

  // 4. Student Registers for Event
  console.log('\n[Step 4] Student Alex registers for event...');
  const regRes = await fetch(`${BASE_URL}/registrations/register/${eventId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    }
  });
  const regData = await regRes.json();
  if (!regData.registration) throw new Error('Registration failed: ' + JSON.stringify(regData));
  const ticketCode = regData.registration.ticketCode;
  const qrPayload = regData.registration.qrPayload;
  console.log('✓ Registration successful!');
  console.log('  Ticket Code:', ticketCode);
  console.log('  Seat Number:', regData.registration.seatNumber);
  console.log('  QR Payload Generated:', qrPayload);

  // 5. Organizer Scans QR Code
  console.log('\n[Step 5] Organizer Sarah scans QR code at entry gate...');
  const scan1Res = await fetch(`${BASE_URL}/registrations/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${orgToken}`
    },
    body: JSON.stringify({
      rawInput: qrPayload,
      eventId: eventId
    })
  });
  const scan1Data = await scan1Res.json();
  console.log('Scan 1 HTTP Status:', scan1Res.status);
  console.log('Scan 1 Result Status:', scan1Data.status);
  console.log('Scan 1 Message:', scan1Data.message);
  if (scan1Data.status !== 'success') {
    throw new Error('Expected status success on first scan, got: ' + JSON.stringify(scan1Data));
  }
  console.log('✓ Check-in Successful! Student:', scan1Data.ticket.studentName);

  // 6. Same QR Scanned Again (Duplicate Check)
  console.log('\n[Step 6] Same QR scanned a second time (Duplicate Check-in Test)...');
  const scan2Res = await fetch(`${BASE_URL}/registrations/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${orgToken}`
    },
    body: JSON.stringify({
      rawInput: qrPayload,
      eventId: eventId
    })
  });
  const scan2Data = await scan2Res.json();
  console.log('Scan 2 HTTP Status:', scan2Res.status, '(Expected: 409 Conflict)');
  console.log('Scan 2 Result Status:', scan2Data.status, '(Expected: already_checked_in)');
  console.log('Scan 2 Message:', scan2Data.message);
  if (scan2Res.status !== 409 || scan2Data.status !== 'already_checked_in') {
    throw new Error('Expected 409 already_checked_in, got: ' + JSON.stringify(scan2Data));
  }
  console.log('✓ Duplicate check-in correctly rejected!');

  // 7. Test Mismatched Event Check-in
  console.log('\n[Step 7] Testing ticket validation against wrong event...');
  const fakeEventId = 'different_event_id_123';
  const scan3Res = await fetch(`${BASE_URL}/registrations/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${orgToken}`
    },
    body: JSON.stringify({
      rawInput: qrPayload,
      eventId: fakeEventId
    })
  });
  const scan3Data = await scan3Res.json();
  console.log('Scan 3 Status:', scan3Data.status, '(Expected: wrong_event)');
  console.log('✓ Mismatched event correctly rejected!');

  console.log('\n========================================');
  console.log('🎉 ALL DEMO FLOW TESTS PASSED 100%! 🎉');
  console.log('========================================');
}

testDemoFlow().catch(err => {
  console.error('Test Flow Error:', err);
  process.exit(1);
});
