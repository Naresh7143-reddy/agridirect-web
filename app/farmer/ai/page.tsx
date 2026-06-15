'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { aiApi } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_PROMPTS = [
  { emoji: '🐛', label: 'Disease help' },
  { emoji: '💰', label: 'Best selling price' },
  { emoji: '🌾', label: 'Crop advice' },
  { emoji: '☀️', label: 'Weather tips' },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Namaste! 🌱 I'm Krishi AI, your farming assistant. Ask me about crop diseases, market prices, weather tips, government schemes — anything farming.",
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msg };
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const res = await aiApi.chat(msg, 'English', history);
      const reply: string =
        (res?.data && typeof res.data === 'object' && res.data.reply) ||
        (typeof res?.data === 'string' && res.data) ||
        'Sorry, I could not generate a reply.';
      setMessages((m) => [...m, { id: Date.now().toString() + 'a', role: 'assistant', text: reply }]);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Connection error';
      setMessages((m) => [...m, { id: Date.now().toString() + 'a', role: 'assistant', text: `⚠️ ${msg}` }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="flex flex-col h-[calc(100vh-4rem-2rem)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-6 px-6">
          <div className="container-x flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Krishi AI</h1>
              <p className="text-sm text-white/80">Your farming assistant · Powered by Groq Llama 3.3 70B</p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6">
          <div className="container-x max-w-3xl space-y-4">
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="size-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                      <Sparkles className="size-4" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white shadow-card rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  </div>
                </motion.div>
              ))}
              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="size-9 rounded-full bg-primary text-white flex items-center justify-center">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="bg-white shadow-card rounded-2xl px-5 py-3 flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-ink-2 text-sm">Thinking…</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="container-x max-w-3xl pb-4">
            <div className="flex gap-2 flex-wrap">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(`${q.label} for tomato in Andhra Pradesh`)}
                  className="rounded-full bg-white shadow-card px-4 py-2 text-sm font-semibold hover:shadow-hover transition"
                >
                  {q.emoji} {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-border py-4 px-4">
          <div className="container-x max-w-3xl flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about crops, prices, weather…"
              className="flex-1 px-5 py-3 rounded-full bg-bg border-2 border-transparent focus:border-primary outline-none"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || typing}
              className="size-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
