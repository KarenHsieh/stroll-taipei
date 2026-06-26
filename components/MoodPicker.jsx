"use client";

import { useEffect, useMemo } from "react";
import { TAG_CATEGORIES } from "@/lib/attractions/tag-pool.js";
import { getTagPool } from "@/lib/tags/index.js";
import { getMoodHint } from "@/lib/moods/hints.js";

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

const COPY_NO_AREA = "請先選擇散策地";
const COPY_ZERO = "目前沒有對應地點";

export default function MoodPicker({
  value,
  onChange,
  editionId,
  selectedAreaId,
  attractions,
}) {
  const pool = editionId ? getTagPool(editionId) : null;
  const moods = pool?.mood ?? TAG_CATEGORIES.mood;

  const noAreaSelected = !selectedAreaId;

  const counts = useMemo(() => {
    const out = {};
    for (const m of moods) out[m] = 0;
    if (noAreaSelected || !Array.isArray(attractions)) return out;
    for (const a of attractions) {
      if (a.edition_id !== editionId) continue;
      if (a.area_id !== selectedAreaId) continue;
      if (!Array.isArray(a.tags)) continue;
      for (const m of moods) {
        if (a.tags.includes(m)) out[m] += 1;
      }
    }
    return out;
  }, [moods, attractions, editionId, selectedAreaId, noAreaSelected]);

  useEffect(() => {
    if (noAreaSelected) return;
    if (!Array.isArray(value) || value.length === 0) return;
    const stillValid = value.filter((m) => (counts[m] ?? 0) > 0);
    if (stillValid.length !== value.length) {
      onChange(stillValid);
    }
  }, [noAreaSelected, counts, value, onChange]);

  const toggle = (mood, disabled) => {
    if (disabled) return;
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
        const count = counts[mood] ?? 0;
        const disabled = noAreaSelected || count === 0;
        const dot = MOOD_DOT[mood] || "#9C6B3F";
        const hint = getMoodHint(editionId, mood);

        let sublabel;
        if (noAreaSelected) {
          sublabel = COPY_NO_AREA;
        } else if (count === 0) {
          sublabel = COPY_ZERO;
        } else if (hint) {
          sublabel = `${hint} · ${count} 個地點`;
        } else {
          sublabel = `${count} 個地點`;
        }

        return (
          <button
            key={mood}
            type="button"
            data-testid={`mood-button-${mood}`}
            aria-pressed={active}
            aria-disabled={disabled || undefined}
            onClick={() => toggle(mood, disabled)}
            className={`inline-flex flex-col items-start gap-0.5 whitespace-nowrap rounded-2xl px-4 py-2 leading-[1.2] transition-all duration-200 ${
              disabled
                ? "cursor-not-allowed bg-[var(--color-cream-card)] text-[#9a8a78] opacity-60 shadow-[inset_0_0_0_1px_rgba(120,90,60,0.08)]"
                : active
                  ? "cursor-pointer bg-[var(--color-terracotta)] font-semibold text-[var(--color-cream-card)] shadow-[0_2px_8px_rgba(197,106,58,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]"
                  : "cursor-pointer bg-[var(--color-cream-card)] font-medium text-[#5a4a38] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.14)]"
            }`}
          >
            <span className="inline-flex items-center gap-1.5 text-sm">
              {!active && !disabled && (
                <span
                  className="h-1.5 w-1.5 rounded-full opacity-70"
                  style={{ background: dot }}
                  aria-hidden="true"
                />
              )}
              {mood}
            </span>
            <span
              data-testid={`mood-sublabel-${mood}`}
              className="text-[11px] opacity-80"
            >
              {sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
