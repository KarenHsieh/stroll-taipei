import { encodeStrollRequest, decodeStrollRequest } from "./request-encoder.js";
import attractionsData from "../../data/attractions.json" with { type: "json" };

describe("encodeStrollRequest + decodeStrollRequest round-trip", () => {
  it("preserves all required fields plus empty activities", () => {
    const state = {
      area: "大稻埕",
      start: 14,
      duration: 4,
      moods: ["文青", "靜謐"],
    };
    const decoded = decodeStrollRequest(encodeStrollRequest(state));
    expect(decoded).toEqual({
      valid: true,
      area: "大稻埕",
      start: 14,
      duration: 4,
      moods: ["文青", "靜謐"],
      activities: [],
      stops: [],
    });
  });

  it("preserves activities when supplied", () => {
    const state = {
      area: "天神・中洲",
      start: 18,
      duration: 3,
      moods: ["熱鬧"],
      activities: ["屋台", "展覽/藝文"],
    };
    const decoded = decodeStrollRequest(encodeStrollRequest(state));
    expect(decoded.activities).toEqual(["屋台", "展覽/藝文"]);
  });

  it("when activities omitted/empty, does NOT emit the activities URL param", () => {
    const params = encodeStrollRequest({
      area: "大稻埕",
      start: 14,
      duration: 4,
      moods: ["文青"],
    });
    expect(Array.from(params.keys())).toEqual(["area", "start", "duration", "moods"]);
  });

  it("when activities present, URL gains an 'activities' key at the end", () => {
    const params = encodeStrollRequest({
      area: "大稻埕",
      start: 14,
      duration: 4,
      moods: ["文青"],
      activities: ["小吃"],
    });
    expect(Array.from(params.keys())).toEqual([
      "area",
      "start",
      "duration",
      "moods",
      "activities",
    ]);
  });
});

describe("decodeStrollRequest — invalid inputs", () => {
  it("reports valid false when duration is missing", () => {
    const params = new URLSearchParams("area=大稻埕&start=14&moods=文青,靜謐");
    const decoded = decodeStrollRequest(params);
    expect(decoded.valid).toBe(false);
    expect(decoded.area).toBe("大稻埕");
    expect(decoded.start).toBe(14);
    expect(decoded.duration).toBeNull();
    expect(decoded.moods).toEqual(["文青", "靜謐"]);
  });

  it("reports valid false when moods is empty string", () => {
    const params = new URLSearchParams("area=大稻埕&start=14&duration=4&moods=");
    const decoded = decodeStrollRequest(params);
    expect(decoded.valid).toBe(false);
    expect(decoded.moods).toEqual([]);
  });

  it("missing/empty activities does not affect validity", () => {
    const params = new URLSearchParams("area=大稻埕&start=14&duration=4&moods=文青");
    const decoded = decodeStrollRequest(params);
    expect(decoded.valid).toBe(true);
    expect(decoded.activities).toEqual([]);
  });

  it("accepts a plain object as searchParams (Next.js server component shape)", () => {
    const decoded = decodeStrollRequest({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
      activities: "小吃",
    });
    expect(decoded).toEqual({
      valid: true,
      area: "大稻埕",
      start: 14,
      duration: 4,
      moods: ["文青", "靜謐"],
      activities: ["小吃"],
      stops: [],
    });
  });
});

describe("encodeStrollRequest + decodeStrollRequest — stops snapshot", () => {
  // Pick two real attraction ids that the anti-tamper filter will pass through.
  const DDC_A = "dadaocheng_lu-guo-coffee";
  const DDC_B = "dadaocheng_xiahai-temple";

  it("preserves both attraction ids on round-trip", () => {
    const decoded = decodeStrollRequest(
      encodeStrollRequest({
        area: "大稻埕",
        start: 14,
        duration: 4,
        moods: ["文青"],
        activities: [],
        stops: [DDC_A, DDC_B],
      })
    );
    expect(decoded).toEqual({
      valid: true,
      area: "大稻埕",
      start: 14,
      duration: 4,
      moods: ["文青"],
      activities: [],
      stops: [DDC_A, DDC_B],
    });
  });

  it("preserves an empty stops array on round-trip and keeps valid:true", () => {
    const decoded = decodeStrollRequest(
      encodeStrollRequest({
        area: "大稻埕",
        start: 14,
        duration: 4,
        moods: ["文青"],
        activities: [],
        stops: [],
      })
    );
    expect(decoded.valid).toBe(true);
    expect(decoded.stops).toEqual([]);
  });

  it("decoder filters ids absent from data/attractions.json but preserves duplicates of valid ids", () => {
    // Sanity-check fixture: the fake id must not exist in the dataset
    const fakeId = "dadaocheng_fake-place";
    expect(attractionsData.find((a) => a.id === fakeId)).toBeUndefined();

    const params = new URLSearchParams(
      `area=大稻埕&start=14&duration=4&moods=文青&stops=${DDC_A},${fakeId},${DDC_A}`
    );
    const decoded = decodeStrollRequest(params);
    expect(decoded.valid).toBe(true);
    expect(decoded.stops).toEqual([DDC_A, DDC_A]);
  });

  it("decoder ignores legacy anchorLat/anchorLng params: still valid, stops correct, no anchor field", () => {
    const params = new URLSearchParams(
      `area=大稻埕&start=14&duration=4&moods=文青&anchorLat=25.05&anchorLng=121.51&stops=${DDC_A}`
    );
    const decoded = decodeStrollRequest(params);
    expect(decoded.valid).toBe(true);
    expect(decoded.stops).toEqual([DDC_A]);
    expect(decoded.anchor).toBeUndefined();
  });
});
