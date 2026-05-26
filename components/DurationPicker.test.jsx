import { render, screen, fireEvent } from "@testing-library/react";
import DurationPicker from "./DurationPicker.jsx";

describe("DurationPicker", () => {
  it("renders four duration cards with both label and hour sub-text", () => {
    render(<DurationPicker value={null} onChange={() => {}} />);
    expect(screen.getByText("小晃一下")).toBeInTheDocument();
    expect(screen.getByText("剛剛好")).toBeInTheDocument();
    expect(screen.getByText("慢慢走")).toBeInTheDocument();
    expect(screen.getByText("約 1 小時")).toBeInTheDocument();
    expect(screen.getByText("約 2 小時")).toBeInTheDocument();
    expect(screen.getByText("約 3 小時")).toBeInTheDocument();
    expect(screen.getByText("約 4 小時")).toBeInTheDocument();
  });

  it("invokes onChange with the hour value when a duration is clicked", () => {
    const onChange = jest.fn();
    render(<DurationPicker value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /慢慢走/ }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("4-hour label adapts to the bucket: '走整個上午' for am, '走整個下午' for pm, '夜遊到底' for night", () => {
    const { rerender } = render(
      <DurationPicker value={null} onChange={() => {}} bucketId="am" />
    );
    expect(screen.getByText("走整個上午")).toBeInTheDocument();

    rerender(<DurationPicker value={null} onChange={() => {}} bucketId="pm" />);
    expect(screen.getByText("走整個下午")).toBeInTheDocument();

    rerender(
      <DurationPicker value={null} onChange={() => {}} bucketId="night" />
    );
    expect(screen.getByText("夜遊到底")).toBeInTheDocument();
  });
});
