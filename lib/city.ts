export type VenueId = "lumen" | "vesper" | "marea" | "atlas" | "sotto";

export interface Venue {
  id: VenueId;
  name: string;
  category: string;
  neighborhood: string;
  coordinates: [number, number];
  label: string;
}

/** Editorial demo venues; these names and locations are illustrative. */
export const VENUES: Venue[] = [
  { id: "lumen", name: "Lumen", category: "Modern dining", neighborhood: "SoHo", coordinates: [-73.9987, 40.7247], label: "DINNER, REIMAGINED" },
  { id: "vesper", name: "Vesper", category: "Cocktail bar", neighborhood: "Lower East Side", coordinates: [-73.9917, 40.7215], label: "ONE MORE ROUND" },
  { id: "marea", name: "Marea", category: "Coastal kitchen", neighborhood: "Nolita", coordinates: [-73.9952, 40.7233], label: "A LITTLE ESCAPE" },
  { id: "atlas", name: "Atlas", category: "Rooftop & late nights", neighborhood: "Tribeca", coordinates: [-74.006, 40.7197], label: "ABOVE THE ORDINARY" },
  { id: "sotto", name: "Sotto", category: "Wine & small plates", neighborhood: "East Village", coordinates: [-73.9892, 40.7277], label: "STAY A LITTLE LONGER" },
];

export interface CityCamera {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  bias: number;
}

/** A single camera, with continuous interpolation through the entire story. */
export const CAMERA_STOPS: CityCamera[] = [
  { center: [-73.9995, 40.7245], zoom: 15.35, pitch: 64, bearing: -22, bias: .40 },
  { center: [-73.9971, 40.724], zoom: 15.55, pitch: 58, bearing: 5, bias: .34 },
  { center: VENUES[0].coordinates, zoom: 17.05, pitch: 65, bearing: 32, bias: .31 },
  { center: VENUES[1].coordinates, zoom: 16.7, pitch: 62, bearing: 74, bias: -.22 },
  { center: [-73.997, 40.7241], zoom: 15.1, pitch: 50, bearing: 104, bias: .02 },
  { center: [-74.0039, 40.7213], zoom: 15.7, pitch: 61, bearing: 149, bias: -.24 },
  { center: [-73.9978, 40.724], zoom: 14.75, pitch: 50, bearing: 181, bias: .12 },
  { center: [-73.999, 40.7236], zoom: 14.5, pitch: 60, bearing: 209, bias: .27 },
];

export const CITY_ROUTES: [number, number][][] = [
  [VENUES[0].coordinates, [-73.9975, 40.7242], [-73.9968, 40.7234], VENUES[2].coordinates],
  [VENUES[2].coordinates, [-73.9943, 40.7228], [-73.9936, 40.7236], [-73.9919, 40.7227], VENUES[1].coordinates],
  [VENUES[1].coordinates, [-73.9908, 40.723], [-73.9925, 40.7238], [-73.9908, 40.7261], VENUES[4].coordinates],
  [VENUES[0].coordinates, [-74.0003, 40.723], [-74.002, 40.7222], [-74.0038, 40.7219], [-74.0048, 40.7204], VENUES[3].coordinates],
];

export function cameraAt(progress: number): CityCamera {
  const clamped = Math.max(0, Math.min(7, progress));
  const index = Math.min(6, Math.floor(clamped));
  const raw = clamped - index;
  const t = raw * raw * (3 - 2 * raw);
  const from = CAMERA_STOPS[index];
  const to = CAMERA_STOPS[index + 1];
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    center: [lerp(from.center[0], to.center[0]), lerp(from.center[1], to.center[1])],
    zoom: lerp(from.zoom, to.zoom), pitch: lerp(from.pitch, to.pitch),
    bearing: lerp(from.bearing, to.bearing), bias: lerp(from.bias, to.bias),
  };
}

export function partialLine(points: [number, number][], fraction: number): [number, number][] {
  const portion = Math.max(0, Math.min(1, fraction)) * (points.length - 1);
  const whole = Math.floor(portion);
  const result = points.slice(0, whole + 1);
  if (whole < points.length - 1) {
    const t = portion - whole;
    result.push([
      points[whole][0] + (points[whole + 1][0] - points[whole][0]) * t,
      points[whole][1] + (points[whole + 1][1] - points[whole][1]) * t,
    ]);
  }
  if (result.length < 2) result.push(result[0]);
  return result;
}
