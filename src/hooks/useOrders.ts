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
  notes?: string;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    city: string;
    street: string;
    houseNumber: string;
    apartment?: string;
    phone: string;
  };
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
      { name: "פרגולה ביוקלימטית Beak", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=80", price: 38000, quantity: 1, color: "שחור", size: "600×400 cm" },
      { name: "תאורת LED משולבת", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=200&q=80", price: 4500, quantity: 2 },
    ],
    shippingAddress: {
      firstName: "אחמד",
      lastName: "כנעאן",
      city: "חיפה",
      street: "הנשיא",
      houseNumber: "12",
      apartment: "4",
      phone: "0521234567",
    },
  },
  {
    id: "seed-2",
    orderNumber: "#10198",
    date: "28/02/2026",
    total: 22500,
    status: "confirmed",
    items: [
      { name: "מערכת למלות מוטורית Gate Tube", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&q=80", price: 22500, quantity: 1, color: "לבן", size: "500×350 cm" },
    ],
    shippingAddress: {
      firstName: "אחמד",
      lastName: "כנעאן",
      city: "חיפה",
      street: "הנשיא",
      houseNumber: "12",
      phone: "0521234567",
    },
  },
  {
    id: "seed-3",
    orderNumber: "#10142",
    date: "10/01/2026",
    total: 15800,
    status: "delivered",
    items: [
      { name: "פרופיל אלומיניום 900YSL1500", image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=200&q=80", price: 1200, quantity: 6, color: "RAL 7016 – Anthracite Grey", size: "3m" },
      { name: "אביזרי חיבור פרימיום", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&q=80", price: 3200, quantity: 2, color: "לבן" },
    ],
    shippingAddress: {
      firstName: "אחמד",
      lastName: "כנעאן",
      city: "נצרת",
      street: "פאולוס השישי",
      houseNumber: "5",
      phone: "0521234567",
    },
  },
];

interface OrderStore {
  orders: Order[];
  addOrder: (order: Omit<Order, "id">) => void;
  getOrder: (id: string) => Order | undefined;
}

export const useOrders = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => {
        const id = crypto.randomUUID();
        set((s) => ({ orders: [{ ...order, id }, ...s.orders] }));
      },
      getOrder: (id) => get().orders.find((o) => o.id === id),
    }),
    {
      name: "amg-orders",
      onRehydrateStorage: () => (state) => {
        if (state && state.orders.length === 0) {
          state.orders = SEED_ORDERS;
        }
      },
    }
  )
);
