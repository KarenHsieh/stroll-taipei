"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

const ALL = "__all__";

export default function AttractionsTable({ attractions, editions, areas }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editionFilter, setEditionFilter] = useState(() => {
    const v = searchParams.get("edition");
    return v && editions.some((e) => e.id === v) ? v : ALL;
  });
  const [areaFilter, setAreaFilter] = useState(() => {
    const ed = searchParams.get("edition");
    const v = searchParams.get("area");
    if (!ed || !v) return ALL;
    return areas.some((a) => a.editionId === ed && a.id === v) ? v : ALL;
  });
  const [nameSearch, setNameSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (editionFilter !== ALL) params.set("edition", editionFilter);
    if (areaFilter !== ALL) params.set("area", areaFilter);
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, "", url);
  }, [editionFilter, areaFilter, pathname]);

  const areasForEdition = useMemo(() => {
    if (editionFilter === ALL) return [];
    return areas.filter((a) => a.editionId === editionFilter);
  }, [areas, editionFilter]);

  const filtered = useMemo(() => {
    const search = nameSearch.trim().toLowerCase();
    return attractions.filter((a) => {
      if (editionFilter !== ALL && a.edition_id !== editionFilter) return false;
      if (areaFilter !== ALL && a.area_id !== areaFilter) return false;
      if (search && !a.name.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [attractions, editionFilter, areaFilter, nameSearch]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="font-[family-name:var(--font-serif-tc)] text-2xl font-bold text-[var(--color-text)]">
        Attractions admin
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-mid)]">
        共 {attractions.length} 筆,目前顯示 {filtered.length} 筆。
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl bg-[var(--color-cream-card)] p-4 shadow-[inset_0_0_0_1px_rgba(120,90,60,0.10)]">
        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-mid)]">
          Edition
          <select
            aria-label="Edition filter"
            value={editionFilter}
            onChange={(e) => {
              setEditionFilter(e.target.value);
              setAreaFilter(ALL);
            }}
            className="rounded-lg border border-[rgba(120,90,60,0.2)] bg-white px-2 py-1.5 text-sm text-[var(--color-text)]"
          >
            <option value={ALL}>全部</option>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-mid)]">
          Area
          <select
            aria-label="Area filter"
            value={areaFilter}
            disabled={editionFilter === ALL}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="rounded-lg border border-[rgba(120,90,60,0.2)] bg-white px-2 py-1.5 text-sm text-[var(--color-text)] disabled:opacity-40"
          >
            <option value={ALL}>全部</option>
            {areasForEdition.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-xs text-[var(--color-text-mid)]">
          搜尋名稱
          <input
            aria-label="搜尋名稱"
            type="text"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="輸入景點名稱片段"
            className="rounded-lg border border-[rgba(120,90,60,0.2)] bg-white px-2 py-1.5 text-sm text-[var(--color-text)]"
          />
        </label>

        <Link
          href="/dev-tools/attractions/new"
          className="rounded-lg bg-[var(--color-terracotta)] px-3 py-2 text-sm font-semibold text-[var(--color-cream-card)] shadow-[0_4px_14px_-4px_rgba(197,106,58,0.4)]"
        >
          + 新增景點
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl bg-[var(--color-cream-card)] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.10)]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[rgba(197,106,58,0.06)] text-xs uppercase tracking-wide text-[var(--color-text-mid)]">
            <tr>
              <th className="px-3 py-2.5">id</th>
              <th className="px-3 py-2.5">name</th>
              <th className="px-3 py-2.5">area</th>
              <th className="px-3 py-2.5">tags</th>
              <th className="px-3 py-2.5">stay</th>
              <th className="px-3 py-2.5">lat,lng</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const expanded = expandedId === a.id;
              return (
                <Row
                  key={a.id}
                  attraction={a}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : a.id)}
                />
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-[var(--color-text-mid)]">
                  沒有符合條件的景點
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ attraction, expanded, onToggle }) {
  return (
    <>
      <tr
        data-attraction-id={attraction.id}
        data-edition-id={attraction.edition_id}
        data-area-id={attraction.area_id}
        onClick={onToggle}
        className="cursor-pointer border-t border-[rgba(120,90,60,0.08)] hover:bg-[rgba(197,106,58,0.04)]"
      >
        <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-mid)]">
          {attraction.id}
        </td>
        <td className="px-3 py-2 font-[family-name:var(--font-serif-tc)] text-[var(--color-text)]">
          {attraction.name}
        </td>
        <td className="px-3 py-2 text-[var(--color-text-mid)]">{attraction.area}</td>
        <td className="px-3 py-2 text-xs text-[var(--color-text-mid)]">
          {attraction.tags.join(" · ")}
        </td>
        <td className="px-3 py-2 text-xs text-[var(--color-text-mid)]">
          {attraction.stay_range[0]}–{attraction.stay_range[1]} 分
        </td>
        <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-mid)]">
          {attraction.lat}, {attraction.lng}
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-[rgba(120,90,60,0.08)] bg-[rgba(197,106,58,0.03)]">
          <td colSpan={6} className="px-4 py-3">
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-[var(--color-text-mid)]">
              {JSON.stringify(attraction, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
