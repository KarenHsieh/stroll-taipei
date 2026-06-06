import { encodeStrollRequest, decodeStrollRequest } from "./request-encoder.js";

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
    });
  });
});
