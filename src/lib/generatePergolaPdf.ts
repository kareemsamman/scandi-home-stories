import { jsPDF } from "jspdf";
import type { PergolaSpecs } from "@/types/pergola";

interface PdfInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  width: number;
  length: number;
  height?: number | "";
  pergolaType: string;
  mountType: string;
  installation: boolean;
  lighting: string;
  santafRoofing: boolean;
  frameColor: string;
  roofColor: string;
  notes: string;
}

const MODULE_LABELS: Record<string, Record<string, string>> = {
  he: { single: "יחיד", double: "כפול", triple: "משולש", custom: "דורש בדיקה" },
  ar: { single: "فردية", double: "مزدوجة", triple: "ثلاثية", custom: "يتطلب مراجعة" },
};

const MOUNT_LABELS: Record<string, Record<string, string>> = {
  he: { wall: "צמוד קיר", freestanding: "עצמאי" },
  ar: { wall: "مثبتة على الحائط", freestanding: "مستقلة" },
};

const LIGHTING_LABELS: Record<string, Record<string, string>> = {
  he: { none: "ללא", white: "לבנה", rgb: "RGB" },
  ar: { none: "بدون", white: "أبيض", rgb: "RGB" },
};

const PERGOLA_TYPE_LABELS: Record<string, Record<string, string>> = {
  he: { bioclimatic: "ביוקלימטית", motorized: "למלות מוטורית", fixed: "קבועה", retractable: "נפתחת" },
  ar: { bioclimatic: "بيوكليماتيك", motorized: "لاميلا موتورية", fixed: "ثابتة", retractable: "قابلة للسحب" },
};

export async function generatePergolaPdf(
  input: PdfInput,
  specs: PergolaSpecs,
  locale: string,
  svgElement: SVGSVGElement | null,
): Promise<string> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const isRtl = locale === "he" || locale === "ar";
  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Helper: text aligned based on RTL
  const addText = (text: string, x: number, yPos: number, opts?: { fontSize?: number; bold?: boolean; color?: [number, number, number]; align?: string }) => {
    doc.setFontSize(opts?.fontSize || 10);
    doc.setTextColor(...(opts?.color || [51, 51, 51]));
    if (opts?.bold) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");
    doc.text(text, x, yPos, { align: (opts?.align || "left") as any });
  };

  // ── Header ──
  addText("AMG PERGOLA", pageW / 2, y, { fontSize: 18, bold: true, align: "center" });
  y += 6;
  addText("Pergola Request Summary", pageW / 2, y, { fontSize: 10, color: [120, 120, 120], align: "center" });
  y += 4;
  addText(new Date().toLocaleDateString("en-GB"), pageW / 2, y, { fontSize: 8, color: [150, 150, 150], align: "center" });
  y += 10;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Customer Info ──
  addText("Customer Information", margin, y, { fontSize: 12, bold: true });
  y += 7;
  const customerRows = [
    ["Name", input.customerName],
    ["Phone", input.customerPhone],
  ];
  if (input.customerEmail) customerRows.push(["Email", input.customerEmail]);

  customerRows.forEach(([label, value]) => {
    addText(`${label}:`, margin, y, { fontSize: 9, color: [100, 100, 100] });
    addText(value, margin + 30, y, { fontSize: 9 });
    y += 5;
  });
  y += 5;

  // ── Dimensions ──
  addText("Dimensions", margin, y, { fontSize: 12, bold: true });
  y += 7;
  const dimRows = [
    ["Width", `${input.width} mm`],
    ["Depth / Projection", `${input.length} mm`],
  ];
  if (input.height) dimRows.push(["Height", `${input.height} mm`]);

  dimRows.forEach(([label, value]) => {
    addText(`${label}:`, margin, y, { fontSize: 9, color: [100, 100, 100] });
    addText(value, margin + 50, y, { fontSize: 9 });
    y += 5;
  });
  y += 5;

  // ── Configuration ──
  addText("Configuration", margin, y, { fontSize: 12, bold: true });
  y += 7;
  const l = locale === "ar" ? "ar" : "he";
  const configRows = [
    ["Pergola Type", PERGOLA_TYPE_LABELS[l]?.[input.pergolaType] || input.pergolaType],
    ["Mount Type", MOUNT_LABELS[l]?.[input.mountType] || input.mountType],
    ["Installation", input.installation ? "Yes" : "No"],
    ["Lighting", LIGHTING_LABELS[l]?.[input.lighting] || input.lighting],
    ["Santaf Roofing", input.santafRoofing ? "Yes" : "No"],
    ["Frame Color", input.frameColor],
    ["Roof Color", input.roofColor],
  ];

  configRows.forEach(([label, value]) => {
    addText(`${label}:`, margin, y, { fontSize: 9, color: [100, 100, 100] });
    addText(value, margin + 50, y, { fontSize: 9 });
    y += 5;
  });
  y += 5;

  // ── Technical Specs ──
  addText("Technical Specifications", margin, y, { fontSize: 12, bold: true });
  y += 7;
  const specRows = [
    ["Module Type", MODULE_LABELS[l]?.[specs.moduleClassification] || specs.moduleClassification],
    ["Carrier Count", String(specs.carrierCount)],
    ["Front Posts", String(specs.frontPostCount)],
    ["Back Posts", String(specs.backPostCount)],
  ];

  specRows.forEach(([label, value]) => {
    addText(`${label}:`, margin, y, { fontSize: 9, color: [100, 100, 100] });
    addText(value, margin + 50, y, { fontSize: 9 });
    y += 5;
  });
  y += 5;

  // ── Notes ──
  if (input.notes.trim()) {
    addText("Notes", margin, y, { fontSize: 12, bold: true });
    y += 7;
    const lines = doc.splitTextToSize(input.notes.trim(), contentW);
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 5;
  }

  // ── SVG Drawing (if available) ──
  if (svgElement) {
    try {
      // Convert SVG to data URL via canvas
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const imgData = await new Promise<string>((resolve, reject) => {
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

      // Check remaining page space
      const remainingSpace = 297 - y - 30; // A4 height - current y - footer
      const imgW = contentW;
      const imgH = Math.min(remainingSpace, 80);

      if (imgH > 30) {
        addText("Top View Drawing", margin, y, { fontSize: 12, bold: true });
        y += 5;
        doc.addImage(imgData, "PNG", margin, y, imgW, imgH);
        y += imgH + 5;
      }
    } catch {
      // Silently skip if SVG rendering fails
    }
  }

  // ── Disclaimer ──
  y = Math.max(y, 260);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const disclaimer = "Drawing and post distribution are preliminary and subject to technical/site inspection.";
  doc.text(disclaimer, pageW / 2, y, { align: "center" });

  return doc.output("datauristring");
}
