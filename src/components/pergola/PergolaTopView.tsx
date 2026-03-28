import type { DrawingConfig } from "@/types/pergola";
import { calcPostPositions, calcCarrierPositions } from "@/lib/pergolaRules";

interface Props {
  config: DrawingConfig;
}

const PAD = 400; // mm padding for dimension labels

export const PergolaTopView = ({ config }: Props) => {
  const { width, length, mountType, lighting, specs, frameColor } = config;
  const postPositions = calcPostPositions(width, specs.frontPostCount);
  const carrierPositions = calcCarrierPositions(length, specs.carrierCount);

  const vw = width + PAD * 2;
  const vh = length + PAD * 2;
  const ox = PAD; // origin x
  const oy = PAD; // origin y

  const postSize = Math.max(60, Math.min(width, length) * 0.02);

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ maxHeight: 420 }}
    >
      {/* Frame outline */}
      <rect
        x={ox}
        y={oy}
        width={width}
        height={length}
        fill="none"
        stroke={frameColor || "#333"}
        strokeWidth={Math.max(20, width * 0.004)}
      />

      {/* Wall indicator for wall-mounted */}
      {mountType === "wall" && (
        <rect
          x={ox - 30}
          y={oy + length}
          width={width + 60}
          height={60}
          fill="#999"
          rx={8}
        />
      )}

      {/* Module dividers */}
      {specs.moduleWidths.length > 1 &&
        specs.moduleWidths.slice(0, -1).reduce((acc: number[], mw, i) => {
          const x = (acc[i - 1] || 0) + mw;
          acc.push(x);
          return acc;
        }, [] as number[]).map((xOff, i) => (
          <line
            key={`mod-${i}`}
            x1={ox + xOff}
            y1={oy}
            x2={ox + xOff}
            y2={oy + length}
            stroke={frameColor || "#333"}
            strokeWidth={12}
            strokeDasharray="40 20"
          />
        ))}

      {/* Carriers (horizontal lines) */}
      {carrierPositions.map((y, i) => (
        <line
          key={`car-${i}`}
          x1={ox}
          y1={oy + y}
          x2={ox + width}
          y2={oy + y}
          stroke="#888"
          strokeWidth={8}
        />
      ))}

      {/* Front posts */}
      {postPositions.map((x, i) => (
        <rect
          key={`fp-${i}`}
          x={ox + x - postSize / 2}
          y={oy - postSize / 2}
          width={postSize}
          height={postSize}
          fill={frameColor || "#333"}
          stroke="#000"
          strokeWidth={4}
        />
      ))}

      {/* Back posts (freestanding only) */}
      {mountType === "freestanding" &&
        postPositions.map((x, i) => (
          <rect
            key={`bp-${i}`}
            x={ox + x - postSize / 2}
            y={oy + length - postSize / 2}
            width={postSize}
            height={postSize}
            fill={frameColor || "#333"}
            stroke="#000"
            strokeWidth={4}
          />
        ))}

      {/* Lighting indicators */}
      {lighting !== "none" &&
        carrierPositions.slice(0, -1).map((y, i) => {
          const midY = (y + (carrierPositions[i + 1] ?? y)) / 2;
          return (
            <circle
              key={`light-${i}`}
              cx={ox + width / 2}
              cy={oy + midY}
              r={Math.max(20, width * 0.008)}
              fill={lighting === "white" ? "#FFF9C4" : "#E040FB"}
              stroke="#666"
              strokeWidth={3}
            />
          );
        })}

      {/* Width dimension (top) */}
      <line x1={ox} y1={oy - 200} x2={ox + width} y2={oy - 200} stroke="#555" strokeWidth={4} />
      <line x1={ox} y1={oy - 240} x2={ox} y2={oy - 160} stroke="#555" strokeWidth={4} />
      <line x1={ox + width} y1={oy - 240} x2={ox + width} y2={oy - 160} stroke="#555" strokeWidth={4} />
      <text
        x={ox + width / 2}
        y={oy - 220}
        textAnchor="middle"
        fontSize={Math.max(60, width * 0.018)}
        fill="#333"
        fontFamily="sans-serif"
      >
        {width} mm
      </text>

      {/* Length dimension (right side) */}
      <line x1={ox + width + 200} y1={oy} x2={ox + width + 200} y2={oy + length} stroke="#555" strokeWidth={4} />
      <line x1={ox + width + 160} y1={oy} x2={ox + width + 240} y2={oy} stroke="#555" strokeWidth={4} />
      <line x1={ox + width + 160} y1={oy + length} x2={ox + width + 240} y2={oy + length} stroke="#555" strokeWidth={4} />
      <text
        x={ox + width + 280}
        y={oy + length / 2}
        textAnchor="middle"
        fontSize={Math.max(60, length * 0.018)}
        fill="#333"
        fontFamily="sans-serif"
        transform={`rotate(90, ${ox + width + 280}, ${oy + length / 2})`}
      >
        {length} mm
      </text>
    </svg>
  );
};
