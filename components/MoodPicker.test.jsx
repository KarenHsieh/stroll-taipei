import { render, screen, fireEvent } from "@testing-library/react";
import { TAG_CATEGORIES } from "@/lib/attractions/tag-pool.js";
import MoodPicker from "./MoodPicker.jsx";

describe("MoodPicker", () => {
  it("renders one option per TAG_CATEGORIES.mood entry, in source order", () => {
    render(<MoodPicker value={[]} onChange={() => {}} />);
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(labels).toEqual(TAG_CATEGORIES.mood);
  });

  it("with editionId='taipei', shows only base moods (no fukuoka-specific moods)", () => {
    render(<MoodPicker value={[]} onChange={() => {}} editionId="taipei" />);
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(labels).not.toContain("流水聲");
    expect(labels).not.toContain("傳統");
    expect(labels).toContain("文青");
    expect(labels).toContain("靜謐");
  });

  it("with editionId='fukuoka', shows base moods plus 流水聲 / 傳統", () => {
    render(<MoodPicker value={[]} onChange={() => {}} editionId="fukuoka" />);
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(labels).toContain("流水聲");
    expect(labels).toContain("傳統");
    expect(labels).toContain("文青");
    expect(labels).toContain("靜謐");
  });

  it("toggles a mood when clicked twice via successive onChange calls", () => {
    const states = [[]];
    const onChange = jest.fn((next) => states.push(next));

    const { rerender } = render(<MoodPicker value={states[0]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "文青" }));
    expect(onChange).toHaveBeenLastCalledWith(["文青"]);

    rerender(<MoodPicker value={["文青"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "靜謐" }));
    expect(onChange).toHaveBeenLastCalledWith(["文青", "靜謐"]);

    rerender(<MoodPicker value={["文青", "靜謐"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "文青" }));
    expect(onChange).toHaveBeenLastCalledWith(["靜謐"]);
  });
});
