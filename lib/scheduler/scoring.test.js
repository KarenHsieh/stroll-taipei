import { scoreAttraction } from "./scoring.js";

const A = { tags: ["文青", "靜謐", "老屋"], rating: 4.0 };
const B = { tags: ["熱鬧"], rating: 5.0 };
const C = { tags: ["文青", "靜謐", "老屋"], rating: 5.0 };
const MOODS = ["文青", "靜謐"];

describe("scoreAttraction — Stage 3a baseline preserved when walkInMinutes=0 and surprise not triggered", () => {
  it.each([
    ["A: 2 matches, rating 4.0 → 28", A, MOODS, 28],
    ["B: 0 matches, rating 5.0 → 10", B, MOODS, 10],
    ["C: 2 matches, rating 5.0 → 30", C, MOODS, 30],
  ])("%s", (_, attraction, moods, expected) => {
    expect(scoreAttraction(attraction, { selectedMoods: moods, walkInMinutes: 0 })).toBe(
      expected
    );
  });

  it("higher tag overlap outranks higher rating (A > B)", () => {
    expect(scoreAttraction(A, { selectedMoods: MOODS, walkInMinutes: 0 })).toBeGreaterThan(
      scoreAttraction(B, { selectedMoods: MOODS, walkInMinutes: 0 })
    );
  });

  it("walkInMinutes defaults to 0 when omitted", () => {
    expect(scoreAttraction(A, { selectedMoods: MOODS })).toBe(28);
  });

  it("empty selectedMoods reduces score to rating × 2", () => {
    expect(scoreAttraction(A, { selectedMoods: [], walkInMinutes: 0 })).toBe(8);
  });
});

describe("scoreAttraction — selectedActivities (Option A: soft boost, same weight as moods)", () => {
  const ATTR = { tags: ["文青", "小吃"], rating: 4.0 };

  it("an activity match adds the same +10 a mood match would", () => {
    const moodOnly = scoreAttraction(ATTR, {
      selectedMoods: ["文青"],
      selectedActivities: [],
      walkInMinutes: 0,
    });
    const activityOnly = scoreAttraction(ATTR, {
      selectedMoods: [],
      selectedActivities: ["小吃"],
      walkInMinutes: 0,
    });
    expect(moodOnly).toBe(activityOnly);
  });

  it("mood match + activity match stack: 文青 + 小吃 both hit → 28", () => {
    expect(
      scoreAttraction(ATTR, {
        selectedMoods: ["文青"],
        selectedActivities: ["小吃"],
        walkInMinutes: 0,
      })
    ).toBe(28); // 20 tag + 8 rating
  });

  it("selectedActivities defaults to [] when omitted (backward compat with caller-side defaults)", () => {
    expect(scoreAttraction(ATTR, { selectedMoods: ["文青"], walkInMinutes: 0 })).toBe(18);
  });

  it("activity matches also count toward the surprise bonus tag-match threshold", () => {
    const lowRating = { tags: ["文青", "小吃"], rating: 3.5 };
    // 2 matches across mood+activity, rating 3.5 → triggers surprise
    expect(
      scoreAttraction(lowRating, {
        selectedMoods: ["文青"],
        selectedActivities: ["小吃"],
        walkInMinutes: 0,
      })
    ).toBe(35); // 20 tag + 7 rating + 8 surprise
  });
});

describe("scoreAttraction — walk penalty", () => {
  it("walkInMinutes=5 subtracts exactly 5 from the score (rating ≥ 4.0)", () => {
    const before = scoreAttraction(C, { selectedMoods: MOODS, walkInMinutes: 0 });
    const after = scoreAttraction(C, { selectedMoods: MOODS, walkInMinutes: 5 });
    expect(before - after).toBe(5);
  });

  it("the user's example: A base 28 walk 12 → 16, B base 24 walk 3 → 21, B wins", () => {
    const baseAttractionA = { tags: ["文青", "靜謐"], rating: 4.0 };
    const baseAttractionB = { tags: ["文青"], rating: 7.0 };
    expect(scoreAttraction(baseAttractionA, { selectedMoods: MOODS, walkInMinutes: 0 })).toBe(28);
    expect(scoreAttraction(baseAttractionB, { selectedMoods: MOODS, walkInMinutes: 0 })).toBe(24);
    const finalA = scoreAttraction(baseAttractionA, { selectedMoods: MOODS, walkInMinutes: 12 });
    const finalB = scoreAttraction(baseAttractionB, { selectedMoods: MOODS, walkInMinutes: 3 });
    expect(finalA).toBe(16);
    expect(finalB).toBe(21);
    expect(finalB).toBeGreaterThan(finalA);
  });
});

describe("scoreAttraction — surprise bonus", () => {
  const SURPRISE_MOODS = ["文青", "靜謐", "老屋"];

  it("triggers when rating < 4.0 AND tagMatches ≥ 2 (rating 3.5 + 3 matches → 45)", () => {
    const lowRatingHighMatch = { tags: ["文青", "靜謐", "老屋"], rating: 3.5 };
    expect(
      scoreAttraction(lowRatingHighMatch, { selectedMoods: SURPRISE_MOODS, walkInMinutes: 0 })
    ).toBe(45); // 30 + 7 + 8
  });

  it("does NOT trigger when rating ≥ 4.0 (rating 4.5 + 2 matches → 29)", () => {
    const highRatingTwoMatch = { tags: ["文青", "靜謐"], rating: 4.5 };
    expect(
      scoreAttraction(highRatingTwoMatch, { selectedMoods: SURPRISE_MOODS, walkInMinutes: 0 })
    ).toBe(29); // 20 + 9 + 0
  });

  it("does NOT trigger when tagMatches < 2 (rating 3.5 + 1 match → 17)", () => {
    const lowRatingLowMatch = { tags: ["文青", "熱鬧", "小吃"], rating: 3.5 };
    expect(
      scoreAttraction(lowRatingLowMatch, { selectedMoods: SURPRISE_MOODS, walkInMinutes: 0 })
    ).toBe(17); // 10 + 7 + 0
  });

  it("surprise-eligible 3.5/3-match (45) beats 4.5/2-match (29)", () => {
    const surprise = { tags: ["文青", "靜謐", "老屋"], rating: 3.5 };
    const noSurprise = { tags: ["文青", "靜謐"], rating: 4.5 };
    expect(
      scoreAttraction(surprise, { selectedMoods: SURPRISE_MOODS, walkInMinutes: 0 })
    ).toBeGreaterThan(
      scoreAttraction(noSurprise, { selectedMoods: SURPRISE_MOODS, walkInMinutes: 0 })
    );
  });
});
