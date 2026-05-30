import Link from "next/link";

export default function BackToFormLink({ params, editionId }) {
  const query = params.toString();
  const base = editionId ? `/${editionId}` : "/";
  const href = query.length > 0 ? `${base}?${query}` : base;

  return (
    <Link
      href={href}
      aria-label="回到挑條件"
      className="inline-flex items-center gap-1.5 font-[family-name:var(--font-sans-tc)] text-[13px] text-[var(--color-eyebrow)] hover:opacity-80"
    >
      <span aria-hidden="true" className="text-base">
        ←
      </span>
      <span>回到挑條件</span>
    </Link>
  );
}
