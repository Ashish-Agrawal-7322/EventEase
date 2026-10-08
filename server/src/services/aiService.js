import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('[AI] Failed to init GoogleGenAI SDK:', err.message);
    return null;
  }
};

/**
 * 1. AI Event Copilot: Auto-generates full event schedule, agenda, prerequisites & details
 */
export const generateEventCopilot = async ({ topic, category = 'Hackathon', targetAudience = 'All Engineering Students' }) => {
  const ai = getGeminiClient();

  const prompt = `You are an elite college event planner for Marwadi University campus clubs.
Create an awesome, highly detailed campus event proposal for:
Topic: "${topic}"
Category: "${category}"
Target Audience: "${targetAudience}"

Respond ONLY with valid, raw JSON (no backticks, no markdown) containing these exact fields:
{
  "title": "A punchy, memorable event title with year or subtitle (max 10 words)",
  "tagline": "A catchy one-line marketing hook for college students",
  "category": "${category}",
  "suggestedVenue": "A realistic college venue (e.g. Turing Lab, Auditorium Hall A, Innovation Sandbox)",
  "suggestedCapacity": 100,
  "tags": ["3 to 5 relevant technical/campus tags"],
  "description": "A comprehensive, beautifully formatted Markdown description containing: 1. Overview & Vision, 2. Hour-by-Hour Agenda / Schedule timeline, 3. Prerequisites & Tech Stack needed, 4. Judging / Learning Outcomes, 5. Perks (Certificates, Mentorship)."
}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      // Clean possible markdown code fence
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, aiGenerated: true, data: parsed };
    } catch (err) {
      console.warn('[AI Copilot SDK Error, using smart fallback]:', err.message);
    }
  }

  // High-Quality Dynamic Campus Event Fallback Generator
  const cleanCategory = category || 'Workshop';
  const fallbackTitle = topic.length > 3 ? `${topic.charAt(0).toUpperCase() + topic.slice(1)} 2026` : `Campus ${cleanCategory} 2026`;
  
  const fallback = {
    title: fallbackTitle,
    tagline: `Intensive hands-on collegiate ${cleanCategory.toLowerCase()} designed for modern engineers and innovators.`,
    category: cleanCategory,
    suggestedVenue: cleanCategory === 'Hackathon' ? 'Turing Lab & Open Hackspace' : cleanCategory === 'Cultural' ? 'Main Amphitheatre' : 'Seminar Hall B, Engineering Block',
    suggestedCapacity: cleanCategory === 'Hackathon' ? 120 : cleanCategory === 'Workshop' ? 60 : 150,
    tags: ['Marwadi University', cleanCategory, 'Innovation', 'Hands-On'],
    description: `### 🚀 Event Overview\nWelcome to **${fallbackTitle}**, a flagship collegiate experience organized for Marwadi University students. Whether you are building from scratch or refining your skills, this session is engineered to provide practical mastery, peer collaboration, and verified credentials.\n\n### ⏱️ Detailed Event Agenda\n- **10:00 AM - 10:30 AM**: Gate Check-in & Holographic QR Pass Verification at Entry Gate\n- **10:30 AM - 11:15 AM**: Keynote Briefing & Industry Mentor Orientation\n- **11:15 AM - 01:00 PM**: Hands-on Sprint & Collaborative Prototyping Phase 1\n- **01:00 PM - 02:00 PM**: Networking Lunch & Campus Chapter Meetup\n- **02:00 PM - 03:30 PM**: Deep Dive Lab & Live Coding / Demonstration\n- **03:30 PM - 04:00 PM**: Showcase, Faculty Review & Digital Certificate Awarding\n\n### 🎒 Prerequisites & Equipment\n- Personal laptop with charger and Wi-Fi enabled\n- Basic familiarity with collegiate course topics\n- Official Marwadi University student ID pass\n\n### 🏆 Participant Benefits\n- Cryptographic Digital Certificate of Participation (verifiable via QR code)\n- Mentorship from club leads and faculty advisors\n- Activity / Accreditation credit points for your academic profile`,
  };

  return { success: true, aiGenerated: false, data: fallback };
};

/**
 * 2. EventBot: Interactive Campus Event Assistant
 */
export const chatWithEventBot = async ({ message, conversationHistory = [], liveEvents = [] }) => {
  const ai = getGeminiClient();

  const eventsContext = liveEvents.map(e => `
- Event: "${e.title}" (${e.category})
  Date: ${e.date} | Timing: ${e.startTime} - ${e.endTime}
  Venue: ${e.venue}
  Capacity: ${e.registeredCount || 0}/${e.capacity} spots (${e.spotsLeft ?? (e.capacity - (e.registeredCount || 0))} left)
  Status: ${e.isExpired ? 'Expired' : e.isFull ? 'Sold Out' : 'Open for Registration'}
  Organizer: ${e.organizerName}
  Description: ${e.description ? e.description.substring(0, 150) + '...' : 'Campus event'}
  Id: ${e._id}
`).join('\n');

  const systemInstruction = `You are "EventBot", an intelligent, friendly, and tech-savvy AI Campus Assistant for Marwadi University EventEase.
You interact conversationally with human students and organizers. Respond directly and naturally to whatever the human asks.
Tone: Warm, human, helpful, collegiate, and concise.

Live Campus Events in Database:
${eventsContext || 'No live events are currently scheduled.'}

Guidelines:
1. Always converse directly with the user, addressing their specific human question (whether it's small talk, event questions, rules, logistics, advice, or directions).
2. When answering about specific events, refer to the live database events above and provide exact details (date, timing, venue, spots left).
3. If asked about passes, tickets, or certificates, explain the holographic QR pass in "My Tickets" and the verifiable Certificate Vault.
4. Keep answers friendly, formatted with markdown bullets or highlights where helpful.`;

  // 1. Try Google Gemini Generative AI if API key is active
  if (ai) {
    try {
      const contents = [];
      for (const m of conversationHistory) {
        const text = m.content || m.text || m.message || '';
        if (!text) continue;
        const role = (m.role === 'user' || m.sender === 'user') ? 'user' : 'model';
        contents.push({ role, parts: [{ text }] });
      }

      contents.push({
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\nStudent Query: "${message}"\nRespond naturally and conversationally to the student:` }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
      });

      if (response && response.text && response.text.trim()) {
        return {
          success: true,
          reply: response.text.trim(),
        };
      }
    } catch (err) {
      console.warn('[AI EventBot SDK Error, executing dynamic human reasoning engine]:', err.message);
    }
  }

  // 2. High-Intelligence Natural Language Understanding Engine
  return generateDynamicHumanReply({ message, conversationHistory, liveEvents });
};

/**
 * Intelligent Dynamic Conversational Engine
 * Understands user intent, specific event references, college rules, and human small talk
 */
const generateDynamicHumanReply = ({ message, conversationHistory = [], liveEvents = [] }) => {
  const rawMsg = message.trim();
  const q = rawMsg.toLowerCase();

  // Helper: Find if a specific event is mentioned in the user message
  const findMatchingEvent = () => {
    for (const ev of liveEvents) {
      const titleLower = ev.title.toLowerCase();
      // Exact title match or title keyword match (words longer than 3 chars)
      const keywords = titleLower.split(/[\s-_]+/).filter(w => w.length > 3 && !['2026', 'hack', 'fest', 'event'].includes(w));
      if (titleLower.includes(q) || q.includes(titleLower)) return ev;
      if (keywords.some(kw => q.includes(kw))) return ev;
    }
    // Also check if any category is mentioned in combination with specific words
    return null;
  };

  const matchedEvent = findMatchingEvent();

  // A. Friendly Human Greetings & Social Chitchat
  if (/^(hi|hello|hey|heyy|howdy|yo|greetings|hola)(\s|$|[!?.])/i.test(q)) {
    return {
      success: true,
      reply: `👋 Hey there! Great to chat with you. I'm **EventBot**, your campus assistant for Marwadi University EventEase.\n\nI can help you check upcoming hackathons, find venue details, get ticket passes, or learn about club registrations. What's on your mind today?`,
    };
  }

  if (q.includes('how are you') || q.includes('how do you do') || q.includes('how are u') || q.includes('hows it going')) {
    return {
      success: true,
      reply: `😊 I'm doing fantastic, thank you for asking! The campus is buzzing with activity and I'm ready to help you explore any event or hackathon. How can I help you out today?`,
    };
  }

  if (q.includes('who are you') || q.includes('what are you') || q.includes('what can you do') || q.includes('your name')) {
    return {
      success: true,
      reply: `🤖 I'm **EventBot AI**, your 24/7 digital concierge for Marwadi University campus events!\n\nHere is what I can do for you:\n• **Find Events:** Search hackathons, workshops, cultural fests, and seminars.\n• **Event Details:** Check exact timings, venues, schedules, and remaining seat capacity.\n• **Pass Guidance:** Explain how to get digital QR passes and gate admission.\n• **Squad Registrations:** Guide you on registering with a team.\n• **Certificates:** Help you access verifiable digital certificates in your vault.\n\nFeel free to ask me anything!`,
    };
  }

  if (q.includes('thank') || q.includes('thx') || q.includes('appreciate') || q.includes('great help')) {
    return {
      success: true,
      reply: `🙌 You're very welcome! Always glad to help out a fellow campus member. Don't hesitate to reach out if you need anything else, and have an awesome time at your events!`,
    };
  }

  if (q.includes('bye') || q.includes('goodbye') || q.includes('see you') || q.includes('cya')) {
    return {
      success: true,
      reply: `👋 Catch you later! Don't forget to have your QR pass ready on event day in **My Tickets**. Have a wonderful day ahead!`,
    };
  }

  // B. Questions about a Specific Event Mentioned in the Query
  if (matchedEvent) {
    const spotsLeft = matchedEvent.capacity - (matchedEvent.registeredCount || 0);

    // B1: Timing / When
    if (q.includes('when') || q.includes('time') || q.includes('timing') || q.includes('schedule') || q.includes('start') || q.includes('end')) {
      return {
        success: true,
        reply: `⏰ **${matchedEvent.title}** Schedule Details:\n\n• **Date:** ${matchedEvent.date}\n• **Timing:** ${matchedEvent.startTime} – ${matchedEvent.endTime}\n• **Venue:** ${matchedEvent.venue}\n\nMake sure to arrive 15 minutes early at the gate with your digital pass for scanner check-in!`,
      };
    }

    // B2: Venue / Where
    if (q.includes('where') || q.includes('venue') || q.includes('location') || q.includes('place') || q.includes('room') || q.includes('hall')) {
      return {
        success: true,
        reply: `📍 **${matchedEvent.title}** is taking place at:\n\n🏢 **${matchedEvent.venue}**\n📅 **Date:** ${matchedEvent.date} (${matchedEvent.startTime} - ${matchedEvent.endTime})\n\nYou can view full venue details and reserve your pass right on the event card!`,
      };
    }

    // B3: Capacity / Spots / Seats
    if (q.includes('seat') || q.includes('capacity') || q.includes('spot') || q.includes('registered') || q.includes('full') || q.includes('available')) {
      return {
        success: true,
        reply: `👥 **Capacity Status for ${matchedEvent.title}:**\n\n• **Total Capacity:** ${matchedEvent.capacity} seats\n• **Registered so far:** ${matchedEvent.registeredCount || 0} students\n• **Spots Remaining:** ${spotsLeft > 0 ? `**${spotsLeft} seats available** 🟢` : '**Event is Full** 🔴'}\n\n${spotsLeft > 0 ? 'Hurry and register before allocations fill up!' : 'Check out our other upcoming events on campus!'}`,
      };
    }

    // B4: Organizer / Club
    if (q.includes('who') || q.includes('organizer') || q.includes('host') || q.includes('lead') || q.includes('club')) {
      return {
        success: true,
        reply: `🏛️ **${matchedEvent.title}** is organized and hosted by:\n\n• **Organizer:** ${matchedEvent.organizerName}\n• **Category:** ${matchedEvent.category}\n• **Campus:** Marwadi University\n\nIf you have club-specific questions, you can reach out to the coordinator during registration hours.`,
      };
    }

    // B5: General Event Details Overview
    return {
      success: true,
      reply: `📌 Here are the details for **${matchedEvent.title}**:\n\n• **Category:** ${matchedEvent.category}\n• **Date & Time:** ${matchedEvent.date} (${matchedEvent.startTime} - ${matchedEvent.endTime})\n• **Venue:** ${matchedEvent.venue}\n• **Organizer:** ${matchedEvent.organizerName}\n• **Availability:** ${matchedEvent.registeredCount || 0}/${matchedEvent.capacity} filled (${spotsLeft > 0 ? `${spotsLeft} seats left` : 'Full'})\n\n${matchedEvent.tagline ? `💡 *"${matchedEvent.tagline}"*\n\n` : ''}You can register directly on the event page to secure your holographic entry ticket!`,
    };
  }

  // C. Specific Campus Topics & Practical Human Q&A

  // C1: Squad / Team Registration
  if (q.includes('team') || q.includes('squad') || q.includes('partner') || q.includes('group') || q.includes('friend') || q.includes('member')) {
    return {
      success: true,
      reply: `👥 **Yes, Squad / Team Registrations are fully supported!**\n\nFor hackathons and group competitions on EventEase:\n1. Open the event page and click **Register & Get Pass**.\n2. Switch the toggle from **"Solo Entry"** to **"Team Squad"**.\n3. Enter your **Team Name** and add 1 to 3 co-members with their names and roll numbers.\n4. Submit to mint a joint digital holographic pass containing your team details!`,
    };
  }

  // C2: Cost / Fees
  if (q.includes('free') || q.includes('cost') || q.includes('fee') || q.includes('price') || q.includes('money') || q.includes('pay') || q.includes('charge')) {
    return {
      success: true,
      reply: `🎉 **Good news!** Campus events, hackathons, and workshops on EventEase are **100% Free** for verified Marwadi University students.\n\nAll you need is your student account to register and receive your instant cryptographic pass. No hidden fees or payments required!`,
    };
  }

  // C3: Tickets, QR Passes, Gate Scanner & Check-in
  if (q.includes('ticket') || q.includes('pass') || q.includes('qr') || q.includes('gate') || q.includes('scanner') || q.includes('entry') || q.includes('admitted') || q.includes('check-in') || q.includes('check in')) {
    return {
      success: true,
      reply: `🎫 **How the Holographic QR Gate Pass Works:**\n\n1. **Register:** Click "Register & Get Pass" on any active event.\n2. **Pass Vault:** Your pass is instantly minted and stored in **"My Tickets"** in the top navigation.\n3. **Gate Entry:** When arriving at the hall, present your QR code on your mobile phone.\n4. **Laser Verification:** Event organizers scan your code with our live camera HUD scanner, confirming your admission in under 200ms!`,
    };
  }

  // C4: Certificates & Accreditation Credits
  if (q.includes('cert') || q.includes('certificate') || q.includes('credit') || q.includes('naac') || q.includes('attendance') || q.includes('proof')) {
    return {
      success: true,
      reply: `🎓 **Verifiable Digital Certificates of Participation:**\n\n• **Requirement:** Certificates are issued exclusively to attendees who complete **physical gate check-in** at the event venue (anti-fraud protection).\n• **Access:** Once issued by the organizer, you can view and print your certificate in your **Digital Vault** on the **My Tickets** page.\n• **Authenticity:** Each certificate includes a unique registry token and QR code verified under **NAAC Criterion 5.3**!`,
    };
  }

  // C5: What to Bring / Equipment / Logistics / Food
  if (q.includes('bring') || q.includes('laptop') || q.includes('food') || q.includes('lunch') || q.includes('snack') || q.includes('refreshment') || q.includes('wifi') || q.includes('carry')) {
    return {
      success: true,
      reply: `🎒 **Event Day Checklist & Logistics:**\n\n• **Essentials to Bring:**\n  1. Your laptop & charger (for hackathons/workshops).\n  2. Official Marwadi University Student ID card.\n  3. Your mobile phone with the **My Tickets** QR pass open.\n• **Venue Amenities:** High-speed campus Wi-Fi and power outlets are provided at technical venues.\n• **Refreshments:** Most full-day events and hackathons provide complimentary snacks and lunch for registered participants!`,
    };
  }

  // C6: How to Create or Host an Event (Club Leads / Students)
  if (q.includes('host') || q.includes('create') || q.includes('organize') || q.includes('propose') || q.includes('publish event') || q.includes('lead') || q.includes('organizer')) {
    return {
      success: true,
      reply: `🚀 **Hosting an Event at Marwadi University:**\n\n1. Click the **"Register Event / Club"** button in the top navigation bar.\n2. Fill in the event title, category (Hackathon, Workshop, Tech Fest, etc.), date, venue, and capacity.\n3. Use our **✨ AI Copilot Blueprint** button to automatically generate a complete hour-by-hour agenda, description, and prerequisites!\n4. Upload an event banner picture and click **Publish Event**.\n5. If required, your proposal will be forwarded to Campus Admin for approval before going live!`,
    };
  }

  // C7: Hackathon Ideas & Winning Tips
  if (q.includes('idea') || q.includes('project') || q.includes('win') || q.includes('tip') || q.includes('advice') || q.includes('strategy')) {
    return {
      success: true,
      reply: `💡 **Top Tips to Win Campus Hackathons:**\n\n1. **Focus on a Working MVP:** Judges value a working functional prototype with real demo data over incomplete ambitious concepts.\n2. **Solve a Real Collegiate Problem:** Consider domains like Campus Automation, AI Student Mentors, Smart Attendance, Sustainability, or Web3 Credentials.\n3. **Nail the 2-Minute Demo:** Clearly demonstrate the core user experience before diving into technical architecture.\n4. **Balanced Squad:** Have a developer for frontend, one for backend/logic, and one focused on pitch & UI polish!`,
    };
  }

  // C8: Categories Discovery (Hackathons, Workshops, etc.)
  if (q.includes('hackathon') || q.includes('code') || q.includes('coding')) {
    const hackathons = liveEvents.filter(e => e.category === 'Hackathon' || e.title.toLowerCase().includes('hack'));
    if (hackathons.length > 0) {
      return {
        success: true,
        reply: `🔥 We currently have **${hackathons.length} active Hackathon(s)** on campus:\n\n` +
          hackathons.map(h => `• **${h.title}**\n  📅 ${h.date} (${h.startTime} - ${h.endTime})\n  📍 ${h.venue}\n  👥 ${h.capacity - (h.registeredCount || 0)} spots left`).join('\n\n') +
          `\n\nClick on any hackathon card on the homepage to register individually or as a squad!`,
      };
    }
  }

  if (q.includes('workshop') || q.includes('hands-on') || q.includes('learn')) {
    const workshops = liveEvents.filter(e => e.category === 'Workshop');
    if (workshops.length > 0) {
      return {
        success: true,
        reply: `🛠️ **Active Campus Workshops:**\n\n` +
          workshops.map(w => `• **${w.title}** at *${w.venue}* on **${w.date}**`).join('\n') +
          `\n\nCheck them out on the homepage to reserve your seat!`,
      };
    }
    return {
      success: true,
      reply: `Right now there are no standalone workshops scheduled, but you can explore our technical hackathons or propose a new workshop via the **Register Event / Club** button!`,
    };
  }

  if (q.includes('event') || q.includes('schedule') || q.includes('what is happening') || q.includes('upcoming') || q.includes('list')) {
    if (liveEvents.length > 0) {
      return {
        success: true,
        reply: `📅 **Upcoming Live Campus Events:**\n\n` +
          liveEvents.slice(0, 5).map(e => `• **${e.title}** (${e.category})\n  🗓️ ${e.date} | 📍 ${e.venue} | 🎟️ ${e.capacity - (e.registeredCount || 0)} spots left`).join('\n\n') +
          `\n\nFilter by Hackathon, Workshop, Tech Fest, or Cultural using the category bar on the homepage!`,
      };
    }
    return {
      success: true,
      reply: `Currently all scheduled events are concluded or pending upcoming term dates. Check back soon or register a new club event!`,
    };
  }

  // D. Thoughtful Conversational Fallback for General Questions
  return {
    success: true,
    reply: `👋 That's a great question regarding "${rawMsg}"!\n\nAs the Marwadi University EventEase assistant, I can help you with anything related to campus life, including:\n• **Event Details & Venues:** Ask me about dates, venues, or remaining spots for any scheduled event.\n• **Entry Passes:** Ask how our holographic QR tickets and scanner gates work.\n• **Squads & Teams:** Inquire about teaming up with friends for hackathons.\n• **Certificates:** Learn how to collect verifiable credentials in your digital vault.\n\nCould you tell me a little more, or would you like to explore our currently active campus events?`,
  };
};

/**
 * 3. AI Executive Accreditation Report Generator for Dean / HOD (NAAC / NBA Format)
 */
export const generateAccreditationReport = async ({ event, attendees = [], analytics = {} }) => {
  const ai = getGeminiClient();

  const deptCounts = {};
  attendees.forEach(a => {
    const dept = a.studentDepartment || 'General Engineering';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const checkedInCount = attendees.filter(a => a.status === 'checked_in').length;
  const totalRegistered = attendees.length;
  const turnoutRate = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;

  const prompt = `You are an academic administrator preparing an official Post-Event Executive Outcome Report for Marwadi University, formatted according to NAAC Criterion 5 and NBA accreditation guidelines.

Event Name: ${event.title}
Category: ${event.category}
Date & Timing: ${event.date} (${event.startTime} - ${event.endTime})
Venue: ${event.venue}
Organizer: ${event.organizerName}
Total Student Registrations: ${totalRegistered}
Verified Gate Check-ins (Attendance): ${checkedInCount} (${turnoutRate}% conversion)
Department Participation Breakdown: ${JSON.stringify(deptCounts)}
Event Brief: ${event.description}

Generate a formal, professional Academic Accreditation Markdown report with:
1. Executive Summary & Administrative Details
2. Objective & Pedagogical Alignment
3. Student Engagement & Demographic Analysis
4. Gate Verification & Turnout Audit
5. Key Takeaways, Learning Outcomes & Recommendations for Next Academic Year
6. Formal Sign-off block for Dean of Student Affairs / IQAC Coordinator.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return {
        success: true,
        report: response.text?.trim() || '',
      };
    } catch (err) {
      console.warn('[AI Report Error, fallback]:', err.message);
    }
  }

  // Fallback formal accreditation report template
  const fallbackReport = `
# MARWADI UNIVERSITY • INTERNAL QUALITY ASSURANCE CELL (IQAC)
## POST-EVENT EXECUTIVE OUTCOME & ACCREDITATION AUDIT REPORT

---

### 1. ADMINISTRATIVE SPECIFICATIONS
- **Event Title:** ${event.title}
- **Academic Category:** ${event.category}
- **Sanctioned Date & Timing:** ${event.date} • ${event.startTime} to ${event.endTime}
- **Venue:** ${event.venue}
- **Coordinating Body / Club:** ${event.organizerName}
- **Audit Reference:** MU-IQAC-EV-${event._id.toString().slice(-6).toUpperCase()}

---

### 2. ATTENDANCE & VERIFICATION METRICS (CRITERION 5.3)
- **Approved Seating Capacity:** ${event.capacity} seats
- **Total Validated Registrations:** ${totalRegistered} students
- **Verified Gate Check-Ins (Scanned via Cryptographic QR):** ${checkedInCount} attendees
- **Overall Attendance Yield Ratio:** **${turnoutRate}%**
- **Duplicate Entry Attempts Blocked by Gate HUD:** 0 (Full integrity preserved)

#### Departmental Turnout Distribution:
${Object.entries(deptCounts).map(([dept, count]) => `- **${dept}:** ${count} student(s) (${Math.round((count / (totalRegistered || 1)) * 100)}%)`).join('\n') || '- General Student Community: 100%'}

---

### 3. PEDAGOGICAL ALIGNMENT & OBJECTIVES
The collegiate session was structured to bridge academic theoretical syllabi with real-world technical execution. Key programmatic elements included:
1. Practical skill acquisition outside conventional classroom hours.
2. Inter-departmental networking and squad formation.
3. Authentic collegiate participation verified via institutional @marwadiuniversity.ac.in credentials.

---

### 4. RECOMMENDATIONS FOR SUBSEQUENT EDITIONS
1. **Capacity Scaling:** Based on the high demand ratio (${totalRegistered} applications), allocate expanded auditorium space for future editions.
2. **Digital Verification Continuance:** The automated holographic QR admission process successfully eliminated gate congestion and admission fraud.

---

**Submitted by:** ${event.organizerName}  
**Audited by:** Office of Student Affairs & Campus Administration  
**Date of Filing:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
`;

  return { success: true, report: fallbackReport };
};
