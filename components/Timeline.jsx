"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TimelineStop from "./TimelineStop.jsx";
import TimelineWalk from "./TimelineWalk.jsx";
import AttractionDrawer from "./AttractionDrawer.jsx";
import RecalibrateButton from "./RecalibrateButton.jsx";
import RoutePreviewMap from "./RoutePreviewMap.jsx";

const STOP_ACCENTS = ["#C56A3A", "#6E94A3", "#B8893E", "#7E9577", "#9C6B3F"];

function getAccent(index, total) {
  if (index === total - 1) return "#7E9577";
  return STOP_ACCENTS[index % STOP_ACCENTS.length];
}

export default function Timeline({ displaySchedule, originalRequest }) {
  const [selectedStop, setSelectedStop] = useState(null);
  const [recalibratedSchedule, setRecalibratedSchedule] = useState(null);

  const activeSchedule = recalibratedSchedule ?? displaySchedule;
  const { stops, endText } = activeSchedule;

  const accents = useMemo(
    () => stops.map((_, i) => getAccent(i, stops.length)),
    [stops]
  );

  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const highlightTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const handlePinClick = (index) => {
    const target = document.getElementById(`timeline-stop-${index}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (highlightTimerRef.current !== null) {
      clearTimeout(highlightTimerRef.current);
    }
    setHighlightedIndex(index);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedIndex(null);
      highlightTimerRef.current = null;
    }, 1500);
  };

  return (
    <section>
      {originalRequest && (
        <div
          className="mb-5 flex flex-wrap items-center gap-2"
          data-testid="timeline-meta"
        >
          <RecalibrateButton
            originalStartAt={originalRequest.startAt}
            originalDurationMinutes={originalRequest.durationMinutes}
            displaySchedule={activeSchedule}
            originalRequest={originalRequest}
            onRecalibrated={setRecalibratedSchedule}
          />
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-[family-name:var(--font-sans-tc)] text-xs font-medium"
            style={{
              background: "rgba(126,149,119,0.15)",
              color: "#5E7C58",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--color-sage)" }}
            />
            天氣晴 · 微風
          </span>
        </div>
      )}

      {stops.length === 0 ? (
        <p className="text-base text-[var(--color-text-mid)]">
          這個時段找不到合適路線,試試別的時間或氛圍。
        </p>
      ) : (
        <>
          <div className="mb-5">
            <RoutePreviewMap
              stops={stops}
              accents={accents}
              onPinClick={handlePinClick}
            />
          </div>
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-7 bottom-7 w-0.5"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, rgba(197,106,58,0.35) 0 4px, transparent 4px 9px)",
              }}
            />
            <ol className="relative flex flex-col">
              {stops.map((stop, index) => {
                const accent = accents[index];
                const isLast = index === stops.length - 1;
                const isHighlighted = highlightedIndex === index;
                return (
                  <li
                    key={index}
                    id={`timeline-stop-${index}`}
                    data-highlight={isHighlighted ? "true" : undefined}
                    className={`relative pl-[38px] rounded-2xl transition-shadow duration-300 ${
                      isHighlighted
                        ? "ring-2 ring-[var(--color-terracotta)] ring-offset-2"
                        : ""
                    }`}
                  >
                    {index > 0 && stop.walkInText !== "" && (
                      <TimelineWalk
                        walkInText={stop.walkInText}
                        isPast={stop.isPast}
                      />
                    )}
                    <div
                      className="absolute left-0 flex h-[30px] w-[30px] items-center justify-center rounded-full font-[family-name:var(--font-italic-en)] text-[15px] font-medium z-[2]"
                      style={{
                        top: stop.walkInText && index > 0 ? "56px" : "22px",
                        background: accent,
                        color: "var(--color-cream-card)",
                        boxShadow: `0 4px 12px -4px ${accent}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
                      }}
                    >
                      {index + 1}
                    </div>
                    <TimelineStop
                      name={stop.name}
                      tags={stop.tags}
                      timeText={stop.timeText}
                      stayText={stop.stayText}
                      isOpenEnded={stop.isOpenEnded}
                      isPast={stop.isPast}
                      accent={accent}
                      highlight={isLast}
                      onSelect={() => setSelectedStop(stop)}
                    />
                  </li>
                );
              })}
            </ol>
          </div>

          {endText && (
            <div
              className="mt-5 rounded-2xl px-4 py-3.5 text-center"
              style={{
                background: "rgba(232,151,83,0.10)",
                border: "1px dashed rgba(197,106,58,0.30)",
              }}
            >
              <div className="mb-1 font-[family-name:var(--font-italic-en)] text-[11px] uppercase tracking-[1.4px] text-[var(--color-eyebrow)]">
                end of stroll
              </div>
              <div className="font-[family-name:var(--font-serif-tc)] text-[15px] font-medium text-[var(--color-text)]">
                {endText}
              </div>
            </div>
          )}
        </>
      )}

      <AttractionDrawer
        isOpen={selectedStop !== null}
        onClose={() => setSelectedStop(null)}
        attraction={selectedStop?.attraction ?? null}
        timeText={selectedStop?.timeText ?? ""}
        costText={selectedStop?.costText ?? ""}
        todayOpenHoursText={selectedStop?.todayOpenHoursText ?? ""}
        indoor={selectedStop?.indoor ?? false}
        stayText={selectedStop?.stayText ?? ""}
      />
    </section>
  );
}
