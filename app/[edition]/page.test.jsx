/**
 * @jest-environment node
 */

jest.mock("./edition-home-form.jsx", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  notFound: jest.fn(() => {
    throw new Error("__NOT_FOUND__");
  }),
}));

import EditionHome from "./page.js";
import EditionHomeForm from "./edition-home-form.jsx";

beforeEach(() => {
  EditionHomeForm.mockClear();
});

describe("EditionHome page", () => {
  it("passes the edition and its areas down to EditionHomeForm", async () => {
    const element = await EditionHome({
      params: Promise.resolve({ edition: "fukuoka" }),
    });

    expect(element.type).toBe(EditionHomeForm);
    expect(element.props.edition.id).toBe("fukuoka");
    expect(element.props.areas.every((a) => a.editionId === "fukuoka")).toBe(
      true
    );
    expect(element.props).not.toHaveProperty("landmarksByArea");
  });
});
