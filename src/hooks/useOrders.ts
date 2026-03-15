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

/* ---------- Example seed data ---------- */
const SEED_ORDERS: Order[] = [
  {
    id: "seed-1",
    orderNumber: "#10231",
    date: "12/03/2026",
    total: 47000,
    status: "pending",
    items: [
      { name: "פרגולה ביוקלימטית Beak", image: "/placeholder.svg", price: 38000, quantity: 1 },
      { name: "תאורת LED משולבת", image: "/placeholder.svg", price: 4500, quantity: 2 },
    ],
  },
  {
    id: "seed-2",
    orderNumber: "#10198",
    date: "28/02/2026",
    total: 22500,
    status: "confirmed",
    items: [
      { name: "מערכת למלות מוטורית Gate Tube", image: "/placeholder.svg", price: 22500, quantity: 1 },
    ],
  },
  {
    id: "seed-3",
    orderNumber: "#10142",
    date: "10/01/2026",
    total: 15800,
    status: "delivered",
    items: [
      { name: "פרופיל אלומיניום 900YSL1500", image: "/placeholder.svg", price: 1200, quantity: 6, color: "לבן" },
      { name: "אביזרי חיבור פרימיום", image: "/placeholder.svg", price: 3200, quantity: 2 },
    ],
  },
];

interface OrderStore {
  orders: Order[];
  addOrder: (order: Omit<Order, "id">) => void;
}

export const useOrders = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => {
        const id = crypto.randomUUID();
        set((s) => ({ orders: [{ ...order, id }, ...s.orders] }));
      },
    }),
    {
      name: "amg-orders",
      onRehydrateStorage: () => (state) => {
        // Seed example data only if store is empty (first visit)
        if (state && state.orders.length === 0) {
          state.orders = SEED_ORDERS;
        }
      },
    }
  )
);
