import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';

const pptx = new pptxgen();

// Set Exact 16:9 Widescreen dimensions (13.333 inches x 7.5 inches)
pptx.defineLayout({ name: 'WIDESCREEN_16_9', width: 13.333, height: 7.5 });
pptx.layout = 'WIDESCREEN_16_9';

// Locate Header Banner Image
const bannerPath = path.resolve('assets/header_banner.png');
const hasBanner = fs.existsSync(bannerPath);

// Exact Theme Palette from Template
const COLORS = {
  bgDark: '0D0F17',
  cardDark: '161922',
  cardDarkBorder: '2A2F3D',
  bgLight: 'FAF7F2',
  cardLight: 'FFFFFF',
  cardLightBorder: 'E2DCD2',
  redAccent: 'E11D48',
  redDark: '9F1239',
  cyanAccent: '06B6D4',
  textDark: '0F172A',
  textMuted: '475569',
  textLight: 'FFFFFF',
  textLightMuted: '94A3B8',
};

// Helper: Embed Header & Footer
function addHeaderAndFooter(slide, sectionNum, sectionTag, titleText, isDark = false) {
  // 1. Official Header Banner Image
  if (hasBanner) {
    slide.addImage({
      path: bannerPath,
      x: 0.7,
      y: 0.25,
      w: 11.933,
      h: 0.85,
    });
  }

  // 2. Red Horizontal Accent Line under Banner
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 1.2,
    w: 11.933,
    h: 0.02,
    fill: { color: COLORS.redAccent },
    line: { color: COLORS.redAccent },
  });

  // 3. Section Tag (e.g. 01 · THE TARGET)
  if (sectionNum && sectionTag) {
    slide.addText(`${sectionNum}  ·  ${sectionTag.toUpperCase()}`, {
      x: 0.7,
      y: 1.28,
      w: 11.933,
      h: 0.25,
      fontSize: 10,
      bold: true,
      fontFace: 'Arial',
      color: COLORS.redAccent,
      charSpacing: 2,
    });
  }

  // 4. Main Slide Title
  slide.addText(titleText.toUpperCase(), {
    x: 0.7,
    y: 1.55,
    w: 11.933,
    h: 0.45,
    fontSize: 20,
    bold: true,
    fontFace: 'Arial Black',
    color: isDark ? 'FFFFFF' : '0F172A',
  });

  // 5. Footer Line & Labels
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 6.85,
    w: 11.933,
    h: 0.01,
    fill: { color: isDark ? '2A2F3D' : 'E2DCD2' },
    line: { color: isDark ? '2A2F3D' : 'E2DCD2' },
  });

  slide.addText('Code Carnival 3.0  ·  ADSC, Atmiya University', {
    x: 0.7,
    y: 6.95,
    w: 6.0,
    h: 0.3,
    fontSize: 9,
    fontFace: 'Arial',
    color: isDark ? '64748B' : '94A3B8',
  });

  slide.addText('[TEAM EVENTEASE]', {
    x: 7.633,
    y: 6.95,
    w: 5.0,
    h: 0.3,
    fontSize: 9,
    bold: true,
    fontFace: 'Arial',
    align: 'right',
    color: COLORS.redAccent,
  });
}

// ==========================================
// SLIDE 1: COVER SLIDE (Full 13.333 x 7.5 Dark Canvas)
// ==========================================
{
  const s1 = pptx.addSlide();
  s1.background = { color: COLORS.bgDark };

  // Top Banner
  if (hasBanner) {
    s1.addImage({
      path: bannerPath,
      x: 0.7,
      y: 0.25,
      w: 11.933,
      h: 0.85,
    });
  }

  // Red separator
  s1.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 1.2,
    w: 11.933,
    h: 0.02,
    fill: { color: COLORS.redAccent },
    line: { color: COLORS.redAccent },
  });

  // Pre-title
  s1.addText('ATMIYA DEVELOPER STUDENTS CLUB PRESENTS', {
    x: 0.7,
    y: 1.35,
    w: 11.933,
    h: 0.3,
    fontSize: 11,
    bold: true,
    fontFace: 'Arial',
    color: COLORS.redAccent,
    charSpacing: 3,
  });

  // Title
  s1.addText('CODE CARNIVAL 3.0', {
    x: 0.7,
    y: 1.7,
    w: 11.933,
    h: 0.85,
    fontSize: 42,
    bold: true,
    fontFace: 'Arial Black',
    color: 'FFFFFF',
  });

  // Subtitle
  s1.addText('Idea Submission Template · The Heist Plan', {
    x: 0.7,
    y: 2.6,
    w: 11.933,
    h: 0.3,
    fontSize: 13,
    fontFace: 'Arial',
    color: '94A3B8',
  });

  // Row 1 Cards (3 Columns):
  // Usable width: 11.933 -> each card ~3.84, gap 0.2
  const colW3 = 3.84;
  const colGap3 = 0.2;
  const cardY1 = 3.1;
  const cardH1 = 1.6;

  // 1. Team Name
  s1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: cardY1, w: colW3, h: cardH1,
    fill: { color: COLORS.cardDark }, line: { color: COLORS.cardDarkBorder, width: 1 },
  });
  s1.addText('TEAM NAME', { x: 0.9, y: cardY1 + 0.15, w: colW3 - 0.4, h: 0.25, fontSize: 10, bold: true, color: COLORS.redAccent, charSpacing: 2 });
  s1.addText('EventEase\n(Team SyncForge)', { x: 0.9, y: cardY1 + 0.45, w: colW3 - 0.4, h: 0.9, fontSize: 14, bold: true, color: 'FFFFFF' });

  // 2. Team ID
  const cardX2 = 0.7 + colW3 + colGap3;
  s1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cardX2, y: cardY1, w: colW3, h: cardH1,
    fill: { color: COLORS.cardDark }, line: { color: COLORS.cardDarkBorder, width: 1 },
  });
  s1.addText('TEAM ID', { x: cardX2 + 0.2, y: cardY1 + 0.15, w: colW3 - 0.4, h: 0.25, fontSize: 10, bold: true, color: COLORS.redAccent, charSpacing: 2 });
  s1.addText('CC3-ADSC-2026', { x: cardX2 + 0.2, y: cardY1 + 0.45, w: colW3 - 0.4, h: 0.9, fontSize: 14, bold: true, color: 'FFFFFF' });

  // 3. Team Leader
  const cardX3 = cardX2 + colW3 + colGap3;
  s1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cardX3, y: cardY1, w: colW3, h: cardH1,
    fill: { color: COLORS.cardDark }, line: { color: COLORS.cardDarkBorder, width: 1 },
  });
  s1.addText('TEAM LEADER / FOUNDER', { x: cardX3 + 0.2, y: cardY1 + 0.15, w: colW3 - 0.4, h: 0.25, fontSize: 10, bold: true, color: COLORS.redAccent, charSpacing: 2 });
  s1.addText('Ashish Agrawal', { x: cardX3 + 0.2, y: cardY1 + 0.45, w: colW3 - 0.4, h: 0.9, fontSize: 14, bold: true, color: 'FFFFFF' });

  // Row 2 Cards (2 Columns: 65% width / 35% width)
  const cardY2 = 4.9;
  const cardH2 = 1.75;
  const colW2A = 7.89;
  const colW2B = 3.84;

  // 4. Problem Statement Title
  s1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: cardY2, w: colW2A, h: cardH2,
    fill: { color: COLORS.cardDark }, line: { color: COLORS.cardDarkBorder, width: 1 },
  });
  s1.addText('PROJECT / PROBLEM STATEMENT TITLE', { x: 0.9, y: cardY2 + 0.15, w: colW2A - 0.4, h: 0.25, fontSize: 10, bold: true, color: COLORS.redAccent, charSpacing: 2 });
  s1.addText('EventEase: Autonomous Campus Event Operations, Holographic QR Gate Passports & AI NAAC Audit Engine', {
    x: 0.9, y: cardY2 + 0.45, w: colW2A - 0.4, h: 1.1, fontSize: 13, bold: true, color: 'FFFFFF', lineSpacing: 18,
  });

  // 5. Track
  s1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cardX3, y: cardY2, w: colW2B, h: cardH2,
    fill: { color: COLORS.cardDark }, line: { color: COLORS.cardDarkBorder, width: 1 },
  });
  s1.addText('THEME / TRACK', { x: cardX3 + 0.2, y: cardY2 + 0.15, w: colW2B - 0.4, h: 0.25, fontSize: 10, bold: true, color: COLORS.redAccent, charSpacing: 2 });
  s1.addText('Smart Campus &\nAI / Web3 Automation', { x: cardX3 + 0.2, y: cardY2 + 0.45, w: colW2B - 0.4, h: 1.1, fontSize: 13, bold: true, color: 'FFFFFF' });

  // Footer
  s1.addShape(pptx.shapes.RECTANGLE, { x: 0.7, y: 6.85, w: 11.933, h: 0.01, fill: { color: '2A2F3D' } });
  s1.addText('Code Carnival 3.0  ·  ADSC, Atmiya University', { x: 0.7, y: 6.95, w: 6.0, h: 0.3, fontSize: 9, color: '64748B' });
  s1.addText('[TEAM EVENTEASE]', { x: 7.633, y: 6.95, w: 5.0, h: 0.3, fontSize: 9, bold: true, align: 'right', color: COLORS.redAccent });
}

// ==========================================
// SLIDE 2: PROBLEM STATEMENT & UNDERSTANDING
// ==========================================
{
  const s2 = pptx.addSlide();
  s2.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s2, '01', 'THE TARGET', 'PROBLEM STATEMENT & UNDERSTANDING');

  const colW = 5.86;
  const colH = 4.6;
  const colY = 2.05;

  // Left Box: Problem Statement
  s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: colY, w: colW, h: colH,
    fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
  });
  s2.addText('PROBLEM STATEMENT', {
    x: 0.95, y: colY + 0.2, w: colW - 0.5, h: 0.35,
    fontSize: 14, bold: true, fontFace: 'Arial Black', color: COLORS.redAccent,
  });
  s2.addText([
    { text: '• Chaotic Campus Operations: ', options: { bold: true, color: '0F172A' } },
    { text: 'Colleges manage 40+ annual events through messy Google Forms, WhatsApp groups, and paper rosters.\n\n', options: { color: '334155' } },
    { text: '• Rampant Gate Fraud & Proxy Entry: ', options: { bold: true, color: '0F172A' } },
    { text: 'Unregistered crowds flood auditorium gates; students share screenshots of passes to fake attendance.\n\n', options: { color: '334155' } },
    { text: '• Unverified Certificates & Accreditation Delay: ', options: { bold: true, color: '0F172A' } },
    { text: 'Non-attendees claim participation certificates, while administration spends 2+ weeks compiling physical attendance slips for annual NAAC & NBA audits.', options: { color: '334155' } },
  ], {
    x: 0.95, y: colY + 0.65, w: colW - 0.5, h: 3.7, fontSize: 11.5, fontFace: 'Arial', lineSpacing: 18,
  });

  // Right Box: Our Understanding
  const colX2 = 0.7 + colW + 0.21;
  s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: colX2, y: colY, w: colW, h: colH,
    fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
  });
  s2.addText('OUR UNDERSTANDING', {
    x: colX2 + 0.25, y: colY + 0.2, w: colW - 0.5, h: 0.35,
    fontSize: 14, bold: true, fontFace: 'Arial Black', color: COLORS.redAccent,
  });
  s2.addText([
    { text: '• Root Cause: ', options: { bold: true, color: '0F172A' } },
    { text: 'Complete absence of an integrated, institutional single sign-on platform tying event registration to physical gate entry.\n\n', options: { color: '334155' } },
    { text: '• Gaps in Existing Tools: ', options: { bold: true, color: '0F172A' } },
    { text: 'Commercial tools like Eventbrite/Luma lack .edu collegiate authentication, squad registration, and NAAC Criterion 5 reporting.\n\n', options: { color: '334155' } },
    { text: '• Why Solve It Now: ', options: { bold: true, color: '0F172A' } },
    { text: 'With 10,000+ students and strict UGC/NAAC compliance requirements, universities urgently need an automated, tamper-proof system.', options: { color: '334155' } },
  ], {
    x: colX2 + 0.25, y: colY + 0.65, w: colW - 0.5, h: 3.7, fontSize: 11.5, fontFace: 'Arial', lineSpacing: 18,
  });
}

// ==========================================
// SLIDE 3: STAKEHOLDER PAIN POINTS & AUDIENCE
// ==========================================
{
  const s3 = pptx.addSlide();
  s3.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s3, '01', 'THE TARGET', 'STAKEHOLDER PAIN POINTS & AUDIENCE');

  const colW3 = 3.84;
  const colGap3 = 0.2;
  const colH3 = 4.6;
  const colY3 = 2.05;

  const cards = [
    {
      num: '01', title: 'STUDENT COMMUNITY',
      pain: '20-minute entry queues, lost passes, individual registration limits for hackathon squads, lack of verifiable credentials.',
      value: 'Instant holographic QR pass in "My Tickets", solo or squad entry (2-4 members), and cryptographic digital certificate vault.',
    },
    {
      num: '02', title: 'CLUB LEADS & ORGANIZERS',
      pain: 'Messy spreadsheets, days wasted writing agendas, manual gate checking, zero real-time attendance analytics.',
      value: '1-click Google Gemini AI Event Copilot, 200ms laser HUD camera scanner, and 1-click broadcast reminder emails.',
    },
    {
      num: '03', title: 'FACULTY & IQAC ADMIN',
      pain: 'Forged participation certificates, inaccurate turnout data, hundreds of manual hours assembling NAAC Criterion 5 audit files.',
      value: 'Issuance locked strictly to physical gate scans, automated NAAC Criterion 5.3 PDF report, institutional review dashboard.',
    },
  ];

  cards.forEach((c, idx) => {
    const cardX = 0.7 + idx * (colW3 + colGap3);
    s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cardX, y: colY3, w: colW3, h: colH3,
      fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
    });
    s3.addText(c.num, {
      x: cardX + 0.25, y: colY3 + 0.2, w: 1.0, h: 0.35,
      fontSize: 22, bold: true, color: COLORS.redAccent, fontFace: 'Arial Black',
    });
    s3.addText(c.title, {
      x: cardX + 0.25, y: colY3 + 0.65, w: colW3 - 0.5, h: 0.45,
      fontSize: 13, bold: true, color: '0F172A', fontFace: 'Arial Black',
    });
    s3.addText([
      { text: 'Critical Pain Point:\n', options: { bold: true, color: 'DC2626', fontSize: 10.5 } },
      { text: `${c.pain}\n\n`, options: { color: '475569', fontSize: 11 } },
      { text: 'EventEase Impact:\n', options: { bold: true, color: '059669', fontSize: 10.5 } },
      { text: c.value, options: { color: '334155', fontSize: 11 } },
    ], {
      x: cardX + 0.25, y: colY3 + 1.2, w: colW3 - 0.5, h: 3.1, fontFace: 'Arial', lineSpacing: 16,
    });
  });
}

// ==========================================
// SLIDE 4: PROPOSED SOLUTION
// ==========================================
{
  const s4 = pptx.addSlide();
  s4.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s4, '02', 'THE PLAN', 'PROPOSED SOLUTION — EVENTEASE PROTOCOL');

  const colW = 5.86;
  const colH = 4.6;
  const colY = 2.05;

  // Left Box: Our Solution
  s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: colY, w: colW, h: colH,
    fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
  });
  s4.addText('OUR CORE SOLUTION', {
    x: 0.95, y: colY + 0.2, w: colW - 0.5, h: 0.35,
    fontSize: 14, bold: true, fontFace: 'Arial Black', color: COLORS.redAccent,
  });
  s4.addText([
    { text: '• Autonomous Collegiate Platform: ', options: { bold: true, color: '0F172A' } },
    { text: 'An end-to-end college event ecosystem uniting registration, gate control, and accreditation.\n\n', options: { color: '334155' } },
    { text: '• Cryptographic Holographic Passes: ', options: { bold: true, color: '0F172A' } },
    { text: 'HMAC-SHA256 signed QR tickets generated instantly upon student registration, stored offline in Digital Vault.\n\n', options: { color: '334155' } },
    { text: '• Google Gemini AI Copilot & EventBot: ', options: { bold: true, color: '0F172A' } },
    { text: 'Gemini 2.5 Flash drafts full event blueprints in 1 click; 24/7 EventBot answers student queries dynamically.\n\n', options: { color: '334155' } },
    { text: '• Fraud-Proof Attendance Lock: ', options: { bold: true, color: '0F172A' } },
    { text: 'Certificates of Participation are issued strictly to students verified by gate camera scanning.', options: { color: '334155' } },
  ], {
    x: 0.95, y: colY + 0.65, w: colW - 0.5, h: 3.7, fontSize: 11.5, fontFace: 'Arial', lineSpacing: 18,
  });

  // Right Box: Pillars
  const colX2 = 0.7 + colW + 0.21;
  s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: colX2, y: colY, w: colW, h: colH,
    fill: { color: '131622' }, line: { color: '2A2F3D', width: 1 },
  });
  s4.addText('SYSTEM HIGHLIGHT ARCHITECTURE', {
    x: colX2 + 0.25, y: colY + 0.2, w: colW - 0.5, h: 0.35,
    fontSize: 13, bold: true, fontFace: 'Arial Black', color: '38BDF8',
  });

  const pillars = [
    { title: '1. AI Event Synthesis', desc: 'Transform 1 sentence prompt into title, agenda, and prerequisites via Gemini 2.5 Flash' },
    { title: '2. Cryptographic Passports', desc: 'Solo or 2-4 member squad pass with anti-duplication token & seat allocation' },
    { title: '3. 200ms Laser Gate Scanner', desc: 'Real-time camera check-in with auditory beep & instant admission status' },
    { title: '4. Verifiable Credentials & NAAC', desc: 'Public URL QR verification + 1-click official NBA / NAAC Criterion 5.3 PDF audit' },
  ];

  pillars.forEach((p, idx) => {
    const pillY = colY + 0.65 + idx * 0.92;
    s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: colX2 + 0.25, y: pillY, w: colW - 0.5, h: 0.82,
      fill: { color: '1E2333' }, line: { color: '333B50', width: 1 },
    });
    s4.addText(p.title, { x: colX2 + 0.45, y: pillY + 0.08, w: colW - 0.9, h: 0.25, fontSize: 11, bold: true, color: COLORS.redAccent });
    s4.addText(p.desc, { x: colX2 + 0.45, y: pillY + 0.35, w: colW - 0.9, h: 0.42, fontSize: 10, color: 'E2E8F0' });
  });
}

// ==========================================
// SLIDE 5: KEY FEATURES & CORE FUNCTIONALITY
// ==========================================
{
  const s5 = pptx.addSlide();
  s5.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s5, '03', 'THE ARSENAL', 'KEY FEATURES & CORE FUNCTIONALITY');

  const colW2 = 5.86;
  const cardH = 2.15;
  const colY1 = 2.05;
  const colY2 = 4.45;

  const feats = [
    {
      num: '01', title: 'Holographic Passes & Squad Registration',
      desc: 'Instant ticket minting upon enrollment. Supports Solo & Team/Squad entries (2-4 members with joint pass). Offline printable passes with HMAC digital signature.',
    },
    {
      num: '02', title: '200ms Laser HUD Gate Check-in Scanner',
      desc: 'Mobile-friendly camera scanner with audio chimes. Instant check-in status validation, anti-replay fraud prevention, and real-time live attendance sync.',
    },
    {
      num: '03', title: 'Google Gemini AI Copilot & Campus EventBot',
      desc: 'AI Event Copilot generates complete collegiate proposals in seconds. 24/7 floating EventBot parses natural student questions with live database event context.',
    },
    {
      num: '04', title: 'Verifiable Digital Certificates & NAAC Audit',
      desc: 'Issuance restricted exclusively to gate-verified attendees. Cryptographic QR verify portal (/verify-certificate/:id) + 1-click NAAC Criterion 5 audit report generator.',
    },
  ];

  feats.forEach((f, idx) => {
    const isRight = idx % 2 === 1;
    const isBottom = idx >= 2;
    const cardX = isRight ? 0.7 + colW2 + 0.21 : 0.7;
    const cardY = isBottom ? colY2 : colY1;

    s5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cardX, y: cardY, w: colW2, h: cardH,
      fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
    });
    s5.addText(f.num, { x: cardX + 0.25, y: cardY + 0.15, w: 0.8, h: 0.35, fontSize: 22, bold: true, color: COLORS.redAccent, fontFace: 'Arial Black' });
    s5.addText(f.title, { x: cardX + 1.05, y: cardY + 0.18, w: colW2 - 1.25, h: 0.35, fontSize: 12.5, bold: true, color: '0F172A', fontFace: 'Arial Black' });
    s5.addText(f.desc, { x: cardX + 0.25, y: cardY + 0.65, w: colW2 - 0.5, h: 1.35, fontSize: 11, color: '334155', fontFace: 'Arial', lineSpacing: 16 });
  });
}

// ==========================================
// SLIDE 6: HOW THE SOLUTION WILL WORK
// ==========================================
{
  const s6 = pptx.addSlide();
  s6.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s6, '04', 'THE EXECUTION', 'HOW THE SOLUTION WILL WORK (EXECUTION FLOW)');

  const stepW = 2.83;
  const stepGap = 0.2;
  const stepY = 2.05;
  const stepH = 2.2;

  const steps = [
    { step: 'STEP 1', title: 'PROPOSAL & CREATION', action: 'Student / Club Lead uses AI Copilot to draft agenda, venue, capacity. Submits for review.' },
    { step: 'STEP 2', title: 'PASS MINTING', action: 'Attendee registers Solo or Squad (2-4). Receives encrypted QR pass in My Tickets.' },
    { step: 'STEP 3', title: 'GATE CHECK-IN', action: 'Organizer scans student QR at door (<200ms). Admits attendee & blocks duplicate re-entry.' },
    { step: 'STEP 4', title: 'CREDENTIALS & AUDIT', action: '1-click certificate dispatch strictly to verified attendees. 1-click NAAC PDF report.' },
  ];

  steps.forEach((st, idx) => {
    const cardX = 0.7 + idx * (stepW + stepGap);
    s6.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cardX, y: stepY, w: stepW, h: stepH,
      fill: { color: '0F172A' }, line: { color: '334155', width: 1 },
    });
    s6.addText(st.step, { x: cardX + 0.2, y: stepY + 0.15, w: stepW - 0.4, h: 0.25, fontSize: 11, bold: true, color: COLORS.redAccent, fontFace: 'Arial Black' });
    s6.addText(st.title, { x: cardX + 0.2, y: stepY + 0.45, w: stepW - 0.4, h: 0.35, fontSize: 10.5, bold: true, color: 'FFFFFF', fontFace: 'Arial Black' });
    s6.addText(st.action, { x: cardX + 0.2, y: stepY + 0.85, w: stepW - 0.4, h: 1.2, fontSize: 10, color: 'CBD5E1', fontFace: 'Arial', lineSpacing: 14 });
  });

  // Pipeline Box Below
  const pipeY = 4.5;
  const pipeH = 2.15;
  s6.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: pipeY, w: 11.933, h: pipeH,
    fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
  });
  s6.addText('PIPELINE ARCHITECTURE & FLOW', {
    x: 0.95, y: pipeY + 0.15, w: 10.0, h: 0.3,
    fontSize: 12, bold: true, color: COLORS.redAccent, fontFace: 'Arial Black',
  });

  const pipes = [
    { title: 'React 18 SPA', tech: 'Client UI / Scanner / EventBot' },
    { title: 'Express.js Gateway', tech: 'Auth / Role Guard / QR HMAC' },
    { title: 'MongoDB Atlas', tech: 'Events / Users / Tickets / Certs' },
    { title: 'Gemini 2.5 AI', tech: 'Copilot & Conversational Agent' },
    { title: 'Nodemailer Dispatch', tech: 'Automated 2h QR Pass Reminders' },
  ];

  const pbW = 2.18;
  const pbGap = 0.2;
  pipes.forEach((p, idx) => {
    const pbX = 0.95 + idx * (pbW + pbGap);
    s6.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: pbX, y: pipeY + 0.55, w: pbW, h: 1.35,
      fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1 },
    });
    s6.addText(p.title, { x: pbX + 0.1, y: pipeY + 0.7, w: pbW - 0.2, h: 0.4, fontSize: 11, bold: true, color: '0F172A', align: 'center' });
    s6.addText(p.tech, { x: pbX + 0.1, y: pipeY + 1.15, w: pbW - 0.2, h: 0.6, fontSize: 9, color: '64748B', align: 'center' });
  });
}

// ==========================================
// SLIDE 7: TECHNOLOGY / TECH STACK
// ==========================================
{
  const s7 = pptx.addSlide();
  s7.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s7, '05', 'THE GEAR', 'TECHNOLOGY & TECH STACK');

  const rows = [
    [
      { text: 'Layer', options: { bold: true, color: 'FFFFFF', fill: { color: '0F172A' } } },
      { text: 'Technology / Libraries', options: { bold: true, color: 'FFFFFF', fill: { color: '0F172A' } } },
      { text: 'Why We Chose It (Engineering Rationale)', options: { bold: true, color: 'FFFFFF', fill: { color: '0F172A' } } },
    ],
    [
      { text: 'Frontend', options: { bold: true, color: COLORS.redAccent } },
      { text: 'React 18, Vite, TailwindCSS, Framer Motion, Lucide' },
      { text: 'Instant HMR, 60fps animations, mobile-first cyberpunk UI, sub-second loads' },
    ],
    [
      { text: 'Backend', options: { bold: true, color: COLORS.redAccent } },
      { text: 'Node.js, Express.js (ES Modules), JWT, CORS' },
      { text: 'Non-blocking I/O event loop, high concurrent attendance throughput, modular routers' },
    ],
    [
      { text: 'Database', options: { bold: true, color: COLORS.redAccent } },
      { text: 'MongoDB Atlas, Mongoose ODM' },
      { text: 'Cloud cluster resilience, flexible schema for squad rosters & nested ticket payloads' },
    ],
    [
      { text: 'AI & Copilot', options: { bold: true, color: COLORS.redAccent } },
      { text: 'Google Gemini 2.5 Flash SDK (@google/genai) + Custom NLP Engine' },
      { text: 'Multi-turn conversational campus context with zero-crash collegiate fallback' },
    ],
    [
      { text: 'Security & QR', options: { bold: true, color: COLORS.redAccent } },
      { text: 'qrcode, html5-qrcode, bcryptjs, HMAC-SHA256' },
      { text: 'Offline tamper-proof ticket encoding with hardware laser HUD camera scanning' },
    ],
    [
      { text: 'Delivery', options: { bold: true, color: COLORS.redAccent } },
      { text: 'Nodemailer (Gmail SMTP / Ethereal Testbed)' },
      { text: 'Automated 2-hour pre-event gate reminders with embedded pass attachments' },
    ],
  ];

  s7.addTable(rows, {
    x: 0.7,
    y: 2.05,
    w: 11.933,
    colW: [2.1, 4.4, 5.433],
    fill: { color: COLORS.cardLight },
    border: { pt: 1, color: COLORS.cardLightBorder },
    fontFace: 'Arial',
    fontSize: 10.5,
    rowH: [0.4, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65],
    align: 'left',
    valign: 'middle',
  });
}

// ==========================================
// SLIDE 8: CURRENT PROGRESS / WORK DONE
// ==========================================
{
  const s8 = pptx.addSlide();
  s8.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s8, '06', 'INSIDE THE MINT', 'CURRENT PROGRESS & IMPLEMENTATION STATUS');

  const colW = 5.86;
  const colH = 4.6;
  const colY = 2.05;

  // Left Box: COMPLETED
  s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: colY, w: colW, h: colH,
    fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
  });
  s8.addText('100% PRODUCTION COMPLETED', {
    x: 0.95, y: colY + 0.2, w: colW - 0.5, h: 0.35,
    fontSize: 14, bold: true, fontFace: 'Arial Black', color: '059669',
  });
  s8.addText([
    { text: '✔ Full Authentication & Role Guards: ', options: { bold: true, color: '0F172A' } },
    { text: 'Student, Club Lead, Faculty, and Admin roles with OTP verification.\n\n', options: { color: '334155' } },
    { text: '✔ Holographic QR Pass System: ', options: { bold: true, color: '0F172A' } },
    { text: 'Instant ticket minting, digital vault in My Tickets, solo and team/squad registration.\n\n', options: { color: '334155' } },
    { text: '✔ Gate Scanner HUD & Attendee Management: ', options: { bold: true, color: '0F172A' } },
    { text: 'Camera QR scanning (<200ms), manual override, CSV export, broadcast alert.\n\n', options: { color: '334155' } },
    { text: '✔ Google Gemini AI Suite: ', options: { bold: true, color: '0F172A' } },
    { text: 'AI Event Copilot blueprint generator + conversational EventBot with live DB events.\n\n', options: { color: '334155' } },
    { text: '✔ Verifiable Certificate Vault & NAAC: ', options: { bold: true, color: '0F172A' } },
    { text: 'Cryptographic anti-fraud certificates + NAAC Criterion 5.3 PDF report generator.', options: { color: '334155' } },
  ], {
    x: 0.95, y: colY + 0.65, w: colW - 0.5, h: 3.7, fontSize: 11, fontFace: 'Arial', lineSpacing: 16,
  });

  // Right Box: IN PROGRESS & TEST BENCH
  const colX2 = 0.7 + colW + 0.21;
  s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: colX2, y: colY, w: colW, h: colH,
    fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
  });
  s8.addText('IN PROGRESS / TEST BENCH METRICS', {
    x: colX2 + 0.25, y: colY + 0.2, w: colW - 0.5, h: 0.35,
    fontSize: 14, bold: true, fontFace: 'Arial Black', color: COLORS.redAccent,
  });
  s8.addText([
    { text: '• NFC Turnstile Gate Sync: ', options: { bold: true, color: '0F172A' } },
    { text: 'Tap-to-enter integration with college smart cards and RFID wristbands.\n\n', options: { color: '334155' } },
    { text: '• Offline Mesh Sync Engine: ', options: { bold: true, color: '0F172A' } },
    { text: 'Local P2P Bluetooth mesh verification in zero-connectivity basement auditoriums.\n\n', options: { color: '334155' } },
    { text: '• Verified Test Bench Metrics: ', options: { bold: true, color: '0F172A' } },
    { text: '• 0 Gate Spoofing Errors observed during test load runs.\n• Sub-200ms average QR scan latency on mobile webcams.\n• 100% production-ready Vite client build (2.25s bundle compile).\n• Live MongoDB Atlas cloud cluster connected and active.', options: { color: '334155' } },
  ], {
    x: colX2 + 0.25, y: colY + 0.65, w: colW - 0.5, h: 3.7, fontSize: 11, fontFace: 'Arial', lineSpacing: 16,
  });
}

// ==========================================
// SLIDE 9: SYSTEM SECURITY & ANTI-FRAUD
// ==========================================
{
  const s9 = pptx.addSlide();
  s9.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s9, '06', 'INSIDE THE MINT', 'SYSTEM SECURITY & ANTI-FRAUD ARCHITECTURE');

  const cardH3 = 1.35;
  const cardGap = 0.2;
  const startY = 2.1;

  const secs = [
    {
      num: '01', title: 'HMAC-SHA256 Encrypted Passports',
      desc: 'Each QR code encapsulates a cryptographic hash of ticketCode, eventId, rollNumber, and a server secret key. Screenshot replication or ticket spoofing is mathematically impossible.',
    },
    {
      num: '02', title: 'Strict Physical Gate Attendance Gatekeeping',
      desc: 'Unlike traditional platforms where anyone registered gets a certificate, EventEase strictly restricts issuance to status: "checked_in", physically stamped at the gate.',
    },
    {
      num: '03', title: 'Public QR Registry Verification',
      desc: 'Every certificate carries an authentic URL token (/verify-certificate/MU-CERT-2026-XXXX). Recruiters and academic auditors verify authenticity in 1 second.',
    },
  ];

  secs.forEach((sec, idx) => {
    const cardY = startY + idx * (cardH3 + cardGap);
    s9.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.7, y: cardY, w: 11.933, h: cardH3,
      fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
    });
    s9.addText(sec.num, { x: 0.95, y: cardY + 0.2, w: 0.8, h: 0.5, fontSize: 24, bold: true, color: COLORS.redAccent, fontFace: 'Arial Black' });
    s9.addText(sec.title, { x: 1.8, y: cardY + 0.15, w: 10.5, h: 0.35, fontSize: 13, bold: true, color: '0F172A', fontFace: 'Arial Black' });
    s9.addText(sec.desc, { x: 1.8, y: cardY + 0.55, w: 10.5, h: 0.7, fontSize: 10.5, color: '475569', fontFace: 'Arial', lineSpacing: 15 });
  });
}

// ==========================================
// SLIDE 10: COMPETITIVE BENCHMARKING
// ==========================================
{
  const s10 = pptx.addSlide();
  s10.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s10, '06', 'INSIDE THE MINT', 'COMPETITIVE BENCHMARKING (WHY EVENTEASE WINS)');

  const compRows = [
    [
      { text: 'Capability / Metric', options: { bold: true, color: 'FFFFFF', fill: { color: '0F172A' } } },
      { text: 'Google Forms / Sheets', options: { bold: true, color: 'FFFFFF', fill: { color: '475569' } } },
      { text: 'Eventbrite / Luma', options: { bold: true, color: 'FFFFFF', fill: { color: '475569' } } },
      { text: 'EventEase (Our Project)', options: { bold: true, color: 'FFFFFF', fill: { color: 'BE123C' } } },
    ],
    [
      { text: 'Gate Verification', options: { bold: true } },
      { text: '❌ Manual paper ticking' },
      { text: '⚠️ Generic ticket barcode' },
      { text: '✅ 200ms Laser HUD QR Scanner', options: { bold: true, color: '059669' } },
    ],
    [
      { text: 'Squad / Team Entry', options: { bold: true } },
      { text: '❌ Messy comma fields' },
      { text: '❌ Individual passes only' },
      { text: '✅ Native 2-4 Member Squad Pass', options: { bold: true, color: '059669' } },
    ],
    [
      { text: 'AI Event Copilot', options: { bold: true } },
      { text: '❌ None' },
      { text: '❌ None' },
      { text: '✅ Google Gemini 2.5 Flash Engine', options: { bold: true, color: '059669' } },
    ],
    [
      { text: 'Campus AI EventBot', options: { bold: true } },
      { text: '❌ None' },
      { text: '❌ None' },
      { text: '✅ 24/7 Live Context Q&A Concierge', options: { bold: true, color: '059669' } },
    ],
    [
      { text: 'Certificate Anti-Fraud', options: { bold: true } },
      { text: '❌ Fakeable Canva certs' },
      { text: '⚠️ Paid add-ons' },
      { text: '✅ Issued ONLY to Gate Check-ins', options: { bold: true, color: '059669' } },
    ],
    [
      { text: 'NAAC / NBA Accreditation', options: { bold: true } },
      { text: '❌ 14 Days Manual Assembly' },
      { text: '❌ No collegiate alignment' },
      { text: '✅ 1-Click Criterion 5.3 PDF Audit', options: { bold: true, color: '059669' } },
    ],
  ];

  s10.addTable(compRows, {
    x: 0.7,
    y: 2.05,
    w: 11.933,
    colW: [2.7, 2.9, 2.9, 3.433],
    fill: { color: COLORS.cardLight },
    border: { pt: 1, color: COLORS.cardLightBorder },
    fontFace: 'Arial',
    fontSize: 10.5,
    rowH: [0.4, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65],
    align: 'left',
    valign: 'middle',
  });
}

// ==========================================
// SLIDE 11: FUTURE PLAN & STRATEGIC ROADMAP
// ==========================================
{
  const s11 = pptx.addSlide();
  s11.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s11, '07', 'THE GETAWAY', 'FUTURE PLAN & STRATEGIC ROADMAP');

  const colW3 = 3.84;
  const colGap3 = 0.2;
  const colH3 = 4.6;
  const colY3 = 2.05;

  const phases = [
    {
      phase: 'PHASE 1', title: 'DURING HACKATHON',
      items: [
        'Complete end-to-end QR pass lifecycle',
        'Google Gemini 2.5 Flash AI Copilot & EventBot',
        'Verifiable Digital Certificate Vault',
        'Live gate HUD scanner demonstration',
        'Zero-crash collegiate fallback engine',
      ],
    },
    {
      phase: 'PHASE 2', title: 'RIGHT AFTER (30 DAYS)',
      items: [
        'Production deploy to cloud hosting (Vercel/Render)',
        'Pilot with 5 active Atmiya University clubs',
        'Automated WhatsApp pass delivery via Twilio',
        'NFC student ID card tap-to-admit beta',
        'IQAC dashboard export for college reports',
      ],
    },
    {
      phase: 'PHASE 3', title: 'LONG-TERM VISION',
      items: [
        'Multi-campus SaaS scaling across 20+ universities',
        'Turnstile hardware IoT gate controller integration',
        'Verifiable Web3 on-chain credential ledger',
        'AI student skill graph from verified fest turnouts',
        'Sponsorship & hackathon prize escrow contracts',
      ],
    },
  ];

  phases.forEach((rp, idx) => {
    const cardX = 0.7 + idx * (colW3 + colGap3);
    s11.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cardX, y: colY3, w: colW3, h: colH3,
      fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
    });
    s11.addText(rp.phase, { x: cardX + 0.25, y: colY3 + 0.2, w: colW3 - 0.5, h: 0.3, fontSize: 11, bold: true, color: COLORS.redAccent, fontFace: 'Arial Black' });
    s11.addText(rp.title, { x: cardX + 0.25, y: colY3 + 0.55, w: colW3 - 0.5, h: 0.4, fontSize: 13, bold: true, color: '0F172A', fontFace: 'Arial Black' });
    s11.addText(rp.items.map(it => `• ${it}\n\n`).join(''), {
      x: cardX + 0.25, y: colY3 + 1.05, w: colW3 - 0.5, h: 3.3, fontSize: 11, color: '334155', fontFace: 'Arial', lineSpacing: 17,
    });
  });
}

// ==========================================
// SLIDE 12: FEASIBILITY, BUSINESS MODEL & CAMPUS IMPACT
// ==========================================
{
  const s12 = pptx.addSlide();
  s12.background = { color: COLORS.bgLight };
  addHeaderAndFooter(s12, '07', 'THE GETAWAY', 'FEASIBILITY, BUSINESS MODEL & CAMPUS IMPACT');

  const colW2 = 5.86;
  const cardH = 2.15;
  const colY1 = 2.05;
  const colY2 = 4.45;

  const impacts = [
    { num: '95%', title: 'Reduction in Gate Queue Time', desc: 'From 3-minute manual name searches down to sub-200ms optical laser camera scans.' },
    { num: '100%', title: 'Elimination of Proxy Certificates', desc: 'Digital certificates are cryptographically locked to physical gate check-in logs.' },
    { num: '1 Click', title: 'NAAC / NBA Accreditation Prep', desc: 'Cuts administrative documentation from 14 days down to 1 click PDF export.' },
    { num: 'Zero Cost', title: 'Completely Free for Students', desc: 'No ticket processing fees or paywalls for university members.' },
  ];

  impacts.forEach((m, idx) => {
    const isRight = idx % 2 === 1;
    const isBottom = idx >= 2;
    const cardX = isRight ? 0.7 + colW2 + 0.21 : 0.7;
    const cardY = isBottom ? colY2 : colY1;

    s12.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cardX, y: cardY, w: colW2, h: cardH,
      fill: { color: COLORS.cardLight }, line: { color: COLORS.cardLightBorder, width: 1 },
    });
    s12.addText(m.num, { x: cardX + 0.25, y: cardY + 0.15, w: 2.2, h: 0.65, fontSize: 30, bold: true, color: COLORS.redAccent, fontFace: 'Arial Black' });
    s12.addText(m.title, { x: cardX + 0.25, y: cardY + 0.85, w: colW2 - 0.5, h: 0.35, fontSize: 13, bold: true, color: '0F172A', fontFace: 'Arial Black' });
    s12.addText(m.desc, { x: cardX + 0.25, y: cardY + 1.25, w: colW2 - 0.5, h: 0.75, fontSize: 11, color: '64748B', fontFace: 'Arial', lineSpacing: 16 });
  });
}

// ==========================================
// SLIDE 13: THE VAULT & REPOSITORY LINK
// ==========================================
{
  const s13 = pptx.addSlide();
  s13.background = { color: COLORS.bgDark };
  addHeaderAndFooter(s13, '08', 'THE VAULT', 'GITHUB REPOSITORY & PROJECT DELIVERABLES', true);

  // Link Container
  s13.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: 2.1, w: 11.933, h: 1.25,
    fill: { color: COLORS.cardDark }, line: { color: COLORS.redAccent, width: 2 },
  });
  s13.addText('🔗  https://github.com/ashishagrawal/EventEase', {
    x: 0.95, y: 2.45, w: 11.4, h: 0.55,
    fontSize: 20, bold: true, color: 'FFFFFF', fontFace: 'Arial Black',
  });

  // 4 Feature Proof Boxes
  const vaultCards = [
    { title: 'PUBLIC REPO', badge: 'VERIFIED', desc: 'Repository visibility is set to public with transparent branch history & documentation.' },
    { title: 'README & DOCS', badge: 'COMPREHENSIVE', desc: 'Covers setup steps, API gateway index, AI endpoints, demo accounts & architecture.' },
    { title: 'COMMITS', badge: 'ACTIVE & REGULAR', desc: 'Frequent, clean commits documenting AI Copilot, EventBot, Certificate Vault & gate scanner.' },
    { title: 'LIVE PROTOTYPE', badge: 'HACKATHON READY', desc: 'Client on Vite localhost:5173, Server on Express port 5000, Live MongoDB Atlas cluster.' },
  ];

  const colW4 = 2.83;
  const colGap4 = 0.2;
  const vCardY = 3.6;
  const vCardH = 3.0;

  vaultCards.forEach((vc, idx) => {
    const cardX = 0.7 + idx * (colW4 + colGap4);
    s13.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cardX, y: vCardY, w: colW4, h: vCardH,
      fill: { color: COLORS.cardDark }, line: { color: COLORS.cardDarkBorder, width: 1 },
    });
    s13.addText(vc.title, { x: cardX + 0.2, y: vCardY + 0.2, w: colW4 - 0.4, h: 0.3, fontSize: 12, bold: true, color: COLORS.redAccent, fontFace: 'Arial Black' });
    s13.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cardX + 0.2, y: vCardY + 0.55, w: 1.5, h: 0.28,
      fill: { color: '1E293B' }, line: { color: '334155', width: 1 },
    });
    s13.addText(vc.badge, { x: cardX + 0.2, y: vCardY + 0.55, w: 1.5, h: 0.28, fontSize: 8.5, bold: true, color: '38BDF8', align: 'center' });
    s13.addText(vc.desc, { x: cardX + 0.2, y: vCardY + 1.0, w: colW4 - 0.4, h: 1.8, fontSize: 10.5, color: '94A3B8', lineSpacing: 16 });
  });
}

// Generate the files in both locations
const rootOutput = path.resolve('../EventEase_CodeCarnival_Presentation.pptx');
const finalOutput = path.resolve('../EventEase_CodeCarnival_Final_Deck.pptx');

pptx.writeFile({ fileName: rootOutput })
  .then(() => {
    console.log('SUCCESS: Written to', rootOutput);
    try {
      fs.copyFileSync(rootOutput, finalOutput);
      console.log('SUCCESS: Copied to', finalOutput);
    } catch (e) {
      console.log('Final output note:', e.message);
    }
  })
  .catch((err) => {
    console.error('ERROR creating presentation:', err);
    process.exit(1);
  });
