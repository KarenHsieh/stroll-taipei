function periodPrefix(hour) {
  if (hour < 12) return "上午";
  if (hour === 12) return "中午";
  return "下午";
}

function twelveHour(hour) {
  if (hour === 0) return 12;
  if (hour <= 12) return hour;
  return hour - 12;
}

function formatAnchor(hour, anchorMinute) {
  if (hour === 0 && anchorMinute === 0) {
    return "凌晨 12 點";
  }
  const prefix = periodPrefix(hour);
  const display = twelveHour(hour);
  if (anchorMinute === 30) {
    return `${prefix} ${display} 點半`;
  }
  return `${prefix} ${display} 點`;
}

export function toDisplayTime(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();

  if (minute === 0) {
    return formatAnchor(hour, 0);
  }
  if (minute === 30) {
    return formatAnchor(hour, 30);
  }

  if (minute < 15) {
    return `約${formatAnchor(hour, 0)}`;
  }
  if (minute < 45) {
    return `約${formatAnchor(hour, 30)}`;
  }
  const nextHour = (hour + 1) % 24;
  return `約${formatAnchor(nextHour, 0)}`;
}
