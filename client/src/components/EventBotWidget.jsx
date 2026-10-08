import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Minimize2, Maximize2, Zap, Calendar, MapPin } from 'lucide-react';
import api from '../services/api';

const QUICK_PROMPTS = [
  'What events are happening soon?',
  'Are there any technical hackathons?',
  'How does QR gate check-in work?',
  'Which events have free seats?',
];

export function EventBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "👋 Hey! I'm **EventBot AI**, your Marwadi University campus concierge powered by Google Gemini. Ask me about upcoming club fests, technical hackathons, registration deadlines, or QR gate entry!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      const res = await api.ai.chat(textToSend.trim(), historyPayload);
      const botReply = res.reply || 'I am having trouble answering right now. Please try again!';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ ' + (err.message || 'Unable to connect to EventBot service. Check server connection.'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[550px] max-h-[80vh] bg-slate-900/95 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-200 mb-3">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm font-cyber">EVENTBOT AI</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    GEMINI 2.5
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">Live Marwadi University Campus Guide</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs sm:text-sm custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-xs shadow-md shadow-cyan-900/40'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-xs shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-1 font-mono ${
                      msg.role === 'user' ? 'text-cyan-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl px-3.5 py-2 text-slate-400 text-xs font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-cyan-300 ml-1">Analyzing campus schedule...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions pills */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-slate-800/90 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-750 transition-colors cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-950 border-t border-cyan-500/20 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask EventBot anything..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-950/50"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-400/60 hover:scale-105 active:scale-95 transition-all duration-300 border border-cyan-300/40"
        aria-label="Toggle EventBot Assistant"
      >
        <div className="relative">
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold font-cyber tracking-wider">EVENTBOT AI</p>
          <p className="text-[10px] text-cyan-100 font-mono flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Ask Campus Copilot
          </p>
        </div>
      </button>
    </div>
  );
}

export default EventBotWidget;
