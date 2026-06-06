import { getLocalDayKey } from "../time/local-clock.js";

export function formatTodayOpenHours(openHoursArray, date, timeZone) {
  const dayKey = getLocalDayKey(date, timeZone);
  const todaySlots = openHoursArray.filter((slot) => slot.day === dayKey);
  if (todaySlots.length === 0) return "今日公休";
  return todaySlots.map((slot) => `${slot.open}～${slot.close}`).join("、");
}
