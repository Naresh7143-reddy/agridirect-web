'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  quantity: number;
  farmerName?: string;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) => set((state) => {
        const existing = state.items.find((i) => i.productId === item.productId);
        if (existing) {
          return { items: state.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i,
          ) };
        }
        return { items: [...state.items, { ...item, quantity: qty }] };
      }),
      remove: (productId) => set((state) => ({
        items: state.items.filter((i) => i.productId !== productId),
      })),
      setQuantity: (productId, qty) => set((state) => ({
        items: qty <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: qty } : i,
            ),
      })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'agridirect-cart', storage: createJSONStorage(() => localStorage) },
  ),
);

interface WishlistState {
  items: Set<string>;
  init: (productIds: string[]) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
}

export const useWishlist = create<WishlistState>((set, get) => ({
  items: new Set(),
  init: (productIds) => set({ items: new Set(productIds) }),
  add: (productId) => set((state) => {
    const newItems = new Set(state.items);
    newItems.add(productId);
    return { items: newItems };
  }),
  remove: (productId) => set((state) => {
    const newItems = new Set(state.items);
    newItems.delete(productId);
    return { items: newItems };
  }),
  has: (productId) => get().items.has(productId),
}));
