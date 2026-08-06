"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { Dealer } from "@/lib/cms/types";
import {
  QUICK_SEARCH,
  US_MAP_CENTER,
  US_MAP_ZOOM,
  directionsUrl,
  formatMiles,
  phoneHref,
  resolvePlaceLocal,
  resolveSearch,
  type DealerWithDistance,
  type GeoPoint,
} from "@/lib/cms/dealer-geo";
import { DealerCallModal } from "@/components/site/dealer-call-modal";

const DealerLeafletMap = dynamic(
  () =>
    import("@/components/site/dealer-leaflet-map").then(
      (m) => m.DealerLeafletMap,
    ),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#c8dff0]" />,
  },
);

function formatCityLine(dealer: Dealer) {
  const place = [dealer.city, dealer.region].filter(Boolean).join(", ");
  if (!dealer.postal) return place;
  return place ? `${place} ${dealer.postal}` : dealer.postal;
}

export function FindDealer({ dealers }: { dealers: Dealer[] }) {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [results, setResults] = useState<DealerWithDistance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [center, setCenter] = useState({
    lat: US_MAP_CENTER.lat,
    lng: US_MAP_CENTER.lng,
  });
  const [zoom, setZoom] = useState(US_MAP_ZOOM);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mapResetKey, setMapResetKey] = useState(0);
  const requestId = useRef(0);

  const hasResults = results.length > 0;
  const selected = selectedId
    ? (results.find((d) => d.id === selectedId) ?? null)
    : null;

  function selectDealer(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  function applyHit(
    place: GeoPoint,
    nextResults: DealerWithDistance[],
    displayQuery: string,
  ) {
    setQuery(displayQuery);
    setLabel(place.label);
    setCenter({ lat: place.lat, lng: place.lng });
    setZoom(place.zoom ?? 9);
    setResults(nextResults);
    setSelectedId(nextResults[0]?.id ?? null);
    setDetailOpen(nextResults.length > 0);
    setError(
      nextResults.length === 0
        ? "No dealers near that location yet."
        : null,
    );
  }

  function runPreset(place: (typeof QUICK_SEARCH)[number]) {
    const id = ++requestId.current;
    setPending(false);
    setError(null);
    const hit = resolvePlaceLocal(place.query, dealers) ?? {
      place: {
        lat: place.lat,
        lng: place.lng,
        label: place.label,
        zoom: place.zoom,
      },
      results: [],
    };
    if (id !== requestId.current) return;
    applyHit(hit.place, hit.results, place.label);
  }

  async function runSearch(raw: string) {
    const q = raw.trim();
    if (!q) return;

    void import("@/lib/analytics/track-client").then(
      ({ trackAnalyticsEvent }) => {
        void trackAnalyticsEvent("dealer_search", {
          label: q.slice(0, 80),
        });
      },
    );

    const id = ++requestId.current;
    setError(null);

    // Instant path first (dealers / known cities / states)
    const local = resolvePlaceLocal(q, dealers);
    if (local) {
      setPending(false);
      applyHit(local.place, local.results, q);
      return;
    }

    setPending(true);
    try {
      const hit = await resolveSearch(q, dealers);
      if (id !== requestId.current) return;
      if (!hit) {
        setError("No location found. Try a U.S. city or ZIP.");
        return;
      }
      applyHit(hit.place, hit.results, q);
    } finally {
      if (id === requestId.current) setPending(false);
    }
  }

  function clearSearch() {
    requestId.current += 1;
    setPending(false);
    setQuery("");
    setLabel("");
    setResults([]);
    setSelectedId(null);
    setDetailOpen(false);
    setCallOpen(false);
    setError(null);
    setCenter({ lat: US_MAP_CENTER.lat, lng: US_MAP_CENTER.lng });
    setZoom(US_MAP_ZOOM);
    setMapResetKey((k) => k + 1);
  }

  function onQueryChange(value: string) {
    setQuery(value);
    // Native search "x" or deleting all text → reset map + results
    if (!value.trim() && (results.length > 0 || label || error)) {
      clearSearch();
    }
  }

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] flex-col bg-bg-secondary lg:h-[calc(100dvh-6rem)] lg:flex-row">
      <h1 className="sr-only">Find a Koda Siding dealer</h1>
      {hasResults ? (
        <aside className="z-10 flex max-h-[42vh] w-full shrink-0 flex-col border-b border-[#d8d5cc] bg-[#fdfcf8] lg:max-h-none lg:w-88 lg:border-r lg:border-b-0">
          <div className="flex items-start justify-between gap-3 border-b border-[#d8d5cc] px-6 py-4">
            <div>
              <p className="text-[11px] tracking-[0.075em] text-[#8a8d86] uppercase">
                Results
              </p>
              <p className="pt-1 text-base leading-6 text-text-primary">
                <span className="font-extrabold">
                  {results.length} dealer{results.length === 1 ? "" : "s"}
                </span>
                {label ? (
                  <span className="font-normal text-[#6b6858]">
                    {" "}
                    near {label}
                  </span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSearch}
              className="shrink-0 pt-1 text-sm text-[#8a8d86] transition hover:text-text-primary"
            >
              Clear
            </button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {results.map((dealer) => {
              const active = dealer.id === selectedId;
              return (
                <li key={dealer.id} className="border-b border-[#d8d5cc]">
                  <button
                    type="button"
                    onClick={() => selectDealer(dealer.id)}
                    className={`flex w-full items-start justify-between gap-3 px-6 py-4 text-left transition ${
                      active
                        ? "bg-bg-primary"
                        : "bg-transparent hover:bg-bg-primary/50"
                    }`}
                  >
                    <span>
                      <span
                        className={`block text-base leading-5.5 font-extrabold ${
                          active ? "text-brand-primary" : "text-text-primary"
                        }`}
                      >
                        {dealer.name}
                      </span>
                      <span className="mt-1 block text-sm leading-[1.4] text-[#6b6858]">
                        {[dealer.city, dealer.region]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                    <span className="shrink-0 pt-0.5 text-sm text-[#8a8d86]">
                      {formatMiles(dealer.distanceMi)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      ) : null}

      <div className="relative min-h-80 flex-1 lg:min-h-0">
        <DealerLeafletMap
          results={results}
          selectedId={selectedId}
          onSelect={selectDealer}
          center={center}
          zoom={zoom}
          resetKey={mapResetKey}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4 pt-8 lg:pt-12">
          <form
            className="pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-md border border-[#d8d5cc] bg-[rgba(253,252,248,0.95)] p-1.75 shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.06)]"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch(query);
            }}
          >
            <span className="flex size-10 shrink-0 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/search.svg"
                alt=""
                width={18}
                height={18}
                className="size-4.5"
              />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search U.S. city or ZIP"
              aria-label="Search U.S. city or ZIP"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-text-primary outline-none placeholder:text-[#8a8d86]"
            />
            <button
              type="submit"
              disabled={pending || !query.trim()}
              className="shrink-0 rounded-md bg-brand-primary px-8 py-3 font-display text-sm tracking-[0.04em] text-text-inverse uppercase transition hover:bg-brand-primary-active disabled:opacity-50"
            >
              {pending ? "…" : "Search"}
            </button>
          </form>
        </div>

        {error && !hasResults ? (
          <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex justify-center px-4">
            <p className="rounded-md border border-[#d8d5cc] bg-[rgba(253,252,248,0.95)] px-4 py-2 text-sm text-[#6b6858] shadow-sm">
              {error}
            </p>
          </div>
        ) : null}

        {!hasResults ? (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-[rgba(88,116,106,0.25)] backdrop-blur-[2px]">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-8">
              <p className="text-base leading-none font-medium text-text-primary">
                Quick Search
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {QUICK_SEARCH.map((place) => (
                  <button
                    key={place.label}
                    type="button"
                    onClick={() => runPreset(place)}
                    className="rounded-full border border-[#d8d5cc] bg-[rgba(253,252,248,0.95)] px-4 py-2 text-sm text-text-primary backdrop-blur-[2px] transition hover:border-brand-primary/30 hover:bg-bg-primary"
                  >
                    {place.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {hasResults && detailOpen && selected ? (
          <div className="absolute right-4 bottom-8 left-4 z-20 mx-auto max-w-sm lg:right-8 lg:left-auto lg:mx-0">
            <div className="border border-[#d8d5cc] bg-[rgba(253,252,248,0.95)] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {selected.region ? (
                    <p className="text-[11px] tracking-[0.075em] text-[#4a9a72] uppercase">
                      {selected.region}
                    </p>
                  ) : null}
                  <p className="pt-1 text-lg leading-4.5 font-extrabold text-text-primary">
                    {selected.name}
                  </p>
                  <div className="pt-2 text-sm leading-[1.4] text-[#6b6858]">
                    {selected.address ? <p>{selected.address}</p> : null}
                    <p>{formatCityLine(selected)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close details"
                  onClick={() => setDetailOpen(false)}
                  className="px-1 text-base leading-4 text-[#8a8d86] transition hover:text-text-primary"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2 pt-4">
                {phoneHref(selected.phone) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCallOpen(true);
                      void import("@/lib/analytics/track-client").then(
                        ({ trackAnalyticsEvent }) => {
                          void trackAnalyticsEvent("dealer_call", {
                            label: "Call dealer",
                          });
                        },
                      );
                    }}
                    className="inline-flex h-11.5 items-center justify-center rounded-md bg-brand-primary px-8 font-display text-sm tracking-[0.04em] text-text-inverse uppercase transition hover:bg-brand-primary-active"
                  >
                    Call
                  </button>
                ) : null}
                <a
                  href={directionsUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11.5 items-center justify-center rounded-md border border-border-strong bg-bg-primary px-8 font-display text-sm tracking-[0.04em] text-brand-primary uppercase transition hover:bg-bg-secondary"
                >
                  Directions
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {callOpen && selected && phoneHref(selected.phone) ? (
        <DealerCallModal
          dealerName={selected.name}
          phone={selected.phone}
          onClose={() => setCallOpen(false)}
        />
      ) : null}
    </div>
  );
}
