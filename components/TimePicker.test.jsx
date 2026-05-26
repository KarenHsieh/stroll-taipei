import { render, screen, fireEvent } from "@testing-library/react";
import TimePicker from "./TimePicker.jsx";

describe("TimePicker", () => {
  it("defaults to the morning bucket and shows three hour chips for 上午", () => {
    render(<TimePicker value={null} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "上午 9 點" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上午 10 點" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上午 11 點" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下午 2 點" })).not.toBeInTheDocument();
  });

  it("switching to 下午 bucket reveals afternoon hour chips, and clicking 下午 2 點 invokes onChange with 14", () => {
    const onChange = jest.fn();
    const { rerender } = render(<TimePicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "下午" }));
    expect(screen.getByRole("button", { name: "下午 2 點" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下午 2 點" }));
    expect(onChange).toHaveBeenCalledWith(14);

    rerender(<TimePicker value={14} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "下午 2 點" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("when a night hour is selected, the night bucket is active and the chips swap to evening hours", () => {
    render(<TimePicker value={20} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "夜晚" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "晚上 8 點" })).toBeInTheDocument();
  });
});
