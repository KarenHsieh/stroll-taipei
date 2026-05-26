export default function SectionCard({ title, hint, children, className = "" }) {
  return (
    <section
      className={`rounded-[22px] border border-[rgba(197,106,58,0.08)] bg-[var(--color-cream-card)] px-[18px] pt-5 pb-[22px] shadow-[0_1px_0_rgba(120,90,60,0.06),0_8px_24px_-16px_rgba(120,90,60,0.18)] ${className}`}
    >
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 className="m-0 font-[family-name:var(--font-serif-tc)] text-base font-semibold tracking-[0.2px] text-[var(--color-text)]">
          {title}
        </h2>
        {hint && (
          <span className="shrink-0 whitespace-nowrap font-[family-name:var(--font-sans-tc)] text-[11px] text-[var(--color-text-muted)]">
            {hint}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
