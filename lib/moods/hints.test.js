import { getMoodHint, MOOD_HINTS } from "./hints.js";

describe("getMoodHint", () => {
  describe("taipei edition known moods", () => {
    it("returns 咖啡店、書店、選物店 for (taipei, 文青)", () => {
      expect(getMoodHint("taipei", "文青")).toBe("咖啡店、書店、選物店");
    });

    it("returns 老建築、老字號、市場 for (taipei, 復古)", () => {
      expect(getMoodHint("taipei", "復古")).toBe("老建築、老字號、市場");
    });

    it("returns 公園、廟宇、巷弄 for (taipei, 靜謐)", () => {
      expect(getMoodHint("taipei", "靜謐")).toBe("公園、廟宇、巷弄");
    });

    it("returns a non-empty hint for every mood in the taipei mood pool", () => {
      // Every taipei mood (文青/職人/復古/靜謐/熱鬧/生活感/老建築) must have a hint
      const taipeiMoods = ["文青", "職人", "復古", "靜謐", "熱鬧", "生活感", "老建築"];
      for (const mood of taipeiMoods) {
        const hint = getMoodHint("taipei", mood);
        expect(typeof hint).toBe("string");
        expect(hint.length).toBeGreaterThan(0);
      }
    });
  });

  describe("fukuoka edition known moods", () => {
    it("returns a non-empty hint for (fukuoka, 文青)", () => {
      const hint = getMoodHint("fukuoka", "文青");
      expect(typeof hint).toBe("string");
      expect(hint.length).toBeGreaterThan(0);
    });

    it("returns a non-empty hint for every mood in the fukuoka mood pool", () => {
      // base moods plus fukuoka extras (流水聲/傳統)
      const fukuokaMoods = [
        "文青",
        "職人",
        "復古",
        "靜謐",
        "熱鬧",
        "生活感",
        "老建築",
        "流水聲",
        "傳統",
      ];
      for (const mood of fukuokaMoods) {
        const hint = getMoodHint("fukuoka", mood);
        expect(typeof hint).toBe("string");
        expect(hint.length).toBeGreaterThan(0);
      }
    });
  });

  describe("fallback behaviour", () => {
    it("returns null for an unknown editionId", () => {
      expect(getMoodHint("atlantis", "文青")).toBeNull();
    });

    it("returns null for an unknown mood within a known edition", () => {
      expect(getMoodHint("taipei", "未知氛圍")).toBeNull();
    });

    it("returns null when editionId is null", () => {
      expect(getMoodHint(null, "文青")).toBeNull();
    });

    it("returns null when editionId is undefined", () => {
      expect(getMoodHint(undefined, "文青")).toBeNull();
    });

    it("returns null when mood is null", () => {
      expect(getMoodHint("taipei", null)).toBeNull();
    });

    it("returns null when mood is undefined", () => {
      expect(getMoodHint("taipei", undefined)).toBeNull();
    });
  });

  describe("MOOD_HINTS shape", () => {
    it("exports MOOD_HINTS as an object keyed by edition id", () => {
      expect(typeof MOOD_HINTS).toBe("object");
      expect(MOOD_HINTS).not.toBeNull();
      expect(MOOD_HINTS.taipei).toBeDefined();
      expect(MOOD_HINTS.fukuoka).toBeDefined();
    });

    it("each edition entry is an object mapping mood string -> hint string", () => {
      for (const editionId of ["taipei", "fukuoka"]) {
        const entries = MOOD_HINTS[editionId];
        for (const [mood, hint] of Object.entries(entries)) {
          expect(typeof mood).toBe("string");
          expect(typeof hint).toBe("string");
          expect(hint.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
