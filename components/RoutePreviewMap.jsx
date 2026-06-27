"use client";

import { useMemo } from "react";
import Map, { Marker } from "react-map-gl/mapbox";

function computeInitialViewState(stops) {
  if (stops.length === 1) {
    return {
      latitude: stops[0].attraction.lat,
      longitude: stops[0].attraction.lng,
      zoom: 15,
    };
  }
  const lats = stops.map((s) => s.attraction.lat);
  const lngs = stops.map((s) => s.attraction.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    bounds: [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    fitBoundsOptions: { padding: 40 },
  };
}

export default function RoutePreviewMap({ stops, accents, onPinClick }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const initialViewState = useMemo(() => computeInitialViewState(stops), [stops]);

  if (!token) {
    return (
      <div className="h-48 w-full rounded-lg bg-zinc-100 flex items-center justify-center text-sm text-zinc-500">
        地圖暫時無法載入
      </div>
    );
  }

  return (
    <div
      className="h-48 w-full rounded-lg overflow-hidden"
      aria-label="路線預覽地圖"
    >
      <Map
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={token}
        style={{ width: "100%", height: "100%" }}
      >
        {stops.map((stop, index) => (
          <Marker
            key={stop.attraction.id ?? index}
            latitude={stop.attraction.lat}
            longitude={stop.attraction.lng}
          >
            <button
              type="button"
              data-testid={`route-pin-${index}`}
              aria-label={`前往第 ${index + 1} 站`}
              onClick={() => onPinClick?.(index)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 text-sm font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]"
              style={{ background: accents[index] }}
            >
              {index + 1}
            </button>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
