// Delivery estimation logic shared between cart and checkout

export const PLATFORM_FEE = 10; // ₹10 platform fee

/** Delivery fee based on subtotal */
export function calcDeliveryFee(subtotal: number, pincode?: string): number {
  if (subtotal >= 500) return 0; // free above ₹500
  // Charge ₹40 base; bump to ₹60 if pincode indicates a different state (non-5xx = outside AP/Telangana)
  if (pincode && !pincode.startsWith('5')) return 60;
  return 40;
}

/** Estimated delivery date string shown to user */
export function estimatedDelivery(pincode?: string): string {
  const now = new Date();
  const cutoff = 14; // 2 PM cutoff for same-day processing
  let days = 2;
  if (pincode && !pincode.startsWith('5')) days = 3; // outside AP/Telangana takes 1 extra day
  if (now.getHours() >= cutoff) days += 1; // ordered late → add 1 day

  const delivery = new Date(now);
  // Skip Sundays
  let added = 0;
  while (added < days) {
    delivery.setDate(delivery.getDate() + 1);
    if (delivery.getDay() !== 0) added++; // 0 = Sunday
  }
  return delivery.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

/** ETA string for an existing order based on its status and creation time */
export function orderETA(status: string, createdAt: string): string {
  if (status === 'DELIVERED' || status === 'CANCELLED') return '';
  const created = new Date(createdAt);
  const eta = new Date(created);

  const daysMap: Record<string, number> = {
    PENDING: 3,
    ACCEPTED: 2,
    PACKED: 1,
    ASSIGNED: 1,
    PICKED_UP: 1,
    ON_THE_WAY: 0,
  };
  const days = daysMap[status] ?? 2;

  let added = 0;
  while (added < days) {
    eta.setDate(eta.getDate() + 1);
    if (eta.getDay() !== 0) added++;
  }

  // If ETA is today
  const today = new Date();
  if (eta.toDateString() === today.toDateString()) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (eta.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return eta.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
