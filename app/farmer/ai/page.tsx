'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Camera, X, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { aiApi } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string; // data URL for display
}

const QUICK_PROMPTS = [
  { emoji: '🐛', label: 'Identify disease', prompt: 'What disease does my tomato plant have? How do I treat it?' },
  { emoji: '💰', label: 'Best selling price', prompt: 'What is the current market price for tomato in Andhra Pradesh?' },
  { emoji: '🌾', label: 'Crop advice', prompt: 'What crops should I grow this season in Andhra Pradesh?' },
  { emoji: '☀️', label: 'Weather tips', prompt: 'How do I protect my crops from summer heat in Telangana?' },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Namaste! 🌱 I'm Krishi AI, your farming assistant. Ask me about crop diseases, market prices, weather tips, government schemes — anything farming.\n\n📸 You can also upload a photo of your plant and I'll help identify diseases!",
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      // Extract pure base64 (strip "data:image/...;base64," prefix)
      setImageBase64(dataUrl.split(',')[1]);
      if (!input.trim()) {
        setInput('Identify any diseases or problems in my crop shown in this photo.');
      }
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg && !imagePreview) return;

    const finalText = msg || 'Identify any diseases or problems in my crop shown in this photo.';
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: finalText,
      image: imagePreview ?? undefined,
    };
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.text }));

    setMessages((m) => [...m, userMsg]);
    setInput('');
    const sentImage = imageBase64;
    clearImage();
    setTyping(true);

    try {
      const res = await aiApi.chat(finalText, 'English', history, sentImage ?? undefined);
      const reply: string =
        (res?.data && typeof res.data === 'object' && res.data.reply) ||
        (typeof res?.data === 'string' && res.data) ||
        'Sorry, I could not generate a reply.';
      setMessages((m) => [...m, { id: Date.now().toString() + 'a', role: 'assistant', text: reply }]);
    } catch (e: any) {
      const errMsg = e?.response?.data?.message ?? e?.message ?? 'Connection error';
      setMessages((m) => [...m, { id: Date.now().toString() + 'a', role: 'assistant', text: `⚠️ ${errMsg}` }]);
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
              <p className="text-sm text-white/80">Your farming assistant · Powered by Groq Llama 3</p>
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
                  <div className={`max-w-[80%] space-y-2 ${m.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                    {m.image && (
                      <div className="rounded-2xl overflow-hidden border-2 border-white/30 shadow-card max-w-[260px]">
                        <img src={m.image} alt="Uploaded crop" className="w-full object-cover max-h-48" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-5 py-3 ${
                      m.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white shadow-card rounded-bl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    </div>
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
          <div className="container-x max-w-3xl pb-4 px-4">
            <div className="flex gap-2 flex-wrap">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.prompt)}
                  className="rounded-full bg-white shadow-card px-4 py-2 text-sm font-semibold hover:shadow-hover transition"
                >
                  {q.emoji} {q.label}
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-semibold hover:bg-primary hover:text-white transition flex items-center gap-1.5"
              >
                <Camera className="size-4" /> Upload plant photo
              </button>
            </div>
          </div>
        )}

        {/* Image preview strip */}
        {imagePreview && (
          <div className="container-x max-w-3xl px-4 pb-2">
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-2xl px-3 py-2">
              <ImageIcon className="size-4 text-primary flex-shrink-0" />
              <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-primary/20">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-ink-2 flex-1">Photo attached — tap Send to analyze for diseases</span>
              <button onClick={clearImage} className="size-7 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error hover:text-white transition">
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-border py-4 px-4">
          <div className="container-x max-w-3xl flex gap-2 items-center">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload crop photo for disease detection"
              className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition flex-shrink-0"
            >
              <Camera className="size-5" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={imagePreview ? 'Ask about this photo…' : 'Ask about crops, prices, weather…'}
              className="flex-1 px-5 py-3 rounded-full bg-bg border-2 border-transparent focus:border-primary outline-none"
            />
            <button
              onClick={() => send()}
              disabled={(!input.trim() && !imagePreview) || typing}
              className="size-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
            >
              <Send className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
