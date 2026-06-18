'use client';

import { useEffect } from 'react';

export default function FarmerError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Farmer section error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="text-5xl">🌾</div>
      <h2 className="text-xl font-extrabold">Something went wrong</h2>
      <p className="text-ink-2 text-sm max-w-sm">{error?.message ?? 'An unexpected error occurred in this section.'}</p>
      <button onClick={reset} className="btn-primary">Try again</button>
    </div>
  );
}
