import type { DrawingConfig } from "@/types/pergola";
import { mmToCm, lightingColor } from "@/types/pergola";
import { calcPostPositions, calcCarrierPositions } from "@/lib/pergolaRules";
import { usePergolaEditor, type SelectedElement } from "@/stores/usePergolaEditor";

interface Props { config: DrawingConfig }

const PAD = 500;

export const PergolaTopView = ({ config }: Props) => {
  const { widthMm, lengthMm, mountType, lighting, lightingPosition, lightingRoof, lightingPosts, roofFillMode, santaf, santafColor, slatColor, specs, frameColor, roofColor, pergolaType, carrierConfigs } = config;
  const { selected, select, hoverElement, setHoverElement } = usePergolaEditor();
  const isFixedSlats = pergolaType === "fixed" && roofFillMode === "slats";

  const postPositions = calcPostPositions(widthMm, specs.frontPostCount);
  // Carriers are vertical lines distributed along the WIDTH axis
  const carrierPositions = calcCarrierPositions(widthMm, specs.carrierCount);

  const vw = widthMm + PAD * 2;
  const vh = lengthMm + PAD * 2;
  const ox = PAD;
  const oy = PAD;
  const postSize = Math.max(60, Math.min(widthMm, lengthMm) * 0.022);
  const hitSize = postSize * 2.2; // larger click target
  const sw = Math.max(12, widthMm * 0.003);
  const fontSize = Math.max(55, Math.min(widthMm, lengthMm) * 0.016);

  const hasPostLight = (idx: number) => {
    if (lighting === "none") return false;
    if (lightingPosition === "all_posts") return true;
    if (lightingPosition === "selected_posts") return lightingPosts.includes(idx);
    return false;
  };

  const isSelected = (el: SelectedElement) => selected?.type === el.type && selected?.index === el.index;
  const isHovered = (el: SelectedElement) => hoverElement?.type === el.type && hoverElement?.index === el.index;
  const selStroke = (el: SelectedElement) => isSelected(el) ? "#2563EB" : isHovered(el) ? "#60A5FA" : undefined;
  const selWidth = (el: SelectedElement) => isSelected(el) ? 10 : isHovered(el) ? 7 : 4;

  const handleClick = (el: SelectedElement) => (e: React.MouseEvent) => {
    e.stopPropagation();
    select(isSelected(el) ? null : el);
  };

  const handleHover = (el: SelectedElement | null) => () => setHoverElement(el);

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full cursor-default" style={{ maxHeight: 460 }}
      onClick={() => select(null)}>

      {/* Santaf overlay — clickable */}
      {santaf === "with" && (
        <rect x={ox} y={oy} width={widthMm} height={lengthMm}
          fill={santafColor || "#B22222"} fillOpacity={0.15} rx={8}
          className="cursor-pointer" stroke={selStroke({ type: "santaf", index: -1 })} strokeWidth={selWidth({ type: "santaf", index: -1 })}
          onClick={handleClick({ type: "santaf", index: -1 })}
          onMouseEnter={handleHover({ type: "santaf", index: -1 })}
          onMouseLeave={handleHover(null)} />
      )}

      {/* Roof/fabric area — clickable */}
      <rect x={ox + 2} y={oy + 2} width={widthMm - 4} height={lengthMm - 4}
        fill={roofColor || "#C0C0C0"} fillOpacity={santaf === "with" ? 0.05 : 0.08} rx={4}
        className="cursor-pointer" stroke={selStroke({ type: "roof", index: -1 })} strokeWidth={selWidth({ type: "roof", index: -1 })} strokeDasharray={isSelected({ type: "roof", index: -1 }) ? undefined : "0"}
        onClick={handleClick({ type: "roof", index: -1 })}
        onMouseEnter={handleHover({ type: "roof", index: -1 })}
        onMouseLeave={handleHover(null)} />

      {/* Frame outline — clickable */}
      <rect x={ox} y={oy} width={widthMm} height={lengthMm}
        fill="none" stroke={selStroke({ type: "frame", index: -1 }) || frameColor || "#383838"} strokeWidth={sw * 1.5} rx={4}
        className="cursor-pointer"
        onClick={handleClick({ type: "frame", index: -1 })}
        onMouseEnter={handleHover({ type: "frame", index: -1 })}
        onMouseLeave={handleHover(null)} />

      {/* Wall indicator */}
      {mountType === "wall" && (
        <rect x={ox - 40} y={oy + lengthMm} width={widthMm + 80} height={70} fill="#9CA3AF" rx={6} />
      )}

      {/* Module dividers */}
      {specs.moduleWidths.length > 1 &&
        specs.moduleWidths.slice(0, -1).reduce<number[]>((acc, mw, i) => {
          const x = (acc[i - 1] || 0) + mw;
          acc.push(x);
          return acc;
        }, []).map((xOff, i) => (
          <line key={`mod-${i}`} x1={ox + xOff} y1={oy} x2={ox + xOff} y2={oy + lengthMm}
            stroke={frameColor || "#383838"} strokeWidth={sw} strokeDasharray="50 25" />
        ))}

      {/* Carriers — vertical lines along width, clickable */}
      {carrierPositions.map((x, i) => (
        <g key={`car-${i}`}>
          <line x1={ox + x} y1={oy + 20} x2={ox + x} y2={oy + lengthMm - 20}
            stroke={selStroke({ type: "carrier", index: i }) || "#9CA3AF"} strokeWidth={isSelected({ type: "carrier", index: i }) ? sw * 1.2 : sw * 0.6} />
          {/* Invisible wider hit target */}
          <line x1={ox + x} y1={oy + 20} x2={ox + x} y2={oy + lengthMm - 20}
            stroke="transparent" strokeWidth={sw * 3}
            className="cursor-pointer"
            onClick={handleClick({ type: "carrier", index: i })}
            onMouseEnter={handleHover({ type: "carrier", index: i })}
            onMouseLeave={handleHover(null)} />
        </g>
      ))}

      {/* Internal slats — per-carrier sections (vertical strips), HORIZONTAL slats within each */}
      {isFixedSlats && carrierPositions.length >= 2 && (() => {
        const globalColor = slatColor || "#383E42";
        const sections = carrierPositions.length - 1;

        return Array.from({ length: sections }, (_, secIdx) => {
          const cc = carrierConfigs[secIdx];
          const secColor = cc?.slatColor || globalColor;
          const secGapMm = (cc?.slatGapCm ? cc.slatGapCm * 10 : specs.slatGapMm) || 30;
          const slatH = cc?.slatSize === "20x40" ? 40 : cc?.slatSize === "20x100" ? 100 : 70;
          const x1 = carrierPositions[secIdx];
          const x2 = carrierPositions[secIdx + 1];
          const secW = x2 - x1;

          // Slats run horizontally (across the section width), distributed along the length axis
          const autoCount = Math.max(1, Math.floor((lengthMm - secGapMm) / (slatH + secGapMm)));
          const secSlatCount = (cc?.slatCount && cc.slatCount > 0) ? cc.slatCount : autoCount;
          const actualGap = secSlatCount > 0 ? (lengthMm - secSlatCount * slatH) / (secSlatCount + 1) : secGapMm;

          const el: SelectedElement = { type: "carrier", index: secIdx };
          const isSel = isSelected(el);
          const isHov = isHovered(el);

          return (
            <g key={`sec-${secIdx}`} className="cursor-pointer"
              onClick={handleClick(el)} onMouseEnter={handleHover(el)} onMouseLeave={handleHover(null)}>
              {/* Hit target */}
              <rect x={ox + x1} y={oy} width={secW} height={lengthMm} fill="transparent" />
              {/* Selection highlight */}
              {(isSel || isHov) && (
                <rect x={ox + x1 + 3} y={oy + 3} width={secW - 6} height={lengthMm - 6}
                  fill={isSel ? "#2563EB" : "#93C5FD"} fillOpacity={0.06}
                  stroke={isSel ? "#2563EB" : "#93C5FD"} strokeWidth={4} rx={4}
                  strokeDasharray={isSel ? undefined : "12 6"} />
              )}
              {/* Slats — horizontal bars within each vertical section */}
              {Array.from({ length: secSlatCount }, (_, i) => {
                const yPos = actualGap + i * (slatH + actualGap);
                return (
                  <rect key={`slat-${secIdx}-${i}`}
                    x={ox + x1 + 6} y={oy + yPos} width={secW - 12} height={slatH}
                    fill={secColor} fillOpacity={0.8} rx={1} />
                );
              })}
              {/* Section label on hover/select */}
              {(isSel || isHov) && (
                <text x={ox + x1 + secW / 2} y={oy + lengthMm / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={fontSize * 0.5} fill={isSel ? "#2563EB" : "#6B7280"}
                  fontFamily="sans-serif" fontWeight="700" opacity={0.8}>
                  קורת חלוקה {secIdx + 1} — {secSlatCount} שלבים
                </text>
              )}
            </g>
          );
        });
      })()}

      {/* Roof lighting — clickable */}
      {lighting !== "none" && (
        <rect x={ox + 60} y={oy + 60} width={widthMm - 120} height={lengthMm - 120}
          fill="none"
          stroke={lightingRoof
            ? (selStroke({ type: "roof_lighting", index: -1 }) || (lightingColor(lighting)))
            : (selStroke({ type: "roof_lighting", index: -1 }) || "#D1D5DB")}
          strokeWidth={sw * 0.8} strokeDasharray="30 15" rx={20}
          opacity={lightingRoof ? 0.7 : 0.3}
          className="cursor-pointer"
          onClick={handleClick({ type: "roof_lighting", index: -1 })}
          onMouseEnter={handleHover({ type: "roof_lighting", index: -1 })}
          onMouseLeave={handleHover(null)} />
      )}

      {/* Carrier lights — centered in each vertical section */}
      {lighting !== "none" && lightingPosition !== "no_posts" &&
        carrierPositions.slice(0, -1).map((x, i) => {
          const midX = (x + (carrierPositions[i + 1] ?? x)) / 2;
          return (
            <circle key={`clight-${i}`} cx={ox + midX} cy={oy + lengthMm / 2}
              r={Math.max(22, widthMm * 0.007)}
              fill={lightingColor(lighting)}
              stroke={"#B8860B"} strokeWidth={3} opacity={0.8} />
          );
        })}

      {/* Front posts — clickable */}
      {postPositions.map((x, i) => {
        const el: SelectedElement = { type: "front_post", index: i };
        const lit = hasPostLight(i);
        const isSel = isSelected(el);
        const isHov = isHovered(el);
        return (
          <g key={`fp-${i}`} className="cursor-pointer"
            onClick={handleClick(el)}
            onMouseEnter={handleHover(el)}
            onMouseLeave={handleHover(null)}>
            {/* Hit target */}
            <rect x={ox + x - hitSize / 2} y={oy - hitSize / 2} width={hitSize} height={hitSize}
              fill="transparent" />
            {/* Selection ring */}
            {(isSel || isHov) && (
              <rect x={ox + x - postSize * 0.8} y={oy - postSize * 0.8} width={postSize * 1.6} height={postSize * 1.6}
                fill="none" stroke={isSel ? "#2563EB" : "#93C5FD"} strokeWidth={5} rx={8}
                strokeDasharray={isSel ? undefined : "12 6"} />
            )}
            {/* Post */}
            <rect x={ox + x - postSize / 2} y={oy - postSize / 2} width={postSize} height={postSize}
              fill={frameColor || "#383838"} stroke={isSel ? "#2563EB" : "#000"} strokeWidth={isSel ? 6 : 4} rx={4} />
            {/* Light indicator */}
            {lit && (
              <circle cx={ox + x} cy={oy - postSize / 2 - 25} r={18}
                fill={lightingColor(lighting)} stroke={isSel ? "#2563EB" : "#666"} strokeWidth={isSel ? 4 : 2} />
            )}
            {/* Post label */}
            {(isSel || isHov) && (
              <text x={ox + x} y={oy + postSize / 2 + 55} textAnchor="middle" fontSize={fontSize * 0.55} fill={isSel ? "#2563EB" : "#6B7280"} fontFamily="sans-serif" fontWeight="600">
                #{i + 1}
              </text>
            )}
          </g>
        );
      })}

      {/* Back posts — clickable (freestanding) */}
      {mountType === "freestanding" &&
        postPositions.map((x, i) => {
          const el: SelectedElement = { type: "back_post", index: i };
          const globalIdx = i + specs.frontPostCount;
          const lit = hasPostLight(globalIdx);
          const isSel = isSelected(el);
          const isHov = isHovered(el);
          return (
            <g key={`bp-${i}`} className="cursor-pointer"
              onClick={handleClick(el)}
              onMouseEnter={handleHover(el)}
              onMouseLeave={handleHover(null)}>
              <rect x={ox + x - hitSize / 2} y={oy + lengthMm - hitSize / 2} width={hitSize} height={hitSize}
                fill="transparent" />
              {(isSel || isHov) && (
                <rect x={ox + x - postSize * 0.8} y={oy + lengthMm - postSize * 0.8} width={postSize * 1.6} height={postSize * 1.6}
                  fill="none" stroke={isSel ? "#2563EB" : "#93C5FD"} strokeWidth={5} rx={8}
                  strokeDasharray={isSel ? undefined : "12 6"} />
              )}
              <rect x={ox + x - postSize / 2} y={oy + lengthMm - postSize / 2} width={postSize} height={postSize}
                fill={frameColor || "#383838"} stroke={isSel ? "#2563EB" : "#000"} strokeWidth={isSel ? 6 : 4} rx={4} />
              {lit && (
                <circle cx={ox + x} cy={oy + lengthMm + postSize / 2 + 25} r={18}
                  fill={lightingColor(lighting)} stroke={isSel ? "#2563EB" : "#666"} strokeWidth={isSel ? 4 : 2} />
              )}
              {(isSel || isHov) && (
                <text x={ox + x} y={oy + lengthMm - postSize / 2 - 35} textAnchor="middle" fontSize={fontSize * 0.55} fill={isSel ? "#2563EB" : "#6B7280"} fontFamily="sans-serif" fontWeight="600">
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

      {specs.carrierCount > 1 && carrierPositions.length >= 2 && (
        <>
          <line x1={ox - 180} y1={oy + carrierPositions[0]} x2={ox - 180} y2={oy + carrierPositions[1]} stroke="#9CA3AF" strokeWidth={3} />
          <text x={ox - 200} y={oy + (carrierPositions[0] + carrierPositions[1]) / 2}
            textAnchor="middle" fontSize={fontSize * 0.7} fill="#9CA3AF" fontFamily="sans-serif"
            transform={`rotate(-90, ${ox - 200}, ${oy + (carrierPositions[0] + carrierPositions[1]) / 2})`}>
            ~{mmToCm(specs.spacingMm)} cm
          </text>
        </>
      )}
    </svg>
  );
};
