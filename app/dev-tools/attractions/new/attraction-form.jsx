"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { slugifyName } from "@/lib/dev-tools/slugify.js";
import { isInsideEdition } from "@/lib/stroll/editions.js";
import { getTagPool } from "@/lib/tags/index.js";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const TIME_WINDOWS = ["morning", "afternoon", "evening"];
const CURRENCY_SYMBOL = { TWD: "NT$", JPY: "¥", KRW: "₩" };

function emptyOpenHours() {
  const o = {};
  for (const d of DAYS) o[d] = { open: "10:00", close: "18:00", closed: false };
  return o;
}

function bboxText(bboxes) {
  return bboxes
    .map((b, i) => `#${i + 1} lat ${b.lat[0]}–${b.lat[1]} / lng ${b.lng[0]}–${b.lng[1]}`)
    .join("  ·  ");
}

export default function AttractionForm({ editions, areas, existingIds }) {
  const router = useRouter();
  const [editionId, setEditionId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [name, setName] = useState("");
  const [manualSlug, setManualSlug] = useState("");
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [stayMin, setStayMin] = useState("");
  const [stayMax, setStayMax] = useState("");
  const [avgCost, setAvgCost] = useState("0");
  const [indoor, setIndoor] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [openHours, setOpenHours] = useState(emptyOpenHours);
  const [rating, setRating] = useState("4.0");
  const [bestTime, setBestTime] = useState(new Set());
  const [submitState, setSubmitState] = useState({ status: "idle", errors: [] });

  const edition = useMemo(
    () => editions.find((e) => e.id === editionId) ?? null,
    [editions, editionId]
  );
  const areaOptions = useMemo(
    () => (editionId ? areas.filter((a) => a.editionId === editionId) : []),
    [areas, editionId]
  );
  const area = useMemo(
    () => areaOptions.find((a) => a.id === areaId) ?? null,
    [areaOptions, areaId]
  );
  const pool = useMemo(
    () => (editionId ? getTagPool(editionId) : null),
    [editionId]
  );

  const autoSlug = useMemo(() => slugifyName(name), [name]);
  const slug = manualSlug.trim() || autoSlug;
  const id = areaId && slug ? `${areaId}_${slug}` : "";
  const idCollision = id && existingIds.includes(id);

  const coordStatus = useMemo(() => {
    if (!edition || lat === "" || lng === "") return "empty";
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return "empty";
    return isInsideEdition(edition, latNum, lngNum) ? "ok" : "outside";
  }, [edition, lat, lng]);

  const stayMinNum = Number(stayMin);
  const stayMaxNum = Number(stayMax);
  const stayWarning =
    stayMin !== "" && stayMax !== "" && (stayMinNum < 5 || stayMinNum > stayMaxNum)
      ? "min 至少 5、且 min ≤ max"
      : null;

  function toggleSet(set, value) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function updateDay(day, patch) {
    setOpenHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  function applyAllDaysSame(open, close) {
    setOpenHours(() => {
      const o = {};
      for (const d of DAYS) o[d] = { open, close, closed: false };
      return o;
    });
  }

  function copyMondayToAll() {
    setOpenHours((prev) => {
      const mon = prev.mon;
      const o = {};
      for (const d of DAYS) o[d] = { ...mon };
      return o;
    });
  }

  function buildPayload() {
    return {
      id,
      name,
      edition_id: editionId,
      area_id: areaId,
      area: area?.name ?? "",
      tags: Array.from(selectedTags),
      stay_range: [Number(stayMin), Number(stayMax)],
      avg_cost: Number(avgCost),
      indoor,
      lat: Number(lat),
      lng: Number(lng),
      open_hours: DAYS.filter((d) => !openHours[d].closed).map((d) => ({
        day: d,
        open: openHours[d].open,
        close: openHours[d].close,
      })),
      rating: Number(rating),
      best_time_window: Array.from(bestTime),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitState({ status: "submitting", errors: [] });
    try {
      const res = await fetch("/api/dev-tools/attractions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitState({
          status: "error",
          errors: data.errors ?? [`HTTP ${res.status}`],
        });
        return;
      }
      router.push("/dev-tools/attractions");
    } catch (err) {
      setSubmitState({ status: "error", errors: [err.message ?? "未知錯誤"] });
    }
  }

  const currency = edition?.currency ?? "";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8"
    >
      <h1 className="font-[family-name:var(--font-serif-tc)] text-2xl font-bold text-[var(--color-text)]">
        新增景點
      </h1>

      <Section title="edition + area">
        <Field label="edition_id">
          <select
            aria-label="edition_id"
            value={editionId}
            onChange={(e) => {
              setEditionId(e.target.value);
              setAreaId("");
              setSelectedTags(new Set());
            }}
            className={selectClass}
          >
            <option value="">— 選擇 —</option>
            {editions.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.name} ({ed.id})
              </option>
            ))}
          </select>
        </Field>
        <Field label="area_id">
          <select
            aria-label="area_id"
            value={areaId}
            disabled={!editionId}
            onChange={(e) => setAreaId(e.target.value)}
            className={selectClass}
          >
            <option value="">— 選擇 —</option>
            {areaOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.id}){!a.active ? " — ready-to-open" : ""}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="name + id">
        <Field label="name">
          <input
            aria-label="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="flex flex-col gap-2">
          <Field label="manual slug (空白則用自動 slug)">
            <input
              aria-label="manual slug"
              type="text"
              value={manualSlug}
              onChange={(e) => setManualSlug(e.target.value)}
              placeholder={autoSlug || "請輸入羅馬字 slug"}
              className={`${inputClass} font-mono`}
            />
          </Field>
          {autoSlug === "" && manualSlug === "" && name !== "" && (
            <p
              data-testid="slug-empty-warning"
              className="text-xs text-[var(--color-warning,#b85a22)]"
            >
              name 沒有 ASCII / 數字,自動 slug 為空。請在上方 manual slug 欄位填羅馬字 slug。
            </p>
          )}
          <p className="text-xs text-[var(--color-text-mid)]">
            id 預覽:
            <span
              data-testid="id-preview"
              className="ml-1 font-mono text-[var(--color-text)]"
            >
              {id || "—"}
            </span>
          </p>
          {idCollision && (
            <p
              data-testid="id-collision-warning"
              className="text-xs text-[var(--color-warning,#b85a22)]"
            >
              id 已存在,請改 name 或 slug
            </p>
          )}
        </div>
      </Section>

      <Section title="tags">
        {!pool && (
          <p className="text-sm text-[var(--color-text-mid)]">
            先選 edition_id,tag pool 會依此 edition 載入
          </p>
        )}
        {pool && (
          <div className="flex flex-col gap-3">
            {["flow", "activity", "mood", "special"].map((cat) => (
              <div key={cat}>
                <div className="mb-1 text-xs uppercase tracking-wide text-[var(--color-text-mid)]">
                  {cat}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pool[cat].map((tag) => {
                    const checked = selectedTags.has(tag);
                    const inputId = `tag-${cat}-${tag}`;
                    return (
                      <span key={tag} className="contents">
                        <input
                          id={inputId}
                          aria-label={tag}
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedTags((s) => toggleSet(s, tag))
                          }
                          className="sr-only"
                        />
                        <label
                          htmlFor={inputId}
                          className={`cursor-pointer rounded-full border px-2.5 py-1 text-sm ${
                            checked
                              ? "border-transparent bg-[var(--color-terracotta)] text-[var(--color-cream-card)]"
                              : "border-[rgba(120,90,60,0.2)] bg-white text-[var(--color-text)]"
                          }`}
                        >
                          {tag}
                        </label>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="lat / lng">
        <Field label="lat">
          <input
            aria-label="lat"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="lng">
          <input
            aria-label="lng"
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="text-xs text-[var(--color-text-mid)]">
          {edition
            ? <>edition bbox: {bboxText(edition.bboxes)}</>
            : "選 edition 後顯示 bbox 範圍"}
        </div>
        <div className="text-sm">
          狀態:
          <span
            data-testid="coord-status"
            className="ml-1 font-mono"
          >
            {coordStatus === "ok" ? "✓ 在 bbox 內" : coordStatus === "outside" ? "✗ 不在 bbox 內" : "—"}
          </span>
        </div>
      </Section>

      <Section title="stay_range">
        <Field label="min (分鐘)">
          <input
            aria-label="stay min"
            type="number"
            min="5"
            value={stayMin}
            onChange={(e) => setStayMin(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="max (分鐘)">
          <input
            aria-label="stay max"
            type="number"
            value={stayMax}
            onChange={(e) => setStayMax(e.target.value)}
            className={inputClass}
          />
        </Field>
        {stayWarning && (
          <p className="text-xs text-[var(--color-warning,#b85a22)]">
            {stayWarning}
          </p>
        )}
      </Section>

      <Section title="avg_cost">
        <Field label={`avg_cost (${CURRENCY_SYMBOL[currency] ?? "—"})`}>
          <input
            aria-label="avg_cost"
            type="number"
            min="0"
            value={avgCost}
            onChange={(e) => setAvgCost(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="indoor">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={indoor}
            onChange={(e) => setIndoor(e.target.checked)}
          />
          室內(true) / 室外(false)
        </label>
      </Section>

      <Section title="open_hours">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => applyAllDaysSame("10:00", "20:00")}
            className={quickActionClass}
          >
            全週 10:00–20:00
          </button>
          <button
            type="button"
            onClick={() => applyAllDaysSame("00:00", "23:59")}
            className={quickActionClass}
          >
            24h 營業
          </button>
          <button
            type="button"
            onClick={copyMondayToAll}
            className={quickActionClass}
          >
            複製週一到全部
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {DAYS.map((d) => {
            const v = openHours[d];
            const closeBad = !v.closed && v.close <= v.open;
            return (
              <div
                key={d}
                className="flex flex-wrap items-center gap-2 rounded border border-[rgba(120,90,60,0.1)] bg-white px-2 py-1.5 text-sm"
              >
                <span className="w-10 font-mono text-xs uppercase text-[var(--color-text-mid)]">
                  {d}
                </span>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={v.closed}
                    onChange={(e) => updateDay(d, { closed: e.target.checked })}
                  />
                  公休
                </label>
                <input
                  aria-label={`${d} open`}
                  type="time"
                  value={v.open}
                  disabled={v.closed}
                  onChange={(e) => updateDay(d, { open: e.target.value })}
                  className="rounded border border-[rgba(120,90,60,0.2)] px-1.5 py-0.5"
                />
                –
                <input
                  aria-label={`${d} close`}
                  type="time"
                  value={v.close}
                  disabled={v.closed}
                  onChange={(e) => updateDay(d, { close: e.target.value })}
                  className="rounded border border-[rgba(120,90,60,0.2)] px-1.5 py-0.5"
                />
                {closeBad && (
                  <span
                    data-testid={`open-hours-warning-${d}`}
                    className="text-xs text-[var(--color-warning,#b85a22)]"
                  >
                    close 須晚於 open
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="rating">
        <Field label="rating (0-5)">
          <input
            aria-label="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="best_time_window">
        <div className="flex gap-2">
          {TIME_WINDOWS.map((w) => {
            const checked = bestTime.has(w);
            const inputId = `best-time-${w}`;
            return (
              <span key={w} className="contents">
                <input
                  id={inputId}
                  aria-label={w}
                  type="checkbox"
                  checked={checked}
                  onChange={() => setBestTime((s) => toggleSet(s, w))}
                  className="sr-only"
                />
                <label
                  htmlFor={inputId}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                    checked
                      ? "border-transparent bg-[var(--color-terracotta)] text-[var(--color-cream-card)]"
                      : "border-[rgba(120,90,60,0.2)] bg-white text-[var(--color-text)]"
                  }`}
                >
                  {w}
                </label>
              </span>
            );
          })}
        </div>
        {bestTime.size === 0 && (
          <p className="text-xs text-[var(--color-warning,#b85a22)]">
            至少選一個
          </p>
        )}
      </Section>

      {submitState.errors.length > 0 && (
        <div className="rounded-2xl bg-[rgba(184,90,34,0.08)] p-3 text-sm text-[var(--color-warning,#b85a22)]">
          <div className="mb-1 font-semibold">送出失敗:</div>
          <ul className="list-disc pl-5">
            {submitState.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitState.status === "submitting"}
          className="rounded-lg bg-[var(--color-terracotta)] px-4 py-2 text-sm font-semibold text-[var(--color-cream-card)] shadow-[0_4px_14px_-4px_rgba(197,106,58,0.4)] disabled:opacity-40"
        >
          {submitState.status === "submitting" ? "送出中…" : "送出"}
        </button>
        <Link
          href="/dev-tools/attractions"
          className="rounded-lg border border-[rgba(120,90,60,0.2)] px-4 py-2 text-sm text-[var(--color-text)]"
        >
          取消
        </Link>
      </div>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border border-[rgba(120,90,60,0.1)] bg-[var(--color-cream-card)] p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-mid)]">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs text-[var(--color-text-mid)]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-[rgba(120,90,60,0.2)] bg-white px-2 py-1.5 text-sm text-[var(--color-text)]";
const selectClass = inputClass;
const quickActionClass =
  "rounded border border-[rgba(120,90,60,0.2)] bg-white px-2 py-1 hover:bg-[rgba(197,106,58,0.06)]";
