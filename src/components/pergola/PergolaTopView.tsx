import type { DrawingConfig } from "@/types/pergola";
import { mmToCm } from "@/types/pergola";
import { calcPostPositions, calcCarrierPositions } from "@/lib/pergolaRules";

interface Props { config: DrawingConfig }

const PAD = 500;

export const PergolaTopView = ({ config }: Props) => {
  const { widthMm, lengthMm, mountType, lighting, lightingPosition, lightingFixture, lightingRoof, lightingPosts, santaf, santafColor, specs, frameColor } = config;
  const postPositions = calcPostPositions(widthMm, specs.frontPostCount);
  const carrierPositions = calcCarrierPositions(lengthMm, specs.carrierCount);

  const vw = widthMm + PAD * 2;
  const vh = lengthMm + PAD * 2;
  const ox = PAD;
  const oy = PAD;
  const postSize = Math.max(60, Math.min(widthMm, lengthMm) * 0.022);
  const sw = Math.max(12, widthMm * 0.003);
  const fontSize = Math.max(55, Math.min(widthMm, lengthMm) * 0.016);

  const hasPostLight = (idx: number) => {
    if (lighting === "none") return false;
    if (lightingPosition === "all_posts") return true;
    if (lightingPosition === "selected_posts") return lightingPosts.includes(idx);
    return false;
  };

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full" style={{ maxHeight: 460 }}>
      {/* Santaf roof overlay */}
      {santaf === "with" && (
        <rect x={ox} y={oy} width={widthMm} height={lengthMm} fill={santafColor || "#B22222"} fillOpacity={0.15} rx={8} />
      )}

      {/* Frame outline */}
      <rect x={ox} y={oy} width={widthMm} height={lengthMm} fill="none" stroke={frameColor || "#383838"} strokeWidth={sw * 1.5} rx={4} />

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

      {/* Carriers */}
      {carrierPositions.map((y, i) => (
        <line key={`car-${i}`} x1={ox + 20} y1={oy + y} x2={ox + widthMm - 20} y2={oy + y}
          stroke="#9CA3AF" strokeWidth={sw * 0.6} />
      ))}

      {/* Roof lighting strip */}
      {lightingRoof && lighting !== "none" && (
        <rect x={ox + 60} y={oy + 60} width={widthMm - 120} height={lengthMm - 120}
          fill="none" stroke={lighting === "rgb" ? "#E040FB" : "#FDE68A"} strokeWidth={sw * 0.8}
          strokeDasharray="30 15" rx={20} opacity={0.7} />
      )}

      {/* Carrier lights (between carriers) */}
      {lighting !== "none" && lightingPosition !== "no_posts" &&
        carrierPositions.slice(0, -1).map((y, i) => {
          const midY = (y + (carrierPositions[i + 1] ?? y)) / 2;
          return (
            <circle key={`clight-${i}`} cx={ox + widthMm / 2} cy={oy + midY}
              r={Math.max(22, widthMm * 0.007)}
              fill={lighting === "white" ? "#FEF3C7" : "#E879F9"}
              stroke={lighting === "white" ? "#F59E0B" : "#A855F7"} strokeWidth={3} opacity={0.8} />
          );
        })}

      {/* Front posts */}
      {postPositions.map((x, i) => {
        const lit = hasPostLight(i);
        return (
          <g key={`fp-${i}`}>
            <rect x={ox + x - postSize / 2} y={oy - postSize / 2} width={postSize} height={postSize}
              fill={frameColor || "#383838"} stroke="#000" strokeWidth={4} rx={4} />
            {lit && (
              <circle cx={ox + x} cy={oy - postSize / 2 - 25} r={16}
                fill={lighting === "rgb" ? "#E040FB" : "#FDE68A"} stroke="#666" strokeWidth={2} />
            )}
          </g>
        );
      })}

      {/* Back posts (freestanding) */}
      {mountType === "freestanding" &&
        postPositions.map((x, i) => {
          const lit = hasPostLight(i + specs.frontPostCount);
          return (
            <g key={`bp-${i}`}>
              <rect x={ox + x - postSize / 2} y={oy + lengthMm - postSize / 2} width={postSize} height={postSize}
                fill={frameColor || "#383838"} stroke="#000" strokeWidth={4} rx={4} />
              {lit && (
                <circle cx={ox + x} cy={oy + lengthMm + postSize / 2 + 25} r={16}
                  fill={lighting === "rgb" ? "#E040FB" : "#FDE68A"} stroke="#666" strokeWidth={2} />
              )}
            </g>
          );
        })}

      {/* Width dimension (top) */}
      <line x1={ox} y1={oy - 250} x2={ox + widthMm} y2={oy - 250} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox} y1={oy - 290} x2={ox} y2={oy - 210} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox + widthMm} y1={oy - 290} x2={ox + widthMm} y2={oy - 210} stroke="#6B7280" strokeWidth={4} />
      <text x={ox + widthMm / 2} y={oy - 280} textAnchor="middle" fontSize={fontSize} fill="#374151" fontFamily="sans-serif" fontWeight="600">
        {mmToCm(widthMm)} cm
      </text>

      {/* Length dimension (right) */}
      <line x1={ox + widthMm + 250} y1={oy} x2={ox + widthMm + 250} y2={oy + lengthMm} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox + widthMm + 210} y1={oy} x2={ox + widthMm + 290} y2={oy} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox + widthMm + 210} y1={oy + lengthMm} x2={ox + widthMm + 290} y2={oy + lengthMm} stroke="#6B7280" strokeWidth={4} />
      <text x={ox + widthMm + 340} y={oy + lengthMm / 2} textAnchor="middle" fontSize={fontSize} fill="#374151" fontFamily="sans-serif" fontWeight="600"
        transform={`rotate(90, ${ox + widthMm + 340}, ${oy + lengthMm / 2})`}>
        {mmToCm(lengthMm)} cm
      </text>

      {/* Spacing label */}
      {specs.carrierCount > 1 && carrierPositions.length >= 2 && (
        <>
          <line x1={ox - 180} y1={oy + carrierPositions[0]} x2={ox - 180} y2={oy + carrierPositions[1]}
            stroke="#9CA3AF" strokeWidth={3} />
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
