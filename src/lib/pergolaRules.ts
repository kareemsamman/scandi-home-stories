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

// ── Carrier count by projection/depth (mm) ──
// Table: 3000→7, 3500→8, ... 10000→21

export function calcCarrierCount(lengthMm: number): number {
  if (lengthMm <= 0) return 3;
  if (lengthMm < 3000) {
    return Math.max(3, Math.round((lengthMm / 3000) * 7));
  }
  if (lengthMm > 10000) {
    return 21 + Math.ceil((lengthMm - 10000) / 500);
  }
  return 7 + Math.ceil((lengthMm - 3000) / 500);
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

export function adjustedCarrierCount(lengthMm: number, spacingMode: SpacingMode): number {
  const baseCount = calcCarrierCount(lengthMm);
  if (spacingMode === "automatic" || spacingMode === "standard") return baseCount;
  if (spacingMode === "dense") {
    // Increase carriers for denser spacing
    return Math.max(baseCount, Math.round(baseCount * 1.3));
  }
  if (spacingMode === "wide") {
    // Decrease carriers for wider spacing
    return Math.max(3, Math.round(baseCount * 0.75));
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

// ── Compose all specs ──

export function computeSpecs(input: {
  widthMm: number;
  lengthMm: number;
  mountType: MountType;
  spacingMode: SpacingMode;
  pergolaType: PergolaType;
}): PergolaSpecs {
  const { classification, moduleCount } = classifyModule(input.widthMm);
  const carrierCount = adjustedCarrierCount(input.lengthMm, input.spacingMode);
  const { front, back } = calcPostCount(input.widthMm, input.mountType);
  const moduleWidths = calcModuleWidths(input.widthMm, moduleCount);
  const spacingMm = calcSpacing(input.lengthMm, carrierCount, input.spacingMode);
  const profiles = getProfilesForType(input.pergolaType);

  return {
    moduleClassification: classification,
    moduleCount,
    carrierCount,
    frontPostCount: front,
    backPostCount: back,
    moduleWidths,
    spacingMm,
    profiles,
  };
}
