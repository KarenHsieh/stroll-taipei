const DAY_INDEX_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function formatTodayOpenHours(openHoursArray, date) {
  const dayKey = DAY_INDEX_TO_KEY[date.getDay()];
  const todaySlots = openHoursArray.filter((slot) => slot.day === dayKey);
  if (todaySlots.length === 0) return "今日公休";
  return todaySlots.map((slot) => `${slot.open}～${slot.close}`).join("、");
}
