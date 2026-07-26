'use client';

import { useState, useEffect, useRef } from 'react';
import { supportApi } from '@/lib/api';
import { Send, Loader2, Bot, User, ArrowLeft, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function SupportChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await supportApi.getMessages();
      setMessages(res.data || res || []);
    } catch (err) {
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll for new messages (e.g. agent replies) every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      await supportApi.sendMessage(content);
      await fetchMessages();
    } catch (err) {
      toast.error('Failed to send message');
      setInput(content); // restore input on failure
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto h-[85vh] flex flex-col bg-white rounded-3xl shadow-card border-2 border-border overflow-hidden">
      {/* Chat Header */}
      <div className="bg-ink-1 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="hover:bg-white/10 p-2 rounded-full transition">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center border-2 border-white/20">
              <Bot className="size-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg">AgriDirect Support</h1>
              <div className="flex items-center gap-1.5 text-sm text-white/70">
                <span className="size-2 rounded-full bg-success"></span> Online typically replies in minutes
              </div>
            </div>
          </div>
        </div>
        <button className="hover:bg-white/10 p-3 rounded-full transition text-white">
          <Phone className="size-5" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="text-center text-ink-3 my-auto">
            <Bot className="size-12 mx-auto mb-3 opacity-20" />
            <p>Send a message to start a conversation.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.fromUser;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id || idx} 
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`size-8 rounded-full flex shrink-0 items-center justify-center mt-auto ${isUser ? 'bg-primary' : 'bg-white border-2 border-border'}`}>
                  {isUser ? <User className="size-4 text-white" /> : <Bot className="size-4 text-primary" />}
                </div>
                <div className={`p-4 rounded-2xl ${isUser ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-border rounded-bl-sm text-ink-1 shadow-sm'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <div className={`text-xs mt-2 font-medium ${isUser ? 'text-white/70 text-right' : 'text-ink-3'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t-2 border-border shrink-0 flex items-end gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 max-h-32 min-h-[56px] resize-none bg-bg rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-primary/20 transition text-ink-1"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || sending}
          className="size-14 shrink-0 bg-primary hover:bg-primary-dark transition text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:hover:bg-primary"
        >
          {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 ml-1" />}
        </button>
      </form>
    </div>
  );
}
