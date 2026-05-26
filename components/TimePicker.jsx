"use client";

import { useState } from "react";
import { TIME_BUCKETS, findBucketForHour } from "@/lib/stroll/time-buckets.js";
import { formatHourDisplay } from "@/lib/stroll/time-options.js";

export default function TimePicker({ value, onChange }) {
  const [bucketId, setBucketId] = useState(() =>
    value != null ? findBucketForHour(value).id : "am"
  );
  const [lastValue, setLastValue] = useState(value);

  // sync bucket when `value` changes externally (e.g. URL hydration)
  if (value !== lastValue) {
    setLastValue(value);
    if (value != null) setBucketId(findBucketForHour(value).id);
  }

  const currentBucket =
    TIME_BUCKETS.find((b) => b.id === bucketId) || TIME_BUCKETS[0];

  return (
    <div>
      <div
        className="mb-3.5 flex gap-1 rounded-2xl p-1"
        style={{ background: "var(--color-cream-segment)" }}
      >
        {TIME_BUCKETS.map((b) => {
          const active = b.id === currentBucket.id;
          return (
            <button
              key={b.id}
              type="button"
              aria-pressed={active}
              onClick={() => setBucketId(b.id)}
              className={`flex-1 rounded-[10px] py-2 text-[13px] font-[family-name:var(--font-sans-tc)] transition-all duration-150 ${
                active
                  ? "bg-[var(--color-cream-card)] font-semibold text-[var(--color-text)] shadow-[0_1px_2px_rgba(120,90,60,0.12)]"
                  : "bg-transparent font-medium text-[#8b7558]"
              }`}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {currentBucket.hours.map((h) => {
          const active = value === h;
          return (
            <button
              key={h}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(h)}
              className={`inline-flex cursor-pointer items-center whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition-all duration-200 ${
                active
                  ? "bg-[var(--color-terracotta)] font-semibold text-[var(--color-cream-card)] shadow-[0_2px_8px_rgba(197,106,58,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]"
                  : "bg-[var(--color-cream-card)] font-medium text-[#5a4a38] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.14)]"
              }`}
            >
              {formatHourDisplay(h)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
