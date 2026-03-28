import type { DrawingConfig } from "@/types/pergola";
import { calcPostPositions, calcCarrierPositions } from "@/lib/pergolaRules";

interface Props {
  config: DrawingConfig;
}

// Simple isometric projection helpers
const ISO_SCALE = 0.5;
const ISO_Y_FACTOR = 0.35;

function toIso(x: number, y: number, z: number): [number, number] {
  return [x + y * ISO_SCALE, -z + y * ISO_Y_FACTOR];
}

export const PergolaIsometricView = ({ config }: Props) => {
  const { width, length, height, mountType, lighting, specs, frameColor, roofColor } = config;
  const postPositions = calcPostPositions(width, specs.frontPostCount);
  const carrierPositions = calcCarrierPositions(length, specs.carrierCount);

  // Compute bounding box for viewBox
  const corners = [
    toIso(0, 0, 0),
    toIso(width, 0, 0),
    toIso(0, length, 0),
    toIso(width, length, 0),
    toIso(0, 0, height),
    toIso(width, 0, height),
    toIso(0, length, height),
    toIso(width, length, height),
  ];
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = Math.max(width, length, height) * 0.1;
  const vx = minX - pad;
  const vy = minY - pad;
  const vw = maxX - minX + pad * 2;
  const vh = maxY - minY + pad * 2;

  const sw = Math.max(8, width * 0.003); // stroke width

  // Helper to draw a line in 3D space
  const isoLine = (
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    stroke: string, strokeWidth: number, key: string,
    dash?: string
  ) => {
    const [sx, sy] = toIso(x1, y1, z1);
    const [ex, ey] = toIso(x2, y2, z2);
    return (
      <line
        key={key}
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
      />
    );
  };

  // Roof polygon (top surface)
  const roofPts = [
    toIso(0, 0, height),
    toIso(width, 0, height),
    toIso(width, length, height),
    toIso(0, length, height),
  ];
  const roofPath = roofPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + " Z";

  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ maxHeight: 420 }}
    >
      {/* Roof surface */}
      <path
        d={roofPath}
        fill={roofColor || "#DDD"}
        fillOpacity={0.3}
        stroke={frameColor || "#333"}
        strokeWidth={sw * 1.5}
      />

      {/* Front posts */}
      {postPositions.map((x, i) =>
        isoLine(x, 0, 0, x, 0, height, frameColor || "#333", sw * 2, `fp-${i}`)
      )}

      {/* Back posts (freestanding) */}
      {mountType === "freestanding" &&
        postPositions.map((x, i) =>
          isoLine(x, length, 0, x, length, height, frameColor || "#333", sw * 2, `bp-${i}`)
        )}

      {/* Wall line for wall-mounted */}
      {mountType === "wall" &&
        isoLine(0, length, 0, 0, length, height * 1.1, "#999", sw * 3, "wall-l")}
      {mountType === "wall" &&
        isoLine(width, length, 0, width, length, height * 1.1, "#999", sw * 3, "wall-r")}
      {mountType === "wall" &&
        isoLine(0, length, height * 1.1, width, length, height * 1.1, "#999", sw * 3, "wall-t")}

      {/* Top frame edges */}
      {isoLine(0, 0, height, width, 0, height, frameColor || "#333", sw * 1.5, "tf")}
      {isoLine(0, length, height, width, length, height, frameColor || "#333", sw * 1.5, "tb")}
      {isoLine(0, 0, height, 0, length, height, frameColor || "#333", sw * 1.5, "tl")}
      {isoLine(width, 0, height, width, length, height, frameColor || "#333", sw * 1.5, "tr")}

      {/* Carriers */}
      {carrierPositions.map((y, i) =>
        isoLine(0, y, height, width, y, height, "#888", sw, `car-${i}`, "20 10")
      )}

      {/* Lighting indicators */}
      {lighting !== "none" &&
        carrierPositions.slice(0, -1).map((y, i) => {
          const midY = (y + (carrierPositions[i + 1] ?? y)) / 2;
          const [cx, cy] = toIso(width / 2, midY, height);
          return (
            <circle
              key={`light-${i}`}
              cx={cx}
              cy={cy}
              r={Math.max(15, width * 0.006)}
              fill={lighting === "white" ? "#FFF9C4" : "#E040FB"}
              stroke="#666"
              strokeWidth={2}
            />
          );
        })}

      {/* Bottom frame edges (ground) */}
      {isoLine(0, 0, 0, width, 0, 0, "#AAA", sw * 0.7, "bf", "15 10")}
      {isoLine(0, length, 0, width, length, 0, "#AAA", sw * 0.7, "bb", "15 10")}
      {isoLine(0, 0, 0, 0, length, 0, "#AAA", sw * 0.7, "bl", "15 10")}
      {isoLine(width, 0, 0, width, length, 0, "#AAA", sw * 0.7, "br", "15 10")}
    </svg>
  );
};
