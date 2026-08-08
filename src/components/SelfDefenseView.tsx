import React, { useState } from 'react';
import { ArrowLeft, PlayCircle, MagnifyingGlass, YoutubeLogo } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

interface SelfDefenseViewProps {
  onBack: () => void;
}

const STATIC_VIDEOS = [
  {
    title: 'Wrist Grab Escape',
    id: 'T7aNSRoDCmg',
  },
  {
    title: 'Chokehold Defense',
    id: 'k9Jn0eP-ZVg',
  },
  {
    title: 'Situational Awareness',
    id: 'sS8pG_oV_gM',
  }
];

const SYSTEM_PROMPT = `You are ARIA, a women's safety expert. The user is asking for self-defense advice.
Respond strictly in JSON format with exactly two fields:
- "advice": Clear, step-by-step instructions (under 100 words).
- "youtubeUrl": A highly relevant YouTube search URL for the technique, formatted exactly like "https://www.youtube.com/results?search_query=women+self+defense+<specific+topic>"`;

export const SelfDefenseView: React.FC<SelfDefenseViewProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ advice: string; youtubeUrl: string } | null>(null);
  const [error, setError] = useState('');

  const handleAskAria = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: query.trim() }] }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error.message || "API Error");

      const responseText = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(responseText);

      setResult({
        advice: parsed.advice || "No advice found.",
        youtubeUrl: parsed.youtubeUrl || "https://www.youtube.com/results?search_query=women+self+defense"
      });

    } catch (err: any) {
      console.error("Gemini API Error:", err);
      setError("Failed to fetch advice from ARIA. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative max-h-[850px]">
      {/* Header */}
      <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition active:scale-95">
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="text-xl font-serif font-bold text-slate-900 tracking-tight">Self-Defense</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Static Library */}
        <div className="px-5 pt-6 pb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Techniques</h2>
          <div className="space-y-4">
            {STATIC_VIDEOS.map((video, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <div className="aspect-video relative bg-slate-900">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  ></iframe>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <PlayCircle className="w-6 h-6 text-rose-500 weight-fill" />
                  <span className="font-semibold text-slate-800">{video.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Generator Section */}
        <div className="px-5 py-6 bg-slate-100 border-t border-slate-200 mt-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Ask ARIA for Specific Moves</h2>
          <p className="text-xs text-slate-500 mb-4">
            Need to know how to escape a specific hold? Ask ARIA and she will generate a tutorial link instantly.
          </p>

          <div className="relative mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Someone grabs my hair from behind"
              className="w-full pl-4 pr-12 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAskAria()}
            />
            <button
              onClick={handleAskAria}
              disabled={loading}
              className="absolute right-2 top-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <MagnifyingGlass className="w-5 h-5" weight="bold" />
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-xl mb-4 border border-rose-200">
              {error}
            </div>
          )}

          {/* AI Result Card */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">ARIA's Advice</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5">
                  {result.advice}
                </p>
                <a
                  href={result.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#FF0000] hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <YoutubeLogo weight="fill" className="w-5 h-5" />
                  <span>Watch on YouTube</span>
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
