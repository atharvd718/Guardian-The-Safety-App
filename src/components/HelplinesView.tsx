import React, { useState } from 'react';
import { CaretDown, CaretUp, MagnifyingGlass, PhoneCall, ArrowLeft, X } from '@phosphor-icons/react';

const helplineData = [
  {
    category: "🆘 Emergency",
    color: "#D32F2F",
    bgColor: "#FFEBEE",
    tags: ["emergency", "police", "ambulance", "urgent", "danger"],
    numbers: [
      { name: "Police / Universal Emergency", number: "112" },
      { name: "Police", number: "100" },
      { name: "Ambulance", number: "108" },
    ],
  },
  {
    category: "🏠 Domestic Violence & Abuse",
    color: "#C2185B",
    bgColor: "#FCE4EC",
    tags: ["domestic", "violence", "abuse", "husband", "family", "home", "beating", "assault"],
    numbers: [
      { name: "Women Helpline (24/7)", number: "181" },
      { name: "National Commission for Women", number: "7827170170" },
      { name: "Women in Distress", number: "1091" },
      { name: "Family Counseling", number: "14266" },
    ],
  },
  {
    category: "💍 Dowry Harassment",
    color: "#7B1FA2",
    bgColor: "#F3E5F5",
    tags: ["dowry", "harassment", "in-laws", "dahej", "shaadi", "marriage", "pressure"],
    numbers: [
      { name: "Women Helpline", number: "181" },
      { name: "NCW Helpline", number: "7827170170" },
    ],
  },
  {
    category: "👶 Child Abuse / Missing Child",
    color: "#1565C0",
    bgColor: "#E3F2FD",
    tags: ["child", "missing", "kids", "abuse", "childline", "bachcha", "minor"],
    numbers: [
      { name: "Childline (24/7)", number: "1098" },
      { name: "Missing Children Helpline", number: "1094" },
    ],
  },
  {
    category: "⚖️ Legal Help",
    color: "#2E7D32",
    bgColor: "#E8F5E9",
    tags: ["legal", "lawyer", "court", "law", "rights", "free", "aid", "nalsa", "justice"],
    numbers: [
      { name: "NALSA — Free Legal Aid", number: "15100" },
      { name: "Free Legal Aid for Women", number: "18001801551" },
    ],
  },
  {
    category: "🧠 Mental Health & Counseling",
    color: "#00838F",
    bgColor: "#E0F7FA",
    tags: ["mental", "health", "counseling", "sad", "depression", "anxiety", "stress", "icall", "therapy", "suicide", "help"],
    numbers: [
      { name: "iCall (Mon–Sat 8am–10pm)", number: "9152987821" },
      { name: "Vandrevala Foundation (24/7)", number: "18602662345" },
    ],
  },
  {
    category: "🌐 Cyber Harassment",
    color: "#E65100",
    bgColor: "#FFF3E0",
    tags: ["cyber", "online", "internet", "social media", "stalking", "photo", "blackmail", "threat", "morphed"],
    numbers: [
      { name: "Cyber Crime Helpline", number: "1930" },
    ],
  },
  {
    category: "🏥 Sexual Assault",
    color: "#AD1457",
    bgColor: "#FCE4EC",
    tags: ["sexual", "assault", "rape", "abuse", "molestation", "touch", "harassment"],
    numbers: [
      { name: "Women Helpline", number: "181" },
      { name: "NCW Helpline", number: "7827170170" },
    ],
  },
];

interface HelplinesViewProps {
  onBack: () => void;
}

export const HelplinesView: React.FC<HelplinesViewProps> = ({ onBack }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  // Filter logic — searches category name, number names, tags
  const filteredData = helplineData
    .map((section) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return { ...section, filteredNumbers: section.numbers };

      const categoryMatch =
        section.category.toLowerCase().includes(query) ||
        section.tags.some((tag) => tag.includes(query));

      const matchedNumbers = section.numbers.filter(
        (n) =>
          n.name.toLowerCase().includes(query) ||
          n.number.includes(query)
      );

      if (categoryMatch) return { ...section, filteredNumbers: section.numbers };
      if (matchedNumbers.length > 0) return { ...section, filteredNumbers: matchedNumbers };
      return null;
    })
    .filter(Boolean) as typeof helplineData & { filteredNumbers: typeof helplineData[0]['numbers'] }[];

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white pt-6 pb-4 px-5 shadow-sm rounded-b-3xl z-10 relative">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <ArrowLeft weight="bold" className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-serif font-bold tracking-tight m-0 flex-1">
            Emergency Helplines
          </h2>
        </div>
        <p className="text-white/85 text-sm font-medium pl-11">
          Tap any number to call directly
        </p>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-8">
        
        {/* Search Bar */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center bg-[var(--color-surface)] backdrop-blur-md rounded-2xl px-4 py-3 gap-3 border border-[var(--color-border)] shadow-sm focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all">
            <MagnifyingGlass weight="bold" className="w-5 h-5 text-[var(--color-primary)]" />
            <input
              type="text"
              placeholder='Search "dowry", "cyber", "mental health"...'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setExpandedIndex(null);
              }}
              className="border-none bg-transparent outline-none text-sm text-[var(--color-foreground)] flex-1 placeholder:text-[var(--color-muted)]"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors p-1"
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Result Count */}
          {isSearching && (
            <p className="text-xs text-[var(--color-muted)] mt-2 font-medium px-1">
              {filteredData.length > 0
                ? `Found ${filteredData.length} categor${filteredData.length > 1 ? "ies" : "y"} for "${searchQuery}"`
                : `No results for "${searchQuery}"`}
            </p>
          )}
        </div>

        {/* Quick Call Buttons — hide when searching */}
        {!isSearching && (
          <div className="flex gap-3 px-5 pb-4">
            {[
              { label: "Police", number: "112", bg: "bg-[#D32F2F]" },
              { label: "Women", number: "181", bg: "bg-[#C2185B]" },
              { label: "Ambulance", number: "108", bg: "bg-[#1565C0]" },
            ].map((item) => (
              <button
                key={item.number}
                onClick={() => handleCall(item.number)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 ${item.bg} text-white py-3 rounded-2xl shadow-sm active:scale-95 transition-transform`}
              >
                <PhoneCall weight="fill" className="w-5 h-5 mb-1" />
                <span className="font-bold text-xs">{item.label}</span>
                <span className="text-[10px] opacity-85 font-medium">{item.number}</span>
              </button>
            ))}
          </div>
        )}

        {/* No Results State */}
        {isSearching && filteredData.length === 0 && (
          <div className="text-center px-6 py-12">
            <div className="bg-white/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--color-border)]">
              <MagnifyingGlass weight="duotone" className="w-10 h-10 text-[var(--color-muted)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-1">
              No helplines found
            </h3>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Try words like "abuse", "legal", "child", "cyber", "dowry"
            </p>
            <button
              onClick={() => handleCall("181")}
              className="bg-[var(--color-primary)] text-white border-none rounded-full px-6 py-3 text-sm font-bold shadow-md active:scale-95 transition-transform inline-flex items-center gap-2"
            >
              <PhoneCall weight="fill" className="w-4 h-4" />
              Call Women Helpline 181
            </button>
          </div>
        )}

        {/* Helpline List */}
        <div className="px-5 flex flex-col gap-3">
          {filteredData.map((section, idx) => (
            <div
              key={idx}
              className="bg-[var(--color-surface)] backdrop-blur-sm rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm"
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                style={{ backgroundColor: section.bgColor }}
                className="w-full px-4 py-4 flex justify-between items-center text-left transition-colors"
              >
                <span style={{ color: section.color }} className="font-bold text-sm">
                  {section.category}
                </span>
                <span style={{ color: section.color }}>
                  {expandedIndex === idx || isSearching ? (
                    <CaretUp weight="bold" className="w-4 h-4" />
                  ) : (
                    <CaretDown weight="bold" className="w-4 h-4" />
                  )}
                </span>
              </button>

              {/* Numbers — auto expand when searching */}
              {(expandedIndex === idx || isSearching) && (
                <div className="bg-white/40">
                  {section.filteredNumbers.map((item, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center p-4 ${i !== 0 ? 'border-t border-black/5' : ''}`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="text-xs font-semibold text-[var(--color-foreground)]">
                          {item.name}
                        </div>
                        <div style={{ color: section.color }} className="text-sm font-bold mt-1">
                          {item.number}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCall(item.number)}
                        style={{ backgroundColor: section.color }}
                        className="text-white border-none rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                      >
                        <PhoneCall weight="fill" className="w-3.5 h-3.5" />
                        Call
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        {!isSearching && (
          <div className="mx-5 mt-6 mb-4 px-4 py-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-center">
            <span className="text-xs font-medium text-[#2E7D32]">
              💚 One Stop Centre (Sakhi) — shelter + medical + legal + counseling, free in every district
            </span>
          </div>
        )}
        
      </div>
    </div>
  );
};
