import type { DrawingConfig } from "@/types/pergola";
import { lightingColor } from "@/types/pergola";
import { calcPostPositions, calcCarrierPositions } from "@/lib/pergolaRules";
import { usePergolaEditor, type SelectedElement } from "@/stores/usePergolaEditor";

interface Props { config: DrawingConfig }

const ISO_SCALE = 0.5;
const ISO_Y_FACTOR = 0.35;

function toIso(x: number, y: number, z: number): [number, number] {
  return [x + y * ISO_SCALE, -z + y * ISO_Y_FACTOR];
}

export const PergolaIsometricView = ({ config }: Props) => {
  const { widthMm, lengthMm, heightMm, mountType, lighting, lightingPosition, lightingPosts, roofFillMode, santaf, santafColor, slatColor, specs, frameColor, roofColor, pergolaType, carrierConfigs } = config;
  const { selected, select, hoverElement, setHoverElement } = usePergolaEditor();
  const isFixedSlats = pergolaType === "fixed" && roofFillMode === "slats";

  const postPositions = calcPostPositions(widthMm, specs.frontPostCount);
  const carrierPositions = calcCarrierPositions(widthMm, specs.carrierCount);

  const corners = [
    toIso(0, 0, 0), toIso(widthMm, 0, 0), toIso(0, lengthMm, 0), toIso(widthMm, lengthMm, 0),
    toIso(0, 0, heightMm), toIso(widthMm, 0, heightMm), toIso(0, lengthMm, heightMm), toIso(widthMm, lengthMm, heightMm),
  ];
  const xs = corners.map(c => c[0]);
  const ys = corners.map(c => c[1]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const pad = Math.max(widthMm, lengthMm, heightMm) * 0.14;
  const vx = minX - pad; const vy = minY - pad;
  const vw = maxX - minX + pad * 2; const vh = maxY - minY + pad * 2;
  const sw = Math.max(8, widthMm * 0.003);

  const fc = frameColor || "#2D2D2D";
  const postW = Math.max(6, sw * 2.8); // minimum 6px thick posts

  const isoLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, stroke: string, strokeWidth: number, key: string, dash?: string) => {
    const [sx, sy] = toIso(x1, y1, z1); const [ex, ey] = toIso(x2, y2, z2);
    return <line key={key} x1={sx} y1={sy} x2={ex} y2={ey} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} strokeLinecap="round" />;
  };

  const roofPts = [toIso(0, 0, heightMm), toIso(widthMm, 0, heightMm), toIso(widthMm, lengthMm, heightMm), toIso(0, lengthMm, heightMm)];
  const roofPath = roofPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + " Z";

  const hasPostLight = (idx: number) => {
    if (lighting === "none") return false;
    if (lightingPosition === "all_posts") return true;
    if (lightingPosition === "selected_posts") return lightingPosts.includes(idx);
    return false;
  };

  const isSelected = (el: SelectedElement) => selected?.type === el.type && selected?.index === el.index;
  const isHovered = (el: SelectedElement) => hoverElement?.type === el.type && hoverElement?.index === el.index;
  const handleClick = (el: SelectedElement) => (e: React.MouseEvent) => { e.stopPropagation(); select(isSelected(el) ? null : el); };
  const handleHover = (el: SelectedElement | null) => () => setHoverElement(el);

  const totalSections = carrierPositions.length >= 2 ? carrierPositions.length - 1 : 0;

  return (
    <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full cursor-default" style={{ maxHeight: 460 }}
      onClick={() => select(null)}>

      <defs>
        {/* Gradient for roof slats — simulates light direction */}
        <linearGradient id="slatGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* ── Ground plane — subtle gray rectangle so structure doesn't float ── */}
      {(() => {
        const gPts = [
          toIso(-widthMm * 0.05, -lengthMm * 0.02, 0),
          toIso(widthMm * 1.05, -lengthMm * 0.02, 0),
          toIso(widthMm * 1.05, lengthMm * 1.05, 0),
          toIso(-widthMm * 0.05, lengthMm * 1.05, 0),
        ];
        return <polygon points={gPts.map(p => `${p[0]},${p[1]}`).join(" ")} fill="#F5F5F5" />;
      })()}

      {/* ── Ground shadow — semi-transparent, projected ── */}
      {(() => {
        const sPts = [
          toIso(widthMm * 0.02, lengthMm * 0.02, 0),
          toIso(widthMm * 0.98, lengthMm * 0.02, 0),
          toIso(widthMm * 0.98, lengthMm * 0.98, 0),
          toIso(widthMm * 0.02, lengthMm * 0.98, 0),
        ];
        return <polygon points={sPts.map(p => `${p[0]},${p[1]}`).join(" ")} fill="#000" fillOpacity={0.06} />;
      })()}

      {/* Santaf overlay */}
      {santaf === "with" && (
        <path d={roofPath} fill={santafColor || "#B22222"} fillOpacity={0.2}
          stroke={santafColor || "#B22222"} strokeWidth={sw * 0.5}
          className="cursor-pointer"
          onClick={handleClick({ type: "santaf", index: -1 })}
          onMouseEnter={handleHover({ type: "santaf", index: -1 })}
          onMouseLeave={handleHover(null)} />
      )}

      {/* Roof surface */}
      <path d={roofPath} fill={roofColor || "#E8E8E8"} fillOpacity={0.25}
        stroke={fc} strokeWidth={sw * 2.5}
        className="cursor-pointer"
        onClick={handleClick({ type: "roof", index: -1 })}
        onMouseEnter={handleHover({ type: "roof", index: -1 })}
        onMouseLeave={handleHover(null)} />

      {/* ── Posts — THICKER, solid fill, with base shadow ── */}
      {postPositions.map((x, i) => {
        const el: SelectedElement = { type: "front_post", index: i };
        const [bx, by] = toIso(x, 0, 0);
        const [tx, ty] = toIso(x, 0, heightMm);
        const isSel = isSelected(el);
        const isHov = isHovered(el);
        const lit = hasPostLight(i);
        return (
          <g key={`fp-${i}`} className="cursor-pointer"
            onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)}>
            <circle cx={(bx + tx) / 2} cy={(by + ty) / 2} r={sw * 8} fill="transparent" />
            {/* Post shadow on ground */}
            <circle cx={bx + 3} cy={by + 3} r={postW * 1.5} fill="#000" fillOpacity={0.08} />
            {/* Selection glow */}
            {(isSel || isHov) && (
              <line x1={bx} y1={by} x2={tx} y2={ty}
                stroke={isSel ? "#60A5FA" : "#93C5FD"} strokeWidth={postW + 8} strokeLinecap="round" opacity={0.3} />
            )}
            {/* Post body — thick, solid */}
            <line x1={bx} y1={by} x2={tx} y2={ty}
              stroke={isSel ? "#3B82F6" : "#B0B0B0"} strokeWidth={postW} strokeLinecap="round" />
            {/* Post fill highlight */}
            <line x1={bx} y1={by} x2={tx} y2={ty}
              stroke={fc} strokeWidth={postW * 0.6} strokeLinecap="round" />
            {lit && (() => {
              const [cx, cy] = toIso(x, 0, heightMm + 80);
              return <circle cx={cx} cy={cy} r={14} fill={lightingColor(lighting)} stroke="#555" strokeWidth={2} />;
            })()}
          </g>
        );
      })}

      {/* Back posts (freestanding) */}
      {mountType === "freestanding" && postPositions.map((x, i) => {
        const el: SelectedElement = { type: "back_post", index: i };
        const [bx, by] = toIso(x, lengthMm, 0);
        const [tx, ty] = toIso(x, lengthMm, heightMm);
        const isSel = isSelected(el);
        const lit = hasPostLight(i + specs.frontPostCount);
        return (
          <g key={`bp-${i}`} className="cursor-pointer"
            onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)}>
            <circle cx={(bx + tx) / 2} cy={(by + ty) / 2} r={sw * 8} fill="transparent" />
            <circle cx={bx + 3} cy={by + 3} r={postW * 1.5} fill="#000" fillOpacity={0.08} />
            <line x1={bx} y1={by} x2={tx} y2={ty} stroke="#B0B0B0" strokeWidth={postW} strokeLinecap="round" />
            <line x1={bx} y1={by} x2={tx} y2={ty} stroke={fc} strokeWidth={postW * 0.6} strokeLinecap="round" />
            {lit && (() => {
              const [cx, cy] = toIso(x, lengthMm, heightMm + 80);
              return <circle cx={cx} cy={cy} r={14} fill={lightingColor(lighting)} stroke="#555" strokeWidth={2} />;
            })()}
          </g>
        );
      })}

      {/* Wall */}
      {mountType === "wall" && <>
        {isoLine(0, lengthMm, 0, 0, lengthMm, heightMm * 1.08, "#9CA3AF", sw * 2.5, "wall-l")}
        {isoLine(widthMm, lengthMm, 0, widthMm, lengthMm, heightMm * 1.08, "#9CA3AF", sw * 2.5, "wall-r")}
        {isoLine(0, lengthMm, heightMm * 1.08, widthMm, lengthMm, heightMm * 1.08, "#9CA3AF", sw * 2.5, "wall-t")}
      </>}

      {/* ── Frame edges — THICKEST, darkest ── */}
      {isoLine(0, 0, heightMm, widthMm, 0, heightMm, fc, sw * 3, "tf")}
      {isoLine(0, lengthMm, heightMm, widthMm, lengthMm, heightMm, fc, sw * 3, "tb")}
      {isoLine(0, 0, heightMm, 0, lengthMm, heightMm, fc, sw * 3, "tl")}
      {isoLine(widthMm, 0, heightMm, widthMm, lengthMm, heightMm, fc, sw * 3, "tr")}

      {/* ── Carriers (קורות) — MEDIUM thickness, structural ── */}
      {carrierPositions.map((x, i) =>
        isoLine(x, 0, heightMm, x, lengthMm, heightMm, "#4A4A4A", sw * 1.5, `car-${i}`)
      )}

      {/* ── Slats — THINNEST, with alternating opacity for depth ── */}
      {isFixedSlats && totalSections > 0 && (() => {
        const globalColor = slatColor || "#6B6B6B";
        return Array.from({ length: totalSections }, (_, secIdx) => {
          const rtlIdx = totalSections - 1 - secIdx;
          const cc = carrierConfigs[rtlIdx];
          const secColor = cc?.slatColor || globalColor;
          const secGapMm = (cc?.slatGapCm ? cc.slatGapCm * 10 : specs.slatGapMm) || 30;
          const slatH = cc?.slatSize === "20x40" ? 40 : cc?.slatSize === "20x100" ? 100 : 70;
          const x1 = carrierPositions[secIdx];
          const x2 = carrierPositions[secIdx + 1];
          const usableLength = lengthMm - 90;
          const secSlatCount = Math.max(1, Math.floor(usableLength / (slatH + secGapMm)));
          const actualGap = secSlatCount > 0 ? (usableLength - secSlatCount * slatH) / (secSlatCount + 1) : secGapMm;

          return Array.from({ length: Math.min(secSlatCount, 60) }, (_, i) => {
            const yPos = actualGap + i * (slatH + actualGap);
            const yMid = yPos + slatH / 2;
            const [s1x, s1y] = toIso(x1 + 6, yMid, heightMm);
            const [s2x, s2y] = toIso(x2 - 6, yMid, heightMm);
            const opacity = i % 2 === 0 ? 0.85 : 1.0; // alternating for depth
            return <line key={`slat-${secIdx}-${i}`} x1={s1x} y1={s1y} x2={s2x} y2={s2y}
              stroke={secColor} strokeWidth={sw * 0.7} opacity={opacity} strokeLinecap="round" />;
          });
        });
      })()}

      {/* Roof gradient overlay — simulates light direction */}
      <path d={roofPath} fill="url(#slatGrad)" fillOpacity={0.5} stroke="none" pointerEvents="none" />

      {/* Carrier lights */}
      {lighting !== "none" && lightingPosition !== "no_posts" &&
        carrierPositions.slice(0, -1).map((x, i) => {
          const midX = (x + (carrierPositions[i + 1] ?? x)) / 2;
          const [cx, cy] = toIso(midX, lengthMm / 2, heightMm);
          return <circle key={`lt-${i}`} cx={cx} cy={cy} r={Math.max(12, widthMm * 0.005)} fill={lightingColor(lighting)} stroke="#666" strokeWidth={2} opacity={0.8} />;
        })}

      {/* Ground frame — very subtle grid lines */}
      {isoLine(0, 0, 0, widthMm, 0, 0, "#E0E0E0", sw * 0.3, "bf", "8 6")}
      {isoLine(0, lengthMm, 0, widthMm, lengthMm, 0, "#E0E0E0", sw * 0.3, "bb", "8 6")}
      {isoLine(0, 0, 0, 0, lengthMm, 0, "#E0E0E0", sw * 0.3, "bl", "8 6")}
      {isoLine(widthMm, 0, 0, widthMm, lengthMm, 0, "#E0E0E0", sw * 0.3, "br", "8 6")}
    </svg>
  );
};
