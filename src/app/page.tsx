"use client";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  MapPin,
  Search,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  X,
} from "lucide-react";

// ⭐ IMPROVED: Optimized className utility with better type safety
function cn(...cls: Array<string | false | null | undefined>): string {
  return cls.filter(Boolean).join(" ");
}

// ⭐ IMPROVED: Removed unused Gauge import and Button component (not used anywhere)

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input
    {...props}
    ref={ref}
    className={cn(
      "w-full rounded-xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 border-gray-200 dark:border-slate-700",
      props.className,
    )}
  />
));
Input.displayName = "Input";

const Card = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      "rounded-3xl border backdrop-blur-xl transition-all duration-300",
      props.className,
    )}
  />
);

const CardHeader = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn("px-4 py-4 sm:px-6 sm:pt-6 sm:pb-2", props.className)}
  />
);

const CardTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    {...rest}
    className={cn("text-lg font-bold tracking-tight", className)}
  >
    {children}
  </div>
);

const CardContent = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn("px-4 pb-4 sm:px-6 sm:pb-6", props.className)}
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
      className,
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

// ⭐ IMPROVED: Better type definitions with const assertions
type Units = "metric" | "imperial";

interface GeoPlace {
  id: number | string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface CurrentWeather {
  time: string;
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day?: 0 | 1;
}

interface HourlyData {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  windspeed_10m: number[];
  surface_pressure: number[];
  cloudcover: number[];
}

interface DailyData {
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
}

interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather: CurrentWeather;
  hourly: HourlyData;
  daily: DailyData;
}

interface HourlyItem {
  time: string;
  temperature: number;
  apparent: number;
  wind: number;
  humidity: number;
  precip: number;
}

// ⭐ IMPROVED: Extracted weather code map as const for better performance
const WEATHER_CODE_MAP = {
  0: { label: "Clear sky", icon: <Sun className="w-5 h-5 text-orange-400" /> },
  1: { label: "Mainly clear", icon: <Sun className="w-5 h-5 text-orange-400" /> },
  2: { label: "Partly cloudy", icon: <Cloud className="w-5 h-5 text-blue-400" /> },
  3: { label: "Overcast", icon: <Cloud className="w-5 h-5 text-slate-400" /> },
  45: { label: "Fog", icon: <Cloud className="w-5 h-5" /> },
  48: { label: "Rime fog", icon: <Cloud className="w-5 h-5" /> },
  51: { label: "Light drizzle", icon: <CloudRain className="w-5 h-5 text-blue-300" /> },
  53: { label: "Drizzle", icon: <CloudRain className="w-5 h-5 text-blue-400" /> },
  55: { label: "Dense drizzle", icon: <CloudRain className="w-5 h-5 text-blue-500" /> },
  61: { label: "Slight rain", icon: <CloudRain className="w-5 h-5 text-blue-400" /> },
  63: { label: "Rain", icon: <CloudRain className="w-5 h-5 text-blue-600" /> },
  65: { label: "Heavy rain", icon: <CloudRain className="w-5 h-5 text-blue-800" /> },
  71: { label: "Slight snow", icon: <Snowflake className="w-5 h-5 text-sky-200" /> },
  73: { label: "Snow", icon: <Snowflake className="w-5 h-5 text-sky-300" /> },
  75: { label: "Heavy snow", icon: <Snowflake className="w-5 h-5 text-sky-400" /> },
  77: { label: "Snow grains", icon: <Snowflake className="w-5 h-5 text-sky-500" /> },
  80: { label: "Rain showers", icon: <CloudRain className="w-5 h-5" /> },
  81: { label: "Heavy showers", icon: <CloudRain className="w-5 h-5" /> },
  82: { label: "Violent showers", icon: <CloudRain className="w-5 h-5" /> },
  85: { label: "Snow showers", icon: <Snowflake className="w-5 h-5" /> },
  86: { label: "Heavy snow showers", icon: <Snowflake className="w-5 h-5" /> },
  95: { label: "Thunderstorm", icon: <CloudLightning className="w-5 h-5 text-yellow-500" /> },
  96: { label: "Thunder w/ hail", icon: <CloudLightning className="w-5 h-5" /> },
  99: { label: "Heavy hail", icon: <CloudLightning className="w-5 h-5" /> },
} as const;

// ⭐ IMPROVED: Default city as a constant
const DEFAULT_CITY: GeoPlace = {
  id: 1261481,
  name: "New Delhi",
  country: "India",
  admin1: "Delhi",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia",
};

// ⭐ IMPROVED: Helper functions outside component for better performance
const fmt = (n: number | undefined, digits = 0): string =>
  Number.isFinite(n as number) ? (n as number).toFixed(digits) : "–";

const isoToHour = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const isoToWeekday = (iso: string): string =>
  new Date(iso).toLocaleDateString([], { weekday: "short" });

// ⭐ IMPROVED: Custom hook with generic type
function useDebounce<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ⭐ IMPROVED: Optimized nearest hour calculation
function nearestHourValue(times: string[] = [], values: number[] = []): number {
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

// ⭐ IMPROVED: Type-safe icon retrieval
function iconForCode(code?: number): React.ReactNode {
  if (typeof code === "number" && code in WEATHER_CODE_MAP) {
    return WEATHER_CODE_MAP[code as keyof typeof WEATHER_CODE_MAP].icon;
  }
  return <Sun className="w-4 h-4" />;
}

// ⭐ IMPROVED: More efficient hourly slice with better typing
function hourlySlice(hourly: HourlyData | undefined, n: number): HourlyItem[] {
  if (!hourly) return [];
  
  const {
    time = [],
    temperature_2m = [],
    apparent_temperature = [],
    windspeed_10m = [],
    relative_humidity_2m = [],
    precipitation = [],
  } = hourly;

  const now = Date.now();
  const items: HourlyItem[] = [];

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

  // If no future items, get first n items
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);
  const debouncedQuery = useDebounce(query);

  // ⭐ IMPROVED: Initialize with default city only once
  useEffect(() => {
    if (!selected) {
      setSelected(DEFAULT_CITY);
    }
  }, [selected]);

  // ⭐ IMPROVED: Geocoding search with better error handling
  useEffect(() => {
    const controller = new AbortController();

    const fetchSuggestions = async () => {
      const trimmedQuery = debouncedQuery?.trim();
      
      if (!trimmedQuery || trimmedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      if (isSelectingRef.current) {
        setSuggestions([]);
        return;
      }

      if (selected && trimmedQuery === `${selected.name}, ${selected.country}`) {
        setSuggestions([]);
        return;
      }

      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", trimmedQuery);
        url.searchParams.set("count", "6");
        
        const response = await fetch(url.toString(), { signal: controller.signal });
        const json = await response.json();
        setSuggestions(json?.results || []);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setSuggestions([]);
        }
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [debouncedQuery, selected]);

  // ⭐ IMPROVED: Weather data fetching with better organization
  useEffect(() => {
    const controller = new AbortController();

    const fetchWeatherData = async () => {
      if (!selected) return;

      setLoading(true);
      setError(null);

      try {
        const isMetric = units === "metric";
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        
        // ⭐ IMPROVED: Organized params setting
        const params = {
          latitude: String(selected.latitude),
          longitude: String(selected.longitude),
          current_weather: "true",
          hourly: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,windspeed_10m,surface_pressure,cloudcover",
          daily: "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,uv_index_max,windspeed_10m_max,sunrise,sunset,weathercode",
          timezone: "auto",
          temperature_unit: isMetric ? "celsius" : "fahrenheit",
          windspeed_unit: isMetric ? "kmh" : "mph",
          precipitation_unit: isMetric ? "mm" : "inch",
        };

        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });

        const response = await fetch(url.toString(), { signal: controller.signal });
        const weatherData: ForecastResponse = await response.json();
        setData(weatherData);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setError((err as Error)?.message || "Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
    return () => controller.abort();
  }, [selected, units]);

  // ⭐ IMPROVED: useCallback for stable function reference
  const handleSelectCity = useCallback((city: GeoPlace) => {
    isSelectingRef.current = true;
    setSelected(city);
    setQuery(`${city.name}, ${city.country}`);
    setSuggestions([]);
    inputRef.current?.blur();
    
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  }, []);

  // ⭐ IMPROVED: useCallback for clear button
  const handleClearQuery = useCallback(() => {
    setQuery("");
    setSuggestions([]);
  }, []);

  // ⭐ IMPROVED: useCallback for scroll
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ⭐ IMPROVED: Memoized values with proper dependencies
  const unitLabels = useMemo(
    () => ({
      temp: units === "metric" ? "°C" : "°F",
      wind: units === "metric" ? "km/h" : "mph",
      precip: units === "metric" ? "mm" : "in",
      pressure: "hPa",
    }),
    [units]
  );

  const feelsLike = useMemo(
    () => data ? nearestHourValue(data.hourly?.time, data.hourly?.apparent_temperature) : 0,
    [data]
  );

  const humidityNow = useMemo(
    () => data ? nearestHourValue(data.hourly?.time, data.hourly?.relative_humidity_2m) : 0,
    [data]
  );

  const cardTheme = useMemo(
    () =>
      isDark
        ? "bg-slate-900/60 border-slate-700/50 shadow-2xl shadow-black/20 text-white"
        : "bg-white/80 border-white/40 shadow-xl shadow-indigo-100/50 text-slate-900",
    [isDark]
  );

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
        <header className="sticky top-0 z-50 py-2 sm:py-3 mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-inherit/10 backdrop-blur-md">
          <button
            onClick={scrollToTop}
            className="group flex flex-col items-start transition-transform active:scale-95 w-full sm:w-auto"
          >
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
              aria-label="Toggle dark mode"
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
                  if (e.key === "Enter" && suggestions[0]) {
                    handleSelectCity(suggestions[0]);
                  }
                }}
              />
              {query && (
                <button
                  onClick={handleClearQuery}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 opacity-40" />
                </button>
              )}
            </div>
          </div>

          {suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 z-[70] mt-2 shadow-2xl w-full"
            >
              <Card
                className={cn(
                  cardTheme,
                  "overflow-hidden border-indigo-500/30",
                )}
              >
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSelectCity(suggestion)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-indigo-500/10"
                    >
                      <MapPin className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {suggestion.name}
                        </p>
                        <p className="text-xs opacity-50 truncate">
                          {suggestion.admin1 ? `${suggestion.admin1}, ` : ""}
                          {suggestion.country}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 relative z-10">
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:space-y-8">
            <Card className={cn(cardTheme, "relative overflow-hidden")}>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
              <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                <div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">
                    {selected?.name || "–"}
                  </CardTitle>
                  <p className="text-xs font-bold opacity-40 mt-1 uppercase tracking-widest">
                    {selected?.country}
                  </p>
                </div>
                {data && (
                  <Badge
                    className={
                      isDark ? "bg-white/10" : "bg-indigo-500/10 text-indigo-600"
                    }
                  >
                    {WEATHER_CODE_MAP[data.current_weather?.weathercode as keyof typeof WEATHER_CODE_MAP]?.label}
                  </Badge>
                )}
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
                        <div className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter">
                          {Math.round(data.current_weather.temperature)}°
                        </div>
                        <div className="text-indigo-500">
                          {iconForCode(data.current_weather.weathercode)}
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
            <Card className={cardTheme}>
              <CardHeader>
                <CardTitle>Hourly Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                  {data &&
                    hourlySlice(data.hourly, 24).map((hour) => (
                      <div
                        key={hour.time}
                        className="flex flex-col items-center gap-2 sm:gap-3 min-w-[72px] sm:min-w-[80px] rounded-2xl p-3 sm:p-4 transition-colors hover:bg-indigo-500/5 snap-center"
                      >
                        <span className="text-xs font-bold opacity-40 uppercase text-center">
                          {isoToHour(hour.time)}
                        </span>
                        <div className="p-1.5 sm:p-2 rounded-full bg-indigo-500/10 text-indigo-500">
                          <Thermometer className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                        </div>
                        <span className="font-bold text-base sm:text-lg">
                          {Math.round(hour.temperature)}°
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
                  {data?.daily.time.map((day, index) => (
                    <div
                      key={day}
                      className="flex items-center justify-between rounded-2xl border border-white/5 p-3 sm:p-4 transition-all hover:bg-indigo-500/5"
                    >
                      <span className="w-14 sm:w-16 font-bold text-indigo-500 uppercase text-xs whitespace-nowrap">
                        {isoToWeekday(day)}
                      </span>

                      <div className="flex items-center gap-2 sm:gap-3 flex-1 px-2 sm:px-4 min-w-0">
                        {iconForCode(data.daily.weathercode?.[index])}
                        <span className="text-sm font-medium opacity-70 truncate">
                          {WEATHER_CODE_MAP[data.daily.weathercode?.[index] as keyof typeof WEATHER_CODE_MAP]?.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 sm:text-sm font-bold whitespace-nowrap text-xs">
                        <span className="opacity-40">
                          {Math.round(data.daily.temperature_2m_min?.[index])}°
                        </span>
                        <div className="h-1 w-6 sm:w-8 md:w-12 rounded-full bg-gradient-to-r from-indigo-300 to-indigo-600 hidden xs:block flex-shrink-0" />
                        <span>
                          {Math.round(data.daily.temperature_2m_max?.[index])}°
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

// ⭐ IMPROVED: Memoized DetailBox component to prevent unnecessary re-renders
const DetailBox = React.memo<{
  label: string;
  value: string;
  icon: React.ReactNode;
}>(({ label, value, icon }) => {
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
});

DetailBox.displayName = "DetailBox";