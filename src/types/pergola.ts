export type MountType = 'wall' | 'freestanding';
export type LightingChoice = 'none' | 'white' | 'rgb';
export type LightingPosition = 'none' | 'all_posts' | 'selected_posts' | 'no_posts';
export type LightingFixture = 'none' | 'spotlight' | 'led_strip' | 'rgb_strip' | 'mixed';
export type ModuleClassification = 'single' | 'double' | 'triple' | 'custom';
export type PergolaRequestStatus = 'new' | 'in_review' | 'needs_inspection' | 'ready_for_quote' | 'quoted' | 'closed';
export type SpacingMode = 'automatic' | 'dense' | 'standard' | 'wide';
export type PergolaType = 'fixed' | 'pvc';
export type SantafChoice = 'without' | 'with';
export type RoofFillMode = 'slats' | 'santaf'; // for fixed pergola only

/** Profile names matching the technical PDF reference */
export const PROFILE_NAMES = [
  'rafter',
  'gutter',
  'carrier_post',
  'fabric_master',
  'fabric_carrier',
  'motor_box',
  'roof_sash',
  'motor_shaft_thick',
  'motor_shaft_thin',
] as const;
export type ProfileName = typeof PROFILE_NAMES[number];

/** Standard color presets */
export interface ColorPreset {
  id: string;
  name_he: string;
  name_ar: string;
  hex: string;
}

export const STANDARD_COLORS: ColorPreset[] = [
  { id: 'white', name_he: 'לבן', name_ar: 'أبيض', hex: '#FFFFFF' },
  { id: 'cream', name_he: 'שמנת', name_ar: 'كريمي', hex: '#FFF5E1' },
  { id: 'silver', name_he: 'כסוף', name_ar: 'فضي', hex: '#C0C0C0' },
  { id: 'anthracite', name_he: 'אנתרציט', name_ar: 'أنثراسايت', hex: '#383838' },
  { id: 'black', name_he: 'שחור', name_ar: 'أسود', hex: '#1A1A1A' },
  { id: 'brown', name_he: 'חום', name_ar: 'بني', hex: '#5C3317' },
  { id: 'gray', name_he: 'אפור', name_ar: 'رمادي', hex: '#808080' },
  { id: 'dark_gray', name_he: 'אפור כהה', name_ar: 'رمادي غامق', hex: '#4A4A4A' },
  { id: 'wood_oak', name_he: 'אלון', name_ar: 'بلوط', hex: '#8B6914' },
  { id: 'wood_walnut', name_he: 'אגוז', name_ar: 'جوز', hex: '#5C4033' },
];

export const SANTAF_COLORS: ColorPreset[] = [
  { id: 'santaf_red', name_he: 'אדום', name_ar: 'أحمر', hex: '#B22222' },
  { id: 'santaf_brown', name_he: 'חום', name_ar: 'بني', hex: '#6B3A2A' },
  { id: 'santaf_gray', name_he: 'אפור', name_ar: 'رمادي', hex: '#6B6B6B' },
  { id: 'santaf_black', name_he: 'שחור', name_ar: 'أسود', hex: '#2C2C2C' },
  { id: 'santaf_green', name_he: 'ירוק', name_ar: 'أخضر', hex: '#2E5E3F' },
  { id: 'santaf_terracotta', name_he: 'טרקוטה', name_ar: 'تيراكوتا', hex: '#C04000' },
];

/** What the customer fills in the form — dimensions in cm */
export interface PergolaFormInput {
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  pergolaType: PergolaType;
  mountType: MountType;
  installation: boolean;
  // Lighting
  lighting: LightingChoice;
  lightingPosition: LightingPosition;
  lightingFixture: LightingFixture;
  lightingRoof: boolean;
  lightingPosts: number[]; // indices of posts with lights (for selected_posts)
  // Roof fill mode (fixed pergola only)
  roofFillMode: RoofFillMode;
  // Slats (when roofFillMode === 'slats')
  slatCount: number;
  slatGapCm: number; // gap between slats in cm (1, 2, 3, 4)
  slatColor: string;
  // Santaf (when roofFillMode === 'santaf')
  santaf: SantafChoice;
  santafColor: string;
  // Colors
  frameColor: string;
  roofColor: string;
  // Spacing
  spacingMode: SpacingMode;
  // Profiles
  selectedProfiles: Record<ProfileName, string>; // profile name → preset label
  // Customer
  notes: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}

/** Output of the rule engine */
export interface PergolaSpecs {
  moduleClassification: ModuleClassification;
  moduleCount: number;
  carrierCount: number;
  frontPostCount: number;
  backPostCount: number;
  moduleWidths: number[]; // in mm
  spacingMm: number; // actual spacing between profiles in mm
  profiles: Record<ProfileName, string>; // which profiles are active
  // Slat calculations (fixed pergola)
  slatCount: number;
  slatGapMm: number;
  slatWidthMm: number; // each slat profile width
}

/** Full DB row */
export interface PergolaRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  width: number; // stored in mm
  length: number;
  height: number | null;
  pergola_type: string;
  mount_type: MountType;
  installation: boolean;
  lighting: LightingChoice;
  lighting_position: LightingPosition;
  lighting_type: LightingFixture;
  lighting_posts: number[];
  lighting_roof: boolean;
  santaf_roofing: boolean;
  santaf_color: string;
  frame_color: string;
  roof_color: string;
  notes: string;
  module_classification: ModuleClassification;
  carrier_count: number;
  front_post_count: number;
  back_post_count: number;
  spacing_mode: SpacingMode;
  spacing_cm: number | null;
  profile_preset: string;
  selected_profiles: Record<string, string>;
  post_layout: any;
  pdf_url: string | null;
  status: PergolaRequestStatus;
  admin_notes: string;
  admin_modified_config: Record<string, any> | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

/** Props for SVG drawing components */
export interface DrawingConfig {
  widthMm: number;
  lengthMm: number;
  heightMm: number;
  mountType: MountType;
  lighting: LightingChoice;
  lightingPosition: LightingPosition;
  lightingFixture: LightingFixture;
  lightingRoof: boolean;
  lightingPosts: number[];
  roofFillMode: RoofFillMode;
  santaf: SantafChoice;
  santafColor: string;
  slatColor: string;
  specs: PergolaSpecs;
  frameColor: string;
  roofColor: string;
  pergolaType: PergolaType;
}

// ── Helpers ──

export function cmToMm(cm: number): number {
  return Math.round(cm * 10);
}

export function mmToCm(mm: number): number {
  return mm / 10;
}
