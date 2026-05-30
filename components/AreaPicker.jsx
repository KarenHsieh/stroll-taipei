"use client";

import { ACTIVE_AREAS as DEFAULT_ACTIVE_AREAS, SOON_AREAS as DEFAULT_SOON_AREAS } from "@/lib/stroll/areas.js";

export default function AreaPicker({ value, onChange, onOpenSoon, areas }) {
  const ACTIVE_AREAS = areas ? areas.filter((a) => a.active) : DEFAULT_ACTIVE_AREAS;
  const SOON_AREAS = areas ? areas.filter((a) => !a.active) : DEFAULT_SOON_AREAS;
  const useRail = ACTIVE_AREAS.length > 3;

  return (
    <div>
      {useRail ? (
        <div
          className="-mx-[18px] flex gap-2.5 overflow-x-auto overflow-y-hidden px-[18px] pb-1.5 pt-0.5"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
        >
          {ACTIVE_AREAS.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              active={value === area.name}
              variant="rail"
              onClick={() => onChange(area.name)}
            />
          ))}
          <span className="shrink-0 basis-2" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {ACTIVE_AREAS.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              active={value === area.name}
              variant="grid"
              onClick={() => onChange(area.name)}
            />
          ))}
        </div>
      )}

      {SOON_AREAS.length > 0 && (
        <button
          type="button"
          onClick={onOpenSoon}
          className="mt-3.5 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[11px] text-[var(--color-text-muted)]"
          style={{ background: "rgba(197,106,58,0.05)" }}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-line)]" />
            <span className="overflow-hidden text-ellipsis">
              更多地點即將推出 · 共 {SOON_AREAS.length} 個區域
            </span>
          </span>
          <span className="shrink-0 -translate-y-px text-sm font-light text-[var(--color-line)]">
            ›
          </span>
        </button>
      )}
    </div>
  );
}

function AreaCard({ area, active, variant, onClick }) {
  const isRail = variant === "rail";
  const padding = isRail ? "px-4 py-[18px]" : "py-5 px-2";
  const layout = isRail
    ? "shrink-0 basis-[38%] min-w-[110px] text-left"
    : "text-center";
  const colors = active
    ? "bg-[var(--color-terracotta)] text-[var(--color-cream-card)] shadow-[0_4px_14px_-4px_rgba(197,106,58,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
    : "bg-[var(--color-cream-warm)] text-[var(--color-text)] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.10)]";

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative cursor-pointer rounded-2xl transition-all duration-200 ${padding} ${layout} ${colors}`}
      style={isRail ? { scrollSnapAlign: "start" } : undefined}
    >
      <div className="font-[family-name:var(--font-serif-tc)] text-lg font-semibold">
        {area.name}
      </div>
      {active && isRail && (
        <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-[var(--color-cream-card)]" />
      )}
    </button>
  );
}
