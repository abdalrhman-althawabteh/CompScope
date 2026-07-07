// ponytail: hand-rolled SVG charts, no charting lib. Swap for Recharts only if interactions grow.

export function BarChart({
  data,
}: {
  data: { label: string; value: string; pct: number; highlight?: boolean }[];
}) {
  return (
    <div className="flex h-64 gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col gap-3">
          <div className="flex flex-1 items-end justify-center">
            <div
              className={
                "relative w-full max-w-[52px] rounded-xl " +
                (d.highlight
                  ? "bg-gradient-to-t from-[#242424] to-[#323232]"
                  : "bg-[#1e1e1e]")
              }
              style={{ height: `${d.pct}%` }}
            >
              <div
                className={
                  "absolute inset-x-0 -top-0.5 h-1 rounded-full " +
                  (d.highlight ? "bg-flame" : "bg-[#4a4a4a]")
                }
              />
              <span
                className={
                  "absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium " +
                  (d.highlight
                    ? "rounded-md bg-white px-1.5 py-0.5 font-semibold text-black"
                    : "text-muted")
                }
              >
                {d.value}
              </span>
            </div>
          </div>
          <span
            className={
              "text-center text-xs " +
              (d.highlight ? "font-semibold text-fg" : "text-faint")
            }
          >
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AreaChart({
  points,
  peakLabel,
}: {
  points: number[];
  peakLabel?: string;
}) {
  const W = 520;
  const H = 200;
  const pad = 8;
  const max = Math.max(...points, 1);
  const step = (W - pad * 2) / (points.length - 1);
  const xy = points.map((v, i) => [
    pad + i * step,
    H - pad - (v / max) * (H - pad * 2 - 20),
  ]);

  // smooth path (Catmull-Rom -> bezier)
  const line = xy
    .map((p, i, a) => {
      if (i === 0) return `M ${p[0]} ${p[1]}`;
      const p0 = a[i - 1];
      const cx = (p0[0] + p[0]) / 2;
      return `C ${cx} ${p0[1]} ${cx} ${p[1]} ${p[0]} ${p[1]}`;
    })
    .join(" ");
  const area = `${line} L ${W - pad} ${H} L ${pad} ${H} Z`;
  const peak = xy.reduce((a, b) => (b[1] < a[1] ? b : a), xy[0]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="#ffffff" strokeWidth="2.5" />
      <circle cx={peak[0]} cy={peak[1]} r="5" fill="#fff" />
      {peakLabel && (
        <g transform={`translate(${peak[0]}, ${peak[1] - 22})`}>
          <rect
            x="-16"
            y="-14"
            width="32"
            height="24"
            rx="7"
            fill="#fff"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="#000"
          >
            {peakLabel}
          </text>
        </g>
      )}
    </svg>
  );
}
