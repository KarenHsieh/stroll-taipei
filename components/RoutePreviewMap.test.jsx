import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("react-map-gl/mapbox", () => {
  const React = require("react");
  const Map = jest.fn(
    ({ children, initialViewState, mapStyle, mapboxAccessToken, style }) =>
      React.createElement(
        "div",
        {
          "data-testid": "mapbox-map",
          "data-latitude": initialViewState?.latitude,
          "data-longitude": initialViewState?.longitude,
          "data-zoom": initialViewState?.zoom,
          "data-bounds": initialViewState?.bounds
            ? JSON.stringify(initialViewState.bounds)
            : undefined,
          "data-fitbounds-padding":
            initialViewState?.fitBoundsOptions?.padding != null
              ? String(initialViewState.fitBoundsOptions.padding)
              : undefined,
          "data-mapstyle": mapStyle,
          "data-token": mapboxAccessToken,
          "data-width": style?.width,
          "data-height": style?.height,
        },
        children
      )
  );
  const Marker = jest.fn(({ latitude, longitude, children }) =>
    React.createElement(
      "div",
      {
        "data-testid": "mapbox-marker",
        "data-latitude": latitude,
        "data-longitude": longitude,
      },
      children
    )
  );
  return { __esModule: true, default: Map, Marker };
});

import RoutePreviewMap from "./RoutePreviewMap.jsx";

const ORIGINAL_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  } else {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = ORIGINAL_TOKEN;
  }
});

function makeStop(overrides = {}) {
  return {
    attraction: {
      id: "stop-id",
      name: "stop name",
      lat: 25.0567,
      lng: 121.5101,
      ...overrides.attraction,
    },
    ...overrides,
  };
}

const threeStops = [
  makeStop({ attraction: { id: "a", name: "爐鍋咖啡", lat: 25.0567, lng: 121.5101 } }),
  makeStop({ attraction: { id: "b", name: "小藝埕", lat: 25.0578, lng: 121.5110 } }),
  makeStop({ attraction: { id: "c", name: "永樂市場", lat: 25.0556, lng: 121.5095 } }),
];

const threeAccents = ["#C56A3A", "#6E94A3", "#7E9577"];

describe("RoutePreviewMap — basic rendering", () => {
  it("renders one pin per stop with testid route-pin-<index>", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    render(
      <RoutePreviewMap
        stops={threeStops}
        accents={threeAccents}
        onPinClick={() => {}}
      />
    );
    expect(screen.getByTestId("route-pin-0")).toBeInTheDocument();
    expect(screen.getByTestId("route-pin-1")).toBeInTheDocument();
    expect(screen.getByTestId("route-pin-2")).toBeInTheDocument();
  });

  it("each pin shows index + 1 as its visible label", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    render(
      <RoutePreviewMap
        stops={threeStops}
        accents={threeAccents}
        onPinClick={() => {}}
      />
    );
    expect(screen.getByTestId("route-pin-0").textContent).toBe("1");
    expect(screen.getByTestId("route-pin-1").textContent).toBe("2");
    expect(screen.getByTestId("route-pin-2").textContent).toBe("3");
  });

  it("each pin uses accents[index] as its background color", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    render(
      <RoutePreviewMap
        stops={threeStops}
        accents={threeAccents}
        onPinClick={() => {}}
      />
    );
    expect(screen.getByTestId("route-pin-0").style.background).toMatch(
      /rgb\(197, 106, 58\)|#C56A3A/i
    );
    expect(screen.getByTestId("route-pin-1").style.background).toMatch(
      /rgb\(110, 148, 163\)|#6E94A3/i
    );
    expect(screen.getByTestId("route-pin-2").style.background).toMatch(
      /rgb\(126, 149, 119\)|#7E9577/i
    );
  });

  it("container is h-48 and w-full", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    const { container } = render(
      <RoutePreviewMap
        stops={threeStops}
        accents={threeAccents}
        onPinClick={() => {}}
      />
    );
    const outer = container.firstChild;
    expect(outer.className).toMatch(/\bh-48\b/);
    expect(outer.className).toMatch(/\bw-full\b/);
  });

  it("with >= 2 stops, Map's initial bounds frame all stops with padding 40", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    render(
      <RoutePreviewMap
        stops={threeStops}
        accents={threeAccents}
        onPinClick={() => {}}
      />
    );
    const map = screen.getByTestId("mapbox-map");
    // bounds is [[minLng, minLat], [maxLng, maxLat]]
    const lats = threeStops.map((s) => s.attraction.lat);
    const lngs = threeStops.map((s) => s.attraction.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const expectedBounds = [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
    expect(JSON.parse(map.dataset.bounds)).toEqual(expectedBounds);
    expect(map.dataset.fitboundsPadding).toBe("40");
  });

  it("with exactly 1 stop, Map centers on that stop with zoom ~15 and no bounds", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    const oneStop = [
      makeStop({
        attraction: { id: "a", name: "唯一", lat: 25.07, lng: 121.55 },
      }),
    ];
    render(
      <RoutePreviewMap
        stops={oneStop}
        accents={["#C56A3A"]}
        onPinClick={() => {}}
      />
    );
    const map = screen.getByTestId("mapbox-map");
    expect(map.dataset.latitude).toBe("25.07");
    expect(map.dataset.longitude).toBe("121.55");
    expect(map.dataset.zoom).toBe("15");
    expect(map.dataset.bounds).toBeUndefined();
  });

  it("clicking route-pin-N invokes onPinClick(N) exactly once", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    const onPinClick = jest.fn();
    render(
      <RoutePreviewMap
        stops={threeStops}
        accents={threeAccents}
        onPinClick={onPinClick}
      />
    );
    fireEvent.click(screen.getByTestId("route-pin-1"));
    expect(onPinClick).toHaveBeenCalledTimes(1);
    expect(onPinClick).toHaveBeenCalledWith(1);
  });

  it("placeholder click does not invoke onPinClick", () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const onPinClick = jest.fn();
    render(
      <RoutePreviewMap
        stops={threeStops}
        accents={threeAccents}
        onPinClick={onPinClick}
      />
    );
    fireEvent.click(screen.getByText("地圖暫時無法載入"));
    expect(onPinClick).not.toHaveBeenCalled();
  });

  it("does not throw when onPinClick is undefined and a pin is clicked", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
    render(
      <RoutePreviewMap stops={threeStops} accents={threeAccents} />
    );
    expect(() => fireEvent.click(screen.getByTestId("route-pin-0"))).not.toThrow();
  });

  it("renders placeholder with 「地圖暫時無法載入」 and no markers when token is missing", () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    render(
      <RoutePreviewMap
        stops={threeStops}
        accents={threeAccents}
        onPinClick={() => {}}
      />
    );
    expect(screen.getByText("地圖暫時無法載入")).toBeInTheDocument();
    expect(screen.queryByTestId("mapbox-map")).not.toBeInTheDocument();
    expect(screen.queryByTestId("route-pin-0")).not.toBeInTheDocument();
  });
});
