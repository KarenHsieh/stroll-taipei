import { requireDevOnly } from "./dev-only.js";

const mockNotFound = jest.fn(() => {
  throw new Error("__NOT_FOUND__");
});

jest.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

beforeEach(() => {
  mockNotFound.mockClear();
});

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe("requireDevOnly — gate behind NODE_ENV === 'development'", () => {
  it("returns silently when NODE_ENV is 'development'", () => {
    process.env.NODE_ENV = "development";
    expect(() => requireDevOnly()).not.toThrow();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("calls notFound when NODE_ENV is 'production'", () => {
    process.env.NODE_ENV = "production";
    expect(() => requireDevOnly()).toThrow("__NOT_FOUND__");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("calls notFound when NODE_ENV is 'test'", () => {
    process.env.NODE_ENV = "test";
    expect(() => requireDevOnly()).toThrow("__NOT_FOUND__");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("calls notFound when NODE_ENV is 'staging'", () => {
    process.env.NODE_ENV = "staging";
    expect(() => requireDevOnly()).toThrow("__NOT_FOUND__");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("calls notFound when NODE_ENV is undefined", () => {
    delete process.env.NODE_ENV;
    expect(() => requireDevOnly()).toThrow("__NOT_FOUND__");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
