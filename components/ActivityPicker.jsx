"use client";

import { getTagPool } from "@/lib/tags/index.js";

export default function ActivityPicker({ value, onChange, editionId }) {
  const pool = editionId ? getTagPool(editionId) : null;
  const activities = pool?.activity ?? [];

  const toggle = (activity) => {
    if (value.includes(activity)) {
      onChange(value.filter((a) => a !== activity));
    } else {
      onChange([...value, activity]);
    }
  };

  if (activities.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activities.map((activity) => {
        const active = value.includes(activity);
        return (
          <button
            key={activity}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(activity)}
            className={`inline-flex cursor-pointer items-center whitespace-nowrap rounded-full px-4 py-2.5 text-sm leading-[1.2] transition-all duration-200 ${
              active
                ? "bg-[var(--color-terracotta)] font-semibold text-[var(--color-cream-card)] shadow-[0_2px_8px_rgba(197,106,58,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]"
                : "bg-[var(--color-cream-card)] font-medium text-[#5a4a38] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.14)]"
            }`}
          >
            {activity}
          </button>
        );
      })}
    </div>
  );
}
