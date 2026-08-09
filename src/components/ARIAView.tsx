import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Send, Sparkles, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import AriaCharacter from '../assets/aria-character.svg';
import { chatWithARIA, detectDanger } from '../services/gemini';

interface ARIAViewProps {
  onBack: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  isEmergency?: boolean;
}

type CharacterState = 'GREETING' | 'IDLE' | 'THINKING' | 'SPEAKING' | 'ALERT';

const QUICK_PROMPTS = [
  'What to do in an emergency?',
  'Emergency Helplines',
  'Self-defense tips',
  'Night travel safety checklist',
];

const EMERGENCY_KEYWORDS = ['help', 'danger', 'sos', 'emergency', 'attack', 'unsafe'];

const SYSTEM_PROMPT = `You are ARIA (AI Response & Intelligence Assistant), a dedicated women's safety AI assistant. Your ONLY purpose is to help women in situations involving personal safety, danger, harassment, abuse, stalking, or emergencies.

CORE BEHAVIOR RULES:
- Always respond with empathy, calm, and urgency-awareness
- Never minimize or dismiss a user's concern
- Always prioritize immediate physical safety over everything else
- Keep responses clear, short, and actionable — a scared person cannot read long paragraphs
- Detect emotional distress from language cues and adjust tone accordingly

WHAT YOU HELP WITH:
1. EMERGENCY SITUATIONS
   - Guide user to call 112 (India) / 911 (US) / local emergency number
   - Tell them to share live location with a trusted contact
   - Suggest immediate escape routes or safe public spaces (police station, hospital, mall)
   - Remind them to make noise / attract attention if in immediate danger

2. HARASSMENT & STALKING
   - How to document incidents (screenshots, date/time logs)
   - How to file a police complaint or cyber complaint (cybercrime.gov.in for India)
   - Helpline numbers: iCall (9152987821), Vandrevala Foundation (1860-2662-345)
   - Block + report steps on social media platforms

3. DOMESTIC VIOLENCE / ABUSE
   - National Commission for Women helpline: 7827170170
   - iCall helpline: 9152987821
   - How to safely plan an exit
   - What to pack in an emergency bag
   - Legal rights under Protection of Women from Domestic Violence Act

4. SELF-DEFENSE TIPS
   - Simple physical techniques (palm strike, wrist escape, voice projection)
   - Safety apps to install: Shake2Safety, bSafe, Himmat Plus
   - Importance of trusting gut instinct

5. SAFE TRAVEL
   - Share trip details with trusted contacts
   - Prefer well-lit, populated routes at night
   - Cab safety: share OTP only after verifying driver, share ride details

6. MENTAL SUPPORT
   - Validate feelings without judgment
   - Encourage speaking to a trusted person or counselor
   - Vandrevala Foundation 24/7: 1860-2662-345
   - iCall: 9152987821

RESPONSE FORMAT:
- Start with empathy if user seems distressed (e.g., "I hear you. You're safe here.")
- Use bullet points or numbered steps for instructions
- Always end with one relevant helpline or next-step reminder
- Keep each response under 150 words unless the topic needs more detail

WHAT YOU NEVER DO:
- Never give generic "I don't know" replies
- Never tell the user to "calm down" or minimize their experience
- Never discuss topics unrelated to women's safety
- Never ask unnecessary questions when someone is in immediate danger

LANGUAGE:
- Respond in the same language the user writes in (Hindi, English, or Hinglish)
- Use simple, everyday words — no legal jargon

EXAMPLE INTERACTIONS:
User: "Someone is following me"
ARIA: "Stay calm. Walk into the nearest crowded place — a shop, restaurant, or petrol pump. Call someone you trust and stay on the line. If the threat continues, call 112 immediately. Do NOT go home alone right now."

User: "My boyfriend hit me"
ARIA: "What happened to you is not okay — and it is not your fault. You deserve to be safe. Please call NCW helpline: 7827170170 (free, 24/7). If you need to leave, I can help you plan that safely."`;

export const ARIAView: React.FC<ARIAViewProps> = ({ onBack }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      sender: 'bot',
      text: "Hello! I am ARIA, your Guardian AI Safety Assistant. ARIA stands for AI Response & Intelligence Assistant. I am here to keep you safe 24/7.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [charState, setCharState] = useState<CharacterState>('GREETING');
  const [showDangerBanner, setShowDangerBanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    if (!user) return;
    const loadChat = async () => {
      try {
        const q = query(
          collection(db, 'users', user.id, 'chats'),
          orderBy('timestamp', 'asc')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const history = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: data.id || doc.id,
              sender: data.sender,
              text: data.text,
              time: data.time,
              isEmergency: data.isEmergency
            } as Message;
          });
          setMessages(history);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };
    loadChat();
  }, [user]);

  // Transition from Greeting to Idle on mount
  useEffect(() => {
    const t = setTimeout(() => setCharState('IDLE'), 2000);
    return () => clearTimeout(t);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const checkEmergency = (text: string) => {
    return EMERGENCY_KEYWORDS.some(k => text.toLowerCase().includes(k));
  };

  const handleSend = async (textToSend?: string) => {
    const queryStr = textToSend || input;
    if (!queryStr.trim() || loading) return;

    const isEmerg = checkEmergency(queryStr);
    if (isEmerg) setCharState('ALERT');
    else setCharState('THINKING');

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: queryStr.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEmergency: isEmerg,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    if (user) {
      try {
        await addDoc(collection(db, 'users', user.id, 'chats'), {
          ...userMsg,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error('Failed to save user message:', error);
      }
    }

    try {
      const historyFormatted = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      // Detect danger level
      const dangerAnalysis = await detectDanger(queryStr);
      if (dangerAnalysis.suggestSOS) {
        setShowDangerBanner(true);
      } else {
        setShowDangerBanner(false);
      }

      const result = await chatWithARIA(queryStr, historyFormatted);
      if (!result.success) throw new Error("API Error");

      let responseText = result.text;
      const botMsg: Message = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      
      if (user) {
        try {
          await addDoc(collection(db, 'users', user.id, 'chats'), {
            ...botMsg,
            timestamp: serverTimestamp()
          });
        } catch (error) {
          console.error('Failed to save bot message:', error);
        }
      }
      
      setCharState('SPEAKING');
      setTimeout(() => {
        setCharState(isEmerg ? 'ALERT' : 'IDLE');
      }, 3000);

    } catch (err) {
      const botMsg: Message = {
        id: 'bot_err_' + Date.now(),
        sender: 'bot',
        text: "I am having trouble connecting right now. If you are in danger, please tap the SOS button on your dashboard immediately or call local emergency services (112 / 911).",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      
      if (user) {
        try {
          await addDoc(collection(db, 'users', user.id, 'chats'), {
            ...botMsg,
            timestamp: serverTimestamp()
          });
        } catch (error) {
          console.error('Failed to save bot error message:', error);
        }
      }
      
      setCharState('IDLE');
    } finally {
      setLoading(false);
    }
  };

  // Determine animation props based on character state
  const getCharacterAnimation = () => {
    switch (charState) {
      case 'GREETING':
        return { 
          animate: { opacity: 1, scale: 1, y: 0 },
          initial: { opacity: 0, scale: 0.8 },
          transition: { duration: 0.6, ease: "easeOut" }
        };
      case 'SPEAKING':
        return {
          animate: { scale: [1, 1.03, 1] },
          transition: { duration: 0.5, repeat: Infinity }
        };
      case 'THINKING':
        return {
          animate: { rotate: 2, scale: 1.02, y: 2 },
          transition: { duration: 0.4, ease: "easeInOut" }
        };
      case 'ALERT':
        return {
          animate: { scale: 1.05, y: -2, filter: 'drop-shadow(0px 0px 10px rgba(239,68,68,0.5))' },
          transition: { duration: 0.3, ease: "easeOut" }
        };
      case 'IDLE':
      default:
        return {
          animate: { y: [0, -6, 0] },
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        };
    }
  };

  const characterStyle = loading
    ? { filter: 'brightness(0.95) drop-shadow(0 8px 24px rgba(0,105,92,0.2))' }
    : { filter: 'drop-shadow(0 8px 24px rgba(0,105,92,0.2))' };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="aria-chat"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="min-h-screen flex flex-col max-w-md mx-auto shadow-2xl border-x border-slate-200"
        style={{ backgroundColor: '#F0FAF8' }} // Light mint/teal
      >
        {/* TOP SECTION (30%) - Character Avatar area */}
        <div style={{
          background: 'radial-gradient(ellipse at center top, #C8F0E8 0%, #F0FAF8 60%, transparent 100%)',
          borderRadius: '0 0 50% 50%',
          padding: '24px 16px 0 16px',
          marginBottom: '-8px'
        }} className="relative flex flex-col items-center justify-center shrink-0 border-b border-teal-100 z-10">
          
          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 bg-white/50 backdrop-blur hover:bg-white/80 rounded-full transition text-[#00695C] z-20"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Character */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="flex justify-center w-full"
          >
            <motion.img
              src={AriaCharacter}
              alt="ARIA Safety Assistant"
              className="h-48 w-auto object-contain transition-all duration-300"
              style={characterStyle}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: charState === 'SPEAKING' ? 1.02 : 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </motion.div>
          
          <div className="mt-2 text-center z-10 pb-4">
            <h1 className="font-serif text-[22px] font-black text-[#00695C]">ARIA</h1>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${charState === 'ALERT' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-[11px] font-bold text-teal-700/70 tracking-wide uppercase">Active Safety Assistant</span>
            </div>
          </div>
        </div>

        {/* Danger Banner */}
        {showDangerBanner && (
          <div className="bg-red-600 text-white p-3 mx-4 mt-4 rounded-xl text-center font-bold shadow-md cursor-pointer animate-pulse z-20 flex items-center justify-center gap-2" onClick={() => {}}>
            <ShieldAlert className="w-5 h-5" />
            <span>Are you in danger? Press SOS</span>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'bot' && (
                <img
                  src={AriaCharacter}
                  alt="ARIA"
                  className="w-8 h-8 rounded-full object-cover object-top flex-shrink-0 border-2 border-white shadow-sm"
                  style={{ background: '#E0F5F0' }}
                />
              )}

              <div
                className={`max-w-[75%] p-3.5 rounded-3xl text-[13px] leading-relaxed shadow-sm relative ${
                  m.sender === 'user'
                    ? 'bg-[#E8437A] text-white rounded-br-sm'
                    : 'bg-white text-slate-800 border-l-4 border-l-[#00695C] rounded-bl-sm border border-slate-100'
                }`}
              >
                {m.sender === 'bot' && m.isEmergency && (
                  <div className="flex items-center gap-1 mb-1 text-red-600 font-bold text-[10px] uppercase">
                    <ShieldAlert className="w-3 h-3" /> Priority Alert
                  </div>
                )}
                <p className="whitespace-pre-wrap">{m.text}</p>
                <span
                  className={`text-[9px] block text-right font-medium mt-1.5 ${
                    m.sender === 'user' ? 'text-pink-200' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </span>
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex items-end gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-[#00695C] border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-white p-3.5 rounded-3xl rounded-bl-sm border border-slate-100 shadow-sm flex gap-1 items-center h-10">
                <motion.div className="w-1.5 h-1.5 bg-teal-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 bg-teal-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 bg-teal-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-3 bg-white/50 backdrop-blur-md border-t border-teal-50 overflow-x-auto flex gap-2 no-scrollbar">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              key={idx}
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap px-4 py-2 bg-white hover:bg-[#E8437A] hover:text-white hover:border-[#E8437A] border border-[#00695C]/30 text-[#00695C] font-semibold rounded-full text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>{prompt}</span>
            </motion.button>
          ))}
        </div>

        {/* Input Box */}
        <div className="p-3 bg-white border-t border-teal-50 flex items-center gap-2 pb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask ARIA..."
            className="flex-1 px-4 py-3.5 bg-[#F0FAF8] rounded-2xl text-[13px] text-slate-800 placeholder-teal-700/40 focus:outline-none focus:ring-2 focus:ring-[#00695C]/30 transition-all border border-transparent focus:border-[#00695C]/20"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3.5 bg-[#00695C] hover:bg-[#004D40] text-white rounded-2xl disabled:opacity-50 transition-colors shadow-md"
            aria-label="Send Message"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
