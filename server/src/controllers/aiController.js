import { generateEventCopilot, chatWithEventBot, generateAccreditationReport } from '../services/aiService.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';

export const handleGenerateEventCopilot = async (req, res) => {
  try {
    const topic = req.body.topic || req.body.prompt;
    const { category, targetAudience } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a topic or prompt' });
    }

    const result = await generateEventCopilot({
      topic: topic.trim(),
      category: category || 'Hackathon',
      targetAudience: targetAudience || 'University Students',
    });

    return res.json(result);
  } catch (error) {
    console.error('handleGenerateEventCopilot error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate event with AI' });
  }
};

export const handleChatEventBot = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Load active approved events for context
    const activeEvents = await Event.find({
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
    }).sort({ createdAt: -1 }).limit(15);

    const result = await chatWithEventBot({
      message: message.trim(),
      conversationHistory: conversationHistory || [],
      liveEvents: activeEvents,
    });

    return res.json(result);
  } catch (error) {
    console.error('handleChatEventBot error:', error);
    return res.status(500).json({ success: false, message: 'EventBot service error' });
  }
};

export const handleGenerateAccreditationReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Fetch all attendees
    const attendees = await Registration.find({ event: eventId });

    const result = await generateAccreditationReport({
      event,
      attendees,
    });

    return res.json(result);
  } catch (error) {
    console.error('handleGenerateAccreditationReport error:', error);
    return res.status(500).json({ success: false, message: 'Report generation failed' });
  }
};
