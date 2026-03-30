export interface VatConfig {
  enabled: boolean;
  rate: number; // percentage, e.g. 18
}

export const DEFAULT_VAT: VatConfig = { enabled: true, rate: 18 };

export function calculateVat(subtotalAfterDiscount: number, config: VatConfig): number {
  if (!config.enabled || config.rate <= 0 || subtotalAfterDiscount <= 0) return 0;
  return Math.round(subtotalAfterDiscount * config.rate) / 100;
}

export function calculateTotal(params: {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  vat: VatConfig;
}): { discountedSubtotal: number; vatAmount: number; total: number } {
  const discountedSubtotal = Math.max(0, params.subtotal - params.discountAmount);
  const vatAmount = calculateVat(discountedSubtotal, params.vat);
  const total = discountedSubtotal + vatAmount + params.shippingCost;
  return { discountedSubtotal, vatAmount, total };
}
