"use client";

import { useEffect } from "react";
import { SOON_AREAS as DEFAULT_SOON_AREAS } from "@/lib/stroll/areas.js";

export default function ComingSoonSheet({ open, onClose, soonAreas }) {
  const areas = soonAreas ?? DEFAULT_SOON_AREAS;
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={"sheet-backdrop" + (open ? " open" : "")}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-label="即將推出的散策地"
        className={"sheet" + (open ? " open" : "")}
      >
        <div className="mx-auto mb-3.5 mt-1 h-1 w-10 rounded-full bg-[rgba(120,90,60,0.22)]" />

        <div className="mb-1 flex items-baseline justify-between">
          <div>
            <div
              className="font-[family-name:var(--font-italic-en)] text-xs uppercase tracking-[1.6px] text-[var(--color-eyebrow)]"
            >
              Coming soon
            </div>
            <h2 className="mb-0.5 mt-1 font-[family-name:var(--font-serif-tc)] text-[22px] font-bold text-[var(--color-text)]">
              即將推出的散策地
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--color-cream-card)] text-base text-[var(--color-text-mid)] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.12)]"
          >
            ✕
          </button>
        </div>

        <p className="mt-0 mb-4 font-[family-name:var(--font-sans-tc)] text-[13px] leading-[1.55] text-[var(--color-text-mid)]">
          還在田野調查與整理路線中，這些地方還沒準備好接你來散策。
        </p>

        <div className="flex flex-col gap-2.5 overflow-y-auto pb-1">
          {areas.map((area) => (
            <div
              key={area.id}
              className="rounded-2xl border border-[rgba(197,106,58,0.08)] bg-[var(--color-cream-card)] px-[18px] py-4 font-[family-name:var(--font-serif-tc)] text-[17px] font-semibold text-[var(--color-text)]"
            >
              {area.name}
            </div>
          ))}
        </div>

        <div className="mt-3.5 text-center font-[family-name:var(--font-sans-tc)] text-[11px] text-[var(--color-text-muted)]">
          已收錄 · 開放時間陸續公布
        </div>
      </div>
    </>
  );
}
