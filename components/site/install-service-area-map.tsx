"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import {
  installRadiusMeters,
  OMAHA_CENTER,
  type InstallTownPoint,
} from "@/lib/cms/install-service-geo";
import "leaflet/dist/leaflet.css";

function FitServiceArea({
  points,
  selected,
  radiusMiles,
}: {
  points: InstallTownPoint[];
  selected: InstallTownPoint | null;
  radiusMiles: number;
}) {
  const map = useMap();
  const didFit = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        map.invalidateSize();
      } catch {
        /* map not ready */
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [map, points.length, radiusMiles]);

  useEffect(() => {
    try {
      if (!map.getContainer()) return;
    } catch {
      return;
    }

    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 10), {
        animate: true,
        duration: 0.4,
      });
      return;
    }

    const meters = installRadiusMeters(radiusMiles);
    const lat = OMAHA_CENTER.lat;
    const lng = OMAHA_CENTER.lng;
    const latDelta = meters / 111_320;
    const lngDelta = meters / (111_320 * Math.cos((lat * Math.PI) / 180));
    const bounds = L.latLngBounds(
      [lat - latDelta, lng - lngDelta],
      [lat + latDelta, lng + lngDelta],
    );
    for (const point of points) {
      bounds.extend([point.lat, point.lng]);
    }

    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: 9,
      animate: didFit.current,
      duration: 0.4,
    });
    didFit.current = true;
  }, [map, points, selected, radiusMiles]);

  return null;
}

export function InstallServiceAreaMap({
  points,
  selectedName,
  onSelectTown,
  radiusMiles = 60,
}: {
  points: InstallTownPoint[];
  selectedName: string | null;
  onSelectTown: (name: string) => void;
  radiusMiles?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const selected =
    points.find(
      (p) => p.name.toLowerCase() === (selectedName ?? "").toLowerCase(),
    ) ?? null;
  const meters = installRadiusMeters(radiusMiles);

  if (!mounted) {
    return (
      <div className="flex h-64 w-full items-center justify-center bg-[#c8dff0] text-xs font-medium tracking-wide text-brand-primary/50 uppercase sm:h-72 lg:h-80">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full overflow-hidden bg-[#c8dff0] sm:h-72 lg:h-80 [&_.leaflet-control-attribution]:text-[9px] [&_.leaflet-control-zoom]:border-none [&_.leaflet-control-zoom_a]:rounded-md [&_.leaflet-control-zoom_a]:border-brand-primary/15">
      <MapContainer
        key={`install-map-${radiusMiles}-${points.length}`}
        center={[OMAHA_CENTER.lat, OMAHA_CENTER.lng]}
        zoom={8}
        className="size-full"
        scrollWheelZoom
        dragging
        doubleClickZoom
        touchZoom
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        <Circle
          center={[OMAHA_CENTER.lat, OMAHA_CENTER.lng]}
          radius={meters}
          pathOptions={{
            color: "#c2d46a",
            weight: 2,
            fillColor: "#264835",
            fillOpacity: 0.14,
          }}
        />
        {points.map((point) => {
          const active =
            selectedName != null &&
            point.name.toLowerCase() === selectedName.toLowerCase();
          return (
            <CircleMarker
              key={point.name}
              center={[point.lat, point.lng]}
              radius={active ? 8 : 6}
              pathOptions={{
                color: active ? "#182e22" : "#264835",
                weight: 2,
                fillColor: active ? "#c2d46a" : "#f7f5ec",
                fillOpacity: 1,
              }}
              eventHandlers={{
                click: () => onSelectTown(point.name),
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                opacity={1}
                permanent
                className="install-town-label"
              >
                {point.name}
              </Tooltip>
            </CircleMarker>
          );
        })}
        <FitServiceArea
          points={points}
          selected={selected}
          radiusMiles={radiusMiles}
        />
      </MapContainer>
      <p className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-bg-primary/92 px-2 py-1 text-[0.65rem] font-bold tracking-[0.08em] text-brand-primary uppercase">
        {radiusMiles} mi install radius · scroll to zoom
      </p>
    </div>
  );
}
