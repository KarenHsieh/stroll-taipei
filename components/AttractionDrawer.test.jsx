import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("react-map-gl/mapbox", () => {
  const React = require("react");
  const Map = jest.fn(({ children }) =>
    React.createElement("div", { "data-testid": "mapbox-map" }, children)
  );
  const Marker = jest.fn(() =>
    React.createElement("div", { "data-testid": "mapbox-marker" })
  );
  return { __esModule: true, default: Map, Marker };
});

import AttractionDrawer from "./AttractionDrawer.jsx";

const baseAttraction = {
  name: "爐鍋咖啡",
  tags: ["咖啡廳", "老屋", "巷弄"],
  lat: 25.0567,
  lng: 121.5101,
};

const baseProps = {
  attraction: baseAttraction,
  costText: "約 NT$250",
  todayOpenHoursText: "11:00～20:00",
  stayText: "約 1 到 1.5 小時",
};

const ORIGINAL_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  } else {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = ORIGINAL_TOKEN;
  }
});

describe("AttractionDrawer", () => {
  it("when isOpen=false, the sheet is rendered but hidden (aria-hidden true, no open class)", () => {
    render(
      <AttractionDrawer
        {...baseProps}
        indoor={true}
        isOpen={false}
        onClose={() => {}}
      />
    );
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toHaveAttribute("aria-hidden", "true");
    expect(dialog.className).not.toMatch(/\bopen\b/);
  });

  it("when isOpen=true, name, tags, stayText, costText, indoor=室內, todayOpenHoursText are visible", () => {
    render(
      <AttractionDrawer
        {...baseProps}
        indoor={true}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText("爐鍋咖啡")).toBeInTheDocument();
    expect(screen.getByText("咖啡廳")).toBeInTheDocument();
    expect(screen.getByText("老屋")).toBeInTheDocument();
    expect(screen.getByText("約 1 到 1.5 小時")).toBeInTheDocument();
    expect(screen.getByText("約 NT$250")).toBeInTheDocument();
    expect(screen.getByText("室內")).toBeInTheDocument();
    expect(screen.getByText("11:00～20:00")).toBeInTheDocument();
  });

  it("renders 戶外 when indoor=false", () => {
    render(
      <AttractionDrawer
        {...baseProps}
        indoor={false}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText("戶外")).toBeInTheDocument();
  });

  it("invokes onClose when backdrop is clicked", () => {
    const onClose = jest.fn();
    render(
      <AttractionDrawer
        {...baseProps}
        indoor={true}
        isOpen={true}
        onClose={onClose}
      />
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.previousSibling);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("invokes onClose when close button is clicked", () => {
    const onClose = jest.fn();
    render(
      <AttractionDrawer
        {...baseProps}
        indoor={true}
        isOpen={true}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByLabelText("關閉"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("invokes onClose when Esc is pressed while open", () => {
    const onClose = jest.fn();
    render(
      <AttractionDrawer
        {...baseProps}
        indoor={true}
        isOpen={true}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not invoke onClose on Esc after unmount (listener cleanup)", () => {
    const onClose = jest.fn();
    const { unmount } = render(
      <AttractionDrawer
        {...baseProps}
        indoor={true}
        isOpen={true}
        onClose={onClose}
      />
    );
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the Mapbox map area inside the drawer when token is present", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    render(
      <AttractionDrawer
        {...baseProps}
        indoor={true}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByTestId("mapbox-map")).toBeInTheDocument();
    expect(screen.getByTestId("mapbox-marker")).toBeInTheDocument();
  });

  it("renders DOM order: tags → map → dl metadata", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    const { container } = render(
      <AttractionDrawer
        {...baseProps}
        indoor={true}
        isOpen={true}
        onClose={() => {}}
      />
    );
    const tagsRegion = screen.getByText("咖啡廳").closest("div");
    const map = screen.getByTestId("mapbox-map");
    const dl = container.querySelector("dl");

    expect(tagsRegion).toBeInTheDocument();
    expect(map).toBeInTheDocument();
    expect(dl).toBeInTheDocument();

    const pos = (el) => {
      const all = Array.from(container.querySelectorAll("*"));
      return all.indexOf(el);
    };
    expect(pos(tagsRegion)).toBeLessThan(pos(map));
    expect(pos(map)).toBeLessThan(pos(dl));
  });
});
