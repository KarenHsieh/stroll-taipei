import { render, screen } from "@testing-library/react";
import BackToFormLink from "./BackToFormLink.jsx";

describe("BackToFormLink", () => {
  it("renders an anchor with href '/?<params.toString()>' when params has entries", () => {
    const params = new URLSearchParams({
      area: "大稻埕",
      start: "10",
      duration: "3",
      moods: "文青,靜謐",
    });

    render(<BackToFormLink params={params} />);

    const link = screen.getByRole("link", { name: "回到挑條件" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe(`/?${params.toString()}`);
  });

  it("renders an anchor with href '/' when params is empty", () => {
    render(<BackToFormLink params={new URLSearchParams()} />);

    const link = screen.getByRole("link", { name: "回到挑條件" });
    expect(link.getAttribute("href")).toBe("/");
  });

  it("preserves partial query strings without filtering", () => {
    const params = new URLSearchParams({ area: "大稻埕" });

    render(<BackToFormLink params={params} />);

    const link = screen.getByRole("link", { name: "回到挑條件" });
    expect(link.getAttribute("href")).toBe(`/?${params.toString()}`);
  });

  it("exposes aria-label='回到挑條件' on the link", () => {
    render(
      <BackToFormLink params={new URLSearchParams({ area: "大稻埕" })} />
    );

    const link = screen.getByLabelText("回到挑條件");
    expect(link).toBeInTheDocument();
  });

  it("includes a visible left arrow character alongside the label text", () => {
    render(<BackToFormLink params={new URLSearchParams()} />);

    const link = screen.getByRole("link", { name: "回到挑條件" });
    expect(link.textContent).toContain("←");
    expect(link.textContent).toContain("回到挑條件");
  });
});
