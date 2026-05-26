export default function TimelineWalk({ walkInText, isPast }) {
  return (
    <div className="relative flex items-center gap-2 py-3.5 pl-1">
      <span
        aria-hidden="true"
        className="absolute top-[13px] h-3.5 w-3.5 rounded-full"
        style={{
          left: -32,
          background: "var(--color-cream)",
          border: "1.5px dashed rgba(197,106,58,0.4)",
        }}
      />
      <span aria-hidden="true" className="text-xs text-[var(--color-text-muted)]">
        · · ·
      </span>
      <span
        className={`font-[family-name:var(--font-sans-tc)] text-[11.5px] text-[var(--color-text-muted)] ${
          isPast ? "opacity-60" : ""
        }`}
      >
        {walkInText}
      </span>
    </div>
  );
}
