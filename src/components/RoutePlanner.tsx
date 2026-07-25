"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Keyless route planner.
 * - Geolocation: browser native.
 * - Geocoding: OpenStreetMap Nominatim (no key).
 * - Route line + distance + free-flow time: OSRM public server (no key).
 * - Live traffic + turn-by-turn: handed off to Google Maps via a deep link.
 * All network calls run in the visitor's browser, so the app server stays
 * self-contained.
 */

type Point = { lat: number; lon: number; label: string };
type Suggestion = { lat: number; lon: number; label: string };

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OSRM = "https://router.project-osrm.org";

// Popular Bangladesh ride destinations — quick-fill chips.
const PRESETS = ["Cox's Bazar", "Sajek Valley", "Sylhet", "Bandarban", "Kuakata", "Sreemangal"];

// Rough running-cost estimate (BDT). Assumes a typical commuter mileage and a
// reference fuel price; clearly a ballpark, shown as "~".
const KMPL = 45; // typical claimed mileage for a BD commuter
const FUEL_BDT_PER_L = 121; // reference octane price (BDT/litre)

// Minutes → "Xh Ym" / "Ym".
function fmtDuration(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/**
 * Text input with live place autocomplete (Nominatim, debounced). Picking a
 * suggestion hands back a resolved Point so no extra geocode is needed.
 */
function PlaceInput({
  value,
  resolved,
  onChange,
  onPick,
  placeholder,
  disabled,
  right,
}: {
  value: string;
  resolved: boolean; // true when `value` already corresponds to a chosen point
  onChange: (v: string) => void; // typed text changed (clears any resolved point)
  onPick: (p: Point) => void; // a suggestion was chosen
  placeholder: string;
  disabled?: boolean;
  right?: React.ReactNode; // optional trailing button (e.g. "use my location")
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0); // guards against out-of-order responses
  const boxRef = useRef<HTMLDivElement>(null);
  const justPicked = useRef(false);

  // Debounced fetch on typed value.
  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = value.trim();
    if (debounce.current) clearTimeout(debounce.current);
    // Already a resolved place (picked, my-location, surprise) → no suggestions.
    if (resolved || q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      const id = ++seq.current;
      setLoading(true);
      try {
        const res = await fetch(
          `${NOMINATIM}/search?format=json&addressdetails=0&limit=6&countrycodes=bd&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } }
        );
        const data = await res.json();
        if (id !== seq.current) return; // a newer query superseded this one
        const list: Suggestion[] = Array.isArray(data)
          ? data.map((d: any) => ({ lat: parseFloat(d.lat), lon: parseFloat(d.lon), label: d.display_name }))
          : [];
        setSuggestions(list);
        setActive(-1);
        setOpen(list.length > 0);
      } catch {
        if (id === seq.current) setSuggestions([]);
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 280);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [value, resolved]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (s: Suggestion) => {
    justPicked.current = true; // suppress the next debounced fetch
    onChange(s.label);
    onPick({ lat: s.lat, lon: s.lon, label: s.label });
    setOpen(false);
    setSuggestions([]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => suggestions.length && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-sm border border-ink-400 bg-ink-50 px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-graphite-900 focus:outline-none"
          />
          {loading && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-graphite-400">
              …
            </span>
          )}
        </div>
        {right}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-sm border border-ink-400 bg-ink-50 py-1 shadow-float">
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lon}-${i}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(s)}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-xs ${
                  i === active ? "bg-azure/30 text-graphite-900" : "text-graphite-700 hover:bg-ink-200"
                }`}
                disabled={disabled}
              >
                <span className="mt-0.5 text-graphite-400">📍</span>
                <span className="line-clamp-2">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Destination formula — random point at distance d (km) and bearing brng (deg).
function destinationPoint(lat: number, lon: number, distKm: number, brngDeg: number): { lat: number; lon: number } {
  const R = 6371;
  const brng = (brngDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;
  const δ = distKm / R;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(brng));
  const λ2 =
    λ1 + Math.atan2(Math.sin(brng) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: (φ2 * 180) / Math.PI, lon: (((λ2 * 180) / Math.PI + 540) % 360) - 180 };
}

function ensureLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.L) return resolve(w.L);
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(w.L));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.id = "leaflet-js";
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve(w.L);
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

export function RoutePlanner() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null); // start/dest pins
  const routeLayerRef = useRef<any>(null); // route polyline
  const LRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [start, setStart] = useState<Point | null>(null);
  const [dest, setDest] = useState<Point | null>(null);
  const [startText, setStartText] = useState("");
  const [destText, setDestText] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [radiusKm, setRadiusKm] = useState(25);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  // Init map once Leaflet is loaded.
  useEffect(() => {
    let cancelled = false;
    ensureLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        LRef.current = L;
        const map = L.map(mapEl.current, { zoomControl: true, scrollWheelZoom: false }).setView([23.78, 90.4], 11);
        // CARTO "Positron" — clean, light, minimal basemap (keyless). Retina @2x
        // tiles for crispness. Matches the site's light theme.
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 20,
          subdomains: "abcd",
          detectRetina: true,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }).addTo(map);
        // Route under markers, so pins always sit on top of the line.
        routeLayerRef.current = L.layerGroup().addTo(map);
        markerLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setMapReady(true);
      })
      .catch(() => setError("Couldn’t load the map. Check your connection and try again."));
    return () => {
      cancelled = true;
    };
  }, []);

  // Live: as soon as a start/destination is set (typed-pick, my-location, or
  // surprise), drop the pin and smoothly frame the map — no "Plan route" needed.
  useEffect(() => {
    if (!mapReady) return;
    renderMarkers(start, dest);
    // A new point invalidates any previously drawn route line.
    routeLayerRef.current?.clearLayers();
    frame(start, dest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, dest, mapReady]);

  const geocode = async (q: string): Promise<Point | null> => {
    const res = await fetch(`${NOMINATIM}/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label: data[0].display_name };
  };

  const reverse = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(`${NOMINATIM}/reverse?format=json&zoom=14&lat=${lat}&lon=${lon}`, {
        headers: { Accept: "application/json" },
      });
      const d = await res.json();
      return d.display_name || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    } catch {
      return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    }
  };

  const useMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation isn’t available in this browser.");
      return;
    }
    setLoading("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const label = await reverse(latitude, longitude);
        setStart({ lat: latitude, lon: longitude, label });
        setStartText(label);
        setLoading(null);
      },
      () => {
        setLoading(null);
        setError("Couldn’t get your location. Type a starting point instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Quick-fill the destination from a preset name (geocoded).
  const pickPreset = async (name: string) => {
    setError(null);
    setLoading("planning");
    try {
      const p = await geocode(`${name}, Bangladesh`);
      if (!p) {
        setError(`Couldn’t find ${name}. Try typing it.`);
        return;
      }
      setDest(p);
      setDestText(p.label);
      if (start) await planRoute(p);
    } finally {
      setLoading(null);
    }
  };

  const resolveStart = async (): Promise<Point | null> => {
    if (start) return start;
    if (startText.trim()) {
      const p = await geocode(startText.trim());
      if (p) setStart(p);
      return p;
    }
    return null;
  };

  // Build & draw a route. dest is provided (surprise) or resolved from text.
  const planRoute = async (override?: Point) => {
    setError(null);
    setSummary(null);
    setLoading("planning");
    try {
      const s = await resolveStart();
      if (!s) {
        setError("Set a starting point first (use my location or type one).");
        setLoading(null);
        return;
      }
      let d = override ?? dest;
      if (!override && destText.trim() && (!dest || dest.label !== destText.trim())) {
        d = await geocode(destText.trim());
        if (d) setDest(d);
      }
      if (!d) {
        setError("Enter a destination, or hit “Surprise me”.");
        setLoading(null);
        return;
      }

      const pts = roundTrip ? [s, d, s] : [s, d];
      const path = pts.map((p) => `${p.lon},${p.lat}`).join(";");
      let url = `${OSRM}/route/v1/driving/${path}?overview=full&geometries=geojson`;
      if (avoidHighways) url += "&exclude=motorway";

      let route: any = null;
      try {
        const res = await fetch(url);
        const data = await res.json();
        route = data?.routes?.[0] ?? null;
      } catch {
        route = null;
      }
      // Retry without the motorway exclusion if OSRM rejected it.
      if (!route && avoidHighways) {
        const res = await fetch(`${OSRM}/route/v1/driving/${path}?overview=full&geometries=geojson`);
        const data = await res.json();
        route = data?.routes?.[0] ?? null;
      }

      drawRoute(s, d, route);
      if (route) {
        setSummary({ distanceKm: route.distance / 1000, durationMin: route.duration / 60 });
      } else {
        setError("Couldn’t draw the road route, but you can still open it in Google Maps below.");
      }
    } finally {
      setLoading(null);
    }
  };

  // A labelled teardrop pin as an HTML DivIcon.
  const pinIcon = (kind: "start" | "dest", text: string) => {
    const L = LRef.current;
    const fill = kind === "start" ? "#111112" : "#2f8fe6";
    return L.divIcon({
      className: "",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      html: `
        <div class="moto-pin">
          <span class="moto-pin-tag">${text}</span>
          <span class="moto-pin-dot" style="background:${fill}"></span>
        </div>`,
    });
  };

  // Redraw the start/dest markers from current state (no route involved).
  const renderMarkers = (s: Point | null, d: Point | null) => {
    const L = LRef.current;
    const layer = markerLayerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    if (s) layer.addLayer(L.marker([s.lat, s.lon], { icon: pinIcon("start", "Start") }));
    if (d) layer.addLayer(L.marker([d.lat, d.lon], { icon: pinIcon("dest", "Destination") }));
  };

  // Smoothly frame the map to whatever points exist.
  const frame = (s: Point | null, d: Point | null) => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (s && d) {
      map.flyToBounds(L.latLngBounds([s.lat, s.lon], [d.lat, d.lon]).pad(0.35), {
        duration: 0.9,
        easeLinearity: 0.25,
      });
    } else if (s || d) {
      const p = (s ?? d)!;
      map.flyTo([p.lat, p.lon], 13, { duration: 0.9 });
    }
  };

  const drawRoute = (s: Point, d: Point, route: any) => {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    if (route?.geometry?.coordinates) {
      const latlngs = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      // Layered stroke: soft white casing under a solid azure route line.
      layer.addLayer(L.polyline(latlngs, { color: "#ffffff", weight: 9, opacity: 0.9, lineJoin: "round", lineCap: "round" }));
      const line = L.polyline(latlngs, { color: "#2f8fe6", weight: 5, opacity: 1, lineJoin: "round", lineCap: "round" });
      layer.addLayer(line);
      renderMarkers(s, d);
      map.flyToBounds(line.getBounds().pad(0.18), { duration: 0.9, easeLinearity: 0.25 });
    } else {
      layer.addLayer(
        L.polyline([[s.lat, s.lon], [d.lat, d.lon]], { color: "#9a9b90", weight: 3, dashArray: "4 8", lineCap: "round" })
      );
      renderMarkers(s, d);
      map.flyToBounds(L.latLngBounds([s.lat, s.lon], [d.lat, d.lon]).pad(0.3), { duration: 0.9 });
    }
  };

  const surprise = async () => {
    setError(null);
    setLoading("surprising");
    try {
      const s = await resolveStart();
      if (!s) {
        setError("Set a starting point first, then I’ll find you a ride.");
        setLoading(null);
        return;
      }
      // Random bearing, distance 55–100% of the chosen radius.
      const brng = Math.random() * 360;
      const dist = radiusKm * (0.55 + Math.random() * 0.45);
      const { lat, lon } = destinationPoint(s.lat, s.lon, dist, brng);
      const label = await reverse(lat, lon);
      const d: Point = { lat, lon, label };
      setDest(d);
      setDestText(label);
      await planRoute(d);
    } finally {
      setLoading(null);
    }
  };

  const gmapsUrl = () => {
    if (!start || !dest) return null;
    const o = `${start.lat},${start.lon}`;
    const dd = `${dest.lat},${dest.lon}`;
    const params = new URLSearchParams({ api: "1", travelmode: "driving" });
    if (roundTrip) {
      params.set("origin", o);
      params.set("destination", o);
      params.set("waypoints", dd);
    } else {
      params.set("origin", o);
      params.set("destination", dd);
    }
    if (avoidHighways) params.set("avoid", "highways");
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  };

  const url = gmapsUrl();
  const busy = loading !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Controls */}
      <div className="card p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-graphite-900">Plan a ride</h2>

        {/* Start */}
        <label className="mt-4 block text-xs font-semibold text-graphite-500">Starting point</label>
        <div className="mt-1.5">
          <PlaceInput
            value={startText}
            resolved={start != null}
            onChange={(v) => {
              setStartText(v);
              setStart(null);
            }}
            onPick={(p) => setStart(p)}
            placeholder="Use my location or type a place"
            disabled={busy}
            right={
              <button
                onClick={useMyLocation}
                disabled={busy}
                title="Use my location"
                className="shrink-0 rounded-sm border border-ink-400 bg-ink-50 px-3 text-lg hover:bg-ink-200 disabled:opacity-50"
              >
                📍
              </button>
            }
          />
        </div>

        {/* Destination */}
        <label className="mt-4 block text-xs font-semibold text-graphite-500">Destination</label>
        <div className="mt-1.5">
          <PlaceInput
            value={destText}
            resolved={dest != null}
            onChange={(v) => {
              setDestText(v);
              setDest(null);
            }}
            onPick={(p) => setDest(p)}
            placeholder="Where to? (or hit Surprise me)"
            disabled={busy}
          />
        </div>

        {/* Popular ride presets */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((name) => (
            <button
              key={name}
              onClick={() => pickPreset(name)}
              disabled={busy}
              className="rounded-pill border border-ink-400 bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-graphite-700 transition-colors hover:border-graphite-900 hover:bg-ink-200 disabled:opacity-50"
            >
              {name}
            </button>
          ))}
        </div>

        {/* Surprise radius */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-graphite-500">
            <span>Surprise distance</span>
            <span className="text-graphite-900">~{radiusKm} km away</span>
          </div>
          <input
            type="range"
            min={5}
            max={150}
            step={5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>

        {/* Toggles */}
        <div className="mt-4 space-y-2">
          <button
            onClick={() => setRoundTrip((v) => !v)}
            className="flex w-full items-center justify-between rounded-sm border border-ink-400 bg-ink-50 px-3 py-2.5 text-sm font-semibold text-graphite-800"
          >
            <span>Return home same day</span>
            <span className={`relative h-5 w-9 rounded-full transition-colors ${roundTrip ? "bg-azure" : "bg-ink-500"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-graphite-900 transition-all ${roundTrip ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </button>
          <button
            onClick={() => setAvoidHighways((v) => !v)}
            className="flex w-full items-center justify-between rounded-sm border border-ink-400 bg-ink-50 px-3 py-2.5 text-sm font-semibold text-graphite-800"
          >
            <span>Avoid highways</span>
            <span className={`relative h-5 w-9 rounded-full transition-colors ${avoidHighways ? "bg-azure" : "bg-ink-500"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-graphite-900 transition-all ${avoidHighways ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => planRoute()} disabled={busy} className="btn-dark disabled:opacity-50">
            {loading === "planning" ? "Planning…" : "Plan route"}
          </button>
          <button onClick={surprise} disabled={busy} className="btn-accent disabled:opacity-50">
            {loading === "surprising" ? "Rolling…" : "🎲 Surprise me"}
          </button>
        </div>

        {error && <p className="mt-3 rounded-sm bg-azure px-3 py-2 text-xs text-graphite-900">{error}</p>}

        {/* Summary + handoff */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 overflow-hidden rounded-md border border-ink-400 bg-ink-50"
          >
            <div className="grid grid-cols-3 divide-x divide-ink-400 border-b border-ink-400">
              <div className="p-3 text-center">
                <p className="text-lg font-extrabold text-graphite-900">{summary.distanceKm.toFixed(0)}</p>
                <p className="text-[10px] uppercase tracking-wider text-graphite-500">km{roundTrip ? " (rt)" : ""}</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-lg font-extrabold text-graphite-900">{fmtDuration(summary.durationMin)}</p>
                <p className="text-[10px] uppercase tracking-wider text-graphite-500">ride time</p>
              </div>
              <div className="bg-azure/30 p-3 text-center">
                <p className="text-lg font-extrabold text-graphite-900">
                  ৳{Math.round((summary.distanceKm / KMPL) * FUEL_BDT_PER_L)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-graphite-600">~fuel</p>
              </div>
            </div>
            <p className="px-3 py-2 text-[11px] text-graphite-400">
              Free-flow estimate. Fuel assumes ~{KMPL} km/l @ ৳{FUEL_BDT_PER_L}/L — live traffic & exact
              cost vary. Open in Google Maps for turn-by-turn.
            </p>
          </motion.div>
        )}

        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn-accent mt-3 w-full">
            Open in Google Maps ↗
          </a>
        )}
      </div>

      {/* Map */}
      <div className="card overflow-hidden">
        <div ref={mapEl} className="moto-map h-[420px] w-full lg:h-[560px]" />
        {!mapReady && !error && (
          <p className="p-3 text-center text-xs text-graphite-400">Loading map…</p>
        )}
        <p className="border-t border-ink-400 px-3 py-2 text-[11px] text-graphite-400">
          Map data © OpenStreetMap contributors · routing by OSRM · navigation by Google Maps.
        </p>
      </div>
    </div>
  );
}
