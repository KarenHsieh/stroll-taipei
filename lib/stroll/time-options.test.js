import { START_HOURS, formatHourDisplay } from "./time-options.js";

describe("START_HOURS", () => {
  it("contains 14 integer hours from 9 through 22", () => {
    expect(START_HOURS).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
  });
});

describe("formatHourDisplay", () => {
  it.each([
    [9, "上午 9 點"],
    [11, "上午 11 點"],
    [12, "中午 12 點"],
    [14, "下午 2 點"],
    [17, "下午 5 點"],
    [18, "晚上 6 點"],
    [22, "晚上 10 點"],
  ])("formats hour %i as %s", (hour, expected) => {
    expect(formatHourDisplay(hour)).toBe(expected);
  });
});
