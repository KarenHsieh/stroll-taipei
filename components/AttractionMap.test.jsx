import { render, screen } from "@testing-library/react";

jest.mock("react-map-gl/mapbox", () => {
  const React = require("react");
  const Map = jest.fn(({ children, initialViewState, mapStyle, mapboxAccessToken, style }) =>
    React.createElement(
      "div",
      {
        "data-testid": "mapbox-map",
        "data-latitude": initialViewState?.latitude,
        "data-longitude": initialViewState?.longitude,
        "data-zoom": initialViewState?.zoom,
        "data-mapstyle": mapStyle,
        "data-token": mapboxAccessToken,
        "data-width": style?.width,
        "data-height": style?.height,
      },
      children
    )
  );
  const Marker = jest.fn(({ latitude, longitude }) =>
    React.createElement("div", {
      "data-testid": "mapbox-marker",
      "data-latitude": latitude,
      "data-longitude": longitude,
    })
  );
  return { __esModule: true, default: Map, Marker };
});

import AttractionMap from "./AttractionMap.jsx";

const ORIGINAL_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  } else {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = ORIGINAL_TOKEN;
  }
});

describe("AttractionMap", () => {
  it("renders placeholder with 「地圖暫時無法載入」 when token is missing", () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    render(<AttractionMap lat={25.0567} lng={121.5101} name="爐鍋咖啡" />);
    expect(screen.getByText("地圖暫時無法載入")).toBeInTheDocument();
    expect(screen.queryByTestId("mapbox-map")).not.toBeInTheDocument();
  });

  it("placeholder container has h-56 and w-full classes", () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    render(<AttractionMap lat={25.0567} lng={121.5101} name="爐鍋咖啡" />);
    const placeholder = screen.getByText("地圖暫時無法載入");
    expect(placeholder.className).toMatch(/\bh-56\b/);
    expect(placeholder.className).toMatch(/\bw-full\b/);
  });

  it("renders Mapbox Map with correct lat/lng/zoom/style when token is present", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    render(<AttractionMap lat={25.0567} lng={121.5101} name="爐鍋咖啡" />);
    const map = screen.getByTestId("mapbox-map");
    expect(map).toBeInTheDocument();
    expect(map.dataset.latitude).toBe("25.0567");
    expect(map.dataset.longitude).toBe("121.5101");
    expect(map.dataset.zoom).toBe("15");
    expect(map.dataset.mapstyle).toBe("mapbox://styles/mapbox/streets-v12");
    expect(map.dataset.token).toBe("pk.test.token");
    expect(map.dataset.width).toBe("100%");
    expect(map.dataset.height).toBe("100%");
  });

  it("renders Marker child inside Map at the same coordinates", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    render(<AttractionMap lat={25.0567} lng={121.5101} name="爐鍋咖啡" />);
    const marker = screen.getByTestId("mapbox-marker");
    expect(marker).toBeInTheDocument();
    expect(marker.dataset.latitude).toBe("25.0567");
    expect(marker.dataset.longitude).toBe("121.5101");
    // Marker is inside Map
    const map = screen.getByTestId("mapbox-map");
    expect(map.contains(marker)).toBe(true);
  });
});
