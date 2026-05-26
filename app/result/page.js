import { decodeStrollRequest } from "@/lib/stroll/request-encoder.js";
import { planStroll } from "@/lib/scheduler/plan-stroll.js";
import { toDisplaySchedule } from "@/lib/transformer/display-schedule.js";
import Timeline from "@/components/Timeline.jsx";
import BackToFormLink from "@/components/BackToFormLink.jsx";
import { AREAS, CITY } from "@/lib/stroll/areas.js";
import attractions from "@/data/attractions.json";

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

function todayInTaipei() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function buildStartAt(startHour) {
  const today = todayInTaipei();
  const hh = String(startHour).padStart(2, "0");
  return new Date(`${today}T${hh}:00:00+08:00`);
}

function formatStartHour(hour) {
  if (hour < 12) return `上午 ${hour} 點`;
  if (hour === 12) return "中午 12 點";
  if (hour < 18) return `下午 ${hour - 12} 點`;
  return `晚上 ${hour - 12} 點`;
}

export default async function ResultPage({ searchParams }) {
  const params = await searchParams;
  const decoded = decodeStrollRequest(params);
  const urlParams = toURLSearchParams(params);

  if (!decoded.valid) {
    return (
      <ResultShell back={<BackToFormLink params={urlParams} />}>
        <h1 className="font-[family-name:var(--font-serif-tc)] text-2xl font-semibold text-[var(--color-text)]">
          等等,還沒選完
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-mid)]">
          回到首頁把區域、時間、時長、氛圍都選齊再來。
        </p>
      </ResultShell>
    );
  }

  const area = AREAS.find((a) => a.name === decoded.area);
  const areaEn = area?.en;

  const startAt = buildStartAt(decoded.start);
  const internalSchedule = planStroll(
    {
      area: decoded.area,
      startAt,
      durationMinutes: decoded.duration * 60,
      moods: decoded.moods,
    },
    attractions
  );
  const displaySchedule = toDisplaySchedule(
    internalSchedule,
    decoded.area,
    startAt
  );

  const stopCount = displaySchedule.stops.length;
  const startHourText = formatStartHour(decoded.start);

  if (stopCount === 0) {
    return (
      <ResultShell
        back={<BackToFormLink params={urlParams} />}
        eyebrow={
          <Eyebrow city={CITY} areaName={decoded.area} areaEn={areaEn} />
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
    pool: attractions,
  };

  return (
    <ResultShell
      back={<BackToFormLink params={urlParams} />}
      eyebrow={
        <Eyebrow city={CITY} areaName={decoded.area} areaEn={areaEn} />
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

function Eyebrow({ city, areaName, areaEn }) {
  return (
    <div className="mt-2 inline-flex items-baseline gap-2 whitespace-nowrap font-[family-name:var(--font-serif-tc)] text-xs font-medium uppercase tracking-[1.6px] text-[var(--color-eyebrow)]">
      <span className="text-[13px] font-medium normal-case tracking-[3px]">
        {city.zh} · {areaName}
      </span>
      <span className="h-px w-3.5 self-center bg-[var(--color-line)] opacity-60" />
      {areaEn ? `${areaEn} stroll` : `${city.en} stroll`}
    </div>
  );
}
