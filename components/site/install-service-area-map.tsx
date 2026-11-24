"use client";

import { useEffect, useId, useRef, useState } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { installRadiusMeters, OMAHA_CENTER } from "@/lib/cms/install-service-geo";
import "leaflet/dist/leaflet.css";

function FitServiceArea({ radiusMiles }: { radiusMiles: number }) {
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
  }, [map, radiusMiles]);

  useEffect(() => {
    try {
      if (!map.getContainer()) return;
    } catch {
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

    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: 9,
      animate: didFit.current,
      duration: 0.4,
    });
    didFit.current = true;
  }, [map, radiusMiles]);

  return null;
}

function MapLoading() {
  return (
    <div className="flex size-full items-center justify-center text-xs font-medium tracking-wide text-brand-primary/50 uppercase">
      Loading map…
    </div>
  );
}

export function InstallServiceAreaMap({
  radiusMiles = 60,
}: {
  radiusMiles?: number;
}) {
  const mapId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Wait until the shell has a real size, then mount Leaflet once.
  // Cleanup resets ready so React Strict Mode remounts don't hit a dead pane.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    let cancelled = false;
    let frame = 0;

    const tryReady = () => {
      if (cancelled) return;
      if (shell.clientWidth > 0 && shell.clientHeight > 0) {
        setReady(true);
        return;
      }
      frame = requestAnimationFrame(tryReady);
    };

    frame = requestAnimationFrame(tryReady);

    const ro = new ResizeObserver(() => {
      if (cancelled) return;
      if (shell.clientWidth > 0 && shell.clientHeight > 0) {
        setReady(true);
      }
    });
    ro.observe(shell);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      setReady(false);
    };
  }, []);

  const meters = installRadiusMeters(radiusMiles);

  return (
    <div
      ref={shellRef}
      className="relative h-64 w-full overflow-hidden bg-[#c8dff0] sm:h-72 lg:h-80 [&_.leaflet-control-attribution]:text-[9px] [&_.leaflet-control-zoom]:border-none [&_.leaflet-control-zoom_a]:rounded-md [&_.leaflet-control-zoom_a]:border-brand-primary/15"
    >
      {!ready ? (
        <MapLoading />
      ) : (
        <MapContainer
          key={`${mapId}-${radiusMiles}`}
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
          <FitServiceArea radiusMiles={radiusMiles} />
        </MapContainer>
      )}
      <p className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-md bg-bg-primary/92 px-2 py-1 text-[0.65rem] font-bold tracking-[0.08em] text-brand-primary uppercase">
        {radiusMiles} mi install radius · scroll to zoom
      </p>
    </div>
  );
}
