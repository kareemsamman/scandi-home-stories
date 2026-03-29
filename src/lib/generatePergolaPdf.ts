import { jsPDF } from "jspdf";
import type { PergolaSpecs } from "@/types/pergola";

interface PdfInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  widthCm: number;
  lengthCm: number;
  heightCm?: number | 0;
  pergolaType: string;
  mountType: string;
  installation: boolean;
  lighting: string;
  lightingPosition: string;
  lightingFixture: string;
  lightingRoof: boolean;
  santaf: string;
  santafColor: string;
  frameColor: string;
  roofColor: string;
  spacingMode: string;
  notes: string;
}

const TYPE_LABELS: Record<string, string> = { fixed: "פרגולה קבועה / Fixed Pergola", pvc: "פרגולה PVC / PVC Pergola" };
const MOUNT_LABELS: Record<string, string> = { wall: "Wall-Mounted / צמוד קיר", freestanding: "Freestanding / עצמאי" };
const LIGHT_LABELS: Record<string, string> = { none: "None", white: "White", rgb: "RGB" };
const LIGHT_POS_LABELS: Record<string, string> = { none: "None", all_posts: "All Posts", selected_posts: "Selected Posts", no_posts: "No Posts" };
const FIXTURE_LABELS: Record<string, string> = { none: "None", spotlight: "Spotlight", led_strip: "LED Strip", rgb_strip: "RGB Strip", mixed: "Mixed Package" };
const SPACING_LABELS: Record<string, string> = { automatic: "Automatic", dense: "Dense", standard: "Standard", wide: "Wide" };
const MODULE_LABELS: Record<string, string> = { single: "Single", double: "Double", triple: "Triple", custom: "Custom Review" };

async function svgToImage(svgEl: SVGSVGElement): Promise<string> {
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#F9FAFB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generatePergolaPdf(
  input: PdfInput,
  specs: PergolaSpecs,
  locale: string,
  svgElement: SVGSVGElement | null,
): Promise<string> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  const text = (s: string, x: number, yy: number, opts?: { size?: number; bold?: boolean; color?: [number, number, number]; align?: string }) => {
    doc.setFontSize(opts?.size || 9);
    doc.setTextColor(...(opts?.color || [40, 40, 40]));
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.text(s, x, yy, { align: (opts?.align || "left") as any });
  };

  const line = () => { doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 3; };

  const row = (label: string, value: string) => {
    text(label, margin, y, { size: 8, color: [120, 120, 120] });
    text(value, margin + 52, y, { size: 9 });
    y += 4.5;
  };

  // ── Header ──
  text("AMG PERGOLA LTD", pageW / 2, y, { size: 16, bold: true, align: "center" });
  y += 5;
  text("Pergola Configuration Request", pageW / 2, y, { size: 9, color: [100, 100, 100], align: "center" });
  y += 4;
  text(new Date().toLocaleDateString("en-GB"), pageW / 2, y, { size: 7, color: [160, 160, 160], align: "center" });
  y += 7;
  line();

  // ── Customer ──
  text("Customer Information", margin, y, { size: 11, bold: true }); y += 5;
  row("Name", input.customerName);
  row("Phone", input.customerPhone);
  if (input.customerEmail) row("Email", input.customerEmail);
  y += 2; line();

  // ── Dimensions ──
  text("Dimensions", margin, y, { size: 11, bold: true }); y += 5;
  row("Width", `${input.widthCm} cm (${input.widthCm * 10} mm)`);
  row("Depth / Projection", `${input.lengthCm} cm (${input.lengthCm * 10} mm)`);
  if (input.heightCm) row("Height", `${input.heightCm} cm (${Number(input.heightCm) * 10} mm)`);
  y += 2; line();

  // ── Configuration ──
  text("Configuration", margin, y, { size: 11, bold: true }); y += 5;
  row("Pergola Type", TYPE_LABELS[input.pergolaType] || input.pergolaType);
  row("Mount Type", MOUNT_LABELS[input.mountType] || input.mountType);
  row("Installation", input.installation ? "Yes" : "No");
  row("Frame Color", input.frameColor);
  row("Roof / Fabric Color", input.roofColor);
  row("Spacing Preset", SPACING_LABELS[input.spacingMode] || input.spacingMode);
  y += 2; line();

  // ── Lighting ──
  text("Lighting", margin, y, { size: 11, bold: true }); y += 5;
  row("Lighting", LIGHT_LABELS[input.lighting] || input.lighting);
  if (input.lighting !== "none") {
    row("Position", LIGHT_POS_LABELS[input.lightingPosition] || input.lightingPosition);
    row("Fixture Type", FIXTURE_LABELS[input.lightingFixture] || input.lightingFixture);
    row("Roof Lighting", input.lightingRoof ? "Yes" : "No");
  }
  y += 2; line();

  // ── Santaf ──
  text("Roofing / Santaf", margin, y, { size: 11, bold: true }); y += 5;
  row("Santaf", input.santaf === "with" ? "Yes / Included" : "No / Without");
  if (input.santaf === "with" && input.santafColor) {
    row("Santaf Color", input.santafColor);
  }
  y += 2; line();

  // ── Technical Specs ──
  text("Technical Specifications", margin, y, { size: 11, bold: true }); y += 5;
  row("Module Type", MODULE_LABELS[specs.moduleClassification] || specs.moduleClassification);
  row("Carrier Count", String(specs.carrierCount));
  row("Front Posts", String(specs.frontPostCount));
  if (specs.backPostCount > 0) row("Back Posts", String(specs.backPostCount));
  row("Profile Spacing", `~${(specs.spacingMm / 10).toFixed(1)} cm`);
  y += 2;

  // Profiles
  if (specs.profiles) {
    row("Rafter", specs.profiles.rafter);
    row("Carrier Post", specs.profiles.carrier_post);
    row("Fabric Master", specs.profiles.fabric_master);
    row("Fabric Carrier", specs.profiles.fabric_carrier);
    row("Motor Box", specs.profiles.motor_box);
    row("Gutter", specs.profiles.gutter);
  }
  y += 2; line();

  // ── Notes ──
  if (input.notes.trim()) {
    text("Notes", margin, y, { size: 11, bold: true }); y += 5;
    const lines = doc.splitTextToSize(input.notes.trim(), contentW);
    doc.setFontSize(8); doc.setTextColor(60, 60, 60);
    doc.text(lines, margin, y);
    y += lines.length * 3.5 + 3;
    line();
  }

  // ── Drawing ──
  if (svgElement) {
    try {
      const imgData = await svgToImage(svgElement);
      const remain = 297 - y - 25;
      const imgH = Math.min(remain, 65);
      if (imgH > 25) {
        text("Top View Drawing", margin, y, { size: 11, bold: true }); y += 4;
        doc.addImage(imgData, "PNG", margin, y, contentW, imgH);
        y += imgH + 3;
      }
    } catch { /* skip */ }
  }

  // ── Disclaimer ──
  y = Math.max(y + 5, 270);
  doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 4;
  doc.setFontSize(6.5); doc.setTextColor(160, 160, 160);
  const disclaimer = [
    "This is a configuration request summary, not a final price quotation.",
    "Drawing and post distribution are preliminary and subject to technical review and site inspection.",
    "Final solution may differ based on structural requirements.",
  ];
  disclaimer.forEach((d) => { doc.text(d, pageW / 2, y, { align: "center" }); y += 3; });

  return doc.output("datauristring");
}
