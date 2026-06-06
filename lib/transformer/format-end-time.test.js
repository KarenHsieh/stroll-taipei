import { formatEndTime } from "./format-end-time.js";

describe("formatEndTime", () => {
  it("delegates to toDisplayTime for 17:41 → 預計約下午 5 點半結束", () => {
    const date = new Date("2026-05-17T17:41:00+08:00");
    expect(formatEndTime(date, "Asia/Taipei")).toBe("預計約下午 5 點半結束");
  });
});
