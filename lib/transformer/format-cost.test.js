import { formatCost } from "./format-cost.js";

describe("formatCost — currency-aware display", () => {
  describe("zero amount renders as 免費 across currencies", () => {
    const zeroCases = [
      ["TWD", "免費"],
      ["JPY", "免費"],
      ["KRW", "免費"],
    ];

    it.each(zeroCases)("formatCost(0, %s) → %s", (currency, expected) => {
      expect(formatCost(0, currency)).toBe(expected);
    });
  });

  describe("non-zero amount uses the currency's symbol", () => {
    const cases = [
      [250, "TWD", "約 NT$250"],
      [50, "TWD", "約 NT$50"],
      [80, "TWD", "約 NT$80"],
      [200, "TWD", "約 NT$200"],
      [350, "TWD", "約 NT$350"],
      [800, "JPY", "約 ¥800"],
      [8000, "KRW", "約 ₩8,000"],
      [8500000, "KRW", "約 ₩8,500,000"],
    ];

    it.each(cases)("formatCost(%d, %s) → %s", (amount, currency, expected) => {
      expect(formatCost(amount, currency)).toBe(expected);
    });
  });

  describe("unsupported currency raises an error", () => {
    it("formatCost(250, 'USD') throws an error identifying USD as unsupported", () => {
      expect(() => formatCost(250, "USD")).toThrow(/USD/);
    });

    it("formatCost(0, 'USD') still returns 免費 since zero is currency-independent", () => {
      expect(formatCost(0, "USD")).toBe("免費");
    });
  });
});
