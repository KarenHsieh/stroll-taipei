"use client";

import Map, { Marker } from "react-map-gl/mapbox";

export default function AttractionMap({ lat, lng, name }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div className="h-56 w-full rounded-lg bg-zinc-100 flex items-center justify-center text-sm text-zinc-500">
        地圖暫時無法載入
      </div>
    );
  }

  return (
    <div
      className="h-56 w-full rounded-lg overflow-hidden"
      aria-label={name ? `${name} 的位置地圖` : undefined}
    >
      <Map
        initialViewState={{ latitude: lat, longitude: lng, zoom: 15 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={token}
        style={{ width: "100%", height: "100%" }}
      >
        <Marker latitude={lat} longitude={lng} />
      </Map>
    </div>
  );
}
