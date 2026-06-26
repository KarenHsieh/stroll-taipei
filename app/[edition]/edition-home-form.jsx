"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AreaPicker from "@/components/AreaPicker.jsx";
import TimePicker from "@/components/TimePicker.jsx";
import DurationPicker from "@/components/DurationPicker.jsx";
import MoodPicker from "@/components/MoodPicker.jsx";
import ActivityPicker from "@/components/ActivityPicker.jsx";
import SubmitButton from "@/components/SubmitButton.jsx";
import SectionCard from "@/components/SectionCard.jsx";
import LocationSection from "@/components/LocationSection.jsx";
import ComingSoonSheet from "@/components/ComingSoonSheet.jsx";
import EditionPicker from "@/components/EditionPicker.jsx";
import { ACTIVE_EDITIONS } from "@/lib/stroll/editions.js";
import { findBucketForHour } from "@/lib/stroll/time-buckets.js";
import { findAreaInEdition } from "@/lib/stroll/areas.js";
import { isInsideAreaWithBuffer } from "@/lib/stroll/area-geography.js";
import { planStroll } from "@/lib/scheduler/plan-stroll.js";
import { todayInZone, buildDateInZone } from "@/lib/time/local-clock.js";
import attractionsData from "@/data/attractions.json" with { type: "json" };
import {
  decodeStrollRequest,
  encodeStrollRequest,
} from "@/lib/stroll/request-encoder.js";

const IDLE_LOCATION = {
  status: "idle",
  currentLocation: null,
  errorMessage: null,
};

export default function EditionHomeForm({ edition, areas }) {
  return (
    <Suspense fallback={<HomeFormFallback />}>
      <HomeForm edition={edition} areas={areas} />
    </Suspense>
  );
}

function HomeForm({ edition, areas }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState(() => {
    const decoded = decodeStrollRequest(searchParams);
    return {
      area: decoded.area,
      start: decoded.start,
      duration: decoded.duration,
      moods: decoded.moods,
      activities: decoded.activities,
    };
  });
  // LocationSection state is intentionally NOT hydrated from URL — fresh idle
  // on every mount, even when the URL carries legacy anchorLat/anchorLng or a
  // new stops snapshot.
  const [locationValue, setLocationValue] = useState(IDLE_LOCATION);
  const [showSoon, setShowSoon] = useState(false);

  const isComplete =
    state.area !== null &&
    state.start !== null &&
    state.duration !== null &&
    state.moods.length > 0;

  const handleSubmit = () => {
    // Resolve the selected area's record so we can run the bbox + buffer test
    // for anchor eligibility.
    const areaRecord = findAreaInEdition(edition.id, state.area);
    const currentLocation = locationValue?.currentLocation ?? null;
    const anchor =
      currentLocation &&
      areaRecord &&
      isInsideAreaWithBuffer(
        areaRecord,
        currentLocation.lat,
        currentLocation.lng
      )
        ? { lat: currentLocation.lat, lng: currentLocation.lng }
        : null;

    // Compose startAt in the edition's timeZone, mirroring the result page's
    // previous behaviour so planStroll's open-hours gating sees the same
    // wall-clock as before.
    const { year, month, day } = todayInZone(new Date(), edition.timeZone);
    const startAt = buildDateInZone(
      year,
      month,
      day,
      state.start,
      0,
      edition.timeZone
    );

    const planInput = {
      area: state.area,
      startAt,
      durationMinutes: state.duration * 60,
      moods: state.moods,
      activities: state.activities,
      maxWalkMinutes: edition.maxWalkMinutes,
      timeZone: edition.timeZone,
      anchor,
    };
    // Filter attractions to the selected area to keep planStroll's input pool
    // small; the scheduler also filters internally but this matches the
    // previous result-page contract.
    const pool = attractionsData.filter((a) => a.area === state.area);
    const result = planStroll(planInput, pool);
    const stopIds = (result?.stops ?? []).map((s) => s.attraction.id);

    const params = encodeStrollRequest({ ...state, stops: stopIds });
    router.push(`/${edition.id}/result?${params.toString()}`);
  };

  const update = (key) => (value) => setState((s) => ({ ...s, [key]: value }));

  const onAreaChange = (nextAreaName) => {
    setState((s) => (s.area === nextAreaName ? s : { ...s, area: nextAreaName }));
    // Intentionally do NOT reset locationValue — the user's physical position
    // doesn't change when they switch areas. Submit re-runs the bbox test for
    // the newly selected area.
  };

  const bucketId =
    state.start != null ? findBucketForHour(state.start).id : "am";

  return (
    <>
      <main
        className="relative mx-auto min-h-screen max-w-xl px-[22px] pt-16 pb-[140px]"
        style={{ background: "var(--color-cream)" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-60"
          style={{
            background:
              "linear-gradient(180deg, #F4E4C8 0%, var(--color-cream) 100%)",
          }}
        />

        <div className="relative">
          <header className="mb-[22px]">
            <div
              className="inline-flex items-baseline gap-2 whitespace-nowrap font-[family-name:var(--font-serif-tc)] text-[13px] font-medium uppercase tracking-[1.6px] text-[var(--color-eyebrow)]"
            >
              <span className="text-sm font-medium normal-case tracking-[4px] text-[var(--color-eyebrow)]">
                {edition.name}
              </span>
              <span className="h-px w-3.5 self-center bg-[var(--color-line)] opacity-60" />
              {edition.en} stroll
            </div>
            <div className="mt-3">
              <EditionPicker
                editions={ACTIVE_EDITIONS}
                currentEditionId={edition.id}
              />
            </div>
            <h1 className="mt-1.5 mb-1.5 font-[family-name:var(--font-serif-tc)] text-[34px] font-bold leading-[1.15] tracking-[-0.2px] text-[var(--color-text)]">
              今天，想去哪走走？
            </h1>
            <p className="m-0 font-[family-name:var(--font-sans-tc)] text-sm leading-[1.55] text-[var(--color-text-mid)]">
              告訴我地點、時間與氛圍，
              <br />
              幫你排一段剛剛好的散策。
            </p>
          </header>

          <div className="flex flex-col gap-3.5">
            <SectionCard
              title="想去哪散策"
              hint={state.area ? `已選 ${state.area}` : "尚未選擇"}
            >
              <AreaPicker
                value={state.area}
                onChange={onAreaChange}
                onOpenSoon={() => setShowSoon(true)}
                areas={areas}
              />
            </SectionCard>

            {state.area !== null && (
              // Render LocationSection without SectionCard chrome: the component
              // owns its own heading and layout. We do share the same card
              // styling via a thin wrapper so the visual rhythm matches.
              <section className="rounded-[22px] border border-[rgba(197,106,58,0.08)] bg-[var(--color-cream-card)] px-[18px] pt-5 pb-[22px] shadow-[0_1px_0_rgba(120,90,60,0.06),0_8px_24px_-16px_rgba(120,90,60,0.18)]">
                <LocationSection
                  value={locationValue}
                  onChange={setLocationValue}
                />
              </section>
            )}

            <SectionCard
              title="幾點出門"
              hint={state.start != null ? formatHint(state.start) : "尚未選擇"}
            >
              <TimePicker value={state.start} onChange={update("start")} />
            </SectionCard>

            <SectionCard title="想散策多久">
              <DurationPicker
                value={state.duration}
                onChange={update("duration")}
                bucketId={bucketId}
              />
            </SectionCard>

            <SectionCard
              title="想要的氛圍"
              hint={`可複選 · ${state.moods.length} 個`}
            >
              <MoodPicker
                value={state.moods}
                onChange={update("moods")}
                editionId={edition.id}
                selectedAreaId={
                  state.area
                    ? (findAreaInEdition(edition.id, state.area)?.id ?? null)
                    : null
                }
                attractions={attractionsData}
              />
            </SectionCard>

            <SectionCard
              title="想做什麼"
              hint={
                state.activities.length > 0
                  ? `可複選 · 加分用 · ${state.activities.length} 個`
                  : "可複選 · 不選也 OK · 加分用"
              }
            >
              <ActivityPicker
                value={state.activities}
                onChange={update("activities")}
                editionId={edition.id}
              />
            </SectionCard>
          </div>
        </div>

        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl px-[22px] pb-7 pt-3.5"
          style={{
            background:
              "linear-gradient(180deg, rgba(247,239,226,0) 0%, rgba(247,239,226,0.95) 40%, var(--color-cream) 100%)",
          }}
        >
          <div className="pointer-events-auto">
            <SubmitButton disabled={!isComplete} onClick={handleSubmit}>
              產生散策
            </SubmitButton>
          </div>
        </div>
      </main>

      <ComingSoonSheet
        open={showSoon}
        onClose={() => setShowSoon(false)}
        soonAreas={areas.filter((a) => !a.active)}
      />
    </>
  );
}

function formatHint(hour) {
  if (hour < 12) return `上午 ${hour} 點`;
  if (hour === 12) return "中午 12 點";
  if (hour < 18) return `下午 ${hour - 12} 點`;
  return `晚上 ${hour - 12} 點`;
}

function HomeFormFallback() {
  return (
    <main
      className="mx-auto min-h-screen max-w-xl px-[22px] pt-16"
      aria-hidden="true"
    />
  );
}
