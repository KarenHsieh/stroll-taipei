import { notFound } from "next/navigation";
import { decodeStrollRequest } from "@/lib/stroll/request-encoder.js";
import { planStroll } from "@/lib/scheduler/plan-stroll.js";
import { toDisplaySchedule } from "@/lib/transformer/display-schedule.js";
import { todayInZone, buildDateInZone } from "@/lib/time/local-clock.js";
import Timeline from "@/components/Timeline.jsx";
import BackToFormLink from "@/components/BackToFormLink.jsx";
import { AREAS } from "@/lib/stroll/areas.js";
import { getEditionById } from "@/lib/stroll/editions.js";
import { listAttractions } from "@/lib/attractions/repository.js";

function toURLSearchParams(params) {
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) urlParams.append(key, v);
    } else {
      urlParams.append(key, value);
    }
  }
  return urlParams;
}

function buildStartAt(startHour, timeZone) {
  const { year, month, day } = todayInZone(new Date(), timeZone);
  return buildDateInZone(year, month, day, startHour, 0, timeZone);
}

function formatStartHour(hour) {
  if (hour < 12) return `上午 ${hour} 點`;
  if (hour === 12) return "中午 12 點";
  if (hour < 18) return `下午 ${hour - 12} 點`;
  return `晚上 ${hour - 12} 點`;
}

export default async function EditionResultPage({ params, searchParams }) {
  const { edition: editionId } = await params;
  const edition = getEditionById(editionId);
  if (!edition || !edition.active) {
    notFound();
  }

  const sp = await searchParams;
  const decoded = decodeStrollRequest(sp);
  const urlParams = toURLSearchParams(sp);

  if (!decoded.valid) {
    return (
      <ResultShell back={<BackToFormLink params={urlParams} editionId={editionId} />}>
        <h1 className="font-[family-name:var(--font-serif-tc)] text-2xl font-semibold text-[var(--color-text)]">
          等等,還沒選完
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-mid)]">
          回到首頁把區域、時間、時長、氛圍都選齊再來。
        </p>
      </ResultShell>
    );
  }

  const area = AREAS.find(
    (a) => a.editionId === editionId && a.name === decoded.area
  );
  const areaEn = area?.en;

  const startAt = buildStartAt(decoded.start, edition.timeZone);
  const attractions = await listAttractions({ area: decoded.area });
  const internalSchedule = planStroll(
    {
      area: decoded.area,
      startAt,
      durationMinutes: decoded.duration * 60,
      moods: decoded.moods,
      activities: decoded.activities,
      maxWalkMinutes: edition.maxWalkMinutes,
      timeZone: edition.timeZone,
    },
    attractions
  );
  const displaySchedule = toDisplaySchedule(
    internalSchedule,
    decoded.area,
    startAt,
    edition.currency,
    edition.timeZone
  );

  const stopCount = displaySchedule.stops.length;
  const startHourText = formatStartHour(decoded.start);

  if (stopCount === 0) {
    return (
      <ResultShell
        back={<BackToFormLink params={urlParams} editionId={editionId} />}
        eyebrow={
          <Eyebrow edition={edition} areaName={decoded.area} areaEn={areaEn} />
        }
        title={displaySchedule.areaTitle}
      >
        <p className="text-base text-[var(--color-text-mid)]">
          這個時段找不到合適路線,試試別的時間或氛圍。
        </p>
      </ResultShell>
    );
  }

  const originalRequest = {
    area: decoded.area,
    startAt,
    durationMinutes: decoded.duration * 60,
    moods: decoded.moods,
    activities: decoded.activities,
    currency: edition.currency,
    timeZone: edition.timeZone,
    maxWalkMinutes: edition.maxWalkMinutes,
    pool: attractions,
  };

  return (
    <ResultShell
      back={<BackToFormLink params={urlParams} editionId={editionId} />}
      eyebrow={
        <Eyebrow edition={edition} areaName={decoded.area} areaEn={areaEn} />
      }
      title={displaySchedule.areaTitle}
      subtitle={`${startHourText} 出發 · ${stopCount} 站 · 約 ${decoded.duration} 小時`}
    >
      <Timeline
        displaySchedule={displaySchedule}
        originalRequest={originalRequest}
      />
    </ResultShell>
  );
}

function ResultShell({ back, eyebrow, title, subtitle, children }) {
  return (
    <main
      className="relative mx-auto min-h-screen max-w-xl px-[22px] pt-14 pb-14"
      style={{ background: "var(--color-cream)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[200px]"
        style={{
          background:
            "linear-gradient(180deg, #F4E4C8 0%, var(--color-cream) 100%)",
        }}
      />

      <div className="relative">
        <div className="mb-2">{back}</div>
        {eyebrow}
        {title && (
          <h1 className="mt-1 mb-1 font-[family-name:var(--font-serif-tc)] text-3xl font-bold leading-[1.15] tracking-[-0.2px] text-[var(--color-text)]">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mb-5 font-[family-name:var(--font-sans-tc)] text-[13px] leading-[1.55] text-[var(--color-text-mid)]">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </main>
  );
}

function Eyebrow({ edition, areaName, areaEn }) {
  return (
    <div className="mt-2 inline-flex items-baseline gap-2 whitespace-nowrap font-[family-name:var(--font-serif-tc)] text-xs font-medium uppercase tracking-[1.6px] text-[var(--color-eyebrow)]">
      <span className="text-[13px] font-medium normal-case tracking-[3px]">
        {edition.name} · {areaName}
      </span>
      <span className="h-px w-3.5 self-center bg-[var(--color-line)] opacity-60" />
      {areaEn ? `${areaEn} stroll` : `${edition.en} stroll`}
    </div>
  );
}
