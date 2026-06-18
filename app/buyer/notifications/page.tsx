'use client';

import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/buyer/profile" className="size-10 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary/40">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-extrabold">Notifications</h1>
      </div>

      <div className="card text-center py-16 text-ink-2">
        <Bell className="size-12 mx-auto mb-3 text-ink-3" />
        <p className="font-semibold">No notifications yet</p>
        <p className="text-sm mt-1">Order updates and offers will show up here.</p>
      </div>
    </div>
  );
}
