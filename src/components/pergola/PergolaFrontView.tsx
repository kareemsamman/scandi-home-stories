import type { DrawingConfig } from "@/types/pergola";
import { mmToCm } from "@/types/pergola";
import { calcPostPositions } from "@/lib/pergolaRules";

interface Props { config: DrawingConfig }

const PAD = 500;

export const PergolaFrontView = ({ config }: Props) => {
  const { widthMm, heightMm, mountType, lighting, lightingPosition, lightingPosts, santaf, santafColor, specs, frameColor, roofColor } = config;
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

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full" style={{ maxHeight: 460 }}>
      {/* Ground */}
      <line x1={0} y1={groundY} x2={vw} y2={groundY} stroke="#A8896C" strokeWidth={10} />
      <rect x={0} y={groundY} width={vw} height={40} fill="#D4C5A9" fillOpacity={0.3} />

      {/* Santaf roof */}
      {santaf === "with" && (
        <polygon
          points={`${ox},${groundY - heightMm - beamH} ${ox + widthMm},${groundY - heightMm - beamH + slopeOffset} ${ox + widthMm},${groundY - heightMm - beamH + slopeOffset + 50} ${ox},${groundY - heightMm - beamH + 50}`}
          fill={santafColor || "#B22222"} fillOpacity={0.25} stroke={santafColor || "#B22222"} strokeWidth={3} />
      )}

      {/* Roof/fabric fill */}
      <polygon
        points={`${ox},${groundY - heightMm - beamH} ${ox + widthMm},${groundY - heightMm - beamH + slopeOffset} ${ox + widthMm},${groundY - heightMm} ${ox},${groundY - heightMm}`}
        fill={roofColor || "#C0C0C0"} fillOpacity={0.15} />

      {/* Top beam */}
      <rect x={ox} y={groundY - heightMm - beamH} width={widthMm} height={beamH}
        fill={frameColor || "#383838"} stroke="#1F2937" strokeWidth={sw} rx={3} />

      {/* Slope line */}
      <line x1={ox} y1={groundY - heightMm - beamH} x2={ox + widthMm} y2={groundY - heightMm - beamH + slopeOffset}
        stroke={frameColor || "#383838"} strokeWidth={sw} strokeDasharray="35 18" opacity={0.5} />

      {/* Posts */}
      {postPositions.map((x, i) => {
        const lit = hasPostLight(i);
        return (
          <g key={`post-${i}`}>
            <rect x={ox + x - postW / 2} y={groundY - heightMm} width={postW} height={heightMm}
              fill={frameColor || "#383838"} stroke="#1F2937" strokeWidth={sw * 0.7} rx={2} />
            {/* Post light indicator */}
            {lit && (
              <circle cx={ox + x} cy={groundY - heightMm - beamH - 30} r={20}
                fill={lighting === "rgb" ? "#E040FB" : "#FDE68A"} stroke="#666" strokeWidth={3} />
            )}
          </g>
        );
      })}

      {/* Height dimension (left) */}
      <line x1={ox - 250} y1={groundY} x2={ox - 250} y2={groundY - heightMm} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox - 290} y1={groundY} x2={ox - 210} y2={groundY} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox - 290} y1={groundY - heightMm} x2={ox - 210} y2={groundY - heightMm} stroke="#6B7280" strokeWidth={4} />
      <text x={ox - 330} y={groundY - heightMm / 2} textAnchor="middle" fontSize={fontSize} fill="#374151" fontFamily="sans-serif" fontWeight="600"
        transform={`rotate(-90, ${ox - 330}, ${groundY - heightMm / 2})`}>
        {mmToCm(heightMm)} cm
      </text>

      {/* Width dimension (bottom) */}
      <line x1={ox} y1={groundY + 180} x2={ox + widthMm} y2={groundY + 180} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox} y1={groundY + 140} x2={ox} y2={groundY + 220} stroke="#6B7280" strokeWidth={4} />
      <line x1={ox + widthMm} y1={groundY + 140} x2={ox + widthMm} y2={groundY + 220} stroke="#6B7280" strokeWidth={4} />
      <text x={ox + widthMm / 2} y={groundY + 260} textAnchor="middle" fontSize={fontSize} fill="#374151" fontFamily="sans-serif" fontWeight="600">
        {mmToCm(widthMm)} cm
      </text>

      {/* 7° angle indicator */}
      <text x={ox + widthMm - 200} y={groundY - heightMm - beamH + slopeOffset - 20}
        textAnchor="end" fontSize={fontSize * 0.65} fill="#9CA3AF" fontFamily="sans-serif">
        7°
      </text>
    </svg>
  );
};
