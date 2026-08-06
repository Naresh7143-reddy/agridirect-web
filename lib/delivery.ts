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
  return 'Today, within 45 mins';
}

/** ETA string for an existing order based on its status and creation time */
export function orderETA(status: string, createdAt: string): string {
  if (status === 'DELIVERED' || status === 'CANCELLED') return '';
  return 'Today';
}
