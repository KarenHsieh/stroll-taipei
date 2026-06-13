import { filterByArea, filterByHardConstraints } from "./filters.js";
import { pickNextStop } from "./picker.js";
import { estimateWalkingMinutes } from "./walking-time.js";

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function planStroll(
  {
    area,
    startAt,
    durationMinutes,
    moods,
    activities = [],
    maxWalkMinutes,
    timeZone,
    anchor = null,
  },
  attractionsPool
) {
  const byArea = filterByArea(attractionsPool, area);
  const eligible = filterByHardConstraints(byArea, {
    startAt,
    durationMinutes,
    timeZone,
  });

  const stops = [];
  const visited = new Set();
  let currentTime = startAt;
  // When the caller supplies an anchor (a virtual starting coordinate), seed
  // previousStop so the first iteration's pickNextStop applies the same
  // walking-distance cap as every other transition. The anchor itself is never
  // added to the stops array.
  let previousStop =
    anchor && Number.isFinite(anchor.lat) && Number.isFinite(anchor.lng)
      ? { lat: anchor.lat, lng: anchor.lng }
      : null;
  let remainingMinutes = durationMinutes;

  const pickerOptions =
    maxWalkMinutes !== undefined ? { maxWalkMinutes } : undefined;

  while (true) {
    const candidates = eligible.filter((a) => !visited.has(a.id));
    if (candidates.length === 0) break;

    const next = pickNextStop(
      candidates,
      {
        previousStop,
        currentTime,
        selectedMoods: moods,
        selectedActivities: activities,
        timeZone,
      },
      remainingMinutes,
      pickerOptions
    );
    if (next === null) break;

    const walkInMinutes = previousStop
      ? estimateWalkingMinutes(
          { lat: previousStop.lat, lng: previousStop.lng },
          { lat: next.lat, lng: next.lng }
        )
      : 0;
    const stayMinutes = next.stay_range[0];
    const arriveAt = addMinutes(currentTime, walkInMinutes);
    const leaveAt = addMinutes(arriveAt, stayMinutes);

    stops.push({
      attraction: next,
      arriveAt,
      leaveAt,
      stayMinutes,
      walkInMinutes,
      isOpenEnded: false,
    });
    visited.add(next.id);
    previousStop = next;
    currentTime = leaveAt;
    remainingMinutes -= walkInMinutes + stayMinutes;
  }

  if (stops.length > 0) {
    stops[stops.length - 1].isOpenEnded = true;
  }

  return { stops };
}
