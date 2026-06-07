"use client";

import Link from "next/link";

export default function EditionPicker({ editions, currentEditionId }) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 font-[family-name:var(--font-serif-tc)] text-[11px] font-medium uppercase tracking-[1.6px] text-[var(--color-text-muted)]">
        散策地
      </div>
      <div className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const isActive = edition.id === currentEditionId;
          const baseChip =
            "rounded-full px-3.5 py-1.5 font-[family-name:var(--font-serif-tc)] text-sm font-semibold transition-colors duration-150";
          if (isActive) {
            return (
              <span
                key={edition.id}
                aria-current="page"
                className={`${baseChip} bg-[var(--color-terracotta)] text-[var(--color-cream-card)] shadow-[0_2px_8px_-3px_rgba(197,106,58,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]`}
              >
                {edition.name}
              </span>
            );
          }
          return (
            <Link
              key={edition.id}
              href={`/${edition.id}`}
              className={`${baseChip} bg-[var(--color-cream-warm)] text-[var(--color-text)] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.12)] hover:bg-[var(--color-cream-card)]`}
            >
              {edition.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
