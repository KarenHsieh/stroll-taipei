import {
  computeRemainingDuration,
  filterPoolForRecalibration,
  inferRecalibrationState,
  mergeRecalibration,
} from "./recalibrate.js";

const at = (h, m) => new Date(2026, 4, 17, h, m, 0, 0);

describe("computeRemainingDuration", () => {
  it("returns positive remainder when now is before end", () => {
    expect(computeRemainingDuration(at(14, 0), 240, at(15, 30))).toBe(150);
  });

  it("returns 0 when now equals end", () => {
    expect(computeRemainingDuration(at(14, 0), 240, at(18, 0))).toBe(0);
  });

  it("clamps to 0 when now is past end (never negative)", () => {
    expect(computeRemainingDuration(at(14, 0), 240, at(19, 0))).toBe(0);
  });
});

describe("filterPoolForRecalibration", () => {
  const pool = [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
    { id: "c", name: "C" },
    { id: "d", name: "D" },
    { id: "e", name: "E" },
  ];

  it("excludes the specified IDs and preserves order of remaining", () => {
    const result = filterPoolForRecalibration(pool, ["b", "d"]);
    expect(result.map((a) => a.id)).toEqual(["a", "c", "e"]);
  });

  it("returns same contents when excluded list is empty", () => {
    const result = filterPoolForRecalibration(pool, []);
    expect(result).toHaveLength(5);
    expect(result.map((a) => a.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("returns empty array when all IDs excluded", () => {
    expect(filterPoolForRecalibration(pool, ["a", "b", "c", "d", "e"])).toEqual([]);
  });

  it("does not mutate the input pool", () => {
    const snapshot = JSON.stringify(pool);
    filterPoolForRecalibration(pool, ["b", "d"]);
    expect(JSON.stringify(pool)).toBe(snapshot);
  });
});

describe("inferRecalibrationState", () => {
  it("returns not_started when now is before original start", () => {
    expect(inferRecalibrationState(at(14, 0), 240, at(13, 30))).toBe("not_started");
  });

  it("returns in_progress when now equals original start", () => {
    expect(inferRecalibrationState(at(14, 0), 240, at(14, 0))).toBe("in_progress");
  });

  it("returns in_progress when now is mid-window", () => {
    expect(inferRecalibrationState(at(14, 0), 240, at(15, 30))).toBe("in_progress");
  });

  it("returns ended when now equals original end", () => {
    expect(inferRecalibrationState(at(14, 0), 240, at(18, 0))).toBe("ended");
  });

  it("returns ended when now is past original end", () => {
    expect(inferRecalibrationState(at(14, 0), 240, at(19, 0))).toBe("ended");
  });
});

describe("mergeRecalibration", () => {
  it("tags past stops with isPast=true and prepends them to the new schedule", () => {
    const past = [{ name: "A" }, { name: "B" }];
    const newSchedule = {
      areaTitle: "X",
      stops: [{ name: "C", isPast: false }],
      endText: "預計約下午 5 點結束",
    };
    const result = mergeRecalibration(past, newSchedule);
    expect(result).toEqual({
      areaTitle: "X",
      stops: [
        { name: "A", isPast: true },
        { name: "B", isPast: true },
        { name: "C", isPast: false },
      ],
      endText: "預計約下午 5 點結束",
    });
  });

  it("returns the new schedule's stops untouched when pastStops is empty", () => {
    const newSchedule = {
      areaTitle: "X",
      stops: [{ name: "A", isPast: false }],
      endText: "預計約下午 5 點結束",
    };
    const result = mergeRecalibration([], newSchedule);
    expect(result.stops).toEqual([{ name: "A", isPast: false }]);
    expect(result.endText).toBe("預計約下午 5 點結束");
  });

  it("returns only pastStops (all isPast=true) when newDisplaySchedule.stops is empty", () => {
    const past = [{ name: "A" }, { name: "B" }];
    const newSchedule = { areaTitle: "X", stops: [], endText: null };
    const result = mergeRecalibration(past, newSchedule);
    expect(result.stops).toEqual([
      { name: "A", isPast: true },
      { name: "B", isPast: true },
    ]);
    expect(result.endText).toBeNull();
  });

  it("does not mutate the input pastStops", () => {
    const past = [{ name: "A", isPast: false }];
    const newSchedule = { areaTitle: "X", stops: [], endText: null };
    mergeRecalibration(past, newSchedule);
    expect(past[0].isPast).toBe(false);
  });
});
