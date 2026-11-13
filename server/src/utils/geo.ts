/** Distance in km between two [lng, lat] points. */
export function haversineKm([lng1 = 0, lat1 = 0]: number[], [lng2 = 0, lat2 = 0]: number[]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** Parses "lng,lat" from a query string. Returns null when invalid. */
export function parseLngLat(raw: unknown): [number, number] | null {
  if (typeof raw !== "string") return null;
  const [lng, lat] = raw.split(",").map(Number);
  if (lng === undefined || lat === undefined || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
  return [lng, lat];
}
