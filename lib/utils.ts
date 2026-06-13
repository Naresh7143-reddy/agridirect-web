import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(n: number): string {
  if (!Number.isFinite(n)) return '₹0';
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function productImageUrl(p: any): string {
  return (
    p?.primaryImageUrl ||
    p?.imageUrls?.[0] ||
    p?.images?.[0]?.url ||
    ''
  );
}
