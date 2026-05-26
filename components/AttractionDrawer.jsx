"use client";

import { useEffect } from "react";
import AttractionMap from "./AttractionMap.jsx";

export default function AttractionDrawer({
  isOpen,
  onClose,
  attraction,
  timeText,
  costText,
  todayOpenHoursText,
  indoor,
  stayText,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!attraction) return null;

  return (
    <>
      <div
        onClick={onClose}
        className={"sheet-backdrop" + (isOpen ? " open" : "")}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-label={attraction.name}
        className={"sheet" + (isOpen ? " open" : "")}
      >
        <div className="mx-auto mb-3.5 mt-1 h-1 w-10 rounded-full bg-[rgba(120,90,60,0.22)]" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {timeText && (
              <div className="mb-0.5 font-[family-name:var(--font-sans-tc)] text-[11.5px] tracking-[0.6px] text-[var(--color-eyebrow)]">
                {timeText}
              </div>
            )}
            <h2 className="m-0 font-[family-name:var(--font-serif-tc)] text-2xl font-bold leading-[1.2] text-[var(--color-text)]">
              {attraction.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--color-cream-card)] text-base text-[var(--color-text-mid)] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.12)]"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3.5 overflow-y-auto pt-3 pb-1">
          {attraction.tags && attraction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attraction.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[rgba(120,90,60,0.07)] px-2.5 py-1 font-[family-name:var(--font-sans-tc)] text-[11.5px] text-[var(--color-text-mid)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl">
            <AttractionMap
              lat={attraction.lat}
              lng={attraction.lng}
              name={attraction.name}
            />
          </div>

          <dl className="grid grid-cols-[80px_1fr] gap-x-3.5 gap-y-3 font-[family-name:var(--font-sans-tc)] text-[13px]">
            <Fact label="停留時間" value={stayText} />
            <Fact label="價位" value={costText} />
            <Fact label="室內外" value={indoor ? "室內" : "戶外"} />
            <Fact label="今日營業" value={todayOpenHoursText} />
          </dl>
        </div>
      </div>
    </>
  );
}

function Fact({ label, value }) {
  return (
    <>
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="m-0 font-medium text-[var(--color-text)]">{value}</dd>
    </>
  );
}
