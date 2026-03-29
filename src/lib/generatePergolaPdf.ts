import { jsPDF } from "jspdf";
import type { PergolaSpecs } from "@/types/pergola";

export interface PdfInput {
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
  roofFillMode?: string;
  slatGapCm?: number;
  slatColor?: string;
  santaf: string;
  santafColor: string;
  frameColor: string;
  roofColor: string;
  spacingMode: string;
  notes: string;
  carrierConfigs?: { slatSize: string; slatGapCm: number; slatColor: string; lightingEnabled: boolean; lighting: string }[];
}

export interface PdfImageEntry {
  data: string;
  ratio: number; // width / height
}

export interface PdfImages {
  isometric?: PdfImageEntry;
  top?: PdfImageEntry;
  front?: PdfImageEntry;
}

const TYPE_EN: Record<string, string> = { fixed: "Fixed Pergola", pvc: "PVC Pergola" };
const MOUNT_EN: Record<string, string> = { wall: "Wall-Mounted", freestanding: "Freestanding" };
const MODULE_EN: Record<string, string> = { single: "Single Module", double: "Double Module", triple: "Triple Module", custom: "Custom Review" };

export interface CapturedImage {
  data: string; // base64 PNG
  width: number;
  height: number;
  ratio: number; // width / height
}

export async function svgToImage(svgEl: SVGSVGElement): Promise<string> {
  const captured = await svgToImageWithSize(svgEl);
  return captured.data;
}

export async function svgToImageWithSize(svgEl: SVGSVGElement): Promise<CapturedImage> {
  // Clone the SVG and set explicit pixel dimensions for high-res capture
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  const vb = svgEl.getAttribute("viewBox");
  let vbW = 1000, vbH = 1000;
  if (vb) {
    const parts = vb.split(/[\s,]+/).map(Number);
    if (parts.length >= 4) { vbW = parts[2]; vbH = parts[3]; }
  }
  const ratio = vbW / vbH;

  // Render at moderate resolution for small PDF (~1-2MB total)
  const renderW = 900;
  const renderH = Math.round(renderW / ratio);
  clone.setAttribute("width", String(renderW));
  clone.setAttribute("height", String(renderH));

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = renderW;
      canvas.height = renderH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FAFAFA";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, renderW, renderH);
      const data = canvas.toDataURL("image/jpeg", 0.6);
      URL.revokeObjectURL(url);
      resolve({ data, width: renderW, height: renderH, ratio });
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generatePergolaPdf(
  input: PdfInput,
  specs: PergolaSpecs,
  _locale: string,
  images: PdfImages,
): Promise<string> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const m = 15;
  const cw = W - m * 2;
  let y = m;

  // ── Helpers ──
  const txt = (s: string, x: number, yy: number, size = 9, color: [number, number, number] = [30, 30, 30], bold = false, align = "left") => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(s, x, yy, { align: align as any });
  };
  const sep = () => { doc.setDrawColor(235, 235, 235); doc.line(m, y, W - m, y); y += 6; };
  const row = (label: string, value: string) => {
    txt(label, m + 2, y, 8, [120, 120, 120]);
    txt(value, m + 65, y, 9, [30, 30, 30], true);
    y += 5.5;
  };
  const drawSwatch = (label: string, hex: string) => {
    txt(label, m + 2, y, 8, [120, 120, 120]);
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      doc.setFillColor(r, g, b);
      doc.roundedRect(m + 65, y - 3.5, 14, 5, 1, 1, "F");
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(m + 65, y - 3.5, 14, 5, 1, 1, "S");
    } catch { /* skip */ }
    txt(hex, m + 82, y, 7, [150, 150, 150]);
    y += 5.5;
  };
  const sectionTitle = (title: string) => {
    doc.setFillColor(248, 248, 248);
    doc.rect(m, y - 4, cw, 8, "F");
    txt(title, m + 3, y, 10, [50, 50, 50], true);
    y += 8;
  };

  // ════════════════════════════════════════════
  // PAGE 1: Header + Specs
  // ════════════════════════════════════════════

  // Black header
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, W, 36, "F");
  txt("A.M.G  PERGOLA", W / 2, 15, 24, [255, 255, 255], true, "center");
  txt("CONFIGURATION REQUEST", W / 2, 23, 9, [160, 160, 160], false, "center");
  txt("L T D", W / 2, 30, 7, [100, 100, 100], false, "center");

  y = 44;

  // Date + Ref
  const dateStr = new Date().toLocaleDateString("en-GB");
  const refNum = `REF-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  txt(`Date: ${dateStr}`, m, y, 8, [140, 140, 140]);
  txt(refNum, W - m, y, 8, [140, 140, 140], false, "right");
  y += 8;

  // ── Customer ──
  if (input.customerName) {
    sectionTitle("CUSTOMER DETAILS");
    row("Name", input.customerName);
    row("Phone", input.customerPhone);
    if (input.customerEmail) row("Email", input.customerEmail);
    y += 2; sep();
  }

  // ── Pergola ──
  sectionTitle("PERGOLA CONFIGURATION");
  row("Type", TYPE_EN[input.pergolaType] || input.pergolaType);
  row("Mount", MOUNT_EN[input.mountType] || input.mountType);
  row("Installation", input.installation ? "Yes" : "No");
  row("Module", MODULE_EN[specs.moduleClassification] || specs.moduleClassification);
  y += 2; sep();

  // ── Dimensions ──
  sectionTitle("DIMENSIONS");
  row("Width", `${input.widthCm} cm`);
  row("Depth / Projection", `${input.lengthCm} cm`);
  if (input.heightCm) row("Height", `${input.heightCm} cm`);
  y += 2; sep();

  // ── Structure ──
  sectionTitle("STRUCTURE");
  row("Front Posts", String(specs.frontPostCount));
  if (specs.backPostCount > 0) row("Back Posts", String(specs.backPostCount));
  row("Carriers", String(specs.carrierCount));
  row("Carrier Spacing", `~${(specs.spacingMm / 10).toFixed(1)} cm`);
  y += 2; sep();

  // ── Roof ──
  sectionTitle("ROOF / FILL");
  if (input.roofFillMode === "slats") {
    row("Fill Mode", "Internal Slats / Profiles");
    row("Slat Count", String(specs.slatCount));
    row("Slat Gap", `${input.slatGapCm || 3} cm`);
  } else {
    row("Fill Mode", "Santaf Roof");
  }
  if (input.santaf === "with") row("Santaf", "Included");
  row("Lighting", input.lighting === "none" ? "None" : input.lighting.toUpperCase());
  y += 2; sep();

  // ── Colors ──
  sectionTitle("COLORS");
  drawSwatch("Frame", input.frameColor);
  drawSwatch("Roof / Fabric", input.roofColor);
  if (input.slatColor && input.roofFillMode === "slats") drawSwatch("Slat Profiles", input.slatColor);
  if (input.santaf === "with" && input.santafColor) drawSwatch("Santaf", input.santafColor);

  // ── Per-carrier slat details ──
  if (input.roofFillMode === "slats" && input.carrierConfigs && input.carrierConfigs.length > 0) {
    y += 2; sep();
    sectionTitle("SLATS PER CARRIER");
    input.carrierConfigs.forEach((cc, i) => {
      const slatW = 20; // mm face
      const gapMm = cc.slatGapCm * 10;
      const count = Math.max(1, Math.floor(((input.widthCm * 10) - gapMm) / (slatW + gapMm)));
      const lightTxt = cc.lightingEnabled ? ` | Light: ${cc.lighting.toUpperCase()}` : "";
      row(`Carrier ${i + 1}`, `${count} slats | ${cc.slatSize} | Gap: ${cc.slatGapCm}cm${lightTxt}`);
      // Color swatch
      try {
        const r = parseInt(cc.slatColor.slice(1, 3), 16);
        const g = parseInt(cc.slatColor.slice(3, 5), 16);
        const b = parseInt(cc.slatColor.slice(5, 7), 16);
        doc.setFillColor(r, g, b);
        doc.roundedRect(m + 65 + 100, y - 8, 10, 4, 1, 1, "F");
      } catch { /* skip */ }
    });
  }

  // ── Notes ──
  if (input.notes?.trim()) {
    y += 3; sep();
    sectionTitle("NOTES");
    const lines = doc.splitTextToSize(input.notes.trim(), cw - 4);
    doc.setFontSize(8); doc.setTextColor(60, 60, 60); doc.setFont("helvetica", "normal");
    doc.text(lines, m + 2, y);
    y += lines.length * 3.5;
  }

  // ════════════════════════════════════════════
  // PAGE 2+: Drawings (auto-height based on aspect ratio)
  // ════════════════════════════════════════════
  const viewEntries: [string, PdfImageEntry | undefined][] = [
    ["ISOMETRIC VIEW", images.isometric],
    ["TOP VIEW", images.top],
    ["FRONT VIEW", images.front],
  ];
  const availableViews = viewEntries.filter(([, img]) => img) as [string, PdfImageEntry][];

  if (availableViews.length > 0) {
    doc.addPage();
    y = m;

    // Header
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, W, 22, "F");
    txt("TECHNICAL DRAWINGS", W / 2, 14, 14, [255, 255, 255], true, "center");
    y = 30;

    for (const [label, entry] of availableViews) {
      // Fit image proportionally within page width
      const maxImgW = cw - 8;
      const maxImgH = 130; // max height per image on page
      let imgW = maxImgW;
      let imgH = imgW / entry.ratio;
      if (imgH > maxImgH) { imgH = maxImgH; imgW = imgH * entry.ratio; }
      const frameW = imgW + 8;
      const frameH = imgH + 8;
      const frameX = m + (cw - frameW) / 2; // center the frame

      if (y + frameH + 14 > H - 30) {
        doc.addPage();
        y = m;
      }

      // Label
      txt(label, W / 2, y, 9, [80, 80, 80], true, "center");
      y += 5;

      // Frame — centered
      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(frameX, y, frameW, frameH, 2, 2, "FD");

      // Image — proportional, centered in frame
      doc.addImage(entry.data, "JPEG", frameX + 4, y + 4, imgW, imgH);
      y += frameH + 10;
    }
  }

  // ════════════════════════════════════════════
  // Footer on every page
  // ════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    // Footer line
    doc.setDrawColor(230, 230, 230);
    doc.line(m, H - 22, W - m, H - 22);
    // Footer text
    doc.setFontSize(6); doc.setTextColor(160, 160, 160); doc.setFont("helvetica", "normal");
    doc.text("A.M.G PERGOLA LTD  |  052-812-2846  |  mail@amgpergola.co.il", W / 2, H - 17, { align: "center" });
    doc.text("This document is a configuration request, not a final quotation.", W / 2, H - 13, { align: "center" });
    doc.text("All drawings and specifications are preliminary and subject to site inspection.", W / 2, H - 9, { align: "center" });
    doc.text(`Page ${p} of ${totalPages}`, W / 2, H - 5, { align: "center" });
  }

  return doc.output("datauristring");
}
