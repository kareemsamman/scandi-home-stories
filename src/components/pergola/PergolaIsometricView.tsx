import type { DrawingConfig } from "@/types/pergola";
import { calcPostPositions, calcCarrierPositions } from "@/lib/pergolaRules";

interface Props { config: DrawingConfig }

const ISO_SCALE = 0.5;
const ISO_Y_FACTOR = 0.35;

function toIso(x: number, y: number, z: number): [number, number] {
  return [x + y * ISO_SCALE, -z + y * ISO_Y_FACTOR];
}

export const PergolaIsometricView = ({ config }: Props) => {
  const { widthMm, lengthMm, heightMm, mountType, lighting, lightingPosition, lightingPosts, santaf, santafColor, specs, frameColor, roofColor } = config;
  const postPositions = calcPostPositions(widthMm, specs.frontPostCount);
  const carrierPositions = calcCarrierPositions(lengthMm, specs.carrierCount);

  const corners = [
    toIso(0, 0, 0), toIso(widthMm, 0, 0), toIso(0, lengthMm, 0), toIso(widthMm, lengthMm, 0),
    toIso(0, 0, heightMm), toIso(widthMm, 0, heightMm), toIso(0, lengthMm, heightMm), toIso(widthMm, lengthMm, heightMm),
  ];
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const pad = Math.max(widthMm, lengthMm, heightMm) * 0.12;
  const vx = minX - pad; const vy = minY - pad;
  const vw = maxX - minX + pad * 2; const vh = maxY - minY + pad * 2;
  const sw = Math.max(8, widthMm * 0.003);

  const isoLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, stroke: string, strokeWidth: number, key: string, dash?: string) => {
    const [sx, sy] = toIso(x1, y1, z1); const [ex, ey] = toIso(x2, y2, z2);
    return <line key={key} x1={sx} y1={sy} x2={ex} y2={ey} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />;
  };

  const roofPts = [toIso(0, 0, heightMm), toIso(widthMm, 0, heightMm), toIso(widthMm, lengthMm, heightMm), toIso(0, lengthMm, heightMm)];
  const roofPath = roofPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + " Z";

  const hasPostLight = (idx: number) => {
    if (lighting === "none") return false;
    if (lightingPosition === "all_posts") return true;
    if (lightingPosition === "selected_posts") return lightingPosts.includes(idx);
    return false;
  };

  return (
    <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full" style={{ maxHeight: 460 }}>
      {/* Santaf overlay on roof */}
      {santaf === "with" && (
        <path d={roofPath} fill={santafColor || "#B22222"} fillOpacity={0.2} stroke={santafColor || "#B22222"} strokeWidth={sw * 0.5} />
      )}

      {/* Roof surface */}
      <path d={roofPath} fill={roofColor || "#C0C0C0"} fillOpacity={0.2} stroke={frameColor || "#383838"} strokeWidth={sw * 1.5} />

      {/* Front posts */}
      {postPositions.map((x, i) => (
        <g key={`fp-${i}`}>
          {isoLine(x, 0, 0, x, 0, heightMm, frameColor || "#383838", sw * 2, `fp-l-${i}`)}
          {hasPostLight(i) && (() => {
            const [cx, cy] = toIso(x, 0, heightMm + 80);
            return <circle cx={cx} cy={cy} r={14} fill={lighting === "rgb" ? "#E040FB" : "#FDE68A"} stroke="#666" strokeWidth={2} />;
          })()}
        </g>
      ))}

      {/* Back posts (freestanding) */}
      {mountType === "freestanding" && postPositions.map((x, i) => (
        <g key={`bp-${i}`}>
          {isoLine(x, lengthMm, 0, x, lengthMm, heightMm, frameColor || "#383838", sw * 2, `bp-l-${i}`)}
          {hasPostLight(i + specs.frontPostCount) && (() => {
            const [cx, cy] = toIso(x, lengthMm, heightMm + 80);
            return <circle cx={cx} cy={cy} r={14} fill={lighting === "rgb" ? "#E040FB" : "#FDE68A"} stroke="#666" strokeWidth={2} />;
          })()}
        </g>
      ))}

      {/* Wall lines */}
      {mountType === "wall" && <>
        {isoLine(0, lengthMm, 0, 0, lengthMm, heightMm * 1.08, "#9CA3AF", sw * 2.5, "wall-l")}
        {isoLine(widthMm, lengthMm, 0, widthMm, lengthMm, heightMm * 1.08, "#9CA3AF", sw * 2.5, "wall-r")}
        {isoLine(0, lengthMm, heightMm * 1.08, widthMm, lengthMm, heightMm * 1.08, "#9CA3AF", sw * 2.5, "wall-t")}
      </>}

      {/* Top frame edges */}
      {isoLine(0, 0, heightMm, widthMm, 0, heightMm, frameColor || "#383838", sw * 1.5, "tf")}
      {isoLine(0, lengthMm, heightMm, widthMm, lengthMm, heightMm, frameColor || "#383838", sw * 1.5, "tb")}
      {isoLine(0, 0, heightMm, 0, lengthMm, heightMm, frameColor || "#383838", sw * 1.5, "tl")}
      {isoLine(widthMm, 0, heightMm, widthMm, lengthMm, heightMm, frameColor || "#383838", sw * 1.5, "tr")}

      {/* Carriers */}
      {carrierPositions.map((y, i) =>
        isoLine(0, y, heightMm, widthMm, y, heightMm, "#9CA3AF", sw * 0.7, `car-${i}`, "25 12")
      )}

      {/* Carrier lights */}
      {lighting !== "none" && lightingPosition !== "no_posts" &&
        carrierPositions.slice(0, -1).map((y, i) => {
          const midY = (y + (carrierPositions[i + 1] ?? y)) / 2;
          const [cx, cy] = toIso(widthMm / 2, midY, heightMm);
          return <circle key={`lt-${i}`} cx={cx} cy={cy} r={Math.max(12, widthMm * 0.005)} fill={lighting === "rgb" ? "#E879F9" : "#FEF3C7"} stroke="#666" strokeWidth={2} opacity={0.8} />;
        })}

      {/* Ground frame */}
      {isoLine(0, 0, 0, widthMm, 0, 0, "#D1D5DB", sw * 0.6, "bf", "18 10")}
      {isoLine(0, lengthMm, 0, widthMm, lengthMm, 0, "#D1D5DB", sw * 0.6, "bb", "18 10")}
      {isoLine(0, 0, 0, 0, lengthMm, 0, "#D1D5DB", sw * 0.6, "bl", "18 10")}
      {isoLine(widthMm, 0, 0, widthMm, lengthMm, 0, "#D1D5DB", sw * 0.6, "br", "18 10")}
    </svg>
  );
};
