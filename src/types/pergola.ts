export type MountType = 'wall' | 'freestanding';
export type LightingType = 'none' | 'white' | 'rgb';
export type ModuleClassification = 'single' | 'double' | 'triple' | 'custom';
export type PergolaRequestStatus = 'new' | 'in_review' | 'ready_for_quote' | 'quoted' | 'closed';

/** What the customer fills in the form */
export interface PergolaFormInput {
  width: number;
  length: number;
  height?: number;
  pergolaType: string;
  mountType: MountType;
  installation: boolean;
  lighting: LightingType;
  santafRoofing: boolean;
  frameColor: string;
  roofColor: string;
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
  moduleWidths: number[];
}

/** Full DB row */
export interface PergolaRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  width: number;
  length: number;
  height: number | null;
  pergola_type: string;
  mount_type: MountType;
  installation: boolean;
  lighting: LightingType;
  santaf_roofing: boolean;
  frame_color: string;
  roof_color: string;
  notes: string;
  module_classification: ModuleClassification;
  carrier_count: number;
  front_post_count: number;
  back_post_count: number;
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
  width: number;
  length: number;
  height: number;
  mountType: MountType;
  lighting: LightingType;
  specs: PergolaSpecs;
  frameColor: string;
  roofColor: string;
}
