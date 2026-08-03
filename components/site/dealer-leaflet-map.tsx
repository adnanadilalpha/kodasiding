"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { DealerWithDistance } from "@/lib/cms/dealer-geo";
import {
  US_MAP_CENTER,
  US_MAP_ZOOM,
  dealerHasCoords,
} from "@/lib/cms/dealer-geo";
import "leaflet/dist/leaflet.css";

/** Close enough to read street names / building blocks — not Street View. */
const STREET_ZOOM = 16;
const OVERVIEW_MAX_ZOOM = 12;

const PIN = L.icon({
  iconUrl: "/icons/map-pin.svg",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -32],
});

const PIN_ACTIVE = L.icon({
  iconUrl: "/icons/map-pin-active.svg",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -32],
});

function MapViewController({
  center,
  zoom,
  results,
  selectedId,
  resetKey,
}: {
  center: { lat: number; lng: number };
  zoom: number;
  results: DealerWithDistance[];
  selectedId: string | null;
  resetKey: number;
}) {
  const map = useMap();
  const prevSelected = useRef<string | null>(null);
  const prevResultsKey = useRef("");
  const prevResetKey = useRef(resetKey);

  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [map, results.length, resetKey]);

  useEffect(() => {
    if (resetKey !== prevResetKey.current) {
      prevResetKey.current = resetKey;
      prevSelected.current = null;
      prevResultsKey.current = "";
      map.flyTo([center.lat, center.lng], zoom, {
        animate: true,
        duration: 0.5,
      });
      return;
    }

    const resultsKey = results.map((r) => r.id).join(",");
    const resultsChanged = resultsKey !== prevResultsKey.current;
    const selectionChanged = selectedId !== prevSelected.current;

    prevResultsKey.current = resultsKey;
    prevSelected.current = selectedId;

    const selected = results.find(
      (d): d is DealerWithDistance & { lat: number; lng: number } =>
        d.id === selectedId && dealerHasCoords(d),
    );

    // Sidebar / pin selection → zoom into that dealer's streets
    if (selected && selectionChanged && !resultsChanged) {
      map.flyTo([selected.lat, selected.lng], STREET_ZOOM, {
        animate: true,
        duration: 0.55,
      });
      return;
    }

    if (!resultsChanged) return;

    const withCoords = results.filter(
      (d): d is DealerWithDistance & { lat: number; lng: number } =>
        dealerHasCoords(d),
    );

    if (withCoords.length === 0) {
      map.flyTo([center.lat, center.lng], zoom, {
        animate: true,
        duration: 0.5,
      });
      return;
    }

    // New search with a selected dealer → go straight to street level
    if (selected) {
      map.flyTo([selected.lat, selected.lng], STREET_ZOOM, {
        animate: true,
        duration: 0.55,
      });
      return;
    }

    if (withCoords.length === 1) {
      map.flyTo([withCoords[0].lat, withCoords[0].lng], STREET_ZOOM, {
        animate: true,
        duration: 0.55,
      });
      return;
    }

    const bounds = L.latLngBounds(
      withCoords.map((d) => [d.lat, d.lng] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.25), {
      animate: true,
      maxZoom: OVERVIEW_MAX_ZOOM,
    });
  }, [map, center.lat, center.lng, zoom, results, selectedId, resetKey]);

  return null;
}

export function DealerLeafletMap({
  results,
  selectedId,
  onSelect,
  center = US_MAP_CENTER,
  zoom = US_MAP_ZOOM,
  resetKey = 0,
}: {
  results: DealerWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  resetKey?: number;
}) {
  const [mapKey, setMapKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMapKey((k) => k + 1);
    setMounted(true);
    return () => {
      setMounted(false);
      // Strict Mode remount can leave a stale Leaflet id on the host node.
      const host = hostRef.current;
      if (!host) return;
      const leafletNode = host.querySelector(
        ".leaflet-container",
      ) as (HTMLElement & { _leaflet_id?: number }) | null;
      if (leafletNode) {
        delete leafletNode._leaflet_id;
      }
    };
  }, []);

  const markers = useMemo(
    () =>
      results.filter(
        (d): d is DealerWithDistance & { lat: number; lng: number } =>
          dealerHasCoords(d),
      ),
    [results],
  );

  return (
    <div ref={hostRef} className="absolute inset-0 z-0 size-full bg-[#c8dff0]">
      {mounted && mapKey > 0 ? (
        <MapContainer
          key={mapKey}
          center={[center.lat, center.lng]}
          zoom={zoom}
          className="size-full bg-[#c8dff0]"
          scrollWheelZoom
          zoomControl={false}
          maxZoom={19}
        >
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <ZoomControl position="bottomright" />
          <MapViewController
            center={center}
            zoom={zoom}
            results={results}
            selectedId={selectedId}
            resetKey={resetKey}
          />
          {markers.map((dealer) => (
            <Marker
              key={dealer.id}
              position={[dealer.lat, dealer.lng]}
              icon={dealer.id === selectedId ? PIN_ACTIVE : PIN}
              eventHandlers={{
                click: () => onSelect(dealer.id),
              }}
              zIndexOffset={dealer.id === selectedId ? 1000 : 0}
            />
          ))}
        </MapContainer>
      ) : null}
    </div>
  );
}
