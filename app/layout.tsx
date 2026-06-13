import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'AgriDirect — Farm-fresh direct from Indian farmers', template: '%s | AgriDirect' },
  description:
    'Connecting Indian farmers directly to buyers. Fresh produce, fair prices, no middlemen. Order from 500+ verified farmers across 20+ cities.',
  keywords: ['agriculture', 'india', 'farmer', 'organic', 'direct from farm', 'fresh produce'],
  authors: [{ name: 'Godi Naresh Reddy' }],
  openGraph: {
    title: 'AgriDirect',
    description: 'Farm-fresh produce, direct from Indian farmers to your table',
    type: 'website',
    locale: 'en_IN',
  },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg text-ink-1 font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
