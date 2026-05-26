import { encodeStrollRequest, decodeStrollRequest } from "./request-encoder.js";

describe("encodeStrollRequest + decodeStrollRequest round-trip", () => {
  it("preserves all four fields", () => {
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
    });
  });

  it("encodes the four expected keys in order", () => {
    const params = encodeStrollRequest({
      area: "大稻埕",
      start: 14,
      duration: 4,
      moods: ["文青", "靜謐"],
    });
    expect(Array.from(params.keys())).toEqual(["area", "start", "duration", "moods"]);
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

  it("accepts a plain object as searchParams (Next.js server component shape)", () => {
    const decoded = decodeStrollRequest({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    });
    expect(decoded).toEqual({
      valid: true,
      area: "大稻埕",
      start: 14,
      duration: 4,
      moods: ["文青", "靜謐"],
    });
  });
});
