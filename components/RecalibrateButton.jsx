"use client";

import { useState } from "react";
import {
  computeRemainingDuration,
  filterPoolForRecalibration,
  inferRecalibrationState,
  mergeRecalibration,
} from "@/lib/scheduler/recalibrate.js";
import { planStroll } from "@/lib/scheduler/plan-stroll.js";
import { toDisplaySchedule } from "@/lib/transformer/display-schedule.js";
import RecalibratePicker from "./RecalibratePicker.jsx";

export default function RecalibrateButton({
  originalStartAt,
  originalDurationMinutes,
  displaySchedule,
  originalRequest,
  onRecalibrated,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const state = inferRecalibrationState(
    originalStartAt,
    originalDurationMinutes,
    new Date()
  );

  const pastStops = displaySchedule.stops.filter((s) => s.isPast);
  const upcomingStops = displaySchedule.stops.filter((s) => !s.isPast);

  const handleConfirm = (filteredIndex) => {
    const now = new Date();
    const newlyPast = upcomingStops.slice(0, filteredIndex + 1);
    const accumulatedPast = [...pastStops, ...newlyPast];
    const excludedIds = accumulatedPast.map((s) => s.attraction.id);
    const newPool = filterPoolForRecalibration(originalRequest.pool, excludedIds);
    const remaining = computeRemainingDuration(
      originalStartAt,
      originalDurationMinutes,
      now
    );
    const internalSchedule = planStroll(
      {
        area: originalRequest.area,
        startAt: now,
        durationMinutes: remaining,
        moods: originalRequest.moods,
        maxWalkMinutes: originalRequest.maxWalkMinutes,
      },
      newPool
    );
    const newDisplaySchedule = toDisplaySchedule(
      internalSchedule,
      originalRequest.area,
      now,
      originalRequest.currency
    );
    const finalSchedule = mergeRecalibration(accumulatedPast, newDisplaySchedule);
    onRecalibrated(finalSchedule);
    setPickerOpen(false);
  };

  const disabled = state !== "in_progress";
  const message =
    state === "not_started"
      ? "散策還沒開始呢"
      : state === "ended"
        ? "今日散策已結束"
        : null;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setPickerOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400"
      >
        <span aria-hidden="true">↻</span>
        重新校準
      </button>
      {message && <span className="text-sm text-zinc-500">{message}</span>}
      {pickerOpen && (
        <RecalibratePicker
          stops={upcomingStops}
          onCancel={() => setPickerOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
