import { readFileSync } from "node:fs";
import path from "node:path";
import { planStroll } from "./plan-stroll.js";
import { estimateWalkingMinutes } from "./walking-time.js";
import {
  getLocalHour,
  getLocalMinute,
  getLocalDayKey,
} from "../time/local-clock.js";

const SEED = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "data/attractions.json"), "utf8")
);
const SAT_14 = new Date("2026-05-16T14:00:00+08:00");

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function todMinutes(d) {
  return getLocalHour(d, "Asia/Taipei") * 60 + getLocalMinute(d, "Asia/Taipei");
}

describe("planStroll — unit cases", () => {
  it("first stop has walkInMinutes 0 and arriveAt exactly equal to startAt", () => {
    const result = planStroll(
      { area: "大稻埕", startAt: SAT_14, durationMinutes: 240, moods: ["文青", "靜謐"], timeZone: "Asia/Taipei" },
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
        { area: "信義", startAt: SAT_14, durationMinutes: 240, moods: ["文青"], timeZone: "Asia/Taipei" },
        SEED
      );
    }).not.toThrow();
    expect(result).toEqual({ stops: [] });
    expect(Object.keys(result)).toEqual(["stops"]);
  });

  it("loop terminates when remaining time cannot fit any stop (very short window)", () => {
    const result = planStroll(
      { area: "大稻埕", startAt: SAT_14, durationMinutes: 20, moods: ["文青"], timeZone: "Asia/Taipei" },
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
    timeZone: "Asia/Taipei",
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
      const dayKey = getLocalDayKey(stop.arriveAt, "Asia/Taipei");
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

describe("planStroll — uses the supplied timeZone for open-hours gating", () => {
  // Both editions hit this same UTC instant; only the timeZone parameter differs.
  // Asia/Taipei sees Sat 13:00; Asia/Tokyo sees Sat 14:00.
  const saturdayUTC0500 = new Date("2026-06-06T05:00:00Z");

  // Synthetic fukuoka attraction whose Saturday slot covers exactly 14:00–15:00 JST.
  // Under Asia/Tokyo, a 4-hour `startAt=14:00` window opens with this slot.
  // Under Asia/Taipei (which would think wall-clock is 13:00–17:00), the slot
  // opens at 14:00 Taipei → still 1 hour into the window, but since the impl
  // uses the supplied timeZone, the discriminator is the Asia/Taipei-only
  // attraction below.
  const fukuokaSat14To15 = {
    id: "synthetic_fukuoka_sat14-15",
    name: "synthetic fukuoka",
    area: "天神・中洲",
    tags: ["熱鬧"],
    stay_range: [30, 60],
    avg_cost: 800,
    indoor: true,
    lat: 33.59,
    lng: 130.4,
    open_hours: [{ day: "sat", open: "14:00", close: "15:00" }],
    rating: 4.5,
    best_time_window: ["afternoon"],
  };

  // Synthetic taipei attraction whose Saturday slot is 13:00–14:00 — only
  // reachable under Asia/Taipei (Sat 13:00 wall-clock); under Asia/Tokyo
  // (Sat 14:00 wall-clock) the slot is already closed.
  const taipeiSat13To14 = {
    id: "synthetic_taipei_sat13-14",
    name: "synthetic taipei",
    area: "大稻埕",
    tags: ["文青"],
    stay_range: [30, 30],
    avg_cost: 100,
    indoor: true,
    lat: 25.0567,
    lng: 121.5101,
    open_hours: [{ day: "sat", open: "13:00", close: "14:00" }],
    rating: 4.5,
    best_time_window: ["afternoon"],
  };

  it("fukuoka request selects the JST-14:00 attraction whose slot starts exactly at 14:00", () => {
    const result = planStroll(
      {
        area: "天神・中洲",
        startAt: saturdayUTC0500,
        durationMinutes: 60,
        moods: ["熱鬧"],
        timeZone: "Asia/Tokyo",
      },
      [fukuokaSat14To15]
    );
    expect(result.stops.map((s) => s.attraction.id)).toEqual([
      "synthetic_fukuoka_sat14-15",
    ]);
  });

  it("taipei request on the same UTC instant selects the CST-13:00 attraction whose slot is 13:00–14:00", () => {
    const result = planStroll(
      {
        area: "大稻埕",
        startAt: saturdayUTC0500,
        durationMinutes: 60,
        moods: ["文青"],
        timeZone: "Asia/Taipei",
      },
      [taipeiSat13To14]
    );
    expect(result.stops.map((s) => s.attraction.id)).toEqual([
      "synthetic_taipei_sat13-14",
    ]);
  });

  it("fukuoka request rejects the CST-13:00 attraction (its 13:00–14:00 slot is closed in the JST 14:00–15:00 window)", () => {
    const result = planStroll(
      {
        area: "大稻埕",
        startAt: saturdayUTC0500,
        durationMinutes: 60,
        moods: ["文青"],
        timeZone: "Asia/Tokyo",
      },
      [taipeiSat13To14]
    );
    expect(result.stops).toEqual([]);
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
      timeZone: "Asia/Taipei",
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
    timeZone: "Asia/Taipei",
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

describe("planStroll — anchor seeds the first iteration's previousStop", () => {
  const BASE_INPUT = {
    area: "大稻埕",
    startAt: SAT_14,
    durationMinutes: 240,
    moods: ["文青", "靜謐"],
    timeZone: "Asia/Taipei",
    maxWalkMinutes: 15,
  };

  it("without anchor, first stop's walkInMinutes is 0 (snapshot of existing behaviour)", () => {
    const result = planStroll(BASE_INPUT, SEED);
    expect(result.stops.length).toBeGreaterThan(0);
    expect(result.stops[0].walkInMinutes).toBe(0);
  });

  it("with anchor near 大稻埕, first stop's walkInMinutes equals estimateWalkingMinutes(anchor, firstStop)", () => {
    const anchor = { lat: 25.0567, lng: 121.5101 };
    const result = planStroll({ ...BASE_INPUT, anchor }, SEED);
    expect(result.stops.length).toBeGreaterThan(0);
    const first = result.stops[0];
    const expected = estimateWalkingMinutes(anchor, {
      lat: first.attraction.lat,
      lng: first.attraction.lng,
    });
    expect(first.walkInMinutes).toBe(expected);
  });

  it("with anchor far from every candidate, returns { stops: [] } and does not relax the walk cap", () => {
    // Antipodal-ish point — guaranteed to be more than 15 walking minutes from every 大稻埕 attraction
    const anchor = { lat: -25.0567, lng: -121.5101 };
    const result = planStroll({ ...BASE_INPUT, anchor }, SEED);
    expect(result).toEqual({ stops: [] });
  });

  it("anchor coordinates are never synthesized into the stops array as a virtual stop", () => {
    const anchor = { lat: 25.0567, lng: 121.5101 };
    const result = planStroll({ ...BASE_INPUT, anchor }, SEED);
    // No stop SHALL appear at the anchor coordinate that did not originate from a real attraction
    // (every stop's attraction.id must exist in the original SEED dataset)
    const seedIds = new Set(SEED.map((a) => a.id));
    for (const stop of result.stops) {
      expect(seedIds.has(stop.attraction.id)).toBe(true);
    }
    // And the first stop's coords come from a real attraction record, not the anchor pair
    expect(result.stops.length).toBeGreaterThan(0);
    const firstId = result.stops[0].attraction.id;
    expect(SEED.find((a) => a.id === firstId)).toBeDefined();
  });
});
