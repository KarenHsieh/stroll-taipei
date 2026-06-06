"use client";

import { TAG_CATEGORIES } from "@/lib/attractions/tag-pool.js";
import { getTagPool } from "@/lib/tags/index.js";

const MOOD_DOT = {
  文青: "#C56A3A",
  職人: "#9C6B3F",
  復古: "#B8893E",
  靜謐: "#7E9577",
  熱鬧: "#D08A4A",
  生活感: "#8FA383",
  老建築: "#A37550",
  流水聲: "#6F90A6",
  夜晚熱鬧: "#7A5A8A",
  傳統: "#A85A3F",
};

export default function MoodPicker({ value, onChange, editionId }) {
  const pool = editionId ? getTagPool(editionId) : null;
  const moods = pool?.mood ?? TAG_CATEGORIES.mood;

  const toggle = (mood) => {
    if (value.includes(mood)) {
      onChange(value.filter((m) => m !== mood));
    } else {
      onChange([...value, mood]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {moods.map((mood) => {
        const active = value.includes(mood);
        const dot = MOOD_DOT[mood] || "#9C6B3F";
        return (
          <button
            key={mood}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(mood)}
            className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm leading-[1.2] transition-all duration-200 ${
              active
                ? "bg-[var(--color-terracotta)] font-semibold text-[var(--color-cream-card)] shadow-[0_2px_8px_rgba(197,106,58,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]"
                : "bg-[var(--color-cream-card)] font-medium text-[#5a4a38] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.14)]"
            }`}
          >
            {!active && (
              <span
                className="h-1.5 w-1.5 rounded-full opacity-70"
                style={{ background: dot }}
                aria-hidden="true"
              />
            )}
            {mood}
          </button>
        );
      })}
    </div>
  );
}
