import { EVENING_ROUTE } from './route';

export type LngLat = [number, number];

export interface Venue {
  id: string;
  name: string;
  kind: string;
  /** Short live line shown on the map label. */
  note: string;
  coordinates: LngLat;
  /** Venues the guest walks through; the rest appear in the business chapters. */
  onRoute: boolean;
}

/**
 * Real Hostess venues (Astana) staged on a Manhattan evening walk.
 * The map is a scene; names, screens and numbers come from the live app.
 */
export const VENUES: Venue[] = [
  { id: 'selfie', name: 'Selfie', kind: 'Авторская кухня', note: '18 этаж · 92%', coordinates: [-73.986785, 40.74132], onRoute: true },
  { id: 'xoxo', name: 'XOXO Sports & Lounge', kind: 'Спорт-бар', note: 'Стол 15 · 21:00', coordinates: [-73.987569, 40.747881], onRoute: true },
  { id: 'tangiers', name: 'Tangiers Lounge', kind: 'Коктейли', note: 'Свободно · 38%', coordinates: [-73.982344, 40.752504], onRoute: true },
  { id: 'linebrew', name: 'Line Brew', kind: 'Стейки', note: 'Свободно', coordinates: [-73.9787, 40.7587], onRoute: false },
  { id: 'qazaq', name: 'Qazaq Gourmet', kind: 'Казахская кухня', note: 'Умеренно', coordinates: [-73.9958, 40.7418], onRoute: false },
  { id: 'loulou', name: 'Lou Lou', kind: 'Европейская', note: 'Почти полно', coordinates: [-73.9842, 40.7372], onRoute: false },
  { id: 'eva', name: 'Eva Wine Cafe', kind: 'Винотека', note: 'Умеренно', coordinates: [-73.9786, 40.7466], onRoute: false },
];

export const START: LngLat = EVENING_ROUTE[0];

export interface Chapter {
  id: string;
  nav: string;
  business?: boolean;
  /** Phone screen shown by the fixed device on desktop. */
  screen?: string;
  /** Venue whose label is emphasised. */
  venue?: string;
}

export const CHAPTERS: Chapter[] = [
  { id: 'city', nav: 'Город', screen: 'app-map' },
  { id: 'discover', nav: 'Выбор', screen: 'app-places' },
  { id: 'concierge', nav: 'Консьерж', screen: 'app-concierge', venue: 'selfie' },
  { id: 'live', nav: 'Загрузка зала', screen: 'app-selfie', venue: 'selfie' },
  { id: 'next', nav: 'Дальше по вечеру', screen: 'app-xoxo', venue: 'xoxo' },
  { id: 'table', nav: 'Стол', screen: 'app-tables', venue: 'xoxo' },
  { id: 'exchange', nav: 'Биржа напитков', screen: 'app-exchange', venue: 'xoxo' },
  { id: 'nightcap', nav: 'Последний адрес', screen: 'app-tangiers', venue: 'tangiers' },
  { id: 'business', nav: 'Для заведений', business: true },
  { id: 'floor', nav: 'Зал и брони', business: true },
  { id: 'agent', nav: 'AI-хостес', business: true },
  { id: 'growth', nav: 'Данные и маркетинг', business: true },
  { id: 'finale', nav: 'Начать', business: true },
];

export const FIRST_BUSINESS = CHAPTERS.findIndex(chapter => chapter.business);

// --- Route geometry -------------------------------------------------------

const toMeters = (a: LngLat, b: LngLat) => {
  const k = Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
  const dx = (b[0] - a[0]) * 111320 * k, dy = (b[1] - a[1]) * 110540;
  return Math.hypot(dx, dy);
};

const CUMULATIVE = EVENING_ROUTE.reduce<number[]>((acc, point, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + toMeters(EVENING_ROUTE[i - 1], point));
  return acc;
}, []);
export const ROUTE_LENGTH = CUMULATIVE[CUMULATIVE.length - 1];

/** Fraction of the route (by distance) at which a coordinate is closest. */
function fractionAt(target: LngLat) {
  let best = 0, bestDistance = Infinity;
  EVENING_ROUTE.forEach((point, i) => {
    const d = toMeters(point, target);
    if (d < bestDistance) { bestDistance = d; best = i; }
  });
  return CUMULATIVE[best] / ROUTE_LENGTH;
}

const AT_SELFIE = fractionAt(VENUES[0].coordinates);
const AT_XOXO = fractionAt(VENUES[1].coordinates);

/** Point on the route at a distance fraction, plus the local heading in degrees. */
export function routePoint(fraction: number): { point: LngLat; heading: number } {
  const target = Math.max(0, Math.min(1, fraction)) * ROUTE_LENGTH;
  let i = 1;
  while (i < CUMULATIVE.length - 1 && CUMULATIVE[i] < target) i++;
  const a = EVENING_ROUTE[i - 1], b = EVENING_ROUTE[i];
  const span = CUMULATIVE[i] - CUMULATIVE[i - 1] || 1;
  const t = Math.max(0, Math.min(1, (target - CUMULATIVE[i - 1]) / span));
  const k = Math.cos(a[1] * Math.PI / 180);
  return {
    point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    heading: Math.atan2((b[0] - a[0]) * k, b[1] - a[1]) * 180 / Math.PI,
  };
}

// --- Camera -----------------------------------------------------------------

interface Keyframe {
  /** 1 = camera rides the head of the route; 0 = fixed `center`. */
  follow: number;
  /** Absolute bearing when fixed; offset from the direction of travel when following. */
  center: LngLat;
  route: number;
  network: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

const MIDTOWN: LngLat = [-73.9868, 40.7462];
const KEYFRAMES: Keyframe[] = [
  { follow: 0, center: [-73.9884, 40.7418], route: 0, network: 0, zoom: 15.35, pitch: 62, bearing: 22 },
  { follow: 1, center: MIDTOWN, route: AT_SELFIE * .42, network: 0, zoom: 16.05, pitch: 60, bearing: 0 },
  { follow: 1, center: MIDTOWN, route: AT_SELFIE, network: 0, zoom: 16.45, pitch: 63, bearing: -12 },
  { follow: 1, center: MIDTOWN, route: AT_SELFIE, network: 0, zoom: 16.95, pitch: 67, bearing: 8 },
  { follow: 1, center: MIDTOWN, route: AT_XOXO, network: 0, zoom: 16.2, pitch: 61, bearing: 0 },
  { follow: 1, center: MIDTOWN, route: AT_XOXO, network: 0, zoom: 16.85, pitch: 68, bearing: -14 },
  { follow: 1, center: MIDTOWN, route: AT_XOXO, network: 0, zoom: 16.55, pitch: 65, bearing: -22 },
  { follow: 1, center: MIDTOWN, route: 1, network: 0, zoom: 16.25, pitch: 62, bearing: 0 },
  { follow: 0, center: MIDTOWN, route: 1, network: 1, zoom: 15.3, pitch: 58, bearing: 29 },
  { follow: 0, center: MIDTOWN, route: 1, network: 1, zoom: 15.45, pitch: 60, bearing: 62 },
  { follow: 0, center: [-73.9852, 40.7476], route: 1, network: 1, zoom: 15.6, pitch: 62, bearing: 98 },
  { follow: 0, center: MIDTOWN, route: 1, network: 1, zoom: 15.35, pitch: 58, bearing: 136 },
  { follow: 0, center: [-73.9862, 40.7455], route: 1, network: 1, zoom: 15.25, pitch: 56, bearing: 192 },
];

export interface CameraState {
  center: LngLat;
  head: LngLat;
  zoom: number;
  pitch: number;
  bearing: number;
  route: number;
  network: number;
}

const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * Direction of travel over the last ~200 m. Looking along it keeps the drawn
 * trail below the head, in the open band between the copy and the phone.
 */
function travelHeading(route: number) {
  const window = .08;
  const to = routePoint(Math.max(route, window)).point;
  const from = routePoint(Math.max(0, Math.max(route, window) - window)).point;
  const k = Math.cos(to[1] * Math.PI / 180);
  return Math.atan2((to[0] - from[0]) * k, to[1] - from[1]) * 180 / Math.PI;
}
const nearAngle = (angle: number, reference: number) => angle + Math.round((reference - angle) / 360) * 360;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Continuous camera for a scroll progress between 0 and CHAPTERS.length - 1. */
export function cameraAt(progress: number): CameraState {
  const last = KEYFRAMES.length - 1;
  const p = Math.max(0, Math.min(last, progress));
  const i = Math.min(last - 1, Math.floor(p));
  const t = ease(p - i);
  const a = KEYFRAMES[i], b = KEYFRAMES[i + 1];
  const route = lerp(a.route, b.route, t);
  const head = routePoint(route).point;
  const follow = lerp(a.follow, b.follow, t);
  const fixed: LngLat = [lerp(a.center[0], b.center[0], t), lerp(a.center[1], b.center[1], t)];
  const aBearing = a.follow ? travelHeading(route) + a.bearing : a.bearing;
  const bBearing = nearAngle(b.follow ? travelHeading(route) + b.bearing : b.bearing, aBearing);
  return {
    center: [lerp(fixed[0], head[0], follow), lerp(fixed[1], head[1], follow)],
    head,
    zoom: lerp(a.zoom, b.zoom, t),
    pitch: lerp(a.pitch, b.pitch, t),
    bearing: lerp(aBearing, bBearing, t),
    route,
    network: lerp(a.network, b.network, t),
  };
}

/** Gentle arcs that connect every venue to its two nearest neighbours. */
export function networkLines(): LngLat[][] {
  const pairs = new Set<string>();
  VENUES.forEach((venue, i) => {
    VENUES.map((other, j) => ({ j, d: i === j ? Infinity : toMeters(venue.coordinates, other.coordinates) }))
      .sort((x, y) => x.d - y.d).slice(0, 2)
      .forEach(({ j }) => pairs.add([Math.min(i, j), Math.max(i, j)].join('-')));
  });
  return [...pairs].map(key => {
    const [i, j] = key.split('-').map(Number);
    const from = VENUES[i].coordinates, to = VENUES[j].coordinates;
    const dx = to[0] - from[0], dy = to[1] - from[1];
    return Array.from({ length: 24 }, (_, s) => {
      const t = s / 23, bow = Math.sin(t * Math.PI) * .12;
      return [from[0] + dx * t - dy * bow, from[1] + dy * t + dx * bow] as LngLat;
    });
  });
}
