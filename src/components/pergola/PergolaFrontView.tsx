import type { DrawingConfig } from "@/types/pergola";
import { calcPostPositions } from "@/lib/pergolaRules";

interface Props {
  config: DrawingConfig;
}

const PAD = 400;

export const PergolaFrontView = ({ config }: Props) => {
  const { width, height, specs, frameColor } = config;
  const postPositions = calcPostPositions(width, specs.frontPostCount);

  const slopeOffset = 120; // slight slope visual
  const beamThickness = 60;
  const postWidth = Math.max(40, width * 0.015);

  const vw = width + PAD * 2;
  const vh = height + slopeOffset + PAD * 2;
  const ox = PAD;
  const groundY = PAD + height + slopeOffset;

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ maxHeight: 420 }}
    >
      {/* Ground line */}
      <line
        x1={0}
        y1={groundY}
        x2={vw}
        y2={groundY}
        stroke="#8B7355"
        strokeWidth={8}
      />

      {/* Posts */}
      {postPositions.map((x, i) => (
        <rect
          key={`post-${i}`}
          x={ox + x - postWidth / 2}
          y={groundY - height}
          width={postWidth}
          height={height}
          fill={frameColor || "#333"}
          stroke="#000"
          strokeWidth={4}
        />
      ))}

      {/* Top beam */}
      <rect
        x={ox}
        y={groundY - height - beamThickness}
        width={width}
        height={beamThickness}
        fill={frameColor || "#333"}
        stroke="#000"
        strokeWidth={4}
      />

      {/* Slope indication line */}
      <line
        x1={ox}
        y1={groundY - height - beamThickness}
        x2={ox + width}
        y2={groundY - height - beamThickness + slopeOffset}
        stroke={frameColor || "#333"}
        strokeWidth={6}
        strokeDasharray="30 15"
        opacity={0.5}
      />

      {/* Height dimension (left) */}
      <line x1={ox - 200} y1={groundY} x2={ox - 200} y2={groundY - height} stroke="#555" strokeWidth={4} />
      <line x1={ox - 240} y1={groundY} x2={ox - 160} y2={groundY} stroke="#555" strokeWidth={4} />
      <line x1={ox - 240} y1={groundY - height} x2={ox - 160} y2={groundY - height} stroke="#555" strokeWidth={4} />
      <text
        x={ox - 280}
        y={groundY - height / 2}
        textAnchor="middle"
        fontSize={Math.max(60, height * 0.02)}
        fill="#333"
        fontFamily="sans-serif"
        transform={`rotate(-90, ${ox - 280}, ${groundY - height / 2})`}
      >
        {height} mm
      </text>

      {/* Width dimension (bottom) */}
      <line x1={ox} y1={groundY + 150} x2={ox + width} y2={groundY + 150} stroke="#555" strokeWidth={4} />
      <line x1={ox} y1={groundY + 110} x2={ox} y2={groundY + 190} stroke="#555" strokeWidth={4} />
      <line x1={ox + width} y1={groundY + 110} x2={ox + width} y2={groundY + 190} stroke="#555" strokeWidth={4} />
      <text
        x={ox + width / 2}
        y={groundY + 220}
        textAnchor="middle"
        fontSize={Math.max(60, width * 0.018)}
        fill="#333"
        fontFamily="sans-serif"
      >
        {width} mm
      </text>
    </svg>
  );
};
