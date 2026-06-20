import { getAreaBoundary, isInsideAreaWithBuffer } from "./area-geography.js";
import attractionsData from "../../data/attractions.json" with { type: "json" };

describe("area-geography — getAreaBoundary", () => {
  it("returns the explicit bbox verbatim when area.bbox is well-formed", () => {
    const area = {
      editionId: "fukuoka",
      id: "hakata-tenjin-nakasu",
      bbox: { lat: [33.585, 33.600], lng: [130.395, 130.415] },
    };
    expect(getAreaBoundary(area)).toEqual({
      lat: [33.585, 33.600],
      lng: [130.395, 130.415],
    });
  });

  it("falls back to a bbox computed from the area's attractions when bbox is absent", () => {
    // Use fukuoka hakata-tenjin-nakasu (real area with real attractions in the dataset);
    // pass it WITHOUT a bbox so the auto-fallback path runs.
    const area = { editionId: "fukuoka", id: "hakata-tenjin-nakasu" };
    const matched = attractionsData.filter(
      (a) => a.edition_id === "fukuoka" && a.area_id === "hakata-tenjin-nakasu"
    );
    const expected = {
      lat: [Math.min(...matched.map((a) => a.lat)), Math.max(...matched.map((a) => a.lat))],
      lng: [Math.min(...matched.map((a) => a.lng)), Math.max(...matched.map((a) => a.lng))],
    };
    expect(getAreaBoundary(area)).toEqual(expected);
  });

  it("returns null when there is no explicit bbox and no attractions match the area", () => {
    const area = { editionId: "newland", id: "ghost-town" };
    expect(getAreaBoundary(area)).toBeNull();
  });
});

describe("area-geography — isInsideAreaWithBuffer", () => {
  const area = {
    editionId: "fukuoka",
    id: "hakata-tenjin-nakasu",
    bbox: { lat: [33.585, 33.600], lng: [130.395, 130.415] },
  };

  it("returns true for a point well inside the bbox", () => {
    expect(isInsideAreaWithBuffer(area, 33.592, 130.405)).toBe(true);
  });

  it("returns true for a point ~220m south of the bbox edge (within 400m buffer)", () => {
    expect(isInsideAreaWithBuffer(area, 33.583, 130.405)).toBe(true);
  });

  it("returns false for a point ~1100m south of the bbox edge (outside 400m buffer)", () => {
    expect(isInsideAreaWithBuffer(area, 33.575, 130.405)).toBe(false);
  });

  it("returns false for a point ~460m east of the bbox edge (outside 400m buffer)", () => {
    expect(isInsideAreaWithBuffer(area, 33.600, 130.420)).toBe(false);
  });

  it("returns false when the area has no effective boundary (no bbox, no matching attractions)", () => {
    const ghost = { editionId: "newland", id: "ghost-town" };
    expect(isInsideAreaWithBuffer(ghost, 33.592, 130.405)).toBe(false);
  });
});
