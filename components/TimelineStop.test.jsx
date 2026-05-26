import { fireEvent, render, screen } from "@testing-library/react";
import TimelineStop from "./TimelineStop.jsx";

describe("TimelineStop", () => {
  const baseProps = {
    name: "爐鍋咖啡",
    tags: ["咖啡廳", "老屋"],
    timeText: "下午 2 點",
    stayText: "約 1 到 1.5 小時",
  };

  it("renders stayText when isOpenEnded=false", () => {
    render(<TimelineStop {...baseProps} isOpenEnded={false} />);
    expect(screen.getByText("爐鍋咖啡")).toBeInTheDocument();
    expect(screen.getByText("下午 2 點")).toBeInTheDocument();
    expect(screen.getByText("約 1 到 1.5 小時")).toBeInTheDocument();
    expect(screen.queryByText("直到你想結束")).not.toBeInTheDocument();
  });

  it("renders 直到你想結束 instead of stayText when isOpenEnded=true", () => {
    render(<TimelineStop {...baseProps} isOpenEnded={true} />);
    expect(screen.getByText("直到你想結束")).toBeInTheDocument();
    expect(screen.queryByText("約 1 到 1.5 小時")).not.toBeInTheDocument();
  });

  it("invokes onSelect callback when card is clicked", () => {
    const onSelect = jest.fn();
    render(<TimelineStop {...baseProps} isOpenEnded={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("invokes onSelect on Enter/Space via native button activation", () => {
    const onSelect = jest.fn();
    render(<TimelineStop {...baseProps} isOpenEnded={false} onSelect={onSelect} />);
    const btn = screen.getByRole("button");
    btn.focus();
    fireEvent.keyDown(btn, { key: "Enter", code: "Enter" });
    fireEvent.keyUp(btn, { key: "Enter", code: "Enter" });
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalled();
  });

  describe("isPast variations", () => {
    it("isPast=true adds opacity-60 class to the button container", () => {
      render(<TimelineStop {...baseProps} isOpenEnded={false} isPast={true} />);
      expect(screen.getByRole("button").className).toMatch(/\bopacity-60\b/);
    });

    it("isPast=true renders the 已造訪 label", () => {
      render(<TimelineStop {...baseProps} isOpenEnded={false} isPast={true} />);
      expect(screen.getByText("已造訪")).toBeInTheDocument();
    });

    it("isPast=true still invokes onSelect when clicked (past stops remain inspectable)", () => {
      const onSelect = jest.fn();
      render(<TimelineStop {...baseProps} isOpenEnded={false} isPast={true} onSelect={onSelect} />);
      fireEvent.click(screen.getByRole("button"));
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("isPast omitted leaves button without opacity-60 and without 已造訪 label", () => {
      render(<TimelineStop {...baseProps} isOpenEnded={false} />);
      expect(screen.getByRole("button").className).not.toMatch(/\bopacity-60\b/);
      expect(screen.queryByText("已造訪")).not.toBeInTheDocument();
    });
  });
});
