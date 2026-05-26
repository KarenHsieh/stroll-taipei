"use client";

import { DURATIONS } from "@/lib/stroll/duration-options.js";
import { LONG_LABEL_BY_BUCKET } from "@/lib/stroll/time-buckets.js";

export default function DurationPicker({ value, onChange, bucketId }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {DURATIONS.map((d) => {
        const active = value === d.hour;
        const label =
          d.hour === 4 ? (LONG_LABEL_BY_BUCKET[bucketId] || d.label) : d.label;
        return (
          <button
            key={d.hour}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(d.hour)}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3.5 text-left transition-all duration-200 ${
              active
                ? "bg-[var(--color-terracotta)] text-[var(--color-cream-card)] shadow-[0_4px_14px_-4px_rgba(197,106,58,0.45)]"
                : "bg-[var(--color-cream-warm)] text-[var(--color-text)] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.10)]"
            }`}
          >
            <DurationGlyph hours={d.hour} active={active} />
            <div>
              <div className="font-[family-name:var(--font-serif-tc)] text-sm font-semibold leading-[1.2]">
                {label}
              </div>
              <div
                className={`mt-0.5 font-[family-name:var(--font-sans-tc)] text-[11px] ${
                  active ? "opacity-85" : "opacity-55"
                }`}
              >
                {d.sub}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DurationGlyph({ hours, active }) {
  const stroke = active ? "#FDF8EE" : "#C56A3A";
  const dim = active ? "#FDF8EE" : "#E8C9A8";
  const W = 30,
    H = 22;
  const cx = 15,
    cy = 20,
    r = 11;
  const total = 180;
  const fillAngle = (hours / 4) * total;
  const startA = 180;
  const endA = 180 - fillAngle;
  const pol = (a) => {
    const rad = (a * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  };
  const [x1, y1] = pol(startA);
  const [x2, y2] = pol(endA);
  const large = fillAngle > 180 ? 1 : 0;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        stroke={dim}
        strokeOpacity="0.5"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        stroke={stroke}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={x2} cy={y2} r="2.2" fill={stroke} />
    </svg>
  );
}
