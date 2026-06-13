'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Leaf,
  Truck,
  ShieldCheck,
  Sparkles,
  Phone,
  Github,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed left-0 right-0 top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-border">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-extrabold text-primary tracking-tight">AgriDirect</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-2">
            <a href="#features" className="hover:text-primary transition">Features</a>
            <a href="#how" className="hover:text-primary transition">How it works</a>
            <a href="#testimonials" className="hover:text-primary transition">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-ink-1 hover:text-primary">Sign in</Link>
            <Link href="/login" className="btn-primary text-sm py-2 px-4">Get started</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-50 via-bg to-yellow-50" />
        <div className="container-x grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-6">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Trusted by 500+ Indian farmers</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-ink-1 leading-[1.05]">
              Farm-fresh,<br />
              <span className="text-primary">direct to your table</span>
            </h1>
            <p className="mt-6 text-xl text-ink-2 leading-relaxed max-w-lg">
              Skip the middlemen. Buy verified, just-picked produce straight from Indian farmers
              at fair prices. Better for them, fresher for you.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/login" className="btn-primary text-base px-8 py-4">
                Shop fresh produce
                <ArrowRight className="size-5" />
              </Link>
              <Link href="/login" className="btn-secondary text-base px-8 py-4">
                Sell as a farmer
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap gap-6 text-sm text-ink-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-success" />
                Verified farmers
              </div>
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-primary" />
                Free delivery over ₹500
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="size-5 text-success" />
                Organic options
              </div>
            </div>
          </motion.div>

          {/* Hero image — animated produce cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative h-[500px] lg:h-[600px]"
          >
            {/* Floating decorative cards */}
            <FloatingCard delay={0} className="absolute top-0 left-4 lg:left-12" emoji="🍅" name="Tomato" price="₹40/kg" tag="Organic" />
            <FloatingCard delay={0.15} className="absolute top-24 right-0 lg:right-8" emoji="🥬" name="Spinach" price="₹30/bunch" tag="Fresh" />
            <FloatingCard delay={0.3} className="absolute top-56 left-12 lg:left-20" emoji="🥕" name="Carrot" price="₹50/kg" tag="Local" />
            <FloatingCard delay={0.45} className="absolute top-80 right-4 lg:right-16" emoji="🌽" name="Sweet Corn" price="₹25/piece" tag="Today's pick" />
            <FloatingCard delay={0.6} className="absolute bottom-4 left-1/4" emoji="🥭" name="Alphonso" price="₹450/dozen" tag="Premium" />
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '500+', label: 'Verified farmers' },
            { value: '10,000+', label: 'Happy buyers' },
            { value: '25,000+', label: 'Orders delivered' },
            { value: '20+', label: 'Cities served' },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-extrabold text-primary mb-2">{s.value}</div>
              <div className="text-sm text-ink-2">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="container-x">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-ink-1 mb-4">
              Why AgriDirect?
            </h2>
            <p className="text-lg text-ink-2">
              We built the marketplace farmers deserve — and the freshness buyers want.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card group hover:-translate-y-1"
              >
                <div className={`size-14 rounded-2xl flex items-center justify-center mb-5 ${f.bg}`}>
                  <f.icon className={`size-7 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-ink-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────────────────── */}
      <section id="how" className="py-24 bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="container-x">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="size-16 rounded-full bg-primary text-white text-2xl font-extrabold flex items-center justify-center mx-auto mb-6 shadow-hover">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-ink-2">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24">
        <div className="container-x">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-16">
            Loved by farmers and buyers
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-ink-1 mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {t.emoji}
                  </div>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-ink-2">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 text-9xl flex items-center justify-around">
          🌾🌾🌾
        </div>
        <div className="container-x relative text-center max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
            Ready to taste the difference?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of Indians who've made the switch to fresh, fair, farm-direct produce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="rounded-full bg-white text-primary px-8 py-4 font-semibold shadow-lg hover:scale-105 transition inline-flex items-center justify-center gap-2"
            >
              Start shopping <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 border-white px-8 py-4 font-semibold hover:bg-white hover:text-primary transition inline-flex items-center justify-center"
            >
              Become a seller
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-ink-1 text-white/80 py-16">
        <div className="container-x grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌾</span>
              <span className="text-xl font-extrabold text-white">AgriDirect</span>
            </div>
            <p className="text-sm leading-relaxed">
              Connecting Indian farmers directly to buyers since 2026.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="https://github.com/Naresh7143-reddy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                <Github className="size-5" />
              </a>
              <a href="mailto:nareshreddy.godi@gmail.com" className="hover:text-white transition">
                <Phone className="size-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">For buyers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login">Shop now</Link></li>
              <li><Link href="/login">Wishlist</Link></li>
              <li><Link href="/login">Orders</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">For farmers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login">Sell with us</Link></li>
              <li><Link href="/login">Krishi AI</Link></li>
              <li><Link href="/login">Resources</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://agridirect-backend-80yz.onrender.com/api/privacy">Privacy</a></li>
              <li><a href="https://agridirect-backend-80yz.onrender.com/api/terms">Terms</a></li>
              <li>Built by Godi Naresh Reddy</li>
            </ul>
          </div>
        </div>
        <div className="container-x mt-12 pt-8 border-t border-white/10 text-sm text-center">
          © 2026 AgriDirect. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

// ─── Floating produce card ─────────────────────────────────────────────────
function FloatingCard({ emoji, name, price, tag, delay, className }: any) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }}
      className={`bg-white rounded-2xl shadow-hover p-5 min-w-[180px] ${className}`}
    >
      <div className="text-5xl mb-2">{emoji}</div>
      <div className="font-bold text-ink-1">{name}</div>
      <div className="text-primary font-extrabold text-lg">{price}</div>
      <div className="mt-2 inline-block bg-primary/10 text-primary text-xs font-semibold rounded-full px-2 py-0.5">
        {tag}
      </div>
    </motion.div>
  );
}

const features = [
  { icon: Leaf, color: 'text-primary', bg: 'bg-primary/10', title: 'Truly fresh',
    desc: 'Harvested today, on your doorstep tomorrow. No cold storage, no compromise.' },
  { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', title: 'Verified farmers',
    desc: 'Every seller is KYC-verified. See farm photos, certifications, and ratings.' },
  { icon: Sparkles, color: 'text-secondary', bg: 'bg-secondary/10', title: 'AI-powered',
    desc: 'Krishi AI helps farmers maximize yield and helps you find what to cook tonight.' },
  { icon: Truck, color: 'text-primary', bg: 'bg-primary/10', title: 'Same-day delivery',
    desc: 'Order before 4 PM, get it the same day in eligible cities. Free over ₹500.' },
  { icon: Phone, color: 'text-warning', bg: 'bg-warning/10', title: 'Direct chat',
    desc: 'Talk directly with your farmer. Ask about how they grew it, get recipes.' },
  { icon: Star, color: 'text-secondary', bg: 'bg-secondary/10', title: 'Fair prices',
    desc: 'Farmers get 20-30% more. You pay 15% less. We just keep things running.' },
];

const steps = [
  { title: 'Browse', desc: 'Find fresh produce from verified farmers near you.' },
  { title: 'Order', desc: 'Add to cart, pick a slot, pay securely with UPI or COD.' },
  { title: 'Enjoy', desc: 'Get farm-fresh goodness delivered. Rate, repeat, support farmers.' },
];

const testimonials = [
  { emoji: '👨‍🌾', name: 'Ramesh K.', role: 'Farmer · Andhra Pradesh',
    text: 'I now sell 60% more, directly. No more giving up margin to middlemen. Krishi AI helps me decide when to harvest.' },
  { emoji: '👩‍🍳', name: 'Priya S.', role: 'Buyer · Bengaluru',
    text: 'The tomatoes actually taste like tomatoes. Same-day delivery is magical. I never go to the supermarket anymore.' },
  { emoji: '🚲', name: 'Suresh M.', role: 'Delivery partner · Hyderabad',
    text: 'Open marketplace means I always have work. Earnings are 2x what I made before. Great app for partners.' },
];
