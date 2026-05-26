export const DURATION_HOURS = [1, 2, 3, 4];

export const DURATIONS = [
  { hour: 1, label: "小晃一下", sub: "約 1 小時" },
  { hour: 2, label: "剛剛好", sub: "約 2 小時" },
  { hour: 3, label: "慢慢走", sub: "約 3 小時" },
  { hour: 4, label: "走整個下午", sub: "約 4 小時" },
];

export function formatDurationDisplay(hour) {
  return `約 ${hour} 小時`;
}
