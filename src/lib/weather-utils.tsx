import { WEATHER_CODE_MAP } from "./constants";
// import { iconForCode } from "@/lib/weather-utils"; // If self-referencing, otherwise define below

export const fmt = (n: number | undefined, digits = 0): string =>
  Number.isFinite(n as number) ? (n as number).toFixed(digits) : "–";

export const isoToHour = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const isoToWeekday = (iso: string): string =>
  new Date(iso).toLocaleDateString([], { weekday: "short" });

export function nearestHourValue(times: string[] = [], values: number[] = []): number {
  if (!times.length || !values.length) return 0;
  const now = Date.now();
  let bestIdx = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < times.length; i++) {
    const delta = Math.abs(new Date(times[i]).getTime() - now);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIdx = i;
    }
  }
  return values[Math.min(bestIdx, values.length - 1)] ?? 0;
}

export function hourlySlice(hourly: any, n: number) {
  if (!hourly) return [];
  const { time = [], temperature_2m = [], apparent_temperature = [], windspeed_10m = [], relative_humidity_2m = [], precipitation = [] } = hourly;
  const now = Date.now();
  const items = [];
  for (let i = 0; i < time.length && items.length < n; i++) {
    const timestamp = new Date(time[i]).getTime();
    if (timestamp >= now) {
      items.push({
        time: time[i],
        temperature: temperature_2m[i] ?? 0,
        apparent: apparent_temperature[i] ?? temperature_2m[i] ?? 0,
        wind: windspeed_10m[i] ?? 0,
        humidity: relative_humidity_2m[i] ?? 0,
        precip: precipitation[i] ?? 0,
      });
    }
  }
  return items;
}