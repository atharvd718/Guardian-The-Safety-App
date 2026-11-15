import React, { useState } from 'react';
import { ArrowLeft, PlayCircle, MagnifyingGlass, YoutubeLogo } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomableStage } from './ZoomableStage';

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
  },
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
  const [readerScale, setReaderScale] = useState<number>(100);

  const handleAskAria = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: query.trim() }] }],
          generationConfig: {
            response_mime_type: 'application/json',
          },
        }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error.message || 'API Error');

      const responseText = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(responseText);

      setResult({
        advice: parsed.advice || 'No advice found.',
        youtubeUrl:
          parsed.youtubeUrl || 'https://www.youtube.com/results?search_query=women+self+defense',
      });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      setError('Failed to fetch advice from ARIA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Header */}
      <div className="px-4 py-3.5 bg-[var(--color-surface)] backdrop-blur-md border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 z-20">
        <button
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] -ml-2 rounded-full hover:bg-black/5 flex items-center justify-center transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-serif font-bold tracking-tight flex-1">Self-Defense</h1>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
          {[85, 100, 115, 130].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setReaderScale(pct)}
              className={`min-h-[32px] px-2 text-[11px] font-mono tabular-nums font-bold rounded-lg transition-colors ${
                readerScale === pct
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* Zoomable Visual Defense FlowChart */}
        <div className="px-4 pt-5 space-y-2">
          <h2 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
            Zoomable Defense Response Map
          </h2>
          <ZoomableStage title="5-Step Escape Protocol & Strike Zones">
            <div className="space-y-3" style={{ fontSize: `${readerScale}%` }}>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[var(--color-surface-tint)] border border-[var(--color-border)]">
                  <span className="text-[11px] font-bold text-[var(--color-primary)] block">
                    01. Voice & Distance
                  </span>
                  <p className="text-xs mt-1 leading-snug">
                    Project a loud command (&ldquo;BACK OFF!&rdquo;) and step diagonally out of
                    reach.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-tint)] border border-[var(--color-border)]">
                  <span className="text-[11px] font-bold text-[var(--color-primary)] block">
                    02. Wrist Break
                  </span>
                  <p className="text-xs mt-1 leading-snug">
                    Rotate wrist sharply toward the attacker&apos;s thumb—the weakest point of any
                    grip.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-tint)] border border-[var(--color-border)]">
                  <span className="text-[11px] font-bold text-[var(--color-primary)] block">
                    03. High-Impact Targets
                  </span>
                  <p className="text-xs mt-1 leading-snug">
                    Heel of palm to nose/chin, knee to groin, or stomp instep cleanly.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-tint)] border border-[var(--color-border)]">
                  <span className="text-[11px] font-bold text-[var(--color-primary)] block">
                    04. Create Gap & Run
                  </span>
                  <p className="text-xs mt-1 leading-snug">
                    Do not stay to fight. Sprint toward lit shops, guards, or tap SOS immediately.
                  </p>
                </div>
              </div>
            </div>
          </ZoomableStage>
        </div>

        {/* Static Library */}
        <div className="px-4 pt-6 pb-4">
          <h2 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3">
            Quick Video Techniques
          </h2>
          <div className="space-y-4">
            {STATIC_VIDEOS.map((video, idx) => (
              <div
                key={idx}
                className="bg-[var(--color-surface-elevated)] rounded-2xl overflow-hidden shadow-sm border border-[var(--color-border)]"
              >
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
                  />
                </div>
                <div className="p-4 flex items-center gap-3">
                  <PlayCircle className="w-6 h-6 text-[var(--color-primary)]" weight="fill" />
                  <span className="font-semibold text-sm">{video.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Generator Section */}
        <div className="px-4 py-6 bg-[var(--color-surface-tint)] border-t border-[var(--color-border)] mt-4">
          <h2 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">
            Ask ARIA for Specific Moves
          </h2>
          <p className="text-xs text-[var(--color-muted)] mb-4">
            Need to know how to escape a specific hold? Ask ARIA for step-by-step guidance.
          </p>

          <div className="relative mb-5">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Someone grabs my hair from behind"
              className="w-full min-h-[48px] pl-4 pr-14 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
              onKeyDown={(e) => e.key === 'Enter' && handleAskAria()}
            />
            <button
              onClick={handleAskAria}
              disabled={loading}
              className="absolute right-2 top-2 min-h-[36px] min-w-[36px] p-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-active)] disabled:opacity-50 transition"
              aria-label="Ask ARIA"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <MagnifyingGlass className="w-4 h-4" weight="bold" />
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl mb-4 border border-rose-200">
              {error}
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-surface-elevated)] p-5 rounded-2xl shadow-sm border border-[var(--color-border)]"
                style={{ fontSize: `${readerScale}%` }}
              >
                <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider block mb-2">
                  ARIA&apos;s Advice
                </span>
                <p className="text-sm leading-relaxed mb-5">{result.advice}</p>
                <a
                  href={result.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] py-3 bg-[#FF0000] hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
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
