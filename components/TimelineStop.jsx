"use client";

export default function TimelineStop({
  name,
  tags,
  timeText,
  stayText,
  isOpenEnded,
  onSelect,
  isPast,
  accent = "#C56A3A",
  highlight = false,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative ml-1 block w-full cursor-pointer rounded-[18px] bg-[var(--color-cream-card)] px-4 pt-4 pb-3.5 text-left transition-all ${
        isPast ? "opacity-60" : ""
      }`}
      style={{
        boxShadow:
          "0 1px 0 rgba(120,90,60,0.05), 0 10px 24px -16px rgba(120,90,60,0.22)",
        border: highlight
          ? `1.5px solid ${accent}`
          : "1px solid rgba(197,106,58,0.08)",
      }}
    >
      <div className="mb-0.5 font-[family-name:var(--font-sans-tc)] text-[11.5px] tracking-[0.4px] text-[var(--color-eyebrow)]">
        {timeText}
        {isPast && (
          <span className="ml-2 rounded bg-[rgba(120,90,60,0.1)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">
            已造訪
          </span>
        )}
      </div>
      <div className="mb-0.5 flex items-center gap-2 font-[family-name:var(--font-serif-tc)] text-[19px] font-bold leading-[1.2] text-[var(--color-text)]">
        <span className="min-w-0 flex-1">{name}</span>
        <span
          className="-translate-y-px text-sm font-normal"
          style={{ color: "var(--color-line)", fontFamily: "system-ui, sans-serif" }}
        >
          ›
        </span>
      </div>

      {tags && tags.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[rgba(120,90,60,0.07)] px-2.5 py-[3px] font-[family-name:var(--font-sans-tc)] text-[11px] text-[var(--color-text-mid)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 font-[family-name:var(--font-sans-tc)] text-xs text-[var(--color-text-mid)]">
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke="#9A8770"
            strokeWidth="1.2"
          />
          <path
            d="M 8 4 V 8 L 10.5 9.5"
            stroke="#9A8770"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <span>停留</span>
        <span>{isOpenEnded ? "直到你想結束" : stayText}</span>
      </div>
    </button>
  );
}
