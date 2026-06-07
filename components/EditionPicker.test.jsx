import { fireEvent, render, screen } from "@testing-library/react";
import EditionPicker from "./EditionPicker.jsx";

const taipei = {
  id: "taipei",
  name: "台北",
  en: "Taipei",
  active: true,
};

const fukuoka = {
  id: "fukuoka",
  name: "福岡",
  en: "Fukuoka",
  active: true,
};

describe("EditionPicker", () => {
  it("renders one item per edition in the provided order", () => {
    render(
      <EditionPicker editions={[taipei, fukuoka]} currentEditionId="taipei" />
    );
    expect(screen.getByText("台北")).toBeInTheDocument();
    expect(screen.getByText("福岡")).toBeInTheDocument();
  });

  it("marks the current edition with aria-current='page' and renders it as non-link", () => {
    render(
      <EditionPicker editions={[taipei, fukuoka]} currentEditionId="taipei" />
    );
    const active = screen.getByText("台北").closest("[aria-current='page']");
    expect(active).not.toBeNull();
    // active item is NOT a link or button
    expect(active.tagName.toLowerCase()).not.toBe("a");
    expect(active.tagName.toLowerCase()).not.toBe("button");
  });

  it("renders non-active editions as links pointing to /<editionId> (no query string)", () => {
    render(
      <EditionPicker editions={[taipei, fukuoka]} currentEditionId="taipei" />
    );
    const fukuokaLink = screen.getByRole("link", { name: /福岡/ });
    expect(fukuokaLink).toBeInTheDocument();
    expect(fukuokaLink.getAttribute("href")).toBe("/fukuoka");
  });

  it("marks the current edition (fukuoka) as active and renders taipei as a link to /taipei", () => {
    render(
      <EditionPicker editions={[taipei, fukuoka]} currentEditionId="fukuoka" />
    );
    const active = screen.getByText("福岡").closest("[aria-current='page']");
    expect(active).not.toBeNull();

    const taipeiLink = screen.getByRole("link", { name: /台北/ });
    expect(taipeiLink.getAttribute("href")).toBe("/taipei");
  });

  it("displays the category label 散策地", () => {
    render(
      <EditionPicker editions={[taipei, fukuoka]} currentEditionId="taipei" />
    );
    expect(screen.getByText("散策地")).toBeInTheDocument();
  });

  it("renders cleanly when only one edition is active (no switchable target)", () => {
    render(<EditionPicker editions={[taipei]} currentEditionId="taipei" />);
    expect(screen.getByText("台北")).toBeInTheDocument();
    // No other edition link should exist
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("active item is non-interactive: clicking it does not navigate", () => {
    render(
      <EditionPicker editions={[taipei, fukuoka]} currentEditionId="taipei" />
    );
    const active = screen.getByText("台北").closest("[aria-current='page']");
    // No links rendered for the active item itself
    const linksWithTaipei = screen
      .queryAllByRole("link")
      .filter((el) => el.textContent.includes("台北"));
    expect(linksWithTaipei).toHaveLength(0);
    // Clicking the active element should not throw and should produce no link side-effect
    fireEvent.click(active);
  });
});
