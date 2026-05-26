import { render, screen } from "@testing-library/react";
import SubmitButton from "./SubmitButton.jsx";

describe("SubmitButton", () => {
  it("when disabled is false, button has no disabled attribute and is fully opaque", () => {
    render(
      <SubmitButton disabled={false} onClick={() => {}}>
        產生散策
      </SubmitButton>
    );
    const button = screen.getByRole("button", { name: /產生散策/ });
    expect(button).not.toBeDisabled();
    expect(button.className).not.toMatch(/cursor-not-allowed/);
  });

  it("when disabled is true, button has disabled attribute and uses the disabled className palette", () => {
    render(
      <SubmitButton disabled={true} onClick={() => {}}>
        產生散策
      </SubmitButton>
    );
    const button = screen.getByRole("button", { name: /產生散策/ });
    expect(button).toBeDisabled();
    expect(button.className).toMatch(/cursor-not-allowed/);
  });
});
