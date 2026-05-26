export const TIME_BUCKETS = [
  { id: "am", label: "上午", hours: [9, 10, 11] },
  { id: "pm", label: "下午", hours: [12, 13, 14, 15, 16, 17] },
  { id: "night", label: "夜晚", hours: [18, 19, 20, 21, 22] },
];

export const LONG_LABEL_BY_BUCKET = {
  am: "走整個上午",
  pm: "走整個下午",
  night: "夜遊到底",
};

export function findBucketForHour(hour) {
  return (
    TIME_BUCKETS.find((b) => b.hours.includes(hour)) || TIME_BUCKETS[0]
  );
}
