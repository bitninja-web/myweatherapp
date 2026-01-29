"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Search,
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
} from "lucide-react";

/*************************************************
 * Self‑contained, previewable Weather App (React)
 * ------------------------------------------------
 * - No external UI deps (shadcn placeholders below)
 * - Fetches Open‑Meteo geocoding + forecast
 * - Metric/Imperial toggle
 * - Day/Night toggle added (top-right)
 * - Clear button added beside "Use Top Match"
 *************************************************/

// ---------- Minimal UI primitives (shadcn-like) ----------

function cn(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

const Button = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "ghost" }
) => (
  <button
    {...props}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all",
      props.variant === "ghost"
        ? "bg-transparent hover:bg-gray-100 border border-transparent"
        : "bg-pink-500 hover:bg-pink-600 text-white",
      props.className || ""
    )}
  />
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2",
      props.className || ""
    )}
  />
);

const Card = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={cn("rounded-2xl border shadow-sm", props.className || "")} />
);
const CardHeader = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={cn("px-6 pt-5", props.className || "")} />
);
const CardTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div {...rest} className={cn("text-lg font-semibold", className || "")}>{children}</div>
);
const CardContent = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={cn("px-6 pb-6 overflow-visible", props.className || "")} />
);

const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, children, ...rest }) => (
  <span
    {...rest}
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
      className || ""
    )}
  >
    {children}
  </span>
);

const ScrollArea: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div {...rest} className={cn("overflow-y-auto", className || "")}>{children}</div>
);

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse rounded-xl bg-gray-200", className)} />
);

const Separator = () => <div className="my-3 h-px w-full bg-gray-200" />;

// ---------------- Types ----------------

type Units = "metric" | "imperial";

type GeoPlace = {
  id: number | string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type CurrentWeather = {
  time: string;
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day?: 0 | 1;
};

type HourlyData = {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  windspeed_10m: number[];
  surface_pressure: number[];
  cloudcover: number[];
};

type DailyData = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  precipitation_sum: number[];
  uv_index_max: number[];
  windspeed_10m_max: number[];
  sunrise: string[];
  sunset: string[];
  weathercode: number[]; // included for per-day icon/label
};

type ForecastResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather: CurrentWeather;
  hourly: HourlyData;
  daily: DailyData;
};

// -------------- Utils ---------------

const WEATHER_CODE_MAP: Record<number, { label: string; icon: React.ReactNode }> = {
  0: { label: "Clear sky", icon: <Sun className="w-5 h-5" /> },
  1: { label: "Mainly clear", icon: <Sun className="w-5 h-5" /> },
  2: { label: "Partly cloudy", icon: <Cloud className="w-5 h-5" /> },
  3: { label: "Overcast", icon: <Cloud className="w-5 h-5" /> },
  45: { label: "Fog", icon: <Cloud className="w-5 h-5" /> },
  48: { label: "Depositing rime fog", icon: <Cloud className="w-5 h-5" /> },
  51: { label: "Light drizzle", icon: <CloudRain className="w-5 h-5" /> },
  53: { label: "Drizzle", icon: <CloudRain className="w-5 h-5" /> },
  55: { label: "Dense drizzle", icon: <CloudRain className="w-5 h-5" /> },
  61: { label: "Slight rain", icon: <CloudRain className="w-5 h-5" /> },
  63: { label: "Rain", icon: <CloudRain className="w-5 h-5" /> },
  65: { label: "Heavy rain", icon: <CloudRain className="w-5 h-5" /> },
  71: { label: "Slight snow", icon: <Snowflake className="w-5 h-5" /> },
  73: { label: "Snow", icon: <Snowflake className="w-5 h-5" /> },
  75: { label: "Heavy snow", icon: <Snowflake className="w-5 h-5" /> },
  77: { label: "Snow grains", icon: <Snowflake className="w-5 h-5" /> },
  80: { label: "Rain showers", icon: <CloudRain className="w-5 h-5" /> },
  81: { label: "Heavy showers", icon: <CloudRain className="w-5 h-5" /> },
  82: { label: "Violent showers", icon: <CloudRain className="w-5 h-5" /> },
  85: { label: "Snow showers", icon: <Snowflake className="w-5 h-5" /> },
  86: { label: "Heavy snow showers", icon: <Snowflake className="w-5 h-5" /> },
  95: { label: "Thunderstorm", icon: <CloudLightning className="w-5 h-5" /> },
  96: { label: "Thunder w/ hail", icon: <CloudLightning className="w-5 h-5" /> },
  99: { label: "Thunder w/ heavy hail", icon: <CloudLightning className="w-5 h-5" /> },
};

const fmt = (n: number | undefined, digits = 0) =>
  Number.isFinite(n as number) ? (n as number).toFixed(digits) : "–";
const isoToHour = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const isoToWeekday = (iso: string) => new Date(iso).toLocaleDateString([], { weekday: "short" });

function useDebounce<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function nearestHourValue(times: string[] = [], values: number[] = []) {
  if (!times.length || !values.length) return 0;
  const now = Date.now();
  let bestIdx = 0;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]).getTime();
    const d = Math.abs(t - now);
    if (d < bestDelta) {
      bestDelta = d;
      bestIdx = i;
    }
  }
  return values[Math.min(bestIdx, values.length - 1)] ?? 0;
}

function iconForCode(code?: number) {
  if (code === 0 || typeof code === "number") return WEATHER_CODE_MAP[code]?.icon ?? <Sun className="w-4 h-4" />;
  return <Sun className="w-4 h-4" />;
}

function hourlySlice(hourly: HourlyData, n: number) {
  const { time = [], temperature_2m = [], apparent_temperature = [], windspeed_10m = [], relative_humidity_2m = [], precipitation = [] } =
    hourly || ({} as HourlyData);
  const now = Date.now();
  const items: { time: string; temperature: number; apparent: number; wind: number; humidity: number; precip: number }[] = [];

  for (let i = 0; i < time.length; i++) {
    const t = new Date(time[i]).getTime();
    if (t >= now && items.length < n) {
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
  if (items.length === 0) {
    for (let i = 0; i < Math.min(n, time.length); i++) {
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

// -------------- Component --------------

export default function WeatherApp() {
  const [units, setUnits] = useState<Units>("metric");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoPlace[]>([]);
  const [selected, setSelected] = useState<GeoPlace | null>(null);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: day/night theme
  const [isDark, setIsDark] = useState(false);

  const debouncedQuery = useDebounce(query);

  // Default location New Delhi on first load
  useEffect(() => {
    if (!selected) {
      const delhi: GeoPlace = {
        id: 1261481,
        name: "New Delhi",
        country: "India",
        admin1: "Delhi",
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: "Asia",
      };
      setSelected(delhi);
    }
  }, [selected]);

  // Fetch suggestions (debounced)
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const q = debouncedQuery?.trim();
      if (!q || q.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", q);
        url.searchParams.set("count", "6");
        url.searchParams.set("language", "en");
        url.searchParams.set("format", "json");
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error("Geocoding failed");
        const j = await res.json();
        const list: GeoPlace[] = (j?.results || []).map((r: any) => ({
          id: r.id ?? `${r.latitude},${r.longitude}`,
          name: r.name,
          country: r.country,
          admin1: r.admin1,
          latitude: r.latitude,
          longitude: r.longitude,
          timezone: r.timezone,
        }));
        setSuggestions(list);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setSuggestions([]);
        }
      }
    };
    run();
    return () => controller.abort();
  }, [debouncedQuery]);

  // Fetch forecast whenever selection or units change
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!selected) return;
      setLoading(true);
      setError(null);
      try {
        const isMetric = units === "metric";
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(selected.latitude));
        url.searchParams.set("longitude", String(selected.longitude));
        url.searchParams.set("current_weather", "true");
        url.searchParams.set(
          "hourly",
          [
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "precipitation",
            "windspeed_10m",
            "surface_pressure",
            "cloudcover",
          ].join(",")
        );
        url.searchParams.set(
          "daily",
          [
            "temperature_2m_max",
            "temperature_2m_min",
            "apparent_temperature_max",
            "apparent_temperature_min",
            "precipitation_sum",
            "uv_index_max",
            "windspeed_10m_max",
            "sunrise",
            "sunset",
            "weathercode",
          ].join(",")
        );
        url.searchParams.set("timezone", "auto");
        url.searchParams.set("temperature_unit", isMetric ? "celsius" : "fahrenheit");
        url.searchParams.set("windspeed_unit", isMetric ? "kmh" : "mph");
        url.searchParams.set("precipitation_unit", isMetric ? "mm" : "inch");
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error("Forecast fetch failed");
        const j: ForecastResponse = await res.json();
        setData(j);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [selected, units]);

  const unitLabels = useMemo(
    () =>
      units === "metric"
        ? { temp: "°C", wind: "km/h", precip: "mm", pressure: "hPa" }
        : { temp: "°F", wind: "mph", precip: "in", pressure: "hPa" },
    [units]
  );

  const currentDesc = useMemo(
    () => (data ? WEATHER_CODE_MAP[data.current_weather?.weathercode]?.label ?? "" : ""),
    [data]
  );

  const feelsLike = useMemo(
    () => (data ? nearestHourValue(data.hourly?.time, data.hourly?.apparent_temperature) : 0),
    [data]
  );
  const humidityNow = useMemo(
    () => (data ? nearestHourValue(data.hourly?.time, data.hourly?.relative_humidity_2m) : 0),
    [data]
  );
  const pressureNow = useMemo(
    () => (data ? nearestHourValue(data.hourly?.time, data.hourly?.surface_pressure) : 0),
    [data]
  );
  const cloudNow = useMemo(
    () => (data ? nearestHourValue(data.hourly?.time, data.hourly?.cloudcover) : 0),
    [data]
  );

  // theme-aware card classes
  const cardTheme = isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white";

  return (
    <div className={cn(isDark ? "min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white" : "min-h-screen bg-gradient-to-b from-pink-50 to-white text-gray-900")}>
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Weather</h1>
            <p className={cn("mt-1 text-sm", isDark ? "text-slate-300" : "text-gray-600")}>Real‑time forecast powered by AI</p>
          </div>

          {/* Units + Theme Toggle (top-right) */}
          <div className="inline-flex items-center gap-3">
            <div className={cn("inline-flex rounded-xl p-1", isDark ? "bg-slate-800 border border-slate-700" : "bg-white border border-gray-200")}>
              <Button variant={units === "metric" ? "default" : "ghost"} className={cn("rounded-lg", units === "metric" && "bg-pink-500 hover:bg-pink-500 text-white")} onClick={() => setUnits("metric")}>Metric (°C)</Button>
              <Button variant={units === "imperial" ? "default" : "ghost"} className={cn("rounded-lg", units === "imperial" && "bg-pink-500 hover:bg-pink-500 text-white")} onClick={() => setUnits("imperial")}>Imperial (°F)</Button>
            </div>

            {/* Day/Night toggle (classy pill with sliding knob) */}
            <button
              aria-label="Toggle day/night"
              onClick={() => setIsDark((v) => !v)}
              className={cn(
                "flex items-center gap-2 rounded-full px-2 py-1 text-sm transition-shadow",
                isDark ? "bg-slate-700 text-white shadow-inner" : "bg-white text-gray-700 shadow"
              )}
            >
              {/* small sliding knob */}
              <div className={cn("relative w-12 h-6 flex items-center rounded-full p-1", isDark ? "bg-slate-600" : "bg-yellow-100")}>
                <div className={cn("absolute w-4 h-4 rounded-full bg-white shadow transform transition-all", isDark ? "translate-x-6" : "translate-x-0")}></div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="text-xs">{isDark ? "Night" : "Day"}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Search */}
        <Card className={cn(cardTheme, "mb-6 relative")}>
          <CardContent className="pt-6">
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", isDark ? "text-slate-300" : "text-gray-400")} />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search city (e.g., Mumbai, London, New York)"
                    className={cn("pl-9", isDark ? "bg-slate-700 text-white border-slate-600" : "bg-white")}
                    aria-label="Search city"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && suggestions[0]) {
                        const s = suggestions[0];
                        setSelected(s);
                        setQuery(`${s.name}, ${s.admin1 ? s.admin1 + ", " : ""}${s.country}`);
                        setSuggestions([]);
                      }
                    }}
                  />
                </div>
                <div className="flex-shrink-0">{/* prevent button from shrinking */}
                  <Button
                    aria-label="Use the top matching suggestion"
                    onClick={() => {
                      if (suggestions[0]) {
                        const s = suggestions[0];
                        setSelected(s);
                        setQuery(`${s.name}, ${s.admin1 ? s.admin1 + ", " : ""}${s.country}`);
                        setSuggestions([]);
                      }
                    }}
                    disabled={!suggestions.length}
                  >
                    <MapPin className="mr-2 h-4 w-4" /> Use Top Match
                  </Button>

                  {/* NEW Clear button placed beside Use Top Match - minimal behavior: clears query + suggestions */}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setQuery("");
                      setSuggestions([]);
                    }}
                    disabled={!query && suggestions.length === 0}
                    className="ml-2"
                    aria-label="Clear search"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Suggestions dropdown (positioned full-width, not clipped) */}
              {!!suggestions.length && (
                <div className="absolute left-0 right-0 z-50 mt-2 w-full">{/* full width dropdown */}
                  <Card className={cn(cardTheme, "w-full")}>
                    <div className="max-h-64 overflow-auto">
                      <div className="p-1">
                        {suggestions.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelected(s);
                              setQuery(`${s.name}, ${s.admin1 ? s.admin1 + ", " : ""}${s.country}`);
                              setSuggestions([]);
                            }}
                            className={cn("flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50", isDark ? "hover:bg-slate-700" : "hover:bg-gray-50")}
                          >
                            <MapPin className="h-4 w-4 text-pink-500" />
                            <div className="flex flex-col items-start min-w-0">
                              <span className="font-medium truncate">{s.name}</span>
                              <span className="text-xs text-gray-500 truncate">{s.admin1 ? `${s.admin1}, ` : ""}{s.country}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: current */}
          <div className="space-y-6">
            <Card className={cardTheme}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-semibold">
                      {selected ? `${selected.name}${selected.country ? ", " + selected.country : ""}` : "–"}
                    </div>
                    <div className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-600")}>{data?.timezone || selected?.timezone || ""}</div>
                  </div>
                  <Badge className={cn(isDark ? "bg-slate-700 border-slate-600" : "bg-gray-50") }>
                    {data && (WEATHER_CODE_MAP[data.current_weather?.weathercode]?.icon || <Sun className="h-4 w-4" />)}
                    <span className="text-xs">{currentDesc || "–"}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                )}
                {!!error && <p className="text-sm text-red-500">{error}</p>}
                {!loading && !error && data && (
                  <div className="space-y-4">
                    <div className="flex items-end gap-4">
                      <div className="text-5xl font-bold leading-none">
                        {Math.round(data.current_weather.temperature)}
                        <span className="align-super text-2xl">{unitLabels.temp}</span>
                      </div>
                      <div className={cn("space-y-1 text-sm", isDark ? "text-slate-300" : "text-gray-700")}>
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4" /> Feels like
                          <b className={cn(isDark ? "text-white" : "text-gray-900")}>{Math.round(feelsLike)}{unitLabels.temp}</b>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wind className="h-4 w-4" /> Wind
                          <b className={cn(isDark ? "text-white" : "text-gray-900")}>{Math.round(data.current_weather.windspeed)} {unitLabels.wind}</b>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4" /> Humidity
                          <b className={cn(isDark ? "text-white" : "text-gray-900")}>{Math.round(humidityNow)}%</b>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4" /> Pressure
                          <b className={cn(isDark ? "text-white" : "text-gray-900")}>{fmt(pressureNow)}</b> {unitLabels.pressure}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3">
                      <MiniInfo label="UV Index" value={fmt(data.daily?.uv_index_max?.[0])} icon={<Sun className="h-4 w-4" />} />
                      <MiniInfo label="Precip (24h)" value={`${fmt(data.daily?.precipitation_sum?.[0])} ${unitLabels.precip}`} icon={<CloudRain className="h-4 w-4" />} />
                      <MiniInfo label="Wind (max)" value={`${fmt(data.daily?.windspeed_10m_max?.[0])} ${unitLabels.wind}`} icon={<Wind className="h-4 w-4" />} />
                      <MiniInfo label="Clouds now" value={`${Math.round(cloudNow)}%`} icon={<Cloud className="h-4 w-4" />} />
                      <MiniInfo label="Sunrise" value={data.daily?.sunrise?.[0] ? new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "–"} icon={<Sun className="h-4 w-4" />} />
                      <MiniInfo label="Sunset" value={data.daily?.sunset?.[0] ? new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "–"} icon={<Moon className="h-4 w-4" />} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 7‑day forecast (fixed and responsive, stacked vertically to avoid overlap) */}
            <Card className={cardTheme}>
              <CardHeader>
                <CardTitle>7‑Day Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                {!data && loading && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                )}

                {data && !loading && !error && (
                  // responsive grid: will wrap naturally and never force horizontal overflow
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {data.daily.time.map((d, i) => (
                      // STACK DATE above TEMPERATURE to avoid overlap; added explicit truncation and spacing
                      <div key={d} className={cn("flex flex-col items-center sm:items-start rounded-xl border p-3 min-w-0 w-full overflow-hidden", isDark ? "border-slate-700" : "") }>
                        <div className="flex w-full items-center gap-3 min-w-0">
                          <span className={cn("w-12 text-sm", isDark ? "text-slate-400" : "text-gray-600")}>{isoToWeekday(d)}</span>
                          <div className="flex items-center gap-2 text-sm min-w-0">
                            {iconForCode(data.daily.weathercode?.[i])}
                            <span className={cn("truncate max-w-[10rem]", isDark ? "text-slate-200" : "text-gray-900")}>{WEATHER_CODE_MAP[data.daily.weathercode?.[i]]?.label || ""}</span>
                          </div>
                        </div>

                        <div className="mt-2 text-sm font-medium w-full text-center sm:text-left">
                          {Math.round(data.daily.temperature_2m_min?.[i] ?? 0)}{unitLabels.temp}
                          <span className="mx-1">–</span>
                          {Math.round(data.daily.temperature_2m_max?.[i] ?? 0)}{unitLabels.temp}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: simple hourly list (next 24h) */}
          <div className="space-y-6 lg:col-span-2">
            <Card className={cardTheme}>
              <CardHeader>
                <CardTitle>Next 24 Hours</CardTitle>
              </CardHeader>
              <CardContent>
                {!data && loading && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                )}
                {data && !loading && !error && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {hourlySlice(data.hourly, 24).map((h) => (
                      <div key={h.time} className={cn("flex flex-col gap-1 rounded-xl border p-3", isDark ? "border-slate-700" : "bg-white") }>
                        <div className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-600")}>{isoToHour(h.time)}</div>
                        <div className="flex items-baseline gap-1 text-lg font-semibold">
                          {Math.round(h.temperature)}
                          <span className="text-xs">{unitLabels.temp}</span>
                        </div>
                        <div className={cn("text-xs", isDark ? "text-slate-200" : "text-gray-900")}>Feels {Math.round(h.apparent)}{unitLabels.temp}</div>
                        <div className={cn("text-xs", isDark ? "text-slate-200" : "text-gray-900")}>Wind {Math.round(h.wind)} {unitLabels.wind}</div>
                        <div className={cn("text-xs", isDark ? "text-slate-200" : "text-gray-900")}>Hum {Math.round(h.humidity)}%</div>
                        <div className={cn("text-xs", isDark ? "text-slate-200" : "text-gray-900")}>Precip {fmt(h.precip)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {!loading && !error && !data && (
                  <div className={cn("text-sm", isDark ? "text-slate-200" : "text-gray-900")}>Type a city name to see the forecast.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------- Small Helpers --------------

function MiniInfo({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xs font-semibold">{value ?? "–"}</div>
    </div>
  );
}