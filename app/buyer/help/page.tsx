'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MessageCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Go to "My orders" from your profile and tap an order to see its live status and delivery tracking.',
  },
  {
    q: 'How do I change or cancel an order?',
    a: 'Open the order from "My orders" — you can cancel it there if it has not been packed yet.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'Cash on Delivery, UPI, and Card payments (via Razorpay) are supported at checkout.',
  },
  {
    q: 'How do I add or change my delivery address?',
    a: 'Go to "Saved addresses" in your profile to add, set a default, or remove an address.',
  },
  {
    q: 'My order arrived damaged or incorrect — what do I do?',
    a: 'Contact us using the details below with your order ID and we will help resolve it.',
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/buyer/profile" className="size-10 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary/40">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-extrabold">Help & support</h1>
      </div>

      <div className="card space-y-3">
        <h2 className="font-bold text-lg">Contact us</h2>
        <a href="mailto:support@agridirect.app" className="flex items-center gap-3 rounded-2xl border-2 border-border px-4 py-3 hover:border-primary/40">
          <Mail className="size-5 text-primary" />
          <span className="font-semibold">support@agridirect.app</span>
        </a>
        <a href="tel:+918919012622" className="flex items-center gap-3 rounded-2xl border-2 border-border px-4 py-3 hover:border-primary/40">
          <Phone className="size-5 text-primary" />
          <span className="font-semibold">+91 89190 12622</span>
        </a>
        <a
          href="https://wa.me/918919012622"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border-2 border-border px-4 py-3 hover:border-primary/40"
        >
          <MessageCircle className="size-5 text-primary" />
          <span className="font-semibold">Chat on WhatsApp</span>
        </a>
      </div>

      <div className="card !p-0 overflow-hidden">
        <h2 className="font-bold text-lg px-5 pt-5 pb-3">Frequently asked questions</h2>
        {FAQS.map((f, i) => (
          <div key={i} className="border-t border-border">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-semibold hover:bg-bg transition"
            >
              {f.q}
              <ChevronDown className={`size-5 text-ink-3 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-5 pb-4 text-sm text-ink-2">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
