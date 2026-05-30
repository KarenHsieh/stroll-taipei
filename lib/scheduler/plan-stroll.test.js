import { readFileSync } from "node:fs";
import path from "node:path";
import { planStroll } from "./plan-stroll.js";
import { estimateWalkingMinutes } from "./walking-time.js";
import {
  getTaipeiHour,
  getTaipeiMinute,
  getTaipeiDayKey,
} from "../time/taipei-clock.js";

const SEED = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "data/attractions.json"), "utf8")
);
const SAT_14 = new Date("2026-05-16T14:00:00+08:00");

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function todMinutes(d) {
  return getTaipeiHour(d) * 60 + getTaipeiMinute(d);
}

describe("planStroll — unit cases", () => {
  it("first stop has walkInMinutes 0 and arriveAt exactly equal to startAt", () => {
    const result = planStroll(
      { area: "大稻埕", startAt: SAT_14, durationMinutes: 240, moods: ["文青", "靜謐"] },
      SEED
    );
    expect(result.stops.length).toBeGreaterThan(0);
    expect(result.stops[0].walkInMinutes).toBe(0);
    expect(result.stops[0].arriveAt.getTime()).toBe(SAT_14.getTime());
  });

  it("returns { stops: [] } and does not throw when no attraction matches the area (no isOpenEnded marking)", () => {
    let result;
    expect(() => {
      result = planStroll(
        { area: "信義", startAt: SAT_14, durationMinutes: 240, moods: ["文青"] },
        SEED
      );
    }).not.toThrow();
    expect(result).toEqual({ stops: [] });
    expect(Object.keys(result)).toEqual(["stops"]);
  });

  it("loop terminates when remaining time cannot fit any stop (very short window)", () => {
    const result = planStroll(
      { area: "大稻埕", startAt: SAT_14, durationMinutes: 20, moods: ["文青"] },
      SEED
    );
    expect(result.stops.length).toBeLessThanOrEqual(1);
  });
});

describe("planStroll — Dadaocheng fixture integration", () => {
  const INPUT = {
    area: "大稻埕",
    startAt: SAT_14,
    durationMinutes: 240,
    moods: ["文青", "靜謐"],
  };
  let result;

  beforeAll(() => {
    result = planStroll(INPUT, SEED);
  });

  it("produces between 3 and 6 stops", () => {
    expect(result.stops.length).toBeGreaterThanOrEqual(3);
    expect(result.stops.length).toBeLessThanOrEqual(6);
  });

  it("every stop has arriveAt < leaveAt and leaveAt within the window", () => {
    const endAt = new Date(SAT_14.getTime() + INPUT.durationMinutes * 60 * 1000);
    for (const stop of result.stops) {
      expect(stop.arriveAt.getTime()).toBeLessThan(stop.leaveAt.getTime());
      expect(stop.leaveAt.getTime()).toBeLessThanOrEqual(endAt.getTime());
    }
  });

  it("every stop's visit window fits inside one of the attraction's same-day open_hours entries", () => {
    for (const stop of result.stops) {
      const dayKey = getTaipeiDayKey(stop.arriveAt);
      const arriveTod = todMinutes(stop.arriveAt);
      const leaveTod = todMinutes(stop.leaveAt);
      const fits = stop.attraction.open_hours.some(
        (slot) =>
          slot.day === dayKey &&
          hhmmToMinutes(slot.open) <= arriveTod &&
          hhmmToMinutes(slot.close) >= leaveTod
      );
      expect(fits).toBe(true);
    }
  });

  it("walkInMinutes between consecutive stops matches estimateWalkingMinutes from coordinates", () => {
    for (let i = 1; i < result.stops.length; i++) {
      const prev = result.stops[i - 1].attraction;
      const curr = result.stops[i].attraction;
      const expected = estimateWalkingMinutes(
        { lat: prev.lat, lng: prev.lng },
        { lat: curr.lat, lng: curr.lng }
      );
      expect(result.stops[i].walkInMinutes).toBe(expected);
    }
  });

  it("no attraction id appears more than once", () => {
    const ids = result.stops.map((s) => s.attraction.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("last stop is flagged isOpenEnded=true, every other stop isOpenEnded=false", () => {
    expect(result.stops.length).toBeGreaterThan(0);
    for (let i = 0; i < result.stops.length - 1; i++) {
      expect(result.stops[i].isOpenEnded).toBe(false);
    }
    expect(result.stops[result.stops.length - 1].isOpenEnded).toBe(true);
  });
});

describe("planStroll — maxWalkMinutes is forwarded to picker", () => {
  function makeAttraction(overrides = {}) {
    return {
      id: "test_x",
      name: "test",
      area: "大稻埕",
      tags: ["文青"],
      stay_range: [30, 60],
      avg_cost: 100,
      indoor: true,
      lat: 25.0567,
      lng: 121.5101,
      open_hours: [{ day: "sat", open: "09:00", close: "21:00" }],
      rating: 4.5,
      best_time_window: ["afternoon"],
      ...overrides,
    };
  }

  // first stop is at the SAT_14 anchor; second stop is ~18 min away → over default 15
  const first = makeAttraction({ id: "first", lat: 25.0567, lng: 121.5101 });
  const second = makeAttraction({ id: "second", lat: 25.0627, lng: 121.5181 });

  it("with maxWalkMinutes=25, second stop (~18 min from first) is added; without it, only first fits", () => {
    const base = {
      area: "大稻埕",
      startAt: SAT_14,
      durationMinutes: 240,
      moods: ["文青"],
    };
    const noOptionResult = planStroll(base, [first, second]);
    expect(noOptionResult.stops.map((s) => s.attraction.id)).toEqual(["first"]);

    const withOptionResult = planStroll(
      { ...base, maxWalkMinutes: 25 },
      [first, second]
    );
    expect(withOptionResult.stops.map((s) => s.attraction.id)).toEqual([
      "first",
      "second",
    ]);
  });
});

describe("planStroll — purity / determinism", () => {
  const INPUT = {
    area: "大稻埕",
    startAt: SAT_14,
    durationMinutes: 240,
    moods: ["文青", "靜謐"],
  };

  it("does not mutate the input pool (frozen pool still works, length and contents unchanged)", () => {
    const frozenPool = Object.freeze([...SEED]);
    const before = JSON.stringify(frozenPool);
    expect(() => planStroll(INPUT, frozenPool)).not.toThrow();
    expect(frozenPool.length).toBe(SEED.length);
    expect(JSON.stringify(frozenPool)).toBe(before);
  });

  it("produces identical stop order and timestamps on two successive calls", () => {
    const a = planStroll(INPUT, SEED);
    const b = planStroll(INPUT, SEED);
    expect(a.stops.map((s) => s.attraction.id)).toEqual(
      b.stops.map((s) => s.attraction.id)
    );
    expect(a.stops.map((s) => s.arriveAt.getTime())).toEqual(
      b.stops.map((s) => s.arriveAt.getTime())
    );
    expect(a.stops.map((s) => s.leaveAt.getTime())).toEqual(
      b.stops.map((s) => s.leaveAt.getTime())
    );
  });
});
