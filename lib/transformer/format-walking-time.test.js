import { formatWalkingTime } from "./format-walking-time.js";

describe("formatWalkingTime", () => {
  it("positive minutes use fixed phrasing", () => {
    expect(formatWalkingTime(5)).toBe("走 5 分鐘左右");
  });

  it("zero minutes returns empty string", () => {
    expect(formatWalkingTime(0)).toBe("");
  });
});
