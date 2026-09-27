"use client";

/**
 * Dependency-free SVG chart primitives.
 *
 * A charting library would add ~90KB gzipped to render four small charts.
 * These are ~4KB, fully responsive via viewBox, and styled with the same
 * design tokens as the rest of the site.
 */

const NAVY = "#0b1f3a";
const GOLD = "#c8a24a";

/* ---------------------------------------------------------------- */

export function Sparkline({
  data,
  labels,
  height = 74,
}: {
  data: number[];
  labels?: string[];
  height?: number;
}) {
  if (!data.length) return null;
  const w = 300;
  const h = height;
  const pad = 6;
  const max = Math.max(...data, 1);
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;

  const pt = (v: number, i: number) => [
    pad + i * step,
    h - pad - (v / max) * (h - pad * 2),
  ];

  const line = data.map((v, i) => pt(v, i).join(",")).join(" ");
  const area = `${pad},${h - pad} ${line} ${pad + (data.length - 1) * step},${h - pad}`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity=".34" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#spark)" />
        <polyline points={line} fill="none" stroke={GOLD} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {data.map((v, i) => {
          const [x, y] = pt(v, i);
          return <circle key={i} cx={x} cy={y} r="2.4" fill={NAVY} />;
        })}
      </svg>
      {labels && (
        <div className="mt-1.5 flex justify-between text-[10.5px] text-ink-400">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function Funnel({
  stages,
}: {
  stages: { label: string; n: number; tone?: "good" | "bad" }[];
}) {
  const max = Math.max(...stages.map((s) => s.n), 1);
  return (
    <div className="grid gap-2">
      {stages.map((s, i) => {
        const pct = (s.n / max) * 100;
        const drop =
          i > 0 && stages[i - 1].n > 0
            ? Math.round((1 - s.n / stages[i - 1].n) * 100)
            : null;
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="font-medium text-navy-800">{s.label}</span>
              <span className="tabular-nums text-ink-400">
                {s.n}
                {drop !== null && drop > 0 && (
                  <span className="ml-1.5 text-[11px] text-[#a6431f]">−{drop}%</span>
                )}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-sand-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(pct, s.n > 0 ? 3 : 0)}%`,
                  background:
                    s.tone === "bad"
                      ? "#c0755e"
                      : `linear-gradient(90deg, ${NAVY}, ${GOLD})`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function Donut({
  slices,
  size = 132,
  centreLabel,
  centreValue,
}: {
  slices: { label: string; n: number; colour: string }[];
  size?: number;
  centreLabel?: string;
  centreValue?: string;
}) {
  const total = slices.reduce((a, s) => a + s.n, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 140 140" width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f2f0ea" strokeWidth="17" />
        {slices.map((s) => {
          const len = (s.n / total) * c;
          const el = (
            <circle
              key={s.label}
              cx="70" cy="70" r={r} fill="none"
              stroke={s.colour} strokeWidth="17"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
        {centreValue && (
          <g className="rotate-90" style={{ transformOrigin: "70px 70px" }}>
            <text x="70" y="68" textAnchor="middle" fontSize="21" fontWeight="700" fill={NAVY}>
              {centreValue}
            </text>
            <text x="70" y="83" textAnchor="middle" fontSize="9.5" fill="#7d8494">
              {centreLabel}
            </text>
          </g>
        )}
      </svg>

      <ul className="grid min-w-[130px] flex-1 gap-1.5">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.colour }} />
            <span className="flex-1 truncate text-ink-500">{s.label}</span>
            <span className="tabular-nums font-semibold text-navy-800">{s.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function BarList({
  rows,
  unit = "",
}: {
  rows: { label: string; n: number }[];
  unit?: string;
}) {
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <div className="grid gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <span className="w-[96px] truncate text-[12.5px] text-ink-500">{r.label}</span>
          <div className="h-6 overflow-hidden rounded bg-sand-100">
            <div
              className="flex h-full items-center rounded transition-all duration-500"
              style={{
                width: `${Math.max((r.n / max) * 100, 2)}%`,
                background: `linear-gradient(90deg, ${NAVY}, #1b3d68)`,
              }}
            />
          </div>
          <span className="w-[62px] text-right text-[12.5px] font-semibold tabular-nums text-navy-800">
            {r.n.toLocaleString("en-IN")}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function SizeHistogram({ sizes }: { sizes: Record<string, number> }) {
  const order = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  const max = Math.max(...order.map((s) => sizes[s] ?? 0), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: 96 }}>
      {order.map((s) => {
        const v = sizes[s] ?? 0;
        return (
          <div key={s} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10.5px] font-semibold tabular-nums text-ink-400">
              {v || ""}
            </span>
            <div
              className="w-full rounded-t transition-all duration-500"
              style={{
                height: `${Math.max((v / max) * 62, v > 0 ? 4 : 1)}px`,
                background: v > 0 ? `linear-gradient(180deg, ${GOLD}, #a8842f)` : "#eceae3",
              }}
            />
            <span className="text-[10.5px] font-bold text-navy-800">{s}</span>
          </div>
        );
      })}
    </div>
  );
}
