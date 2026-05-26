import {
  DETOUR_FACTOR,
  WALKING_SPEED_M_PER_MIN,
  haversine,
  estimateWalkingMinutes,
} from "./walking-time.js";

const LUGUO = { lat: 25.0567, lng: 121.5101 };
const PIER = { lat: 25.0584, lng: 121.5078 };
const XIAOYI = { lat: 25.0561, lng: 121.5099 };

describe("walking-time constants", () => {
  it("exposes DETOUR_FACTOR=1.3 and WALKING_SPEED_M_PER_MIN=80", () => {
    expect(DETOUR_FACTOR).toBe(1.3);
    expect(WALKING_SPEED_M_PER_MIN).toBe(80);
  });
});

describe("haversine", () => {
  it("爐鍋 → 大稻埕碼頭 is roughly 290m", () => {
    const meters = haversine(LUGUO, PIER);
    expect(meters).toBeGreaterThan(250);
    expect(meters).toBeLessThan(350);
  });

  it("爐鍋 → 小藝埕 is roughly 70m", () => {
    const meters = haversine(LUGUO, XIAOYI);
    expect(meters).toBeGreaterThan(50);
    expect(meters).toBeLessThan(100);
  });
});

describe("estimateWalkingMinutes returns integer minutes (ceil)", () => {
  it("爐鍋 → 大稻埕碼頭 is 5 minutes", () => {
    const minutes = estimateWalkingMinutes(LUGUO, PIER);
    expect(minutes).toBe(5);
    expect(Number.isInteger(minutes)).toBe(true);
  });

  it("爐鍋 → 小藝埕 is 2 minutes", () => {
    const minutes = estimateWalkingMinutes(LUGUO, XIAOYI);
    expect(minutes).toBe(2);
    expect(Number.isInteger(minutes)).toBe(true);
  });
});
