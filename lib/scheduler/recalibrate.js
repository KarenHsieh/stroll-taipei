export function computeRemainingDuration(originalStartAt, originalDurationMinutes, now) {
  const originalEndMs = originalStartAt.getTime() + originalDurationMinutes * 60000;
  return Math.max(0, Math.floor((originalEndMs - now.getTime()) / 60000));
}

export function filterPoolForRecalibration(pool, excludedAttractionIds) {
  return pool.filter((a) => !excludedAttractionIds.includes(a.id));
}

export function inferRecalibrationState(originalStartAt, originalDurationMinutes, now) {
  const originalEndMs = originalStartAt.getTime() + originalDurationMinutes * 60000;
  if (now.getTime() < originalStartAt.getTime()) return "not_started";
  if (now.getTime() >= originalEndMs) return "ended";
  return "in_progress";
}

export function mergeRecalibration(pastStops, newDisplaySchedule) {
  return {
    areaTitle: newDisplaySchedule.areaTitle,
    stops: [
      ...pastStops.map((s) => ({ ...s, isPast: true })),
      ...newDisplaySchedule.stops,
    ],
    endText: newDisplaySchedule.endText,
  };
}
