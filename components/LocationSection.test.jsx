import { render, screen, fireEvent } from "@testing-library/react";
import LocationSection from "./LocationSection.jsx";

const IDLE = { status: "idle", currentLocation: null, errorMessage: null };

describe("LocationSection", () => {
  let originalGeolocation;

  beforeEach(() => {
    originalGeolocation = navigator.geolocation;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
    });
  });

  function installGeolocation(impl) {
    Object.defineProperty(navigator, "geolocation", {
      value: impl,
      configurable: true,
    });
  }

  it("renders the question heading plus 是 / 否 buttons with neither selected initially", () => {
    render(<LocationSection value={IDLE} onChange={() => {}} />);

    expect(
      screen.getByText("要從目前位置開始規劃嗎？")
    ).toBeInTheDocument();

    const yes = screen.getByRole("button", { name: "是" });
    const no = screen.getByRole("button", { name: "否" });
    expect(yes).toHaveAttribute("aria-pressed", "false");
    expect(no).toHaveAttribute("aria-pressed", "false");

    expect(screen.queryByText("已取得位置 ✓")).not.toBeInTheDocument();
    expect(
      screen.queryByText("無法取得位置，將以一般方式規劃")
    ).not.toBeInTheDocument();
  });

  it("clicking 是 invokes getCurrentPosition; on success onChange records the position", () => {
    const getCurrentPosition = jest.fn((success) => {
      success({ coords: { latitude: 33.592, longitude: 130.405 } });
    });
    installGeolocation({ getCurrentPosition });

    const onChange = jest.fn();
    render(<LocationSection value={IDLE} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "是" }));

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    // Check timeout option was forwarded
    const callOptions = getCurrentPosition.mock.calls[0][2];
    expect(callOptions).toEqual(expect.objectContaining({ timeout: 10000 }));

    expect(onChange).toHaveBeenCalledWith({
      status: "yes",
      currentLocation: { lat: 33.592, lng: 130.405 },
      errorMessage: null,
    });
  });

  it("clicking 是 when geolocation rejects (code 1): onChange with currentLocation=null + errorMessage; re-render shows the error text", () => {
    const getCurrentPosition = jest.fn((_success, error) => {
      error({ code: 1, message: "User denied geolocation" });
    });
    installGeolocation({ getCurrentPosition });

    const onChange = jest.fn();
    const { rerender } = render(
      <LocationSection value={IDLE} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole("button", { name: "是" }));

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      status: "yes",
      currentLocation: null,
      errorMessage: "無法取得位置，將以一般方式規劃",
    });

    // Simulate the parent's state update flowing back in.
    rerender(
      <LocationSection
        value={{
          status: "yes",
          currentLocation: null,
          errorMessage: "無法取得位置，將以一般方式規劃",
        }}
        onChange={onChange}
      />
    );

    expect(
      screen.getByText("無法取得位置，將以一般方式規劃")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "是" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("clicking 否 does NOT invoke getCurrentPosition and calls onChange with the 否 payload", () => {
    const getCurrentPosition = jest.fn();
    installGeolocation({ getCurrentPosition });

    const onChange = jest.fn();
    render(<LocationSection value={IDLE} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "否" }));

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith({
      status: "no",
      currentLocation: null,
      errorMessage: null,
    });
  });

  it("when navigator.geolocation is undefined, clicking 是 takes the failure path", () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });

    const onChange = jest.fn();
    render(<LocationSection value={IDLE} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "是" }));

    expect(onChange).toHaveBeenCalledWith({
      status: "yes",
      currentLocation: null,
      errorMessage: "無法取得位置，將以一般方式規劃",
    });
  });
});
