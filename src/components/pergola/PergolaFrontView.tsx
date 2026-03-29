import type { DrawingConfig } from "@/types/pergola";
import { mmToCm } from "@/types/pergola";
import { calcPostPositions } from "@/lib/pergolaRules";
import { usePergolaEditor, type SelectedElement } from "@/stores/usePergolaEditor";

interface Props { config: DrawingConfig }

const PAD = 500;

export const PergolaFrontView = ({ config }: Props) => {
  const { widthMm, heightMm, mountType, lighting, lightingPosition, lightingPosts, roofFillMode, santaf, santafColor, slatColor, specs, frameColor, roofColor, pergolaType } = config;
  const { selected, select, hoverElement, setHoverElement } = usePergolaEditor();
  const isFixedSlats = pergolaType === "fixed" && roofFillMode === "slats";

  const postPositions = calcPostPositions(widthMm, specs.frontPostCount);
  const slopeOffset = 140;
  const beamH = 70;
  const postW = Math.max(50, widthMm * 0.016);
  const sw = Math.max(8, widthMm * 0.003);
  const fontSize = Math.max(55, widthMm * 0.016);

  const vw = widthMm + PAD * 2;
  const vh = heightMm + slopeOffset + PAD * 2;
  const ox = PAD;
  const groundY = PAD + heightMm + slopeOffset;

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

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full cursor-default" style={{ maxHeight: 460 }}
      onClick={() => select(null)}>

      {/* Ground */}
      <line x1={0} y1={groundY} x2={vw} y2={groundY} stroke="#A8896C" strokeWidth={10} />
      <rect x={0} y={groundY} width={vw} height={40} fill="#D4C5A9" fillOpacity={0.3} />

      {/* Santaf roof — clickable */}
      {santaf === "with" && (() => {
        const el: SelectedElement = { type: "santaf", index: -1 };
        const isSel = isSelected(el);
        return (
          <polygon
            points={`${ox},${groundY - heightMm - beamH} ${ox + widthMm},${groundY - heightMm - beamH + slopeOffset} ${ox + widthMm},${groundY - heightMm - beamH + slopeOffset + 50} ${ox},${groundY - heightMm - beamH + 50}`}
            fill={santafColor || "#B22222"} fillOpacity={0.25}
            stroke={isSel ? "#2563EB" : (santafColor || "#B22222")} strokeWidth={isSel ? 6 : 3}
            className="cursor-pointer"
            onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)} />
        );
      })()}

      {/* Roof/fabric area — clickable */}
      {(() => {
        const el: SelectedElement = { type: "roof", index: -1 };
        const isSel = isSelected(el);
        return (
          <polygon
            points={`${ox},${groundY - heightMm - beamH} ${ox + widthMm},${groundY - heightMm - beamH + slopeOffset} ${ox + widthMm},${groundY - heightMm} ${ox},${groundY - heightMm}`}
            fill={roofColor || "#C0C0C0"} fillOpacity={0.15}
            stroke={isSel ? "#2563EB" : "transparent"} strokeWidth={isSel ? 5 : 0}
            className="cursor-pointer"
            onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)} />
        );
      })()}

      {/* Top beam — frame click target */}
      {(() => {
        const el: SelectedElement = { type: "frame", index: -1 };
        const isSel = isSelected(el);
        return (
          <rect x={ox} y={groundY - heightMm - beamH} width={widthMm} height={beamH}
            fill={frameColor || "#383838"} stroke={isSel ? "#2563EB" : "#1F2937"} strokeWidth={isSel ? 6 : sw} rx={3}
            className="cursor-pointer"
            onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)} />
        );
      })()}

      {/* Internal slats cross-section (fixed pergola, slat mode) */}
      {isFixedSlats && specs.slatCount > 0 && (() => {
        const slatW = specs.slatWidthMm;
        const totalSlats = specs.slatCount;
        const gap = specs.slatGapMm;
        const totalUsed = totalSlats * slatW + (totalSlats + 1) * gap;
        const startX = (widthMm - totalUsed) / 2 + gap;
        const slatH = beamH * 0.6;
        return Array.from({ length: Math.min(totalSlats, 60) }, (_, i) => {
          const x = startX + i * (slatW + gap);
          return (
            <rect key={`slat-f-${i}`} x={ox + x} y={groundY - heightMm - beamH + (beamH - slatH) / 2}
              width={slatW} height={slatH}
              fill={slatColor || "#383838"} fillOpacity={0.6} rx={1} />
          );
        });
      })()}

      {/* Slope line */}
      <line x1={ox} y1={groundY - heightMm - beamH} x2={ox + widthMm} y2={groundY - heightMm - beamH + slopeOffset}
        stroke={frameColor || "#383838"} strokeWidth={sw} strokeDasharray="35 18" opacity={0.5} />

      {/* Posts — clickable */}
      {postPositions.map((x, i) => {
        const el: SelectedElement = { type: "front_post", index: i };
        const lit = hasPostLight(i);
        const isSel = isSelected(el);
        const isHov = isHovered(el);
        return (
          <g key={`post-${i}`} className="cursor-pointer"
            onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)}>
            {/* Selection highlight */}
            {(isSel || isHov) && (
              <rect x={ox + x - postW * 1.2} y={groundY - heightMm - 10} width={postW * 2.4} height={heightMm + 20}
                fill="none" stroke={isSel ? "#2563EB" : "#93C5FD"} strokeWidth={4} rx={4}
                strokeDasharray={isSel ? undefined : "10 5"} />
            )}
            {/* Post */}
            <rect x={ox + x - postW / 2} y={groundY - heightMm} width={postW} height={heightMm}
              fill={frameColor || "#383838"} stroke={isSel ? "#2563EB" : "#1F2937"} strokeWidth={isSel ? 5 : sw * 0.7} rx={2} />
            {/* Light */}
            {lit && (
              <circle cx={ox + x} cy={groundY - heightMm - beamH - 30} r={22}
                fill={lighting === "rgb" ? "#E040FB" : "#FDE68A"} stroke={isSel ? "#2563EB" : "#666"} strokeWidth={isSel ? 4 : 3} />
            )}
            {/* Label */}
            {(isSel || isHov) && (
              <text x={ox + x} y={groundY + 50} textAnchor="middle" fontSize={fontSize * 0.55} fill={isSel ? "#2563EB" : "#6B7280"} fontFamily="sans-serif" fontWeight="600">
                #{i + 1}
              </text>
            )}
          </g>
        );
      })}

      {/* Height dimension */}
      <line x1={ox - 250} y1={groundY} x2={ox - 250} y2={groundY - heightMm} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox - 290} y1={groundY} x2={ox - 210} y2={groundY} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox - 290} y1={groundY - heightMm} x2={ox - 210} y2={groundY - heightMm} stroke="#6B7280" strokeWidth={4} />
      <text x={ox - 330} y={groundY - heightMm / 2} textAnchor="middle" fontSize={fontSize} fill="#374151" fontFamily="sans-serif" fontWeight="600"
        transform={`rotate(-90, ${ox - 330}, ${groundY - heightMm / 2})`}>
        {mmToCm(heightMm)} cm
      </text>

      {/* Width dimension */}
      <line x1={ox} y1={groundY + 180} x2={ox + widthMm} y2={groundY + 180} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox} y1={groundY + 140} x2={ox} y2={groundY + 220} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox + widthMm} y1={groundY + 140} x2={ox + widthMm} y2={groundY + 220} stroke="#6B7280" strokeWidth={4} />
      <text x={ox + widthMm / 2} y={groundY + 260} textAnchor="middle" fontSize={fontSize} fill="#374151" fontFamily="sans-serif" fontWeight="600">
        {mmToCm(widthMm)} cm
      </text>

      <text x={ox + widthMm - 200} y={groundY - heightMm - beamH + slopeOffset - 20}
        textAnchor="end" fontSize={fontSize * 0.65} fill="#9CA3AF" fontFamily="sans-serif">7°</text>
    </svg>
  );
};
