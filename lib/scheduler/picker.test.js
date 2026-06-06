import { pickNextStop } from "./picker.js";

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
    rating: 4.0,
    best_time_window: ["afternoon"],
    ...overrides,
  };
}

const SAT_14 = new Date("2026-05-16T14:00:00+08:00");

describe("pickNextStop — Stage 3a behavior preserved", () => {
  it("returns null when no candidate can fit in remaining minutes (stay > remaining)", () => {
    const tooLong = makeAttraction({ stay_range: [120, 180] });
    const result = pickNextStop(
      [tooLong],
      { previousStop: null, currentTime: SAT_14, selectedMoods: ["文青"], timeZone: "Asia/Taipei" },
      60
    );
    expect(result).toBeNull();
  });

  it("returns the higher-final-scoring of two eligible candidates (Stage 3a-style; no walk diff)", () => {
    const high = makeAttraction({
      id: "high",
      tags: ["文青", "靜謐"],
      rating: 4.5,
    });
    const low = makeAttraction({
      id: "low",
      tags: ["文青"],
      rating: 4.0,
    });
    const result = pickNextStop(
      [low, high],
      { previousStop: null, currentTime: SAT_14, selectedMoods: ["文青", "靜謐"], timeZone: "Asia/Taipei" },
      120
    );
    expect(result.id).toBe("high");
  });

  it("disqualifies a candidate whose visit would extend past closing time", () => {
    const closesAt15 = makeAttraction({
      id: "early-close",
      open_hours: [{ day: "sat", open: "09:00", close: "15:00" }],
      stay_range: [120, 180],
      rating: 5.0,
      tags: ["文青", "靜謐", "老屋"],
    });
    const stillOpen = makeAttraction({
      id: "still-open",
      tags: ["文青"],
      rating: 3.0,
    });
    const result = pickNextStop(
      [closesAt15, stillOpen],
      { previousStop: null, currentTime: SAT_14, selectedMoods: ["文青"], timeZone: "Asia/Taipei" },
      240
    );
    expect(result.id).toBe("still-open");
  });
});

describe("pickNextStop — per-edition maxWalkMinutes via options parameter", () => {
  it("accepts a candidate whose walkInMinutes exceeds the default 15 when maxWalkMinutes=25 is passed", () => {
    const previousStop = { lat: 25.0567, lng: 121.5101 };
    // 1.3x-detour walking-minute estimate yields 18 (over 15, under 25)
    const slightlyOver15 = makeAttraction({
      id: "slightly-over-15",
      lat: 25.0627,
      lng: 121.5181,
      tags: ["文青"],
      rating: 4.5,
    });
    const noOptionsResult = pickNextStop(
      [slightlyOver15],
      { previousStop, currentTime: SAT_14, selectedMoods: ["文青"], timeZone: "Asia/Taipei" },
      240
    );
    expect(noOptionsResult).toBeNull();

    const withOptionsResult = pickNextStop(
      [slightlyOver15],
      { previousStop, currentTime: SAT_14, selectedMoods: ["文青"], timeZone: "Asia/Taipei" },
      240,
      { maxWalkMinutes: 25 }
    );
    expect(withOptionsResult).not.toBeNull();
    expect(withOptionsResult.id).toBe("slightly-over-15");
  });
});

describe("pickNextStop — 15-minute hard cap", () => {
  it("a candidate with walkInMinutes > 15 is excluded even if its base score is huge", () => {
    const previousStop = { lat: 25.0567, lng: 121.5101 };
    // far away point in Taipei ~2km away (>15 min walking)
    const farAndHighScore = makeAttraction({
      id: "far-high",
      lat: 25.0780,
      lng: 121.5300,
      tags: ["文青", "靜謐", "老屋"],
      rating: 5.0,
    });
    const result = pickNextStop(
      [farAndHighScore],
      { previousStop, currentTime: SAT_14, selectedMoods: ["文青", "靜謐"], timeZone: "Asia/Taipei" },
      240
    );
    expect(result).toBeNull();
  });
});

describe("pickNextStop — interprets currentTime as Asia/Taipei wall-clock regardless of process TZ", () => {
  it("Thursday 13:00 Taipei (UTC Thu 05:00) selects an attraction whose Thursday slot covers that wall-clock window", () => {
    const thursdayAfternoonInTaipei = new Date("2026-05-28T05:00:00Z");
    const openThu9to17 = makeAttraction({
      id: "fake_thu-9-17",
      open_hours: [{ day: "thu", open: "09:00", close: "17:00" }],
      stay_range: [30, 60],
    });
    const result = pickNextStop(
      [openThu9to17],
      {
        previousStop: null,
        currentTime: thursdayAfternoonInTaipei,
        selectedMoods: ["文青"],
        timeZone: "Asia/Taipei",
      },
      120
    );
    expect(result).not.toBeNull();
    expect(result.id).toBe("fake_thu-9-17");
  });
});

describe("pickNextStop — respects the supplied timeZone for open-hours gating", () => {
  // UTC 2026-06-06T05:00:00Z is Asia/Taipei Sat 13:00 and Asia/Tokyo Sat 14:00.
  // The candidate is open Saturday 13:00–14:00 with 30-minute stay:
  //   - Asia/Taipei view (arrive 13:00, leave 13:30): fits within 13:00–14:00 → selected
  //   - Asia/Tokyo view (arrive 14:00, leave 14:30): outside 13:00–14:00 → null
  const sat1300To1400 = makeAttraction({
    id: "fake_sat-1300-1400",
    open_hours: [{ day: "sat", open: "13:00", close: "14:00" }],
    stay_range: [30, 30],
  });
  const saturdayUTC0500 = new Date("2026-06-06T05:00:00Z");

  it("Asia/Taipei selects the attraction whose Saturday slot covers 13:00–13:30", () => {
    const result = pickNextStop(
      [sat1300To1400],
      {
        previousStop: null,
        currentTime: saturdayUTC0500,
        selectedMoods: ["文青"],
        timeZone: "Asia/Taipei",
      },
      120
    );
    expect(result).not.toBeNull();
    expect(result.id).toBe("fake_sat-1300-1400");
  });

  it("Asia/Tokyo on the same UTC instant returns null because the wall-clock window 14:00–14:30 falls outside the slot", () => {
    const result = pickNextStop(
      [sat1300To1400],
      {
        previousStop: null,
        currentTime: saturdayUTC0500,
        selectedMoods: ["文青"],
        timeZone: "Asia/Tokyo",
      },
      120
    );
    expect(result).toBeNull();
  });
});

describe("pickNextStop — distance influences ranking via walk penalty", () => {
  it("close+slightly-lower-base beats far+slightly-higher-base after walk penalty", () => {
    const previousStop = { lat: 25.0567, lng: 121.5101 };

    // candidate A: ~12 minutes walk (~600m), tags fit 2/2 + rating 4.0 → base = 20 + 8 = 28
    const farHigh = makeAttraction({
      id: "far-high",
      lat: 25.0640,
      lng: 121.5160,
      tags: ["文青", "靜謐"],
      rating: 4.0,
    });

    // candidate B: ~3 minutes walk (~140m), tags fit 1/2 + rating 7.0 (synthetic) → base = 10 + 14 = 24
    // Note: rating 7.0 is not realistic but used here to construct base = 24 cleanly
    const nearLower = makeAttraction({
      id: "near-lower",
      lat: 25.0570,
      lng: 121.5114,
      tags: ["文青"],
      rating: 7.0,
    });

    const result = pickNextStop(
      [farHigh, nearLower],
      { previousStop, currentTime: SAT_14, selectedMoods: ["文青", "靜謐"], timeZone: "Asia/Taipei" },
      120
    );
    expect(result.id).toBe("near-lower");
  });
});
