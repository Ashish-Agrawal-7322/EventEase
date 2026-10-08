# ⚡ EventEase — Futuristic College Event Registration & QR Attendance System

> A full-stack, hackathon-ready campus event platform with cryptographic QR ticketing, HUD laser gate scanning, duplicate check-in prevention, and live Recharts analytics.

---

## 🚀 Live Services
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts |
| **Ticketing & Scanning** | `qrcode.react`, `html5-qrcode`, Web Audio API synthesis, Canvas Confetti |
| **Backend** | Node.js, Express, JWT, bcryptjs, crypto, CSV export |
| **Database** | MongoDB + Mongoose (with zero-config embedded persistent JSON fallback) |

---

## 👥 Roles & Pre-configured Demo Accounts

All accounts use the password: `password123`

| Role | Name | Email | Password | Primary Capabilities |
|---|---|---|---|---|
| 🎓 **Student** | **Alex Rivera** | `alex.student@campus.edu` | `password123` | Browse events, instant registration, Holographic QR Pass, "My Tickets" vault |
| 🎪 **Organizer** | **Sarah Chen** | `sarah.organizer@campus.edu` | `password123` | Create/edit events, capacity management, QR Camera Scanner HUD, live attendee roster, CSV export |
| 🛡️ **Admin** | **Dr. Aris Thorne** | `admin@campus.edu` | `password123` | College-wide oversight, attendance conversion metrics, role promotion & identity directory |

> **Pro Tip**: The top bar of the web app contains an **Instant 1-Click Role Switcher** so you can jump between Student, Organizer, and Admin roles without manually typing credentials!

---

## 🎬 4-Step Hackathon Demo Walkthrough

### Step 1: Student Registers for Event
1. Click **"Student (Alex)"** on the top demo bar.
2. Navigate to **"Explore Events"** and click **"Register & Get QR"** on an event (e.g. *Quantum Leap Workshop* or *ApexHack 2026*).
3. The event capacity count updates live, and an instant **Holographic Digital QR Pass** is minted with seat allocation and tamper-evident SHA-256 signature.

### Step 2: View Digital Ticket Pass
1. Open **"My Tickets"** to view Alex's pass wallet.
2. Click **"Full Pass"** to inspect the high-resolution scannable QR ticket with student roll number, venue, and status.

### Step 3: Organizer Scans QR at Gate
1. Click **"Organizer (Sarah)"** on the top demo bar.
2. Go to **"Organizer Hub"** &rarr; Click **"Scan QR"** on the event.
3. The **Attendance Scanner HUD** opens with laser sweep reticle and Web Audio feedback.
4. Either point a webcam at Alex's QR code OR click the **"Instant Attendee Simulator"** tab and click **"Simulate Scan QR"** on Alex's ticket!
5. **Result**: A celebratory chime plays, confetti bursts, and a glowing green card displays:
   > `✓ Check-in Successful! Welcome to the event.` (Attendee name, roll number, department, seat, timestamp).

### Step 4: Duplicate Check-in Prevention
1. In the scanner, scan Alex's ticket a second time (or click *"Scan Again (Duplicate Test)"*).
2. **Result**: The system rejects the entry with an audio warning and a glowing amber card:
   > `⚠ Duplicate Alert: Already Checked In! Scanned previously at [Timestamp].`
3. Check the **"Live Analytics"** page to observe the Recharts attendance rush curve, capacity fill rate, and department distribution charts.

---

## 💻 Quick Start & Commands

```bash
# 1. Install root, backend, and frontend packages
npm install
npm install --prefix server
npm install --prefix client

# 2. Run both Backend & Frontend simultaneously
npm run dev

# 3. Run automated end-to-end demo flow test
npm test --prefix server
```

---

## 🔒 Security & Architecture Highlights
- **Cryptographic Signatures**: QR payloads contain HMAC-SHA256 signatures tying the ticket code to the event ID.
- **Event Mismatch Protection**: Scanning a ticket from Event A at Event B's gate triggers an instant `wrong_event` rejection.
- **Capacity Enforcement**: Atomic validation rejects registrations if `registeredCount >= capacity`.
- **Zero-Setup Resilience**: Dual-mode storage uses native MongoDB if available, and automatically boots an embedded persistent store if no local MongoDB service is installed.
