'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Send, CheckCircle, Loader2, Users, Wheat, Bike } from 'lucide-react';
import client from '@/lib/api';

type TargetRole = 'ALL' | 'FARMER' | 'BUYER' | 'DELIVERY';

const ROLE_OPTIONS: { value: TargetRole; label: string; icon: any; desc: string }[] = [
  { value: 'ALL',      label: 'Everyone',        icon: Users, desc: 'All registered users' },
  { value: 'BUYER',    label: 'Buyers only',     icon: Users, desc: 'All buyer accounts' },
  { value: 'FARMER',   label: 'Farmers only',    icon: Wheat, desc: 'All farmer accounts' },
  { value: 'DELIVERY', label: 'Delivery only',   icon: Bike,  desc: 'All delivery partners' },
];

interface SentEntry { title: string; body: string; role: string; sentAt: string }

export default function AdminNotifications() {
  const [title, setTitle]         = useState('');
  const [body, setBody]           = useState('');
  const [role, setRole]           = useState<TargetRole>('ALL');
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState<SentEntry[]>([]);
  const [success, setSuccess]     = useState(false);

  const send = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setSuccess(false);
    try {
      await client.post('/api/admin/notifications', { title: title.trim(), body: body.trim(), role });
      setSent(prev => [{ title, body, role, sentAt: new Date().toLocaleTimeString('en-IN') }, ...prev.slice(0, 9)]);
      setTitle('');
      setBody('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {}
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Push Notifications</h1>
        <p className="text-ink-2 mt-1">Send FCM push notifications to any user group</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="card space-y-5">
          <h2 className="font-extrabold text-lg flex items-center gap-2"><Bell className="size-5 text-primary" /> Compose</h2>

          {/* Target audience */}
          <div>
            <label className="block text-sm font-semibold mb-2">Send to</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRole(opt.value)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${role === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                >
                  <opt.icon className={`size-4 shrink-0 ${role === opt.value ? 'text-primary' : 'text-ink-2'}`} />
                  <div>
                    <div className={`text-sm font-bold ${role === opt.value ? 'text-primary' : ''}`}>{opt.label}</div>
                    <div className="text-xs text-ink-3">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1">Notification title <span className="text-error">*</span></label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. New offer available!"
              className="input w-full"
              maxLength={100}
            />
            <div className="text-xs text-ink-3 mt-1 text-right">{title.length}/100</div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold mb-1">Message <span className="text-error">*</span></label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your notification message here…"
              rows={4}
              className="input w-full resize-none"
              maxLength={300}
            />
            <div className="text-xs text-ink-3 mt-1 text-right">{body.length}/300</div>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="bg-ink-1 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-white/60 text-xs mb-2">
                <span className="text-base">🌾</span>
                <span className="font-bold">AgriDirect</span>
                <span className="ml-auto">now</span>
              </div>
              <div className="text-white font-bold text-sm">{title || 'Notification title'}</div>
              <div className="text-white/70 text-sm">{body || 'Your message here'}</div>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={send}
            disabled={sending || !title.trim() || !body.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="size-5 animate-spin" /> : success ? <CheckCircle className="size-5" /> : <Send className="size-5" />}
            {sending ? 'Sending…' : success ? 'Sent!' : 'Send Notification'}
          </button>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-success text-sm font-semibold">
                <CheckCircle className="size-4" /> Notification sent successfully to {ROLE_OPTIONS.find(o => o.value === role)?.label}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History */}
        <div className="card space-y-4">
          <h2 className="font-extrabold text-lg">Sent in this session</h2>
          {sent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-ink-2 gap-3">
              <Bell className="size-10 text-border" />
              <p className="text-sm">No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {sent.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-bg rounded-xl p-4 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{s.title}</span>
                      <span className="text-xs text-ink-3">{s.sentAt}</span>
                    </div>
                    <p className="text-sm text-ink-2 line-clamp-2">{s.body}</p>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">→ {s.role}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
