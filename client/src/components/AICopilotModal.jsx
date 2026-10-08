import React, { useState } from 'react';
import { Sparkles, X, Check, Wand2, Loader2, BookOpen, Clock, Tag } from 'lucide-react';
import api from '../services/api';

export function AICopilotModal({ isOpen, onClose, onApplyGeneratedData }) {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('Hackathon');
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please provide a brief description or theme for your event.');
      return;
    }

    setError('');
    setLoading(true);
    setGeneratedResult(null);

    try {
      const res = await api.ai.generateEvent(prompt, category);
      const blueprint = res.data || res.event;
      if (res.success && blueprint) {
        setGeneratedResult({
          ...blueprint,
          capacity: blueprint.capacity || blueprint.suggestedCapacity || 100,
          venue: blueprint.venue || blueprint.suggestedVenue || '',
        });
      } else {
        setError(res.message || 'Generation returned empty. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate event blueprint.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;
    onApplyGeneratedData(generatedResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-950/80 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-cyber">AI EVENT COPILOT</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  GEMINI 2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Transform a single prompt into a production-ready campus event proposal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Prompt inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Target Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {['Hackathon', 'Workshop', 'Tech Fest', 'Seminar', 'Cultural', 'Gaming'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-2 text-xs font-mono rounded-xl border text-center transition-all ${
                      category === cat
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Describe Your Event Idea / Theme
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g., 24-hour Web3 & AI hackathon for beginners with mentor rounds, food, and cash bounty on Solana"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
                ⚠️ {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Comprehensive Event Spec...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Synthesize Event with Gemini
                </>
              )}
            </button>
          </div>

          {/* Generated Result Preview */}
          {generatedResult && (
            <div className="border border-cyan-500/30 bg-slate-950/80 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> BLUEPRINT SYNTHESIZED
                </span>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {generatedResult.category}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-cyber">{generatedResult.title}</h3>
                <p className="text-xs text-cyan-300 font-mono mt-0.5">{generatedResult.tagline}</p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{generatedResult.description}</p>
              </div>

              {generatedResult.agenda && (
                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                  <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                    Hour-By-Hour Agenda:
                  </span>
                  <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{generatedResult.agenda}</p>
                </div>
              )}

              {generatedResult.prerequisites && (
                <div className="text-xs text-slate-400">
                  <span className="font-mono text-slate-300 font-bold">Prerequisites:</span> {generatedResult.prerequisites}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Auto-Fill Event Form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AICopilotModal;
