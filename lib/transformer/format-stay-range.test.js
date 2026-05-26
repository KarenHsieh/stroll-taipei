import { formatStayRange } from "./format-stay-range.js";

describe("formatStayRange", () => {
  const cases = [
    [[15, 30], "約 15 到 30 分鐘"],
    [[20, 40], "約 20 到 40 分鐘"],
    [[30, 60], "約 30 分鐘到 1 小時"],
    [[60, 90], "約 1 到 1.5 小時"],
    [[120, 180], "約 2 到 3 小時"],
  ];

  it.each(cases)("range %j → %s", (range, expected) => {
    expect(formatStayRange(range)).toBe(expected);
  });
});
