import {
  EDITIONS,
  ACTIVE_EDITIONS,
  getEditionById,
  isInsideEdition,
} from "./editions.js";

describe("editions module — single source of truth for deployable scopes", () => {
  describe("taipei edition values match the existing single-city config", () => {
    let taipei;
    beforeAll(() => {
      taipei = getEditionById("taipei");
    });

    it("returns an edition object for id 'taipei'", () => {
      expect(taipei).not.toBeNull();
    });

    it("name is 台北 and en is Taipei", () => {
      expect(taipei.name).toBe("台北");
      expect(taipei.en).toBe("Taipei");
    });

    it("currency is TWD", () => {
      expect(taipei.currency).toBe("TWD");
    });

    it("bboxes is a length-1 array with the taipei bounding box", () => {
      expect(Array.isArray(taipei.bboxes)).toBe(true);
      expect(taipei.bboxes).toHaveLength(1);
      expect(taipei.bboxes[0]).toEqual({
        lat: [24.9, 25.3],
        lng: [121.4, 121.7],
      });
    });

    it("maxWalkMinutes is 15 (matching the previous global MAX_WALK_MINUTES)", () => {
      expect(taipei.maxWalkMinutes).toBe(15);
    });

    it("active is true", () => {
      expect(taipei.active).toBe(true);
    });
  });

  describe("getEditionById lookup", () => {
    it("returns null for an unknown id", () => {
      expect(getEditionById("atlantis")).toBeNull();
    });
  });

  describe("ACTIVE_EDITIONS filter", () => {
    it("contains only editions whose active flag is true", () => {
      expect(ACTIVE_EDITIONS.every((e) => e.active === true)).toBe(true);
    });

    it("includes the taipei edition", () => {
      expect(ACTIVE_EDITIONS.some((e) => e.id === "taipei")).toBe(true);
    });
  });

  describe("EDITIONS export", () => {
    it("is a non-empty array containing taipei", () => {
      expect(Array.isArray(EDITIONS)).toBe(true);
      expect(EDITIONS.length).toBeGreaterThanOrEqual(1);
      expect(EDITIONS.find((e) => e.id === "taipei")).toBeDefined();
    });
  });

  describe("isInsideEdition — multi-bbox membership", () => {
    const multiBboxEdition = {
      id: "kyoto-stroll",
      name: "京都散策",
      en: "Kyoto Stroll",
      currency: "JPY",
      bboxes: [
        { lat: [35.0, 35.05], lng: [135.76, 135.8] },
        { lat: [34.99, 35.02], lng: [135.84, 135.88] },
      ],
      maxWalkMinutes: 25,
      active: true,
    };

    it("accepts a point inside the first bbox", () => {
      expect(isInsideEdition(multiBboxEdition, 35.02, 135.78)).toBe(true);
    });

    it("accepts a point inside the second bbox", () => {
      expect(isInsideEdition(multiBboxEdition, 35.01, 135.86)).toBe(true);
    });

    it("rejects a point in the gap between two bboxes", () => {
      expect(isInsideEdition(multiBboxEdition, 35.01, 135.82)).toBe(false);
    });

    it("rejects a point outside all bboxes", () => {
      expect(isInsideEdition(multiBboxEdition, 33.59, 130.4)).toBe(false);
    });

    it("accepts a taipei attraction within taipei's single bbox", () => {
      const taipei = getEditionById("taipei");
      expect(isInsideEdition(taipei, 25.0594, 121.5089)).toBe(true);
    });

    it("rejects a fukuoka coordinate against taipei", () => {
      const taipei = getEditionById("taipei");
      expect(isInsideEdition(taipei, 33.5904, 130.4017)).toBe(false);
    });
  });
});
