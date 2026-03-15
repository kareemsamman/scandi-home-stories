import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/data/products";

export interface CartItemOptions {
  color?: { id: string; name: string; hex: string };
  size?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  options?: CartItemOptions;
}

// Unique key for a cart item (product + size + color)
const getCartItemKey = (productId: string, options?: CartItemOptions): string => {
  return `${productId}__${options?.size || ""}__${options?.color?.id || ""}`;
};

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number, options?: CartItemOptions) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
  getItemKey: (item: CartItem) => string;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (product, quantity = 1, options) => {
        set((state) => {
          const key = getCartItemKey(product.id, options);
          const existing = state.items.find(
            (i) => getCartItemKey(i.product.id, i.options) === key
          );
          if (existing) {
            const maxQty = product.type === "contractor" ? 9999 : 10;
            return {
              items: state.items.map((i) =>
                getCartItemKey(i.product.id, i.options) === key
                  ? { ...i, quantity: Math.min(i.quantity + quantity, maxQty) }
                  : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { product, quantity, options }], isOpen: true };
        });
      },
      updateQuantity: (key, quantity) => {
        if (quantity < 1) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            const itemKey = getCartItemKey(i.product.id, i.options);
            if (itemKey !== key) return i;
            const maxQty = i.product.type === "contractor" ? 9999 : 10;
            return { ...i, quantity: Math.min(quantity, maxQty) };
          }),
        }));
      },
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter(
            (i) => getCartItemKey(i.product.id, i.options) !== key
          ),
        })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () =>
        get().items.reduce((t, i) => t + i.product.price * i.quantity, 0),
      getItemCount: () =>
        get().items.reduce((c, i) => c + i.quantity, 0),
      getItemKey: (item) => getCartItemKey(item.product.id, item.options),
    }),
    { name: "amg-cart", partialize: (state) => ({ items: state.items }) }
  )
);
