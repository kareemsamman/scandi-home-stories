export interface TranzilaOrderItemPayload {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  colorHex?: string;
  colorId?: string;
  sizeId?: string;
  meterLength?: number;
}

export interface TranzilaPendingOrderPayload {
  orderNumber: string;
  notes?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  city: string;
  address: string;
  house_number: string;
  apartment?: string;
  locale: "he" | "ar";
  origin: string;
  shippingCost: number;
  discountCode?: string;
  adminDiscount?: number;
  expectedTotal: number;
  isGuest: boolean;
  items: TranzilaOrderItemPayload[];
}

export interface TranzilaCompletedOrderState {
  orderNumber: string;
  total: number;
  date: string;
  orderId?: string;
  phone: string;
  isGuest: boolean;
  firstName: string;
  lastName: string;
  email: string;
}

const PENDING_KEY = "amg-tranzila-pending-order";
const COMPLETED_KEY = "amg-tranzila-completed-order";

const canUseSessionStorage = () => typeof window !== "undefined" && !!window.sessionStorage;

export const savePendingTranzilaOrder = (payload: TranzilaPendingOrderPayload) => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
};

export const loadPendingTranzilaOrder = (): TranzilaPendingOrderPayload | null => {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TranzilaPendingOrderPayload;
  } catch {
    return null;
  }
};

export const clearPendingTranzilaOrder = () => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PENDING_KEY);
};

export const saveCompletedTranzilaOrder = (payload: TranzilaCompletedOrderState) => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(COMPLETED_KEY, JSON.stringify(payload));
};

export const loadCompletedTranzilaOrder = (orderNumber?: string): TranzilaCompletedOrderState | null => {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(COMPLETED_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as TranzilaCompletedOrderState;
    if (orderNumber && parsed.orderNumber !== orderNumber) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearCompletedTranzilaOrder = () => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(COMPLETED_KEY);
};