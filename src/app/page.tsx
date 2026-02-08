"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
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
  X,
} from "lucide-react";

function cn(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

const Button = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "ghost";
  },
) => (
  <button
    {...props}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50",
      props.variant === "ghost"
        ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20",
      props.className || "",
    )}
  />
);

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input
    {...props}
    ref={ref}
    className={cn(
      "w-full rounded-xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 border-gray-200 dark:border-slate-700",
      props.className || "",
    )}
  />
));
Input.displayName = "Input";

const Card = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      "rounded-3xl border backdrop-blur-xl transition-all duration-300",
      props.className || "",
    )}
  />
);
const CardHeader = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn("px-4 py-4 sm:px-6 sm:pt-6 sm:pb-2", props.className || "")}
  />
);
const CardTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    {...rest}
    className={cn("text-lg font-bold tracking-tight", className || "")}
  >
    {children}
  </div>
);
const CardContent = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn("px-4 pb-4 sm:px-6 sm:pb-6", props.className || "")}
  />
);

const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  className,
  children,
  ...rest
}) => (
  <span
    {...rest}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider",
      className || "",
    )}
  >
    {children}
  </span>
);

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-700",
      className,
    )}
  />
);

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
  weathercode: number[];
};

type ForecastResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather: CurrentWeather;
  hourly: HourlyData;
  daily: DailyData;
};

const WEATHER_CODE_MAP: Record<
  number,
  { label: string; icon: React.ReactNode }
> = {
  0: { label: "Clear sky", icon: <Sun className="w-5 h-5 text-orange-400" /> },
  1: {
    label: "Mainly clear",
    icon: <Sun className="w-5 h-5 text-orange-400" />,
  },
  2: {
    label: "Partly cloudy",
    icon: <Cloud className="w-5 h-5 text-blue-400" />,
  },
  3: { label: "Overcast", icon: <Cloud className="w-5 h-5 text-slate-400" /> },
  45: { label: "Fog", icon: <Cloud className="w-5 h-5" /> },
  48: { label: "Rime fog", icon: <Cloud className="w-5 h-5" /> },
  51: {
    label: "Light drizzle",
    icon: <CloudRain className="w-5 h-5 text-blue-300" />,
  },
  53: {
    label: "Drizzle",
    icon: <CloudRain className="w-5 h-5 text-blue-400" />,
  },
  55: {
    label: "Dense drizzle",
    icon: <CloudRain className="w-5 h-5 text-blue-500" />,
  },
  61: {
    label: "Slight rain",
    icon: <CloudRain className="w-5 h-5 text-blue-400" />,
  },
  63: { label: "Rain", icon: <CloudRain className="w-5 h-5 text-blue-600" /> },
  65: {
    label: "Heavy rain",
    icon: <CloudRain className="w-5 h-5 text-blue-800" />,
  },
  71: {
    label: "Slight snow",
    icon: <Snowflake className="w-5 h-5 text-sky-200" />,
  },
  73: { label: "Snow", icon: <Snowflake className="w-5 h-5 text-sky-300" /> },
  75: {
    label: "Heavy snow",
    icon: <Snowflake className="w-5 h-5 text-sky-400" />,
  },
  77: {
    label: "Snow grains",
    icon: <Snowflake className="w-5 h-5 text-sky-500" />,
  },
  80: { label: "Rain showers", icon: <CloudRain className="w-5 h-5" /> },
  81: { label: "Heavy showers", icon: <CloudRain className="w-5 h-5" /> },
  82: { label: "Violent showers", icon: <CloudRain className="w-5 h-5" /> },
  85: { label: "Snow showers", icon: <Snowflake className="w-5 h-5" /> },
  86: { label: "Heavy snow showers", icon: <Snowflake className="w-5 h-5" /> },
  95: {
    label: "Thunderstorm",
    icon: <CloudLightning className="w-5 h-5 text-yellow-500" />,
  },
  96: {
    label: "Thunder w/ hail",
    icon: <CloudLightning className="w-5 h-5" />,
  },
  99: { label: "Heavy hail", icon: <CloudLightning className="w-5 h-5" /> },
};

const fmt = (n: number | undefined, digits = 0) =>
  Number.isFinite(n as number) ? (n as number).toFixed(digits) : "–";
const isoToHour = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const isoToWeekday = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: "short" });

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
  if (code === 0 || typeof code === "number")
    return WEATHER_CODE_MAP[code]?.icon ?? <Sun className="w-4 h-4" />;
  return <Sun className="w-4 h-4" />;
}

function hourlySlice(hourly: HourlyData, n: number) {
  const {
    time = [],
    temperature_2m = [],
    apparent_temperature = [],
    windspeed_10m = [],
    relative_humidity_2m = [],
    precipitation = [],
  } = hourly || ({} as HourlyData);
  const now = Date.now();
  const items: {
    time: string;
    temperature: number;
    apparent: number;
    wind: number;
    humidity: number;
    precip: number;
  }[] = [];

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

export default function WeatherApp() {
  const [units, setUnits] = useState<Units>("metric");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoPlace[]>([]);
  const [selected, setSelected] = useState<GeoPlace | null>(null);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    if (!selected) {
      setSelected({
        id: 1261481,
        name: "New Delhi",
        country: "India",
        admin1: "Delhi",
        latitude: 28.6139,
        longitude: 77.209,
        timezone: "Asia",
      });
    }
  }, [selected]);

  // Geocoding Search Logic
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
        const res = await fetch(url.toString(), { signal: controller.signal });
        const j = await res.json();
        setSuggestions(j?.results || []);
      } catch (e: any) {
        if (e?.name !== "AbortError") setSuggestions([]);
      }
    };
    run();
    return () => controller.abort();
  }, [debouncedQuery]);

  // Forecast Data Fetching
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
          "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,windspeed_10m,surface_pressure,cloudcover",
        );
        url.searchParams.set(
          "daily",
          "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,uv_index_max,windspeed_10m_max,sunrise,sunset,weathercode",
        );
        url.searchParams.set("timezone", "auto");
        url.searchParams.set(
          "temperature_unit",
          isMetric ? "celsius" : "fahrenheit",
        );
        url.searchParams.set("windspeed_unit", isMetric ? "kmh" : "mph");
        url.searchParams.set("precipitation_unit", isMetric ? "mm" : "inch");
        const res = await fetch(url.toString(), { signal: controller.signal });
        const j: ForecastResponse = await res.json();
        setData(j);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [selected, units]);

  const handleSelectCity = (city: GeoPlace) => {
    setSelected(city);
    setQuery(`${city.name}, ${city.country}`);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const unitLabels = useMemo(
    () =>
      units === "metric"
        ? { temp: "°C", wind: "km/h", precip: "mm", pressure: "hPa" }
        : { temp: "°F", wind: "mph", precip: "in", pressure: "hPa" },
    [units],
  );

  const feelsLike = useMemo(
    () =>
      data
        ? nearestHourValue(data.hourly?.time, data.hourly?.apparent_temperature)
        : 0,
    [data],
  );
  const humidityNow = useMemo(
    () =>
      data
        ? nearestHourValue(data.hourly?.time, data.hourly?.relative_humidity_2m)
        : 0,
    [data],
  );

  const cardTheme = isDark
    ? "bg-slate-900/60 border-slate-700/50 shadow-2xl shadow-black/20 text-white"
    : "bg-white/80 border-white/40 shadow-xl shadow-indigo-100/50 text-slate-900";

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-700 relative",
        isDark
          ? "bg-[#0b1120] text-slate-100"
          : "bg-gradient-to-br from-sky-200 via-indigo-50 to-white text-slate-900",
      )}
    >
      {!isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl p-2 sm:p-4 md:p-6 lg:p-8">
        {/* UPDATED: Enhanced responsive header - better mobile stacking, smaller padding */}
        <header className="sticky top-0 z-50 py-2 sm:py-3 mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-inherit/10 backdrop-blur-md">
          <button
            onClick={scrollToTop}
            className="group flex flex-col items-start transition-transform active:scale-95 w-full sm:w-auto"
          >
            {/* UPDATED: Responsive title sizing */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-sky-500 dark:from-indigo-400 dark:to-sky-300">
              AI Weather App
            </h1>
            <p
              className={cn(
                "text-xs sm:text-sm font-medium mt-1 opacity-70 group-hover:opacity-100 transition-opacity",
              )}
            >
              Precision weather forecasting
            </p>
          </button>

          {/* UPDATED: Better mobile controls - full width stack on very small screens */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div
              className={cn(
                "flex rounded-2xl p-1 w-full sm:w-auto",
                isDark
                  ? "bg-slate-800/50 border border-slate-700"
                  : "bg-white/50 border border-indigo-100",
              )}
            >
              <button
                onClick={() => setUnits("metric")}
                className={cn(
                  "flex-1 sm:px-4 py-2 sm:py-1.5 text-xs font-bold rounded-xl transition-all",
                  units === "metric"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 dark:text-slate-300",
                )}
              >
                °C
              </button>
              <button
                onClick={() => setUnits("imperial")}
                className={cn(
                  "flex-1 sm:px-4 py-2 sm:py-1.5 text-xs font-bold rounded-xl transition-all",
                  units === "imperial"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 dark:text-slate-300",
                )}
              >
                °F
              </button>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className={cn(
                "relative flex h-9 sm:h-10 w-16 sm:w-20 items-center rounded-full p-1 transition-all self-start sm:self-auto",
                isDark ? "bg-indigo-900/50" : "bg-indigo-100",
              )}
            >
              <div
                className={cn(
                  "flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full transition-all duration-300",
                  isDark
                    ? "translate-x-7 sm:translate-x-10 bg-indigo-500"
                    : "translate-x-0 bg-white",
                )}
              >
                {isDark ? (
                  <Moon className="h-4 w-4 text-white" />
                ) : (
                  <Sun className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </button>
          </div>
        </header>

        {/* UPDATED: Responsive search - touch-friendly height, better dropdown positioning */}
        <div className="relative mb-6 sm:mb-8 z-[60]">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a city..."
                className="pl-10 sm:pl-11 h-11 sm:h-12 text-base rounded-2xl w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestions[0])
                    handleSelectCity(suggestions[0]);
                }}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                  }}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1"
                >
                  <X className="h-4 w-4 opacity-40" />
                </button>
              )}
            </div>
          </div>

          {!!suggestions.length && (
            <div className="absolute left-0 right-0 z-[70] mt-2 shadow-2xl w-full">
              <Card
                className={cn(
                  cardTheme,
                  "overflow-hidden border-indigo-500/30",
                )}
              >
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectCity(s)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-indigo-500/10"
                    >
                      <MapPin className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {s.name}
                        </p>
                        <p className="text-xs opacity-50 truncate">
                          {s.admin1 ? `${s.admin1}, ` : ""}
                          {s.country}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* UPDATED: Explicit responsive grid - single column mobile, proper split lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 relative z-10">
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:space-y-8">
            <Card className={cn(cardTheme, "relative overflow-hidden")}>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
              <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                <div>
                  {/* UPDATED: Responsive card title */}
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">
                    {selected?.name || "–"}
                  </CardTitle>
                  <p className="text-xs font-bold opacity-40 mt-1 uppercase tracking-widest">
                    {selected?.country}
                  </p>
                </div>
                <Badge
                  className={
                    isDark ? "bg-white/10" : "bg-indigo-500/10 text-indigo-600"
                  }
                >
                  {data &&
                    WEATHER_CODE_MAP[data.current_weather?.weathercode]?.label}
                </Badge>
              </CardHeader>

              <CardContent className="pt-0 sm:pt-4">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-32" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  data && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        {/* UPDATED: Responsive temp display */}
                        <div className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter">
                          {Math.round(data.current_weather.temperature)}°
                        </div>
                        <div className="text-indigo-500">
                          {
                            WEATHER_CODE_MAP[data.current_weather.weathercode]
                              ?.icon
                          }
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <DetailBox
                          label="Feels Like"
                          value={`${Math.round(feelsLike)}°`}
                          icon={<Thermometer className="h-4 w-4" />}
                        />
                        <DetailBox
                          label="Humidity"
                          value={`${Math.round(humidityNow)}%`}
                          icon={<Droplets className="h-4 w-4" />}
                        />
                        <DetailBox
                          label="Wind Speed"
                          value={`${Math.round(data.current_weather.windspeed)} ${unitLabels.wind}`}
                          icon={<Wind className="h-4 w-4" />}
                        />
                        <DetailBox
                          label="UV Index"
                          value={fmt(data.daily?.uv_index_max?.[0])}
                          icon={<Sun className="h-4 w-4" />}
                        />
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            <Card className={cardTheme}>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest opacity-50">
                  Astronomical
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold opacity-40">Sunrise</span>
                  <span className="text-lg font-semibold">
                    {data?.daily?.sunrise?.[0]
                      ? isoToHour(data.daily.sunrise[0])
                      : "–"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold opacity-40">Sunset</span>
                  <span className="text-lg font-semibold">
                    {data?.daily?.sunset?.[0]
                      ? isoToHour(data.daily.sunset[0])
                      : "–"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-4 sm:space-y-6 lg:space-y-8">
            <Card className={cn(cardTheme)}>
              <CardHeader>
                <CardTitle>Hourly Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                {/* UPDATED: Better mobile hourly - wider min-width, snap-center for better UX */}
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                  {data &&
                    hourlySlice(data.hourly, 24).map((h) => (
                      <div
                        key={h.time}
                        className="flex flex-col items-center gap-2 sm:gap-3 min-w-[72px] sm:min-w-[80px] rounded-2xl p-3 sm:p-4 transition-colors hover:bg-indigo-500/5 snap-center"
                      >
                        <span className="text-xs font-bold opacity-40 uppercase text-center">
                          {isoToHour(h.time)}
                        </span>
                        <div className="p-1.5 sm:p-2 rounded-full bg-indigo-500/10 text-indigo-500">
                          <Thermometer className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                        </div>
                        <span className="font-bold text-base sm:text-lg">
                          {Math.round(h.temperature)}°
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className={cardTheme}>
              <CardHeader>
                <CardTitle>7-Day Outlook</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.daily.time.map((d, i) => (
                    <div
                      key={d}
                      className="flex items-center justify-between rounded-2xl border border-white/5 p-3 sm:p-4 transition-all hover:bg-indigo-500/5"
                    >
                      {/* FIXED: Consistent responsive day width */}
                      <span className="w-14 sm:w-16 font-bold text-indigo-500 uppercase text-xs whitespace-nowrap">
                        {isoToWeekday(d)}
                      </span>

                      {/* FIXED: Better responsive weather text handling */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 px-2 sm:px-4 min-w-0">
                        {iconForCode(data.daily.weathercode?.[i])}
                        <span className="text-sm font-medium opacity-70 truncate">
                          {WEATHER_CODE_MAP[data.daily.weathercode?.[i]]?.label}
                        </span>
                      </div>

                      {/* UPDATED: Responsive temp bar */}
                      <div className="flex items-center gap-1 sm:gap-2 sm:text-sm font-bold whitespace-nowrap text-xs">
                        <span className="opacity-40">
                          {Math.round(data.daily.temperature_2m_min?.[i])}°
                        </span>
                        <div className="h-1 w-6 sm:w-8 md:w-12 rounded-full bg-gradient-to-r from-indigo-300 to-indigo-600 hidden xs:block flex-shrink-0" />
                        <span>
                          {Math.round(data.daily.temperature_2m_max?.[i])}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-black/5 dark:bg-white/5 p-3 sm:p-4 border border-white/5">
      <div className="flex items-center gap-2 opacity-40">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-base sm:text-lg font-bold tracking-tight">
        {value}
      </span>
    </div>
  );
}