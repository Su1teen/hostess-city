"use client";

import { useEffect, useRef, useState } from "react";
import type { ExpressionSpecification, Map as MapboxMap, Marker } from "mapbox-gl";
import { CHAPTERS, FIRST_BUSINESS, START, VENUES, cameraAt, networkLines } from "../lib/story";
import { EVENING_ROUTE } from "../lib/route";
import type { ScrollStateRef } from "../lib/scroll-state";

type Props = { motion: ScrollStateRef; registerRenderer: (draw: () => void) => () => void };
type MapStatus = "loading" | "ready" | "offline";

const GOLD = "#f2c27e";
const CLEAR = "rgba(0,0,0,0)";

/** Reveals a line up to `fraction` of its length (line-progress is distance based). */
function reveal(fraction: number, color: string): ExpressionSpecification {
  if (fraction >= .999) return ["interpolate", ["linear"], ["line-progress"], 0, color, 1, color];
  if (fraction <= .001) return ["interpolate", ["linear"], ["line-progress"], 0, CLEAR, 1, CLEAR];
  return ["step", ["line-progress"], color, fraction, CLEAR];
}

function line(coordinates: number[][]) {
  return { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates } };
}

function installLayers(map: MapboxMap, mobile: boolean) {
  map.addSource("hostess-route", { type: "geojson", lineMetrics: true, data: line(EVENING_ROUTE) });
  map.addSource("hostess-network", {
    type: "geojson", lineMetrics: true,
    data: { type: "FeatureCollection", features: networkLines().map(line) },
  });
  const top = { slot: "top" as const };
  map.addLayer({ ...top, id: "route-ghost", type: "line", source: "hostess-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#f2c27e", "line-opacity": .32, "line-width": mobile ? 1.2 : 1.6, "line-dasharray": [1.2, 2.4], "line-emissive-strength": 1 } });
  map.addLayer({ ...top, id: "route-glow", type: "line", source: "hostess-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-gradient": reveal(0, GOLD), "line-width": mobile ? 12 : 18, "line-blur": mobile ? 7 : 10, "line-opacity": .55, "line-emissive-strength": 1 } });
  map.addLayer({ ...top, id: "route-core", type: "line", source: "hostess-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-gradient": reveal(0, "#fff1d8"), "line-width": mobile ? 2.6 : 3.4, "line-emissive-strength": 1 } });
  map.addLayer({ ...top, id: "network-glow", type: "line", source: "hostess-network",
    layout: { "line-cap": "round" },
    paint: { "line-gradient": reveal(0, "#9dbbff"), "line-width": 9, "line-blur": 6, "line-opacity": .4, "line-emissive-strength": 1 } });
  map.addLayer({ ...top, id: "network-core", type: "line", source: "hostess-network",
    layout: { "line-cap": "round" },
    paint: { "line-gradient": reveal(0, "#cfe0ff"), "line-width": 1.5, "line-opacity": .9, "line-emissive-strength": 1 } });
}

function venueMarker(name: string, kind: string, note: string, id: string) {
  const el = document.createElement("div");
  el.className = "map-pin";
  el.dataset.venue = id;
  el.innerHTML = `<span class="map-pin__card"><b></b><small></small><i></i></span><span class="map-pin__stem"></span><span class="map-pin__dot"></span>`;
  el.querySelector("b")!.textContent = name;
  el.querySelector("small")!.textContent = kind;
  el.querySelector("i")!.textContent = note;
  return el;
}

export default function CityMap({ motion, registerRenderer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    let disposed = false, frame = 0, map: MapboxMap | null = null, loaded = false;
    let lastSignature = "", lastRoute = -1, lastNetwork = -1, lastChapter = -1;
    const markers: Marker[] = [];
    let head: Marker | null = null;
    const params = new URLSearchParams(window.location.search);

    const draw = () => {
      frame = 0;
      if (disposed || !map || !loaded) return;
      const state = motion.current;
      const p = state.paused ? state.activeChapter : state.progress;
      const camera = cameraAt(p);
      const width = window.innerWidth, mobile = width < 900;
      const signature = `${p.toFixed(4)}/${width}/${window.innerHeight}`;
      if (signature !== lastSignature) {
        lastSignature = signature;
        map.jumpTo({
          center: camera.center,
          zoom: camera.zoom - (mobile ? .55 : 0),
          pitch: mobile ? Math.min(58, camera.pitch) : camera.pitch,
          bearing: camera.bearing,
          // Keep the route head in the open middle band between the copy and the device.
          padding: mobile
            ? { top: Math.round(window.innerHeight * .1), bottom: 0, left: 0, right: 0 }
            : { top: 0, bottom: Math.round(window.innerHeight * .08), left: Math.round(width * .06), right: 0 },
        });
        head?.setLngLat(camera.head);
      }
      const route = Math.round(camera.route * 600) / 600;
      if (route !== lastRoute) {
        lastRoute = route;
        map.setPaintProperty("route-core", "line-gradient", reveal(route, "#fff1d8"));
        map.setPaintProperty("route-glow", "line-gradient", reveal(route, GOLD));
        head?.getElement().classList.toggle("is-hidden", route <= .002);
      }
      const network = Math.round(camera.network * 120) / 120;
      if (network !== lastNetwork) {
        lastNetwork = network;
        map.setPaintProperty("network-core", "line-gradient", reveal(network, "#cfe0ff"));
        map.setPaintProperty("network-glow", "line-gradient", reveal(network, "#9dbbff"));
        map.setPaintProperty("route-ghost", "line-opacity", .32 * (1 - network));
      }
      const chapter = Math.round(p);
      if (chapter !== lastChapter) {
        lastChapter = chapter;
        const focus = CHAPTERS[chapter]?.venue;
        const business = chapter >= FIRST_BUSINESS;
        const visited = new Set<string>();
        for (let i = 0; i <= chapter; i++) if (CHAPTERS[i].venue) visited.add(CHAPTERS[i].venue!);
        markers.forEach(marker => {
          const el = marker.getElement(), id = el.dataset.venue!;
          const venue = VENUES.find(v => v.id === id);
          const shown = business || id === "start" || venue?.onRoute;
          el.dataset.state = !shown ? "hidden" : id === focus ? "focus" : business ? "network" : visited.has(id) || id === "start" ? "visited" : "ahead";
        });
      }
    };
    const requestDraw = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(draw);
    };
    const unregister = registerRenderer(requestDraw);
    const onResize = () => { lastSignature = ""; map?.resize(); requestDraw(); };
    window.addEventListener("resize", onResize);

    (async () => {
      if (params.get("city") === "off") { setStatus("offline"); return; }
      // Public (pk.) token: inlined at build time, or written by scripts/start.mjs at runtime.
      let token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        try { token = (await (await fetch("/runtime-config.json", { cache: "no-store" })).json()).mapboxToken; } catch { /* no runtime config */ }
      }
      if (disposed) return;
      if (!token) { console.warn("Hostess: NEXT_PUBLIC_MAPBOX_TOKEN не задан — карта отключена"); setStatus("offline"); return; }
      try {
        const mapbox = (await import("mapbox-gl")).default;
        if (disposed) return;
        if (!mapbox.supported()) { setStatus("offline"); return; }
        const mobile = window.innerWidth < 900;
        const initial = cameraAt(motion.current.progress);
        map = new mapbox.Map({
          container: containerRef.current!, accessToken: token!,
          style: "mapbox://styles/mapbox/standard",
          config: { basemap: {
            lightPreset: "night", theme: "default",
            showPointOfInterestLabels: false, showTransitLabels: false, showRoadLabels: false,
            showPlaceLabels: true, show3dObjects: true,
          } },
          language: "ru",
          center: initial.center, zoom: initial.zoom, pitch: initial.pitch, bearing: initial.bearing,
          interactive: false, attributionControl: false, antialias: !mobile,
          fadeDuration: 0, renderWorldCopies: false, maxTileCacheSize: mobile ? 120 : 260,
          performanceMetricsCollection: false,
        });
        map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");
        const canvas = map.getCanvas();
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", "Объёмная ночная карта Манхэттена с маршрутом вечера и заведениями Hostess");
        let failures = 0;
        const offline = () => { if (!disposed) setStatus("offline"); };
        const timeout = window.setTimeout(() => { if (!loaded) offline(); }, 20000);
        map.on("error", event => {
          const message = event.error?.message || "";
          if (/401|403|access token|Unauthorized|Forbidden/i.test(message) || ++failures > 12) offline();
        });
        canvas.addEventListener("webglcontextlost", event => { event.preventDefault(); offline(); });
        map.on("style.load", () => {
          if (disposed || !map) return;
          clearTimeout(timeout);
          try { installLayers(map, mobile); } catch { offline(); return; }
          const pin = (el: HTMLElement, at: [number, number]) =>
            markers.push(new mapbox.Marker({ element: el, anchor: "bottom", pitchAlignment: "viewport", rotationAlignment: "viewport" }).setLngLat(at).addTo(map!));
          const start = venueMarker("Вы здесь", "Юнион-сквер", "19:40", "start");
          start.classList.add("map-pin--start");
          pin(start, START);
          VENUES.forEach(v => pin(venueMarker(v.name, v.kind, v.note, v.id), v.coordinates));
          const traveller = document.createElement("div");
          traveller.className = "map-head is-hidden";
          traveller.innerHTML = "<span></span>";
          head = new mapbox.Marker({ element: traveller, anchor: "center", pitchAlignment: "map" }).setLngLat(START).addTo(map);
          loaded = true;
          setStatus("ready");
          requestDraw();
        });
      } catch { if (!disposed) setStatus("offline"); }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      unregister();
      window.removeEventListener("resize", onResize);
      markers.forEach(marker => marker.remove());
      head?.remove();
      map?.remove();
    };
  }, [motion, registerRenderer]);

  return <div className="city-map" data-map-status={status}>
    <div className="city-map__canvas" ref={containerRef} aria-hidden={status !== "ready"} />
    <div className="city-map__fallback" aria-hidden="true" />
  </div>;
}
