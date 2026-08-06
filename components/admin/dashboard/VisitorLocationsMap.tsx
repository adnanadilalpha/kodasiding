"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { VisitorLocationRow } from "@/lib/admin/types";
import { formatCount } from "@/lib/admin/format";
import "leaflet/dist/leaflet.css";

type VisitorLocationsMapProps = {
  locations: VisitorLocationRow[];
  focusKey: string | null;
  onFocusKey?: (key: string | null) => void;
};

const MAP_HEIGHT = 220;
const WORLD_ZOOM = 2;
const CITY_ZOOM = 8;
const COUNTRY_ZOOM = 5;

function isMappable(location: VisitorLocationRow) {
  return (
    typeof location.latitude === "number" &&
    typeof location.longitude === "number" &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude)
  );
}

function markerRadius(visitors: number, maxVisitors: number) {
  const min = 6;
  const max = 14;
  if (maxVisitors <= 0) return min;
  return min + (visitors / maxVisitors) * (max - min);
}

function MapViewport({
  locations,
  focusKey,
}: {
  locations: VisitorLocationRow[];
  focusKey: string | null;
}) {
  const map = useMap();
  const mappable = useMemo(() => locations.filter(isMappable), [locations]);

  useEffect(() => {
    if (!mappable.length) return;

    if (!focusKey) {
      const bounds = L.latLngBounds(
        mappable.map((location) => [
          location.latitude!,
          location.longitude!,
        ]),
      );
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: WORLD_ZOOM,
        animate: true,
      });
      return;
    }

    const focused = mappable.find((location) => location.key === focusKey);
    if (!focused) return;

    const zoom = focused.city ? CITY_ZOOM : COUNTRY_ZOOM;
    map.flyTo([focused.latitude!, focused.longitude!], zoom, {
      duration: 0.65,
    });
  }, [focusKey, map, mappable]);

  return null;
}

export function VisitorLocationsMap({
  locations,
  focusKey,
  onFocusKey,
}: VisitorLocationsMapProps) {
  const mappable = useMemo(() => locations.filter(isMappable), [locations]);
  const maxVisitors = Math.max(
    ...mappable.map((location) => location.visitors),
    1,
  );

  if (mappable.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-black/10 bg-bg-secondary/60 px-4 text-center text-xs text-text-primary/45"
        style={{ height: MAP_HEIGHT }}
      >
        Map markers appear when visits have city coordinates.
      </div>
    );
  }

  const defaultCenter = mappable[0]!;

  return (
    <div
      className="overflow-hidden rounded-lg border border-black/8 [&_.leaflet-control-zoom]:border-none [&_.leaflet-control-zoom_a]:rounded-md [&_.leaflet-control-zoom_a]:border-black/10"
      style={{ height: MAP_HEIGHT }}
    >
      <MapContainer
        center={[defaultCenter.latitude!, defaultCenter.longitude!]}
        zoom={WORLD_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
        style={{ height: MAP_HEIGHT }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapViewport locations={locations} focusKey={focusKey} />
        {mappable.map((location) => {
          const radius = markerRadius(location.visitors, maxVisitors);
          const isFocused = focusKey === location.key;

          return (
            <CircleMarker
              key={location.key}
              center={[location.latitude!, location.longitude!]}
              radius={radius}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: isFocused ? "#c8b891" : "#183f31",
                fillOpacity: isFocused ? 0.95 : 0.82,
              }}
              eventHandlers={{
                click: () => onFocusKey?.(location.key),
              }}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold text-text-primary">
                    {location.label}
                  </p>
                  {location.detail ? (
                    <p className="text-text-primary/60">{location.detail}</p>
                  ) : null}
                  <p className="mt-1 text-text-primary">
                    {formatCount(location.visitors)} visitors
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
