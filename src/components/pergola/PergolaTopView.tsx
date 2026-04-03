import type { DrawingConfig } from "@/types/pergola";
import { mmToCm, lightingColor } from "@/types/pergola";
import { calcPostPositions, calcCarrierPositions } from "@/lib/pergolaRules";
import { usePergolaEditor, type SelectedElement } from "@/stores/usePergolaEditor";

interface Props { config: DrawingConfig }

const PAD = 500;
const GAP_BG = "#EDF2F7"; // visible gap color between slats

export const PergolaTopView = ({ config }: Props) => {
  const { widthMm, lengthMm, mountType, lighting, lightingPosition, lightingRoof, lightingPosts, roofFillMode, santaf, santafColor, slatColor, specs, frameColor, roofColor, pergolaType, carrierConfigs } = config;
  const { selected, select, hoverElement, setHoverElement } = usePergolaEditor();
  const isFixedSlats = pergolaType === "fixed" && roofFillMode === "slats";

  const postPositions = calcPostPositions(widthMm, specs.frontPostCount);
  const carrierPositions = calcCarrierPositions(widthMm, specs.carrierCount);

  const vw = widthMm + PAD * 2;
  const vh = lengthMm + PAD * 2;
  const ox = PAD;
  const oy = PAD;
  const postSize = Math.max(60, Math.min(widthMm, lengthMm) * 0.022);
  const hitSize = postSize * 2.2;
  const fontSize = Math.max(55, Math.min(widthMm, lengthMm) * 0.016);

  // Structural hierarchy stroke widths
  const frameStroke = Math.max(18, widthMm * 0.005);   // thickest
  const beamStroke = Math.max(14, widthMm * 0.004);    // medium
  const slatStroke = Math.max(8, widthMm * 0.002);     // thinnest

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

  // Derive darker/lighter from user's frame color
  const fc = frameColor || "#2D2D2D";

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full cursor-default" style={{ maxHeight: 460 }}
      onClick={() => select(null)}>

      <defs>
        <filter id="selGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Santaf overlay */}
      {santaf === "with" && (
        <rect x={ox} y={oy} width={widthMm} height={lengthMm}
          fill={santafColor || "#7A8B9A"} fillOpacity={0.15} rx={8}
          className="cursor-pointer"
          onClick={handleClick({ type: "santaf", index: -1 })}
          onMouseEnter={handleHover({ type: "santaf", index: -1 })}
          onMouseLeave={handleHover(null)} />
      )}

      {/* Background fill — light color visible in gaps between slats */}
      <rect x={ox} y={oy} width={widthMm} height={lengthMm}
        fill={GAP_BG} rx={4}
        className="cursor-pointer"
        onClick={handleClick({ type: "roof", index: -1 })}
        onMouseEnter={handleHover({ type: "roof", index: -1 })}
        onMouseLeave={handleHover(null)} />

      {/* Module dividers — very subtle */}
      {specs.moduleWidths.length > 1 &&
        specs.moduleWidths.slice(0, -1).reduce<number[]>((acc, mw, i) => {
          acc.push((acc[i - 1] || 0) + mw); return acc;
        }, []).map((xOff, i) => (
          <line key={`mod-${i}`} x1={ox + xOff} y1={oy} x2={ox + xOff} y2={oy + lengthMm}
            stroke="#CCC" strokeWidth={slatStroke * 0.5} strokeDasharray="6 6" opacity={0.4} />
        ))}

      {/* ── SLATS — per-carrier sections ── */}
      {isFixedSlats && carrierPositions.length >= 2 && (() => {
        const globalColor = slatColor || "#6B6B6B";
        const sections = carrierPositions.length - 1;

        return Array.from({ length: sections }, (_, secIdx) => {
          const rtlIdx = sections - 1 - secIdx;
          const cc = carrierConfigs[rtlIdx];
          const secColor = cc?.slatColor || globalColor;
          const secGapMm = (cc?.slatGapCm ? cc.slatGapCm * 10 : specs.slatGapMm) || 30;
          const slatH = cc?.slatSize === "20x40" ? 40 : cc?.slatSize === "20x100" ? 100 : 70;
          const x1 = carrierPositions[secIdx];
          const x2 = carrierPositions[secIdx + 1];
          const secW = x2 - x1;
          const usableLength = lengthMm - 90;
          const secSlatCount = Math.max(1, Math.floor(usableLength / (slatH + secGapMm)));
          const actualGap = secSlatCount > 0 ? (usableLength - secSlatCount * slatH) / (secSlatCount + 1) : secGapMm;

          const el: SelectedElement = { type: "carrier", index: secIdx };
          const isSel = isSelected(el);
          const isHov = isHovered(el);
          const displayNum = sections - secIdx;

          return (
            <g key={`sec-${secIdx}`} className="cursor-pointer"
              onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)}>
              <rect x={ox + x1} y={oy} width={secW} height={lengthMm} fill="transparent" />

              {/* Selection highlight — subtle glow */}
              {(isSel || isHov) && (
                <rect x={ox + x1 + 2} y={oy + 2} width={secW - 4} height={lengthMm - 4}
                  fill={isSel ? "#DBEAFE" : "#EFF6FF"} fillOpacity={isSel ? 0.5 : 0.3}
                  stroke={isSel ? "#60A5FA" : "#93C5FD"} strokeWidth={2} rx={4}
                  filter="url(#selGlow)" />
              )}

              {/* Slats — thinner, with visible gaps (background shows through) */}
              {Array.from({ length: secSlatCount }, (_, i) => {
                const yPos = actualGap + i * (slatH + actualGap);
                const opacity = i % 2 === 0 ? 0.9 : 0.78; // alternating for depth
                return (
                  <rect key={`slat-${secIdx}-${i}`}
                    x={ox + x1 + 8} y={oy + yPos} width={secW - 16} height={slatH}
                    fill={secColor} fillOpacity={opacity} rx={2}
                    stroke={secColor} strokeWidth={0.5} strokeOpacity={0.3} />
                );
              })}

              {/* Lighting indicator strip — shows when section has lighting */}
              {cc?.lightingEnabled && cc.lighting !== "none" && (() => {
                const ltColor = cc.lighting === "3000k" ? "#FFD27F" : cc.lighting === "4000k" ? "#FFF4E0" : cc.lighting === "6000k" ? "#F0F4FF" : "#FDE68A";
                return (
                  <rect x={ox + x1 + secW * 0.15} y={oy + lengthMm - 45}
                    width={secW * 0.7} height={18} rx={9}
                    fill={ltColor} fillOpacity={0.7}
                    stroke={ltColor} strokeWidth={2} strokeOpacity={0.4} />
                );
              })()}

              {/* Section label */}
              {(isSel || isHov) && (
                <text x={ox + x1 + secW / 2} y={oy + lengthMm / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={fontSize * 0.42} fill="#3B82F6"
                  fontFamily="sans-serif" fontWeight="600" opacity={0.8}>
                  חלוקה {displayNum} — {secSlatCount} שלבים
                </text>
              )}
            </g>
          );
        });
      })()}

      {/* ── CARRIERS (קורות) — structural beams, THICKER than slats ── */}
      {carrierPositions.map((x, i) => (
        <g key={`car-${i}`}>
          <line x1={ox + x} y1={oy + 8} x2={ox + x} y2={oy + lengthMm - 8}
            stroke="#3A3A3A" strokeWidth={beamStroke} strokeLinecap="round" />
          <line x1={ox + x} y1={oy + 8} x2={ox + x} y2={oy + lengthMm - 8}
            stroke="transparent" strokeWidth={beamStroke * 3}
            className="cursor-pointer"
            onClick={handleClick({ type: "carrier", index: i })}
            onMouseEnter={handleHover({ type: "carrier", index: i })}
            onMouseLeave={handleHover(null)} />
        </g>
      ))}

      {/* ── FRAME — thickest, darkest, outermost ── */}
      <rect x={ox} y={oy} width={widthMm} height={lengthMm}
        fill="none" stroke={isSelected({ type: "frame", index: -1 }) ? "#3B82F6" : fc} strokeWidth={frameStroke} rx={6}
        className="cursor-pointer"
        onClick={handleClick({ type: "frame", index: -1 })}
        onMouseEnter={handleHover({ type: "frame", index: -1 })}
        onMouseLeave={handleHover(null)} />

      {/* Wall indicator */}
      {mountType === "wall" && (
        <rect x={ox - 40} y={oy + lengthMm} width={widthMm + 80} height={70} fill="#9CA3AF" rx={6} />
      )}

      {/* Roof lighting */}
      {lighting !== "none" && (
        <rect x={ox + 60} y={oy + 60} width={widthMm - 120} height={lengthMm - 120}
          fill="none"
          stroke={lightingRoof ? lightingColor(lighting) : "#D1D5DB"}
          strokeWidth={slatStroke * 0.8} strokeDasharray="30 15" rx={20}
          opacity={lightingRoof ? 0.7 : 0.3}
          className="cursor-pointer"
          onClick={handleClick({ type: "roof_lighting", index: -1 })}
          onMouseEnter={handleHover({ type: "roof_lighting", index: -1 })}
          onMouseLeave={handleHover(null)} />
      )}

      {/* Per-section lighting circles — based on each חלוקה's lighting config */}
      {isFixedSlats && carrierPositions.length >= 2 &&
        carrierPositions.slice(0, -1).map((x, i) => {
          const sections = carrierPositions.length - 1;
          const rtlIdx = sections - 1 - i;
          const cc = carrierConfigs[rtlIdx];
          if (!cc?.lightingEnabled || cc.lighting === "none") return null;
          const ltColor = cc.lighting === "3000k" ? "#FFD27F" : cc.lighting === "4000k" ? "#FFF4E0" : cc.lighting === "6000k" ? "#F0F4FF" : "#FDE68A";
          const midX = (x + (carrierPositions[i + 1] ?? x)) / 2;
          return (
            <circle key={`clight-${i}`} cx={ox + midX} cy={oy + lengthMm / 2}
              r={Math.max(22, widthMm * 0.008)}
              fill={ltColor} stroke="#B8860B" strokeWidth={2.5} opacity={0.9} />
          );
        })}

      {/* Front posts */}
      {postPositions.map((x, i) => {
        const el: SelectedElement = { type: "front_post", index: i };
        const lit = hasPostLight(i);
        const isSel = isSelected(el);
        const isHov = isHovered(el);
        return (
          <g key={`fp-${i}`} className="cursor-pointer"
            onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)}>
            <rect x={ox + x - hitSize / 2} y={oy - hitSize / 2} width={hitSize} height={hitSize} fill="transparent" />
            {(isSel || isHov) && (
              <rect x={ox + x - postSize * 0.8} y={oy - postSize * 0.8} width={postSize * 1.6} height={postSize * 1.6}
                fill={isSel ? "#DBEAFE" : "none"} fillOpacity={0.4}
                stroke={isSel ? "#60A5FA" : "#93C5FD"} strokeWidth={4} rx={8}
                filter="url(#selGlow)" />
            )}
            <rect x={ox + x - postSize / 2} y={oy - postSize / 2} width={postSize} height={postSize}
              fill={fc} stroke="#1A1A1A" strokeWidth={3} rx={4} />
            {lit && (
              <circle cx={ox + x} cy={oy - postSize / 2 - 25} r={16}
                fill={lightingColor(lighting)} stroke="#555" strokeWidth={2} />
            )}
            {(isSel || isHov) && (
              <text x={ox + x} y={oy + postSize / 2 + 50} textAnchor="middle" fontSize={fontSize * 0.5} fill="#3B82F6" fontFamily="sans-serif" fontWeight="600">
                #{i + 1}
              </text>
            )}
          </g>
        );
      })}

      {/* Back posts (freestanding) */}
      {mountType === "freestanding" &&
        postPositions.map((x, i) => {
          const el: SelectedElement = { type: "back_post", index: i };
          const lit = hasPostLight(i + specs.frontPostCount);
          const isSel = isSelected(el);
          const isHov = isHovered(el);
          return (
            <g key={`bp-${i}`} className="cursor-pointer"
              onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)}>
              <rect x={ox + x - hitSize / 2} y={oy + lengthMm - hitSize / 2} width={hitSize} height={hitSize} fill="transparent" />
              {(isSel || isHov) && (
                <rect x={ox + x - postSize * 0.8} y={oy + lengthMm - postSize * 0.8} width={postSize * 1.6} height={postSize * 1.6}
                  fill={isSel ? "#DBEAFE" : "none"} fillOpacity={0.4}
                  stroke={isSel ? "#60A5FA" : "#93C5FD"} strokeWidth={4} rx={8} />
              )}
              <rect x={ox + x - postSize / 2} y={oy + lengthMm - postSize / 2} width={postSize} height={postSize}
                fill={fc} stroke="#1A1A1A" strokeWidth={3} rx={4} />
              {lit && (
                <circle cx={ox + x} cy={oy + lengthMm + postSize / 2 + 25} r={16}
                  fill={lightingColor(lighting)} stroke="#555" strokeWidth={2} />
              )}
              {(isSel || isHov) && (
                <text x={ox + x} y={oy + lengthMm - postSize / 2 - 30} textAnchor="middle" fontSize={fontSize * 0.5} fill="#3B82F6" fontFamily="sans-serif" fontWeight="600">
                  #{i + 1}B
                </text>
              )}
            </g>
          );
        })}

      {/* Dimensions */}
      <line x1={ox} y1={oy - 250} x2={ox + widthMm} y2={oy - 250} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox} y1={oy - 290} x2={ox} y2={oy - 210} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox + widthMm} y1={oy - 290} x2={ox + widthMm} y2={oy - 210} stroke="#6B7280" strokeWidth={4} />
      <text x={ox + widthMm / 2} y={oy - 280} textAnchor="middle" fontSize={fontSize} fill="#374151" fontFamily="sans-serif" fontWeight="600">
        {mmToCm(widthMm)} cm
      </text>

      <line x1={ox + widthMm + 250} y1={oy} x2={ox + widthMm + 250} y2={oy + lengthMm} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox + widthMm + 210} y1={oy} x2={ox + widthMm + 290} y2={oy} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox + widthMm + 210} y1={oy + lengthMm} x2={ox + widthMm + 290} y2={oy + lengthMm} stroke="#6B7280" strokeWidth={4} />
      <text x={ox + widthMm + 340} y={oy + lengthMm / 2} textAnchor="middle" fontSize={fontSize} fill="#374151" fontFamily="sans-serif" fontWeight="600"
        transform={`rotate(90, ${ox + widthMm + 340}, ${oy + lengthMm / 2})`}>
        {mmToCm(lengthMm)} cm
      </text>

      {/* Spacing indicator */}
      {specs.carrierCount > 1 && carrierPositions.length >= 2 && (
        <>
          <line x1={ox + carrierPositions[0]} y1={oy - 150} x2={ox + carrierPositions[1]} y2={oy - 150} stroke="#9CA3AF" strokeWidth={3} />
          <line x1={ox + carrierPositions[0]} y1={oy - 170} x2={ox + carrierPositions[0]} y2={oy - 130} stroke="#9CA3AF" strokeWidth={3} />
          <line x1={ox + carrierPositions[1]} y1={oy - 170} x2={ox + carrierPositions[1]} y2={oy - 130} stroke="#9CA3AF" strokeWidth={3} />
          <text x={ox + (carrierPositions[0] + carrierPositions[1]) / 2} y={oy - 160}
            textAnchor="middle" fontSize={fontSize * 0.6} fill="#9CA3AF" fontFamily="sans-serif">
            ~{mmToCm(specs.spacingMm)} cm
          </text>
        </>
      )}
    </svg>
  );
};
