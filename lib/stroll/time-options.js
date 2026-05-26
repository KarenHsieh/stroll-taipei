export const START_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function formatHourDisplay(hour) {
  if (hour < 12) return `上午 ${hour} 點`;
  if (hour === 12) return "中午 12 點";
  if (hour < 18) return `下午 ${hour - 12} 點`;
  return `晚上 ${hour - 12} 點`;
}
