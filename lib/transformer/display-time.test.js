import { toDisplayTime } from "./display-time.js";

function at(hour, minute) {
  const d = new Date(2026, 4, 17, hour, minute, 0, 0);
  return d;
}

describe("toDisplayTime — minute boundary cases", () => {
  const cases = [
    [14, 0, "下午 2 點"],
    [14, 14, "約下午 2 點"],
    [14, 15, "約下午 2 點半"],
    [14, 23, "約下午 2 點半"],
    [14, 29, "約下午 2 點半"],
    [14, 30, "下午 2 點半"],
    [14, 31, "約下午 2 點半"],
    [14, 44, "約下午 2 點半"],
    [14, 45, "約下午 3 點"],
    [14, 59, "約下午 3 點"],
  ];

  it.each(cases)("h=%d m=%d → %s", (h, m, expected) => {
    expect(toDisplayTime(at(h, m))).toBe(expected);
  });
});

describe("toDisplayTime — period prefix per hour", () => {
  const cases = [
    [9, "上午 9 點"],
    [11, "上午 11 點"],
    [12, "中午 12 點"],
    [14, "下午 2 點"],
    [22, "下午 10 點"],
  ];

  it.each(cases)("hour %d → %s", (h, expected) => {
    expect(toDisplayTime(at(h, 0))).toBe(expected);
  });
});

describe("toDisplayTime — hour 0 boundary", () => {
  it("renders midnight as 凌晨 12 點 without crashing", () => {
    expect(toDisplayTime(at(0, 0))).toBe("凌晨 12 點");
  });
});
