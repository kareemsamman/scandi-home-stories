import type { MountType, ModuleClassification, PergolaSpecs } from "@/types/pergola";

// ── Module classification by width ──

export function classifyModule(widthMm: number): { classification: ModuleClassification; moduleCount: number } {
  if (widthMm <= 4500) return { classification: "single", moduleCount: 1 };
  if (widthMm <= 9000) return { classification: "double", moduleCount: 2 };
  if (widthMm <= 13500) return { classification: "triple", moduleCount: 3 };
  return { classification: "custom", moduleCount: 0 };
}

// ── Carrier count by projection/depth ──
// 3000mm → 7, each +500mm adds 1 carrier, up to 10000mm → 21
// Below 3000mm: scale down proportionally (minimum 3)

export function calcCarrierCount(lengthMm: number): number {
  if (lengthMm <= 0) return 3;
  if (lengthMm < 3000) {
    // Scale proportionally: at 2000mm ≈ 5 carriers, minimum 3
    return Math.max(3, Math.round((lengthMm / 3000) * 7));
  }
  if (lengthMm > 10000) {
    // Extrapolate beyond table: +1 per 500mm
    return 21 + Math.ceil((lengthMm - 10000) / 500);
  }
  return 7 + Math.ceil((lengthMm - 3000) / 500);
}

// ── Post count by width ──

function postCountByWidth(widthMm: number): number {
  if (widthMm <= 3000) return 2;
  if (widthMm <= 6000) return 3;
  if (widthMm <= 9000) return 4;
  if (widthMm <= 13500) return 5;
  // Beyond 13500: add 1 per 3000mm extra
  return 5 + Math.ceil((widthMm - 13500) / 3000);
}

export function calcPostCount(widthMm: number, mountType: MountType): { front: number; back: number } {
  const count = postCountByWidth(widthMm);
  return {
    front: count,
    back: mountType === "freestanding" ? count : 0,
  };
}

// ── Module widths ──

export function calcModuleWidths(widthMm: number, moduleCount: number): number[] {
  if (moduleCount <= 0) return [widthMm]; // custom: treat as single for drawing
  const w = widthMm / moduleCount;
  return Array.from({ length: moduleCount }, () => w);
}

// ── Position helpers for SVG ──

export function calcPostPositions(widthMm: number, postCount: number): number[] {
  if (postCount <= 1) return [widthMm / 2];
  const positions: number[] = [];
  for (let i = 0; i < postCount; i++) {
    positions.push((i / (postCount - 1)) * widthMm);
  }
  return positions;
}

export function calcCarrierPositions(lengthMm: number, carrierCount: number): number[] {
  if (carrierCount <= 1) return [lengthMm / 2];
  const positions: number[] = [];
  for (let i = 0; i < carrierCount; i++) {
    positions.push((i / (carrierCount - 1)) * lengthMm);
  }
  return positions;
}

// ── Compose all specs ──

export function computeSpecs(input: {
  width: number;
  length: number;
  mountType: MountType;
}): PergolaSpecs {
  const { classification, moduleCount } = classifyModule(input.width);
  const carrierCount = calcCarrierCount(input.length);
  const { front, back } = calcPostCount(input.width, input.mountType);
  const moduleWidths = calcModuleWidths(input.width, moduleCount);

  return {
    moduleClassification: classification,
    moduleCount,
    carrierCount,
    frontPostCount: front,
    backPostCount: back,
    moduleWidths,
  };
}
