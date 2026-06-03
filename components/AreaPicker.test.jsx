import { render, screen, fireEvent } from "@testing-library/react";
import AreaPicker from "./AreaPicker.jsx";
import { AREAS } from "@/lib/stroll/areas.js";

const taipeiAreas = AREAS.filter((a) => a.editionId === "taipei");

describe("AreaPicker", () => {
  it("invokes onChange with the area name when 大稻埕 is clicked", () => {
    const onChange = jest.fn();
    render(<AreaPicker value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /大稻埕/ }));
    expect(onChange).toHaveBeenCalledWith("大稻埕");
  });

  it("invokes onChange when 永康街 (active) is clicked", () => {
    const onChange = jest.fn();
    render(<AreaPicker value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /永康街/ }));
    expect(onChange).toHaveBeenCalledWith("永康街");
  });

  it("invokes onChange when 圓山 (active) is clicked", () => {
    const onChange = jest.fn();
    render(<AreaPicker value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /圓山/ }));
    expect(onChange).toHaveBeenCalledWith("圓山");
  });

  it("does not render a button for an inactive area like 民生社區", () => {
    render(<AreaPicker value={null} onChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /民生社區/ })).not.toBeInTheDocument();
  });

  it("marks the currently-selected area pill with aria-pressed=true", () => {
    render(<AreaPicker value="大稻埕" onChange={() => {}} />);
    const dadaocheng = screen.getByRole("button", { name: /大稻埕/ });
    expect(dadaocheng).toHaveAttribute("aria-pressed", "true");
    const yongkang = screen.getByRole("button", { name: /永康街/ });
    expect(yongkang).toHaveAttribute("aria-pressed", "false");
  });

  it("renders exactly 3 active area buttons plus a coming-soon footer pill for the taipei edition", () => {
    render(
      <AreaPicker
        value={null}
        onChange={() => {}}
        onOpenSoon={() => {}}
        areas={taipeiAreas}
      />
    );
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(
      screen.getByRole("button", { name: /更多地點即將推出/ })
    ).toBeInTheDocument();
  });

  it("clicking the coming-soon footer pill invokes onOpenSoon", () => {
    const onOpenSoon = jest.fn();
    render(
      <AreaPicker value={null} onChange={() => {}} onOpenSoon={onOpenSoon} />
    );
    fireEvent.click(screen.getByRole("button", { name: /更多地點即將推出/ }));
    expect(onOpenSoon).toHaveBeenCalledTimes(1);
  });
});
