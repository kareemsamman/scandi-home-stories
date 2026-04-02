import type {
  MountType, ModuleClassification, PergolaSpecs, SpacingMode,
  PergolaType, ProfileName, PROFILE_NAMES,
} from "@/types/pergola";

// ── Module classification by width (mm) ──

export function classifyModule(widthMm: number): { classification: ModuleClassification; moduleCount: number } {
  if (widthMm <= 4500) return { classification: "single", moduleCount: 1 };
  if (widthMm <= 9000) return { classification: "double", moduleCount: 2 };
  if (widthMm <= 13500) return { classification: "triple", moduleCount: 3 };
  return { classification: "custom", moduleCount: 0 };
}

// ── Carrier (קורת חלוקה) count by width (mm) ──
// Default: width_in_meters - 1 (e.g. 7m → 6, 6m → 5, 3m → 2)

export function calcCarrierCount(widthMm: number): number {
  if (widthMm <= 0) return 1;
  return Math.max(1, Math.floor(widthMm / 1000) - 1);
}

// ── Post count by width (mm) ──

function postCountByWidth(widthMm: number): number {
  if (widthMm <= 3000) return 2;
  if (widthMm <= 6000) return 3;
  if (widthMm <= 9000) return 4;
  if (widthMm <= 13500) return 5;
  return 5 + Math.ceil((widthMm - 13500) / 3000);
}

export function calcPostCount(widthMm: number, mountType: MountType): { front: number; back: number } {
  const count = postCountByWidth(widthMm);
  return {
    front: count,
    back: mountType === "freestanding" ? count : 0,
  };
}

// ── Spacing between profiles (mm) ──
// Default ~500mm (~50cm). Modes adjust this.

const SPACING_FACTORS: Record<SpacingMode, number> = {
  automatic: 1.0,
  dense: 0.75,
  standard: 1.0,
  wide: 1.35,
};

export function calcSpacing(lengthMm: number, carrierCount: number, spacingMode: SpacingMode): number {
  if (carrierCount <= 1) return lengthMm;
  const baseSpacing = lengthMm / (carrierCount - 1);
  return Math.round(baseSpacing * SPACING_FACTORS[spacingMode]);
}

// ── Adjusted carrier count for spacing mode ──

export function adjustedCarrierCount(widthMm: number, spacingMode: SpacingMode): number {
  const baseCount = calcCarrierCount(widthMm);
  if (spacingMode === "automatic" || spacingMode === "standard") return baseCount;
  if (spacingMode === "dense") {
    return Math.max(baseCount, Math.round(baseCount * 1.3));
  }
  if (spacingMode === "wide") {
    return Math.max(1, Math.round(baseCount * 0.75));
  }
  return baseCount;
}

// ── Module widths ──

export function calcModuleWidths(widthMm: number, moduleCount: number): number[] {
  if (moduleCount <= 0) return [widthMm];
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

// ── Profile selection per pergola type ──

export interface ProfileSet {
  rafter: string;
  gutter: string;
  carrier_post: string;
  fabric_master: string;
  fabric_carrier: string;
  motor_box: string;
  roof_sash: string;
  motor_shaft_thick: string;
  motor_shaft_thin: string;
}

const FIXED_PROFILES: ProfileSet = {
  rafter: "Rafter Profile",
  gutter: "Gutter Profile",
  carrier_post: "Carrier Post Profile",
  fabric_master: "Fabric Profile | Master",
  fabric_carrier: "Fabric Profile | Carrier",
  motor_box: "Motor Box Profile",
  roof_sash: "Roof Sash Profile",
  motor_shaft_thick: "Motor Shaft Pipe | Thick",
  motor_shaft_thin: "Motor Shaft Pipe | Thin",
};

const PVC_PROFILES: ProfileSet = {
  rafter: "Rafter Profile",
  gutter: "Gutter Profile",
  carrier_post: "Carrier Post Profile",
  fabric_master: "PVC Fabric Profile | Master",
  fabric_carrier: "PVC Fabric Profile | Carrier",
  motor_box: "Motor Box Profile",
  roof_sash: "Roof Sash Profile",
  motor_shaft_thick: "Motor Shaft Pipe | Thick",
  motor_shaft_thin: "Motor Shaft Pipe | Thin",
};

export function getProfilesForType(pergolaType: PergolaType): ProfileSet {
  return pergolaType === "pvc" ? PVC_PROFILES : FIXED_PROFILES;
}

// ── Slat calculations for fixed pergola ──
// Slat sizes: 20×70mm or 20×40mm — the 20mm is the visible face width when mounted vertically

export function getSlatProfileWidth(slatSize: string): number {
  return slatSize === "20x40" ? 20 : 20; // both are 20mm face width
}

export function getSlatProfileHeight(slatSize: string): number {
  if (slatSize === "20x40") return 40;
  if (slatSize === "20x100") return 100;
  return 70;
}

/** Frame deduction: 9cm (90mm) total for frame profiles on both sides */
const FRAME_DEDUCTION_MM = 90;

export function calcSlatCount(widthMm: number, gapMm: number, slatSize?: string): number {
  if (gapMm <= 0) return 0;
  const usableWidth = widthMm - FRAME_DEDUCTION_MM;
  if (usableWidth <= 0) return 0;
  const slatH = getSlatProfileHeight(slatSize || "20x70");
  const totalUnit = slatH + gapMm;
  return Math.max(2, Math.floor(usableWidth / totalUnit));
}

export function calcSlatGapFromCount(widthMm: number, count: number, slatSize?: string): number {
  if (count <= 1) return widthMm;
  const usableWidth = widthMm - FRAME_DEDUCTION_MM;
  const slatH = getSlatProfileHeight(slatSize || "20x70");
  const totalSlatHeight = count * slatH;
  return Math.max(5, Math.round((usableWidth - totalSlatHeight) / (count + 1)));
}

/** How many slats fit between each pair of carriers (נשאים) */
export function slatsPerCarrier(totalSlats: number, carrierCount: number): number {
  if (carrierCount <= 1) return totalSlats;
  return Math.round(totalSlats / (carrierCount - 1));
}

/** Valid gap presets in cm */
export const SLAT_GAP_PRESETS_CM = [1, 2, 3, 4] as const;

export function getValidSlatRange(widthMm: number): { min: number; max: number } {
  const maxSlats = calcSlatCount(widthMm, SLAT_GAP_PRESETS_CM[0] * 10);
  const minSlats = Math.max(2, calcSlatCount(widthMm, SLAT_GAP_PRESETS_CM[SLAT_GAP_PRESETS_CM.length - 1] * 10));
  return { min: minSlats, max: maxSlats };
}

// ── Compose all specs ──

export function computeSpecs(input: {
  widthMm: number;
  lengthMm: number;
  mountType: MountType;
  spacingMode: SpacingMode;
  pergolaType: PergolaType;
  slatGapCm?: number;
  slatCount?: number;
  slatSize?: string;
}): PergolaSpecs {
  const { classification, moduleCount } = classifyModule(input.widthMm);
  const carrierCount = adjustedCarrierCount(input.lengthMm, input.spacingMode);
  const { front, back } = calcPostCount(input.widthMm, input.mountType);
  const moduleWidths = calcModuleWidths(input.widthMm, moduleCount);
  const spacingMm = calcSpacing(input.lengthMm, carrierCount, input.spacingMode);
  const profiles = getProfilesForType(input.pergolaType);

  // Slat calculations for fixed pergola
  const gapMm = (input.slatGapCm || 3) * 10;
  const ss = input.slatSize || "20x70";
  const slatCount = input.slatCount || calcSlatCount(input.widthMm, gapMm, ss);
  const slatGapMm = calcSlatGapFromCount(input.widthMm, slatCount, ss);

  return {
    moduleClassification: classification,
    moduleCount,
    carrierCount,
    frontPostCount: front,
    backPostCount: back,
    moduleWidths,
    spacingMm,
    profiles,
    slatCount,
    slatGapMm,
    slatWidthMm: getSlatProfileWidth(ss),
  };
}
