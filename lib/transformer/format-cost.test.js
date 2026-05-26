import { formatCost } from "./format-cost.js";

describe("formatCost", () => {
  const cases = [
    [0, "免費"],
    [50, "約 NT$50"],
    [80, "約 NT$80"],
    [200, "約 NT$200"],
    [250, "約 NT$250"],
    [350, "約 NT$350"],
  ];

  it.each(cases)("formatCost(%d) → %s", (twd, expected) => {
    expect(formatCost(twd)).toBe(expected);
  });
});
