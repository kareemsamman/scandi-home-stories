import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return { items: state.items.map((i) => i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, 10) } : i), isOpen: true };
          }
          return { items: [...state.items, { product, quantity }], isOpen: true };
        });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) { get().removeItem(productId); return; }
        set((state) => ({ items: state.items.map((i) => i.product.id === productId ? { ...i, quantity: Math.min(quantity, 10) } : i) }));
      },
      removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((t, i) => t + i.product.price * i.quantity, 0),
      getItemCount: () => get().items.reduce((c, i) => c + i.quantity, 0),
    }),
    { name: "amg-cart", partialize: (state) => ({ items: state.items }) }
  )
);