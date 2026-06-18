'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-8 text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <div>
          <h1 className="text-2xl font-extrabold mb-2">Something went wrong</h1>
          <p className="text-ink-2 text-sm">
            {error?.message?.includes('401') || error?.message?.includes('auth')
              ? 'Your session may have expired.'
              : 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-secondary"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
