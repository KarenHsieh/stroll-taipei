import { formatEndTime } from "./format-end-time.js";

describe("formatEndTime", () => {
  it("delegates to toDisplayTime for 17:41 → 預計約下午 5 點半結束", () => {
    const date = new Date(2026, 4, 17, 17, 41, 0, 0);
    expect(formatEndTime(date)).toBe("預計約下午 5 點半結束");
  });
});
