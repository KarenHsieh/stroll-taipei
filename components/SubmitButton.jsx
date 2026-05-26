"use client";

export default function SubmitButton({ disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2.5 rounded-full px-5 py-[17px] font-[family-name:var(--font-serif-tc)] text-[17px] font-semibold tracking-[1px] text-[var(--color-cream-card)] transition-opacity ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
      style={{
        background:
          "linear-gradient(180deg, var(--color-terracotta-bright) 0%, var(--color-terracotta) 100%)",
        boxShadow:
          "0 8px 24px -6px rgba(197,106,58,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
      }}
    >
      {children}
      <span className="text-base" aria-hidden="true">
        →
      </span>
    </button>
  );
}
