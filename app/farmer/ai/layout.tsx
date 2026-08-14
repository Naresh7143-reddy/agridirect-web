import Link from 'next/link';
import { MessageSquare, Eye, Lightbulb, TrendingUp } from 'lucide-react';

export default function AILayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* AI Navigation Tabs */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            <TabLink href="/farmer/ai" icon={MessageSquare} label="Chat" />
            <TabLink href="/farmer/ai/disease" icon={Eye} label="Disease Detection" />
            <TabLink href="/farmer/ai/advice" icon={Lightbulb} label="Crop Advice" />
            <TabLink href="/farmer/ai/price" icon={TrendingUp} label="Price Forecast" />
          </div>
        </div>
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}

function TabLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-ink-2 hover:text-primary border-b-2 border-transparent hover:border-primary/30 transition whitespace-nowrap"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
