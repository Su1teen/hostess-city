"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapboxMap, Marker } from "mapbox-gl";
import { CAMERA_STOPS, CITY_ROUTES, VENUES, cameraAt, partialLine } from "../lib/city";
import "mapbox-gl/dist/mapbox-gl.css";
import "./city-map.css";

type Props = {
  progress: number;
  activeChapter: number;
  selectedVenue: string;
  onVenueSelect: (id: string) => void;
  motionPaused?: boolean;
};
type MapStatus = "loading" | "ready" | "offline";
type LineCollection = {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: Record<string, number>; geometry: { type: "LineString"; coordinates: number[][] } }[];
};

function selectionOffset(progress: number, selectedVenue: string): [number, number] {
  const selected = VENUES.find(venue => venue.id === selectedVenue) || VENUES[0];
  const smooth = (from: number, to: number) => {
    const t = Math.max(0, Math.min(1, (progress - from) / (to - from)));
    return t * t * (3 - 2 * t);
  };
  const influence = progress < 1 ? smooth(.4, 1) * .72 : progress < 2 ? .72 + smooth(1, 2) * .28 : 1 - smooth(2, 3);
  return [(selected.coordinates[0] - VENUES[0].coordinates[0]) * influence, (selected.coordinates[1] - VENUES[0].coordinates[1]) * influence];
}

function routeData(progress: number): LineCollection {
  const reveal = Math.max(0, Math.min(1, (progress - .35) / 1.65));
  return {
    type: "FeatureCollection",
    features: CITY_ROUTES.map((points, i) => ({
      type: "Feature", properties: { index: i },
      geometry: { type: "LineString", coordinates: partialLine(points, Math.max(0, Math.min(1, reveal * 4 - i * .72))) },
    })),
  };
}

function networkData(reveal = 1): LineCollection {
  const pairs = [[0, 1], [0, 3], [1, 4], [2, 3], [2, 4], [3, 4]];
  return {
    type: "FeatureCollection", features: pairs.map(([a, b]) => {
      const from = VENUES[a].coordinates, to = VENUES[b].coordinates;
      const arc: [number, number][] = Array.from({ length: 32 }, (_, i) => {
          const t = i / 31;
          return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * .0018];
        });
      return { type: "Feature", properties: {}, geometry: {
        type: "LineString", coordinates: partialLine(arc, reveal),
      } };
    }),
  };
}

const DISTRICT: { type: "Feature"; properties: Record<string, never>; geometry: { type: "Polygon"; coordinates: number[][][] } } = {
  type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[
    [-74.0024, 40.7254], [-73.9964, 40.7281], [-73.9924, 40.7233], [-73.9987, 40.7204], [-74.0024, 40.7254],
  ]] },
};

function installCityLayers(map: MapboxMap, mobile: boolean) {
  const style = map.getStyle();
  for (const layer of style.layers || []) {
    const id = layer.id;
    if (layer.type === "symbol") {
      if (/poi|transit|road-label|road-number|water-point|airport|state-label|country-label/.test(id)) {
        map.setLayoutProperty(id, "visibility", "none");
      } else {
        map.setPaintProperty(id, "text-color", "#7d8c9b");
        map.setPaintProperty(id, "text-halo-color", "#0c131d");
        map.setPaintProperty(id, "text-halo-width", 1.3);
        map.setPaintProperty(id, "text-opacity", .55);
      }
    }
    if (layer.type === "background") map.setPaintProperty(id, "background-color", "#101923");
    if (layer.type === "fill") {
      if (/water/.test(id)) map.setPaintProperty(id, "fill-color", "#08111d");
      else if (/building/.test(id)) map.setPaintProperty(id, "fill-color", "#202d38");
      else if (/landuse|landcover|park/.test(id)) map.setPaintProperty(id, "fill-color", "#12202a");
    }
    if (layer.type === "line" && /road/.test(id)) {
      map.setPaintProperty(id, "line-color", /case/.test(id) ? "#111b27" : "#8c7354");
      map.setPaintProperty(id, "line-opacity", /case/.test(id) ? .9 : .48);
    }
  }
  map.setLight({ anchor: "viewport", color: "#cfdfed", intensity: .6, position: [1.5, 135, 48] });
  const firstLabel = (style.layers || []).find(layer => layer.type === "symbol")?.id;
  if (map.getSource("composite")) {
    map.addLayer({
      id: "hostess-buildings", source: "composite", "source-layer": "building", type: "fill-extrusion", minzoom: mobile ? 14 : 13.5,
      filter: ["!=", ["get", "underground"], "true"],
      paint: {
        "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "height"], 12], 0, "#2a3743", 40, "#35424f", 130, "#455362", 250, "#536477"],
        "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13.5, 0, 14.3, ["*", ["max", 12, ["coalesce", ["get", "height"], 12]], mobile ? 1 : 1.2]],
        "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0], "fill-extrusion-opacity": .98, "fill-extrusion-vertical-gradient": true,
      },
    }, firstLabel);
  }
  map.addSource("hostess-district", { type: "geojson", data: DISTRICT });
  map.addLayer({ id: "hostess-district-fill", type: "fill", source: "hostess-district", paint: { "fill-color": "#c69b62", "fill-opacity": .028 } }, map.getLayer("hostess-buildings") ? "hostess-buildings" : firstLabel);
  map.addLayer({ id: "hostess-district-edge", type: "line", source: "hostess-district", paint: { "line-color": "#dcb17d", "line-opacity": .18, "line-width": .8, "line-dasharray": [2, 4] } });
  map.addSource("hostess-routes", { type: "geojson", data: routeData(0), lineMetrics: true });
  map.addLayer({ id: "hostess-routes-glow", type: "line", source: "hostess-routes", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#f4b660", "line-width": mobile ? 7 : 13, "line-opacity": .23, "line-blur": 5 } });
  map.addLayer({ id: "hostess-routes-light", type: "line", source: "hostess-routes", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#ffd395", .8, "#ddb074", 1, "#fff2d6"], "line-width": mobile ? 1.5 : 2.2, "line-opacity": .9 } });
  map.addSource("hostess-network", { type: "geojson", data: networkData(0), lineMetrics: true });
  map.addLayer({ id: "hostess-network-glow", type: "line", source: "hostess-network", layout: { "line-cap": "round" }, paint: { "line-color": "#729bef", "line-width": 7, "line-blur": 3, "line-opacity": 0, "line-occlusion-opacity": .55 } });
  map.addLayer({ id: "hostess-network-light", type: "line", source: "hostess-network", layout: { "line-cap": "round" }, paint: { "line-color": "#9dbfff", "line-width": 1.6, "line-dasharray": [3, 3], "line-opacity": 0, "line-occlusion-opacity": .7, "line-emissive-strength": .85 } });
}

function markerElement(venue: typeof VENUES[number], select: (id: string) => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "city-venue-marker";
  button.setAttribute("aria-label", `Explore ${venue.name}, ${venue.category}`);
  button.dataset.venue = venue.id;
  const dot = document.createElement("span"); dot.className = "city-venue-marker__dot";
  const stem = document.createElement("span"); stem.className = "city-venue-marker__stem";
  const label = document.createElement("span"); label.className = "city-venue-marker__label";
  const name = document.createElement("b"); name.textContent = venue.name;
  const category = document.createElement("small"); category.textContent = venue.category;
  label.append(name, category); button.append(dot, stem, label);
  button.addEventListener("click", () => select(venue.id));
  return button;
}

// Deliberately drawn geometry provides an immediate city silhouette and an offline experience.
const CITY_BLOCKS = Array.from({ length: 24 * 17 }, (_, index) => {
  const c = index % 24, r = Math.floor(index / 24);
  const hash = ((c * 73856093) ^ (r * 19349663)) >>> 0;
  const height = 15 + hash % 47 + (c > 7 && c < 16 && r > 5 && r < 13 ? hash % 93 : 0);
  const x = 930 + (c - r) * 35, y = 160 + (c + r) * 18;
  return { x, y, height, c, r, tone: hash % 3, lit: hash % 7 === 0 };
}).sort((a, b) => a.y - b.y);

const CityDrawing = memo(function CityDrawing() {
  return <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="city-ground" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#17242f"/><stop offset="1" stopColor="#0b1520"/></linearGradient>
      <linearGradient id="city-side" x1="0" x2="1"><stop stopColor="#172330"/><stop offset="1" stopColor="#273847"/></linearGradient>
      <linearGradient id="city-side-lit" x1="0" x2="1"><stop stopColor="#26333e"/><stop offset="1" stopColor="#425261"/></linearGradient>
      <filter id="city-glow"><feGaussianBlur stdDeviation="5"/></filter>
      <radialGradient id="city-ambience"><stop stopColor="#6190af" stopOpacity=".10"/><stop offset="1" stopColor="#6190af" stopOpacity="0"/></radialGradient>
    </defs>
    <path d="M930 106 1874 592 1140 990 186 470Z" fill="url(#city-ground)" stroke="#31404b" strokeWidth="1"/>
    <ellipse cx="1030" cy="430" rx="580" ry="420" fill="url(#city-ambience)"/>
    <g stroke="#ba925e" strokeWidth="1" opacity=".35">
      {Array.from({ length: 26 }, (_, i) => <path key={`a${i}`} d={`M${925 + i * 35} ${139 + i * 18}l-615 318`}/>)}
      {Array.from({ length: 19 }, (_, i) => <path key={`b${i}`} d={`M${925 - i * 35} ${139 + i * 18}l860 442`}/>)}
    </g>
    <path d="m649 411 255 128 204-108 146 75 135-70" fill="none" stroke="#eeb366" strokeWidth="10" opacity=".24" filter="url(#city-glow)"/>
    <path d="m649 411 255 128 204-108 146 75 135-70" fill="none" stroke="#e5b67a" strokeWidth="2" opacity=".75"/>
    <g>{CITY_BLOCKS.map(({ x, y, height: h, c, r, tone, lit }, i) => <g key={i} opacity={c < 3 || r < 2 ? .65 : 1}>
      <path d={`M${x},${y}l25,13 0,${-h} -25,-13Z`} fill={lit ? "url(#city-side-lit)" : "url(#city-side)"}/>
      <path d={`M${x + 25},${y + 13}l22,-12 0,${-h} -22,12Z`} fill={tone === 0 ? "#202e3d" : "#182532"}/>
      <path d={`M${x},${y - h}l25,13 22,-12 -25,-13Z`} fill={["#3c4b59", "#455360", "#303e4b"][tone]} stroke="#65717b" strokeOpacity=".24" strokeWidth=".6"/>
      {Array.from({ length: Math.floor(h / 14) }, (_, floor) => <path key={floor} d={`M${x + 4},${y - floor * 14 - 6}l15,8m12,1 12,-6`} stroke={lit ? "#d3ac73" : "#65788a"} strokeWidth="1" opacity={lit ? .52 : .2}/>) }
    </g>)}</g>
    <g fill="#d5aa73" opacity=".55" fontFamily="monospace" fontSize="11" letterSpacing="5"><text x="907" y="687" transform="rotate(-28 907 687)">SOHO</text><text x="1157" y="359" transform="rotate(28 1157 359)">NOLITA</text><text x="558" y="539" transform="rotate(-28 558 539)">TRIBECA</text></g>
    <path d="M710 254q365-120 667 265M551 397q489-18 578 334" fill="none" stroke="#7ca4e1" strokeWidth="1" opacity=".26" strokeDasharray="3 7"/>
  </svg>;
});

const FALLBACK_POINTS = [{ x: 64, y: 46 }, { x: 84, y: 56 }, { x: 73, y: 36 }, { x: 54, y: 65 }, { x: 86, y: 31 }];

export default function CityMap({ progress, activeChapter, selectedVenue, onVenueSelect, motionPaused = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const latestRef = useRef({ progress, activeChapter, selectedVenue, onVenueSelect, motionPaused });
  const [status, setStatus] = useState<MapStatus>("loading");
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    latestRef.current = { progress, activeChapter, selectedVenue, onVenueSelect, motionPaused };
  }, [progress, activeChapter, selectedVenue, onVenueSelect, motionPaused]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let disposed = false, frame = 0, timeout = 0, failures = 0;
    let currentProgress = latestRef.current.progress, lastTime = 0, lastRouteStep = -1, lastNetwork = -1;
    let currentFocus: [number, number] = [0, 0];
    let lastWidth = 0, lastHeight = 0;
    const mobile = window.innerWidth < 768;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const illustratedPreview = new URLSearchParams(window.location.search).get('city') === 'illustrated';
    const updateMarkers = () => markersRef.current.forEach(marker => {
      const el = marker.getElement();
      el.dataset.selected = String(el.dataset.venue === latestRef.current.selectedVenue);
      el.dataset.network = String(latestRef.current.progress > 3.4 && latestRef.current.progress < 5.3);
      el.setAttribute('aria-pressed', el.dataset.selected);
      el.setAttribute('role', 'button');
    });
    const initialise = async () => {
      if (!token || !containerRef.current || illustratedPreview) { setStatus("offline"); return; }
      try {
        const mapbox = (await import("mapbox-gl")).default;
        if (disposed) return;
        if (!mapbox.supported()) { setStatus("offline"); return; }
        const initial = cameraAt(currentProgress);
        const map = new mapbox.Map({
          container: containerRef.current!, accessToken: token, style: "mapbox://styles/mapbox/dark-v11",
          center: initial.center, zoom: initial.zoom - (mobile ? .45 : 0), pitch: mobile ? 50 : initial.pitch,
          bearing: initial.bearing, interactive: false, attributionControl: false, antialias: !mobile,
          maxTileCacheSize: mobile ? 70 : 160, fadeDuration: 0, logoPosition: "bottom-left",
          renderWorldCopies: false, localFontFamily: "Arial", collectResourceTiming: false,
        });
        mapRef.current = map;
        map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");
        timeout = window.setTimeout(() => { if (!disposed && !map.isStyleLoaded()) setStatus("offline"); }, 15000);
        map.on("error", event => {
          failures++;
          const message = event.error?.message || "";
          if (!disposed && (/401|403|access token|Unauthorized|Forbidden/i.test(message) || failures > 5)) setStatus("offline");
        });
        const canvas = map.getCanvas();
        canvas.setAttribute("aria-label", "Cinematic 3D map of Manhattan; illustrative Hostess venues");
        canvas.setAttribute("role", "img");
        const lost = (event: Event) => { event.preventDefault(); if (!disposed) setStatus("offline"); };
        const restored = () => { if (!disposed) setStatus("ready"); };
        canvas.addEventListener("webglcontextlost", lost);
        canvas.addEventListener("webglcontextrestored", restored);
        map.once("load", () => {
          if (disposed) return;
          clearTimeout(timeout); failures = 0;
          try { installCityLayers(map, mobile); }
          catch { setStatus("offline"); return; }
          markersRef.current = VENUES.map(venue => new mapbox.Marker({
            element: markerElement(venue, id => latestRef.current.onVenueSelect(id)), anchor: "center",
            pitchAlignment: "viewport", rotationAlignment: "viewport", occludedOpacity: .5,
          }).setLngLat(venue.coordinates).addTo(map));
          updateMarkers(); setStatus("ready");
          const animate = (time: number) => {
            if (disposed) return;
            frame = window.requestAnimationFrame(animate);
            const width = containerRef.current?.clientWidth || window.innerWidth;
            const height = containerRef.current?.clientHeight || window.innerHeight;
            const isMobile = width < 768;
            if (document.visibilityState === "hidden" || time - lastTime < (isMobile ? 42 : 30)) return;
            lastTime = time;
            const latest = latestRef.current;
            const motionReduced = motionQuery.matches || latest.motionPaused;
            const target = motionReduced ? latest.activeChapter : latest.progress;
            const previous = currentProgress;
            currentProgress = motionReduced ? target : previous + (target - previous) * .16;
            const targetFocus = selectionOffset(currentProgress, latest.selectedVenue);
            const focusMoving = Math.abs(targetFocus[0] - currentFocus[0]) + Math.abs(targetFocus[1] - currentFocus[1]) > .000001;
            currentFocus = motionReduced ? targetFocus : [currentFocus[0] + (targetFocus[0] - currentFocus[0]) * .12, currentFocus[1] + (targetFocus[1] - currentFocus[1]) * .12];
            const idleHero = !motionReduced && currentProgress < .38;
            const resized = width !== lastWidth || height !== lastHeight;
            lastWidth = width; lastHeight = height;
            if (Math.abs(previous - currentProgress) > .0001 || focusMoving || idleHero || resized || lastRouteStep < 0) {
              const camera = cameraAt(currentProgress);
              const drift = idleHero ? Math.sin(time / 12500) * .00012 : 0;
              const side = width * Math.abs(camera.bias);
              map.jumpTo({
                center: [camera.center[0] + currentFocus[0] + drift, camera.center[1] + currentFocus[1]], zoom: camera.zoom - (isMobile ? .55 : 0),
                bearing: camera.bearing + (idleHero ? Math.sin(time / 18000) * 1.5 : 0),
                pitch: isMobile ? Math.min(52, camera.pitch) : camera.pitch,
                padding: isMobile ? { top: 0, bottom: Math.round(height * .23), left: 0, right: 0 }
                  : { top: 0, bottom: 0, left: camera.bias > 0 ? Math.round(side) : 0, right: camera.bias < 0 ? Math.round(side) : 0 },
                retainPadding: false,
              });
              if (containerRef.current) {
                const center = map.getCenter();
                Object.assign(containerRef.current.dataset, {
                  cameraLongitude: center.lng.toFixed(5), cameraLatitude: center.lat.toFixed(5),
                  cameraZoom: map.getZoom().toFixed(3), cameraPitch: map.getPitch().toFixed(2), cameraBearing: map.getBearing().toFixed(2),
                });
              }
            }
            const step = Math.round(currentProgress * 24);
            if (step !== lastRouteStep) {
              (map.getSource("hostess-routes") as GeoJSONSource)?.setData(routeData(currentProgress)); lastRouteStep = step;
              const network = Math.round(Math.max(0, Math.min(1, (currentProgress - 3.35) / .65)) * 20) / 20;
              if (network !== lastNetwork) {
                (map.getSource("hostess-network") as GeoJSONSource)?.setData(networkData(network));
                map.setPaintProperty("hostess-network-light", "line-opacity", network * .88);
                map.setPaintProperty("hostess-network-glow", "line-opacity", network * .24);
                map.setPaintProperty("hostess-routes-light", "line-opacity", .9 - network * .51);
                map.setPaintProperty("hostess-routes-glow", "line-opacity", .23 - network * .13);
                map.setPaintProperty("hostess-district-fill", "fill-opacity", .028 + network * .025);
                lastNetwork = network;
              }
              updateMarkers();
            }
          };
          frame = window.requestAnimationFrame(animate);
        });
      } catch {
        if (!disposed) setStatus("offline");
      }
    };
    initialise();
    return () => {
      disposed = true; window.cancelAnimationFrame(frame); window.clearTimeout(timeout);
      markersRef.current.forEach(marker => marker.remove()); markersRef.current = [];
      mapRef.current?.remove(); mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    markersRef.current.forEach(marker => {
      const el = marker.getElement(); el.dataset.selected = String(el.dataset.venue === selectedVenue);
      el.setAttribute('aria-pressed', el.dataset.selected);
      el.setAttribute('role', 'button');
    });
  }, [selectedVenue]);

  const fallbackCamera = cameraAt(reduced || motionPaused ? activeChapter : progress);
  const fallbackScale = Math.max(.88, Math.min(1.75, 1 + (fallbackCamera.zoom - CAMERA_STOPS[0].zoom) * .27));
  const fallbackRotation = (fallbackCamera.bearing - CAMERA_STOPS[0].bearing) * .12;
  const fallbackSelection = selectionOffset(reduced || motionPaused ? activeChapter : progress, selectedVenue);
  return <div className="city-map" data-map-status={status} data-camera-chapter={activeChapter}>
    <div className="city-map__fallback" style={{ transform: `scale(${fallbackScale}) rotate(${fallbackRotation}deg) translate(${(fallbackCamera.bias - .4) * 12 - fallbackSelection[0] * 450}%, ${fallbackSelection[1] * 700}%)` }}>
      <CityDrawing />
    </div>
    <div className="city-map__canvas" ref={containerRef} inert={status !== 'ready'} aria-hidden={status !== 'ready'} />
    {status !== "ready" && VENUES.map((venue, index) => <button type="button" key={venue.id}
      className="city-venue-marker city-fallback-marker" data-selected={selectedVenue === venue.id}
      aria-pressed={selectedVenue === venue.id}
      style={{ left: `${FALLBACK_POINTS[index].x}%`, top: `${FALLBACK_POINTS[index].y}%` }}
      onClick={() => onVenueSelect(venue.id)} aria-label={`Explore ${venue.name}, ${venue.category}`}>
      <span className="city-venue-marker__dot"/><span className="city-venue-marker__stem"/>
      <span className="city-venue-marker__label"><b>{venue.name}</b><small>{venue.category}</small></span>
    </button>)}
    <div className="city-map__haze"/><div className="city-map__grain"/>
    {status === "offline" && <div className="city-map__notice"><span>City preview</span> · Live map unavailable</div>}
  </div>;
}
