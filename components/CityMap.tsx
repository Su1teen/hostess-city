"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { ExpressionSpecification, Map as MapboxMap, Marker } from "mapbox-gl";
import { CAMERA_STOPS, CITY_ROUTES, VENUES, cameraAt, partialLine } from "../lib/city";
import "mapbox-gl/dist/mapbox-gl.css";
import "./city-map.css";
import type { ScrollStateRef } from "../lib/scroll-state";

type Props = {
  motion: ScrollStateRef;
  registerRenderer: (draw: () => void) => () => void;
  selectedVenue: string;
  onVenueSelect: (id: string) => void;
};
type MapStatus = "loading" | "ready" | "offline";
type LineCollection = {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: Record<string, number>; geometry: { type: "LineString"; coordinates: number[][] } }[];
};


function revealGradient(fraction: number, color: string): ExpressionSpecification {
  if(fraction>=1)return ['interpolate',['linear'],['line-progress'],0,color,1,color];
  return ['step',['line-progress'],fraction<=0?'rgba(0,0,0,0)':color,Math.max(.0001,fraction),'rgba(0,0,0,0)'];
}

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
  map.setLight({ anchor: "viewport", color: "#d7e4f2", intensity: .65, position: [1.5, 155, 48] });
  map.setFog({ range: [.6, 7], color: '#101a28', 'high-color': '#101a28', 'space-color': '#090e14', 'horizon-blend': .12 });
  const firstLabel = (style.layers || []).find(layer => layer.type === "symbol")?.id;
  if (map.getSource("composite")) {
    map.addLayer({
      id: "hostess-buildings", source: "composite", "source-layer": "building", type: "fill-extrusion", minzoom: mobile ? 14 : 13.5,
      filter: ["!=", ["get", "underground"], "true"],
      paint: {
        "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "height"], 12], 0, "#2a3743", 40, "#35424f", 130, "#455362", 250, "#536477"],
        "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13.5, 0, 14.3, ["*", ["max", 12, ["coalesce", ["get", "height"], 12]], mobile ? 1 : 1.2]],
        "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0], "fill-extrusion-opacity": 1, "fill-extrusion-vertical-gradient": true,
      },
    }, firstLabel);
  }
  map.addSource("hostess-district", { type: "geojson", data: DISTRICT });
  map.addLayer({ id: "hostess-district-fill", type: "fill", source: "hostess-district", paint: { "fill-color": "#c69b62", "fill-opacity": .028 } }, map.getLayer("hostess-buildings") ? "hostess-buildings" : firstLabel);
  map.addLayer({ id: "hostess-district-edge", type: "line", source: "hostess-district", paint: { "line-color": "#dcb17d", "line-opacity": .18, "line-width": .8, "line-dasharray": [2, 4] } });
  map.addSource("hostess-routes", { type: "geojson", data: routeData(2), lineMetrics: true });
  map.addLayer({ id: "hostess-routes-glow", type: "line", source: "hostess-routes", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-gradient": revealGradient(0,"#f4b660"), "line-width": mobile ? 7 : 13, "line-opacity": .19, "line-blur": 3 } });
  map.addLayer({ id: "hostess-routes-light", type: "line", source: "hostess-routes", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#ffd395", .8, "#ddb074", 1, "#fff2d6"], "line-width": mobile ? 1.5 : 2.2, "line-opacity": .9 } });
  map.addSource("hostess-network", { type: "geojson", data: networkData(1), lineMetrics: true });
  map.addLayer({ id: "hostess-network-glow", type: "line", source: "hostess-network", layout: { "line-cap": "round" }, paint: { "line-gradient": revealGradient(0,"#729bef"), "line-width": 7, "line-blur": 3, "line-opacity": 0, "line-occlusion-opacity": .55 } });
  map.addLayer({ id: "hostess-network-light", type: "line", source: "hostess-network", layout: { "line-cap": "round" }, paint: { "line-gradient": revealGradient(0,"#9dbfff"), "line-width": 1.6, "line-opacity": 0, "line-occlusion-opacity": .7, "line-emissive-strength": .85 } });
  // Five small native meshes highlight venues without a second WebGL renderer.
  map.addSource('hostess-places', {type:'geojson', data:{type:'FeatureCollection',features:VENUES.map((venue,index)=>{
    const ring=(radius:number)=>Array.from({length:25},(_,i)=>{const angle=i/24*Math.PI*2;return [venue.coordinates[0]+Math.cos(angle)*radius,venue.coordinates[1]+Math.sin(angle)*radius*.76];});
    return {type:'Feature',id:index,properties:{},geometry:{type:'Polygon',coordinates:[ring(.00017),ring(.00012).reverse()]}};
  })}});
  map.addLayer({id:'hostess-place-crowns',type:'fill-extrusion',source:'hostess-places',paint:{
    'fill-extrusion-height':['case',['boolean',['feature-state','active'],false],65,22],
    'fill-extrusion-base':12,'fill-extrusion-opacity':.72,
    'fill-extrusion-color':['case',['boolean',['feature-state','network'],false],'#8eb8f6','#e2ad6c'],
    'fill-extrusion-emissive-strength':.55,'fill-extrusion-vertical-gradient':true,
  }});
}

function markerElement(venue: typeof VENUES[number], select: (id: string) => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "city-venue-marker";
  button.setAttribute("aria-label", `Выбрать ${venue.name}, ${venue.category}`);
  button.dataset.venue = venue.id;
  const dot = document.createElement("span"); dot.className = "city-venue-marker__dot";
  const stem = document.createElement("span"); stem.className = "city-venue-marker__stem";
  const label = document.createElement("span"); label.className = "city-venue-marker__label";
  const name = document.createElement("b"); name.textContent = venue.name;
  const category = document.createElement("small"); category.textContent = venue.category;
  const ui=document.createElement('span');ui.className='city-venue-marker__ui';
  label.append(name, category);ui.append(dot,stem,label);button.append(ui);
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
    <g fill="#d5aa73" opacity=".55" fontFamily="monospace" fontSize="11" letterSpacing="5"><text x="907" y="687" transform="rotate(-28 907 687)">СОХО</text><text x="1157" y="359" transform="rotate(28 1157 359)">НОЛИТА</text><text x="558" y="539" transform="rotate(-28 558 539)">ТРАЙБЕКА</text></g>
    <path d="M710 254q365-120 667 265M551 397q489-18 578 334" fill="none" stroke="#7ca4e1" strokeWidth="1" opacity=".26" strokeDasharray="3 7"/>
  </svg>;
});

const FALLBACK_POINTS = [{ x: 64, y: 46 }, { x: 84, y: 56 }, { x: 73, y: 36 }, { x: 54, y: 65 }, { x: 86, y: 31 }];

export default function CityMap({ motion, registerRenderer, selectedVenue, onVenueSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef({ selectedVenue, onVenueSelect });
  const scheduler = useRef<(() => void) | undefined>(undefined);
  const [status, setStatus] = useState<MapStatus>('loading');
  const [fallbackLeaving, setFallbackLeaving] = useState(true);

  useEffect(() => {
    latestRef.current = { selectedVenue, onVenueSelect };
    scheduler.current?.();
  }, [selectedVenue, onVenueSelect, motion]);

  useEffect(() => {
    if (status !== 'ready') return;
    const timer = setTimeout(() => setFallbackLeaving(false), 1200);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    let disposed = false, frame = 0, timeout = 0, map: MapboxMap | null = null, loaded = false;
    let lastTime = 0, cameraFrames = 0, routeReveal = -1, networkReveal = -1, markerMode = '', lastSelected = '';
    let lastCamera = '', chapter = -1;
    let focus: [number, number] = [0, 0];
    let size = { width: window.innerWidth, height: window.innerHeight };
    const markers: Marker[] = [];
    const initialMobile = size.width < 768;
    // Background-only render scaling caps high-DPI GPU work. HTML text stays sharp.
    const renderScale = Math.max(1.16, Math.min(2.2, window.devicePixelRatio / 1.4));
    rootRef.current?.style.setProperty('--city-render-scale', String(renderScale));
    const params = new URLSearchParams(window.location.search);
    const benchmark = params.has('bench');
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const requestDraw = () => {
      if (!disposed && !frame && document.visibilityState !== 'hidden') frame = requestAnimationFrame(draw);
    };
    const updateMarkers = (p: number) => {
      const selected = latestRef.current.selectedVenue;
      const network = p >= 3.4 && p < 5.4;
      const mode = `${selected}/${network}`;
      if (markerMode === mode) return;
      markerMode = mode;
      markers.forEach(marker => {
        const el = marker.getElement();
        el.dataset.selected = String(el.dataset.venue === selected);
        el.dataset.network = String(network);
        el.setAttribute('aria-pressed', el.dataset.selected);
        el.setAttribute('role', 'button');
      });
      if (map?.getSource('hostess-places')) VENUES.forEach((venue,index) => map!.setFeatureState({source:'hostess-places',id:index}, {active:venue.id===selected,network}));
    };
    const updateLines = (p: number) => {
      if (!map || !loaded) return;
      const route = Math.round(Math.max(0, Math.min(1, (p - .35) / 1.65)) * 32) / 32;
      const network = Math.round(Math.max(0, Math.min(1, (p - 3.35) / .65)) * 28) / 28;
      if (route !== routeReveal) {
        map.setPaintProperty('hostess-routes-light','line-gradient',revealGradient(route,'#f5c792'));
        map.setPaintProperty('hostess-routes-glow','line-gradient',revealGradient(route,'#e9ac60'));
        routeReveal = route;
      }
      if (network !== networkReveal) {
        map.setPaintProperty('hostess-network-light','line-gradient',revealGradient(network,'#a0c5ff'));
        map.setPaintProperty('hostess-network-glow','line-gradient',revealGradient(network,'#729bef'));
        map.setPaintProperty('hostess-network-light','line-opacity',network > 0 ? .86 : 0);
        map.setPaintProperty('hostess-network-glow','line-opacity',network > 0 ? .20 : 0);
        map.setPaintProperty('hostess-routes-light','line-opacity',.9-network*.5);
        map.setPaintProperty('hostess-routes-glow','line-opacity',.19-network*.10);
        networkReveal = network;
      }
    };
    function draw(time: number) {
      frame = 0;
      if (disposed || document.visibilityState === 'hidden') return;
      const state = motion.current;
      const p = state.paused ? state.activeChapter : state.progress;
      const desiredFocus = selectionOffset(p,latestRef.current.selectedVenue);
      const dt = Math.min(64,Math.max(1,time-lastTime || 16.7));
      const alpha = state.paused ? 1 : 1-Math.exp(-dt/110);
      focus = [focus[0]+(desiredFocus[0]-focus[0])*alpha,focus[1]+(desiredFocus[1]-focus[1])*alpha];
      const focusing = Math.abs(focus[0]-desiredFocus[0])+Math.abs(focus[1]-desiredFocus[1])>.0000004;
      lastTime = time;
      const camera = cameraAt(p);
      if (rootRef.current && chapter !== state.activeChapter) {
        rootRef.current.dataset.cameraChapter = String(state.activeChapter);
        chapter = state.activeChapter;
      }
      if (!loaded && fallbackRef.current) {
        const scale = Math.max(.88,Math.min(1.75,1+(camera.zoom-CAMERA_STOPS[0].zoom)*.27));
        fallbackRef.current.style.transform = `scale(${scale}) rotate(${(camera.bearing-CAMERA_STOPS[0].bearing)*.12}deg) translate(${(camera.bias-.4)*12-focus[0]*450}%,${focus[1]*700}%)`;
      }
      if (map && loaded) {
        const mobile = window.innerWidth < 768;
        const zoom = camera.zoom - (mobile ? .25 : 0) - Math.log2(renderScale);
        const signature = `${p.toFixed(5)}/${focus[0].toFixed(7)}/${focus[1].toFixed(7)}/${size.width}/${size.height}`;
        if (signature !== lastCamera) {
          const side = size.width*Math.abs(camera.bias);
          map.jumpTo({
            center:[camera.center[0]+focus[0],camera.center[1]+focus[1]],
            zoom:mobile && p < 3.2 ? Math.max(15.05,zoom) : zoom,bearing:camera.bearing,pitch:mobile?Math.min(50,camera.pitch):camera.pitch,
            padding:mobile?{top:0,bottom:Math.round(size.height*.18),left:0,right:0}:{top:0,bottom:0,left:camera.bias>0?Math.round(side):0,right:camera.bias<0?Math.round(side):0},
            retainPadding:false,
          });
          lastCamera=signature;
          cameraFrames++;
          if (benchmark && containerRef.current) {
            containerRef.current.dataset.cameraFrames=String(cameraFrames);
          }
        }
        updateLines(p);
        updateMarkers(p);
        // Diagnostic attributes update once when the camera settles, not every frame.
        if (!focusing && containerRef.current) {
          const data = containerRef.current.dataset;
          const zoom = map.getZoom().toFixed(3);
          if (data.cameraZoom !== zoom && (state.paused || Math.abs(p-Math.round(p))<.002)) {
            const center=map.getCenter();
            Object.assign(data,{cameraLongitude:center.lng.toFixed(5),cameraLatitude:center.lat.toFixed(5),cameraZoom:zoom,cameraPitch:map.getPitch().toFixed(2),cameraBearing:map.getBearing().toFixed(2)});
          }
        }
        if (lastSelected !== latestRef.current.selectedVenue) { lastSelected=latestRef.current.selectedVenue; updateMarkers(p); }
      }
      if (focusing) requestDraw();
    }
    scheduler.current = requestDraw;
    const unregister = registerRenderer(requestDraw);
    const resize=new ResizeObserver(entries=>{
      const box=entries[0].contentRect;
      size={width:box.width,height:box.height};
      map?.resize();lastCamera='';requestDraw();
    });
    if (containerRef.current) resize.observe(containerRef.current);
    const visible=()=>{if(document.visibilityState==='visible')requestDraw();};
    document.addEventListener('visibilitychange',visible);
    requestDraw();

    (async()=>{
      if(!token||params.get('city')==='illustrated'){setStatus('offline');return;}
      try{
        const mapbox=(await import('mapbox-gl')).default;
        if(disposed)return;
        if(!mapbox.supported()){setStatus('offline');return;}
        const initial=cameraAt(motion.current.progress);
        map=new mapbox.Map({container:containerRef.current!,accessToken:token,style:'mapbox://styles/mapbox/dark-v11',center:initial.center,zoom:initial.zoom-Math.log2(renderScale),pitch:initial.pitch,bearing:initial.bearing,interactive:false,attributionControl:false,antialias:false,trackResize:false,maxTileCacheSize:initialMobile?100:240,fadeDuration:0,logoPosition:'bottom-left',renderWorldCopies:false,localFontFamily:'Manrope',collectResourceTiming:false,performanceMetricsCollection:false,locale:{'AttributionControl.ToggleAttribution':'Информация о карте'}});
        map.addControl(new mapbox.AttributionControl({compact:true}),'bottom-right');
        let failures=0;
        const offline=()=>{if(!disposed){loaded=false;setStatus('offline');requestDraw();}};
        timeout=window.setTimeout(()=>{if(!loaded)offline();},18000);
        map.on('error',event=>{const msg=event.error?.message||'';if(/401|403|access token|Unauthorized|Forbidden/i.test(msg)||++failures>8)offline();});
        const canvas=map.getCanvas();canvas.setAttribute('aria-label','Объёмная карта Манхэттена с демонстрационными заведениями Hostess');canvas.setAttribute('role','img');
        const lost=(event:Event)=>{event.preventDefault();offline();};
        canvas.addEventListener('webglcontextlost',lost);
        canvas.addEventListener('webglcontextrestored',()=>{if(!disposed){loaded=true;setStatus('ready');requestDraw();}});
        map.once('load',()=>{
          if(disposed||!map)return;
          clearTimeout(timeout);
          try{installCityLayers(map,initialMobile);}catch{offline();return;}
          VENUES.forEach(venue=>markers.push(new mapbox.Marker({element:markerElement(venue,id=>latestRef.current.onVenueSelect(id)),anchor:'center',pitchAlignment:'viewport',rotationAlignment:'viewport',occludedOpacity:.75}).setLngLat(venue.coordinates).addTo(map!)));
          loaded=true;setStatus('ready');updateMarkers(motion.current.progress);requestDraw();
        });
      }catch{if(!disposed)setStatus('offline');}
    })();
    return()=>{
      disposed=true;cancelAnimationFrame(frame);clearTimeout(timeout);resize.disconnect();
      document.removeEventListener('visibilitychange',visible);
      unregister();
      markers.forEach(marker=>marker.remove());map?.remove();
    };
  },[motion, registerRenderer]);

  return <div className="city-map" ref={rootRef} data-map-status={status} data-camera-chapter="0">
    {(status!=='ready'||fallbackLeaving)&&<div className="city-map__fallback" ref={fallbackRef}><CityDrawing/></div>}
    <div className="city-map__canvas" ref={containerRef} inert={status!=='ready'} aria-hidden={status!=='ready'}/>
    {status!=='ready'&&VENUES.map((venue,index)=><button type="button" key={venue.id} className="city-venue-marker city-fallback-marker" data-selected={selectedVenue===venue.id} aria-pressed={selectedVenue===venue.id} style={{left:`${FALLBACK_POINTS[index].x}%`,top:`${FALLBACK_POINTS[index].y}%`}} onClick={()=>onVenueSelect(venue.id)} aria-label={`Выбрать ${venue.name}, ${venue.category}`}><span className="city-venue-marker__dot"/><span className="city-venue-marker__stem"/><span className="city-venue-marker__label"><b>{venue.name}</b><small>{venue.category}</small></span></button>)}
    {status==='offline'&&<div className="city-map__notice"><span>Иллюстрация города</span> · Карта временно недоступна</div>}
  </div>;
}
