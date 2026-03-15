import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OrderItem {
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  items: OrderItem[];
}

interface OrderStore {
  orders: Order[];
  addOrder: (order: Omit<Order, "id">) => void;
}

export const useOrders = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => {
        const id = crypto.randomUUID();
        set((s) => ({ orders: [{ ...order, id }, ...s.orders] }));
      },
    }),
    { name: "amg-orders" }
  )
);
