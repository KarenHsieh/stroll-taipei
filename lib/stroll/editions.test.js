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

    it("timeZone is 'Asia/Taipei'", () => {
      expect(taipei.timeZone).toBe("Asia/Taipei");
    });
  });

  describe("fukuoka edition values reflect the configured second edition with three disjoint bboxes", () => {
    let fukuoka;
    beforeAll(() => {
      fukuoka = getEditionById("fukuoka");
    });

    it("returns an edition object for id 'fukuoka'", () => {
      expect(fukuoka).not.toBeNull();
    });

    it("name is 福岡 and en is Fukuoka", () => {
      expect(fukuoka.name).toBe("福岡");
      expect(fukuoka.en).toBe("Fukuoka");
    });

    it("currency is JPY", () => {
      expect(fukuoka.currency).toBe("JPY");
    });

    it("bboxes is a length-3 array ordered as central Fukuoka, Itoshima, Mojiko", () => {
      expect(Array.isArray(fukuoka.bboxes)).toBe(true);
      expect(fukuoka.bboxes).toHaveLength(3);
      expect(fukuoka.bboxes[0]).toEqual({
        lat: [33.55, 33.62],
        lng: [130.35, 130.45],
      });
      expect(fukuoka.bboxes[1]).toEqual({
        lat: [33.5, 33.62],
        lng: [130.08, 130.32],
      });
      expect(fukuoka.bboxes[2]).toEqual({
        lat: [33.93, 33.97],
        lng: [130.94, 130.98],
      });
    });

    it("maxWalkMinutes is 15 (matching taipei starting value)", () => {
      expect(fukuoka.maxWalkMinutes).toBe(15);
    });

    it("active is true (populated with attractions in the same change)", () => {
      expect(fukuoka.active).toBe(true);
    });

    it("timeZone is 'Asia/Tokyo'", () => {
      expect(fukuoka.timeZone).toBe("Asia/Tokyo");
    });
  });

  describe("every EDITIONS entry has a valid IANA timeZone", () => {
    it.each(
      // Use static IDs so the test name doesn't depend on data lookup at describe time
      [["taipei"], ["fukuoka"]]
    )("%s timeZone is accepted by Intl.DateTimeFormat", (id) => {
      const edition = getEditionById(id);
      expect(edition).not.toBeNull();
      expect(typeof edition.timeZone).toBe("string");
      expect(edition.timeZone.length).toBeGreaterThan(0);
      expect(
        () => new Intl.DateTimeFormat("en-US", { timeZone: edition.timeZone })
      ).not.toThrow();
    });

    it("no edition has an undefined or null timeZone", () => {
      for (const edition of EDITIONS) {
        expect(edition.timeZone).toBeDefined();
        expect(edition.timeZone).not.toBeNull();
      }
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

    it("includes the fukuoka edition", () => {
      expect(ACTIVE_EDITIONS.some((e) => e.id === "fukuoka")).toBe(true);
    });

    it("has length 2 with taipei as the first entry (so root '/' redirects to /taipei)", () => {
      expect(ACTIVE_EDITIONS).toHaveLength(2);
      expect(ACTIVE_EDITIONS[0].id).toBe("taipei");
    });
  });

  describe("EDITIONS export", () => {
    it("is a non-empty array containing taipei", () => {
      expect(Array.isArray(EDITIONS)).toBe(true);
      expect(EDITIONS.length).toBeGreaterThanOrEqual(1);
      expect(EDITIONS.find((e) => e.id === "taipei")).toBeDefined();
    });

    it("contains fukuoka after taipei in array order", () => {
      const taipeiIdx = EDITIONS.findIndex((e) => e.id === "taipei");
      const fukuokaIdx = EDITIONS.findIndex((e) => e.id === "fukuoka");
      expect(taipeiIdx).toBeGreaterThanOrEqual(0);
      expect(fukuokaIdx).toBeGreaterThan(taipeiIdx);
    });
  });

  describe("isInsideEdition — fukuoka multi-bbox membership", () => {
    let fukuoka;
    beforeAll(() => {
      fukuoka = getEditionById("fukuoka");
    });

    it("accepts a point in the central Fukuoka bbox (Tenjin core)", () => {
      expect(isInsideEdition(fukuoka, 33.59, 130.4)).toBe(true);
    });

    it("accepts a point in the Itoshima bbox (Itoshima city core)", () => {
      expect(isInsideEdition(fukuoka, 33.56, 130.2)).toBe(true);
    });

    it("accepts a point in the Mojiko bbox (Mojiko Retro core)", () => {
      expect(isInsideEdition(fukuoka, 33.95, 130.96)).toBe(true);
    });

    it("rejects a point in the gap between Itoshima and central Fukuoka", () => {
      expect(isInsideEdition(fukuoka, 33.55, 130.33)).toBe(false);
    });

    it("rejects a point in the gap between central Fukuoka and Mojiko", () => {
      expect(isInsideEdition(fukuoka, 33.59, 130.6)).toBe(false);
    });

    it("rejects a point outside all three bboxes (Dazaifu, not in scope)", () => {
      expect(isInsideEdition(fukuoka, 33.51, 130.53)).toBe(false);
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
