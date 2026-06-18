'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Camera, X, ImageIcon, ChevronDown } from 'lucide-react';
import { aiApi } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string;
}

const LANGUAGES = [
  { code: 'English', label: 'English', flag: '🇬🇧' },
  { code: 'Telugu',  label: 'తెలుగు',  flag: '🇮🇳' },
  { code: 'Hindi',   label: 'हिन्दी',   flag: '🇮🇳' },
  { code: 'Tamil',   label: 'தமிழ்',   flag: '🇮🇳' },
];

const QUICK_PROMPTS = [
  { emoji: '🐛', label: 'Identify disease',    prompt: 'What disease does my tomato plant have? How do I treat it?' },
  { emoji: '💰', label: 'Best selling price',  prompt: 'What is the current market price for tomato in Andhra Pradesh?' },
  { emoji: '🌾', label: 'Crop advice',         prompt: 'What crops should I grow this season in Andhra Pradesh?' },
  { emoji: '☀️', label: 'Weather tips',        prompt: 'How do I protect my crops from summer heat in Telangana?' },
];

const WELCOME: Record<string, string> = {
  English: "Namaste! 🌱 I'm Krishi AI, your farming assistant. Ask me about crop diseases, market prices, weather tips, government schemes — anything farming.\n\n📸 You can also upload a photo of your plant and I'll help identify diseases!",
  Telugu:  "నమస్కారం! 🌱 నేను కృషి AI, మీ వ్యవసాయ సహాయకుడిని. పంట వ్యాధులు, మార్కెట్ ధరలు, వాతావరణ చిట్కాలు — ఏదైనా అడగండి.\n\n📸 మీ మొక్క ఫోటో పంపండి, వ్యాధి గుర్తించడంలో సహాయం చేస్తాను!",
  Hindi:   "नमस्ते! 🌱 मैं कृषि AI हूँ, आपका कृषि सहायक। फसल रोग, बाज़ार भाव, मौसम सुझाव — कुछ भी पूछें।\n\n📸 अपनी फसल की फ़ोटो भेजें, मैं रोग पहचानने में मदद करूँगा!",
  Tamil:   "வணக்கம்! 🌱 நான் கிருஷி AI, உங்கள் வேளாண் உதவியாளர். பயிர் நோய்கள், சந்தை விலை, வானிலை குறிப்புகள் — எதுவும் கேளுங்கள்.\n\n📸 உங்கள் செடியின் படம் அனுப்புங்கள், நோயை அடையாளம் காண உதவுவேன்!",
};

export default function AIChatPage() {
  const [language, setLanguage] = useState('English');
  const [langOpen, setLangOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME['English'] },
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

  const switchLanguage = (lang: string) => {
    setLanguage(lang);
    setLangOpen(false);
    setMessages([{ id: 'welcome-' + lang, role: 'assistant', text: WELCOME[lang] }]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
      if (!input.trim()) setInput('Identify any diseases or problems in my crop shown in this photo.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearImage = () => { setImagePreview(null); setImageBase64(null); };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg && !imagePreview) return;
    const finalText = msg || 'Identify any diseases or problems in my crop shown in this photo.';
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: finalText, image: imagePreview ?? undefined };
    const history = messages.filter((m) => !m.id.startsWith('welcome')).map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, userMsg]);
    setInput('');
    const sentImage = imageBase64;
    clearImage();
    setTyping(true);
    try {
      const res = await aiApi.chat(finalText, language, history, sentImage ?? undefined);
      const reply: string =
        (res?.data && typeof res.data === 'object' && res.data.reply) ||
        (typeof res?.data === 'string' && res.data) ||
        res?.reply ||
        'Sorry, I could not generate a reply.';
      setMessages((m) => [...m, { id: Date.now().toString() + 'a', role: 'assistant', text: reply }]);
    } catch (e: any) {
      const errMsg = e?.response?.data?.message ?? e?.message ?? 'Connection error';
      setMessages((m) => [...m, { id: Date.now().toString() + 'a', role: 'assistant', text: `⚠️ ${errMsg}` }]);
    } finally {
      setTyping(false);
    }
  };

  const activeLang = LANGUAGES.find((l) => l.code === language)!;

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="flex flex-col h-[calc(100vh-4rem-2rem)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-4 px-6">
          <div className="container-x flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-white/20 flex items-center justify-center">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold">Krishi AI</h1>
                <p className="text-xs text-white/70">Your farming assistant</p>
              </div>
            </div>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 text-sm font-semibold transition"
              >
                {activeLang.flag} {activeLang.label} <ChevronDown className="size-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl py-2 min-w-[140px] z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => switchLanguage(l.code)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-bg transition text-left ${l.code === language ? 'text-primary' : 'text-ink-1'}`}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat messages */}
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
                      <p className="whitespace-pre-wrap leading-relaxed text-sm">{m.text}</p>
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

        {/* Quick prompts — show only on first load */}
        {messages.length <= 1 && (
          <div className="container-x max-w-3xl pb-3 px-4">
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
              <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-primary/20">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-ink-2 flex-1">Photo attached — tap Send to analyze for diseases</span>
              <button onClick={clearImage} className="size-7 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error hover:text-white transition">
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="bg-white border-t border-border py-3 px-4">
          <div className="container-x max-w-3xl flex gap-2 items-center">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload crop photo for disease detection"
              className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition flex-shrink-0"
            >
              <Camera className="size-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={imagePreview ? 'Ask about this photo…' : language === 'Telugu' ? 'పంట గురించి అడగండి…' : language === 'Hindi' ? 'फसल के बारे में पूछें…' : language === 'Tamil' ? 'பயிர் பற்றி கேளுங்கள்…' : 'Ask about crops, diseases, prices…'}
              className="flex-1 px-5 py-3 rounded-full bg-bg border-2 border-transparent focus:border-primary outline-none text-sm"
            />
            <button
              onClick={() => send()}
              disabled={(!input.trim() && !imagePreview) || typing}
              className="size-11 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
            >
              <Send className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
