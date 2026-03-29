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
}

export interface PdfImages {
  isometric?: string; // base64 PNG
  top?: string;
  front?: string;
}

const TYPE_HE: Record<string, string> = { fixed: "פרגולה קבועה", pvc: "פרגולה PVC" };
const MOUNT_HE: Record<string, string> = { wall: "צמוד קיר", freestanding: "עצמאי" };
const MODULE_HE: Record<string, string> = { single: "יחיד", double: "כפול", triple: "משולש", custom: "דורש בדיקה" };
const FILL_HE: Record<string, string> = { slats: "שלבים / פרופילים", santaf: "סנטף" };

export async function svgToImage(svgEl: SVGSVGElement): Promise<string> {
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2.5;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FAFAFA";
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
  images: PdfImages,
): Promise<string> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const m = 15; // margin
  const cw = W - m * 2; // content width
  let y = m;

  // ── Helpers ──
  const txt = (s: string, x: number, yy: number, size = 9, color: [number, number, number] = [30, 30, 30], bold = false, align = "left") => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(s, x, yy, { align: align as any });
  };
  const sep = () => { doc.setDrawColor(230, 230, 230); doc.line(m, y, W - m, y); y += 5; };
  const pair = (label: string, value: string, col2x = 70) => {
    txt(label, W - m, y, 8, [130, 130, 130], false, "right");
    txt(value, W - m - col2x, y, 9, [30, 30, 30], true, "right");
    y += 5;
  };

  // ════════════════════════════════════════════
  // PAGE 1: Header + Specs
  // ════════════════════════════════════════════

  // Black header bar
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, W, 38, "F");

  // AMG PERGOLA text logo
  txt("A.M.G PERGOLA", W / 2, 16, 22, [255, 255, 255], true, "center");
  txt("LTD", W / 2, 23, 10, [180, 180, 180], false, "center");

  // Subtitle
  txt("Pergola Configuration Summary", W / 2, 31, 8, [160, 160, 160], false, "center");

  y = 48;

  // Date and reference
  const dateStr = new Date().toLocaleDateString("en-GB");
  const refNum = `REF-${Date.now().toString(36).toUpperCase()}`;
  txt(dateStr, m, y, 8, [150, 150, 150]);
  txt(refNum, W - m, y, 8, [150, 150, 150], false, "right");
  y += 8;
  sep();

  // ── Customer Info ──
  if (input.customerName) {
    txt("Customer / לקוח", W - m, y, 11, [30, 30, 30], true, "right");
    y += 7;
    pair("שם", input.customerName);
    pair("טלפון", input.customerPhone);
    if (input.customerEmail) pair("דוא\"ל", input.customerEmail);
    y += 2; sep();
  }

  // ── Pergola Details ──
  txt("Pergola Details / פרטי פרגולה", W - m, y, 11, [30, 30, 30], true, "right");
  y += 7;
  pair("סוג פרגולה", TYPE_HE[input.pergolaType] || input.pergolaType);
  pair("סוג התקנה", MOUNT_HE[input.mountType] || input.mountType);
  pair("התקנה מקצועית", input.installation ? "כן" : "לא");
  y += 2; sep();

  // ── Dimensions ──
  txt("Dimensions / מידות", W - m, y, 11, [30, 30, 30], true, "right");
  y += 7;
  pair("רוחב", `${input.widthCm} cm`);
  pair("עומק / הטלה", `${input.lengthCm} cm`);
  if (input.heightCm) pair("גובה", `${input.heightCm} cm`);
  pair("מודול", MODULE_HE[specs.moduleClassification] || specs.moduleClassification);
  y += 2; sep();

  // ── Structure ──
  txt("Structure / מבנה", W - m, y, 11, [30, 30, 30], true, "right");
  y += 7;
  pair("עמודים קדמיים", String(specs.frontPostCount));
  if (specs.backPostCount > 0) pair("עמודים אחוריים", String(specs.backPostCount));
  pair("נשאים", String(specs.carrierCount));
  pair("מרווח בין נשאים", `~${(specs.spacingMm / 10).toFixed(1)} cm`);
  y += 2; sep();

  // ── Roof Fill ──
  txt("Roof / גג", W - m, y, 11, [30, 30, 30], true, "right");
  y += 7;
  if (input.roofFillMode === "slats") {
    pair("מצב מילוי", FILL_HE.slats);
    pair("שלבים", String(specs.slatCount));
    pair("מרווח בין שלבים", `${input.slatGapCm || 3} cm`);
  }
  if (input.santaf === "with") {
    pair("סנטף", "כן");
  }
  pair("תאורה", input.lighting === "none" ? "ללא" : input.lighting.toUpperCase());
  y += 2; sep();

  // ── Colors ──
  txt("Colors / צבעים", W - m, y, 11, [30, 30, 30], true, "right");
  y += 7;
  // Frame color swatch
  const drawSwatch = (label: string, hex: string) => {
    txt(label, W - m, y, 8, [130, 130, 130], false, "right");
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      doc.setFillColor(r, g, b);
      doc.roundedRect(W - m - 80, y - 3.5, 12, 4.5, 1, 1, "F");
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(W - m - 80, y - 3.5, 12, 4.5, 1, 1, "S");
    } catch { /* skip swatch */ }
    txt(hex, W - m - 85, y, 7, [150, 150, 150], false, "right");
    y += 5;
  };
  drawSwatch("צבע מסגרת", input.frameColor);
  drawSwatch("צבע גג / בד", input.roofColor);
  if (input.slatColor && input.roofFillMode === "slats") drawSwatch("צבע שלבים", input.slatColor);
  if (input.santaf === "with" && input.santafColor) drawSwatch("צבע סנטף", input.santafColor);

  // ── Notes ──
  if (input.notes?.trim()) {
    y += 3; sep();
    txt("Notes / הערות", W - m, y, 11, [30, 30, 30], true, "right");
    y += 6;
    const lines = doc.splitTextToSize(input.notes.trim(), cw);
    doc.setFontSize(8); doc.setTextColor(60, 60, 60); doc.setFont("helvetica", "normal");
    doc.text(lines, W - m, y, { align: "right" });
    y += lines.length * 3.5;
  }

  // ════════════════════════════════════════════
  // PAGE 2: Drawings
  // ════════════════════════════════════════════
  const hasAnyImage = images.isometric || images.top || images.front;
  if (hasAnyImage) {
    doc.addPage();
    y = m;

    // Header bar
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, W, 22, "F");
    txt("Technical Drawings / שרטוטים טכניים", W / 2, 14, 14, [255, 255, 255], true, "center");
    y = 30;

    const imgW = cw;

    // Isometric view
    if (images.isometric) {
      txt("Isometric View / תלת מימד", W / 2, y, 9, [100, 100, 100], true, "center");
      y += 3;
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(m, y, imgW, 70, 2, 2, "S");
      doc.addImage(images.isometric, "PNG", m + 2, y + 2, imgW - 4, 66);
      y += 74;
    }

    // Top view
    if (images.top) {
      txt("Top View / מבט עליון", W / 2, y, 9, [100, 100, 100], true, "center");
      y += 3;
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(m, y, imgW, 70, 2, 2, "S");
      doc.addImage(images.top, "PNG", m + 2, y + 2, imgW - 4, 66);
      y += 74;
    }

    // Front view
    if (images.front) {
      if (y + 80 > H - 20) { doc.addPage(); y = m; }
      txt("Front View / מבט קדמי", W / 2, y, 9, [100, 100, 100], true, "center");
      y += 3;
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(m, y, imgW, 55, 2, 2, "S");
      doc.addImage(images.front, "PNG", m + 2, y + 2, imgW - 4, 51);
      y += 59;
    }
  }

  // ════════════════════════════════════════════
  // Footer on last page
  // ════════════════════════════════════════════
  const lastPage = doc.getNumberOfPages();
  doc.setPage(lastPage);

  // Footer bar
  doc.setFillColor(245, 245, 245);
  doc.rect(0, H - 28, W, 28, "F");
  doc.setDrawColor(230, 230, 230);
  doc.line(0, H - 28, W, H - 28);

  txt("A.M.G PERGOLA LTD", W / 2, H - 20, 8, [100, 100, 100], true, "center");

  doc.setFontSize(6); doc.setTextColor(160, 160, 160); doc.setFont("helvetica", "normal");
  doc.text("This is a configuration request summary, not a final price quotation.", W / 2, H - 14, { align: "center" });
  doc.text("Drawings and technical specifications are preliminary and subject to site inspection.", W / 2, H - 11, { align: "center" });
  doc.text("052-812-2846  |  mail@amgpergola.co.il", W / 2, H - 7, { align: "center" });

  return doc.output("datauristring");
}
