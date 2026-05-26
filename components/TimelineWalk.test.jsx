import { render, screen } from "@testing-library/react";
import TimelineWalk from "./TimelineWalk.jsx";

describe("TimelineWalk", () => {
  it("renders the walkInText string", () => {
    render(<TimelineWalk walkInText="走 5 分鐘左右" />);
    expect(screen.getByText("走 5 分鐘左右")).toBeInTheDocument();
  });

  it("isPast=true adds opacity-60 to the wrapper", () => {
    render(<TimelineWalk walkInText="走 5 分鐘左右" isPast={true} />);
    const wrapper = screen.getByText("走 5 分鐘左右");
    expect(wrapper.className).toMatch(/\bopacity-60\b/);
  });

  it("isPast omitted leaves wrapper without opacity-60", () => {
    render(<TimelineWalk walkInText="走 5 分鐘左右" />);
    const wrapper = screen.getByText("走 5 分鐘左右");
    expect(wrapper.className).not.toMatch(/\bopacity-60\b/);
  });
});
