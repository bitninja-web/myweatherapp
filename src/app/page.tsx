"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  MapPin,
  Search,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// UI Components
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Logic & Utils
import { WEATHER_CODE_MAP, DEFAULT_CITY } from "@/lib/constants";
import {
  fmt,
  isoToHour,
  isoToWeekday,
  nearestHourValue,
  hourlySlice,
} from "@/lib/weather-utils";
import { useDebounce } from "@/hooks/useDebounce";
import { GeoPlace, ForecastResponse, Units } from "@/lib/types";
import { DetailBox } from "@/components/ui/weather/DetailBox";

function iconForCode(code?: number): React.ReactNode {
  if (typeof code === "number" && code in WEATHER_CODE_MAP) {
    return WEATHER_CODE_MAP[code as keyof typeof WEATHER_CODE_MAP].icon;
  }
  return <Sun className="w-4 h-4" />;
}

export default function WeatherApp() {
  const [units, setUnits] = useState<Units>("metric");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoPlace[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<GeoPlace | null>(null);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    if (!selected) setSelected(DEFAULT_CITY);
  }, [selected]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchSuggestions = async () => {
      const trimmedQuery = debouncedQuery?.trim();
      if (!trimmedQuery || trimmedQuery.length < 2 || isSelectingRef.current) {
        setSuggestions([]);
        return;
      }
      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", trimmedQuery);
        url.searchParams.set("count", "6");
        const res = await fetch(url.toString(), { signal: controller.signal });
        const json = await res.json();
        setSuggestions(json?.results || []);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setSuggestions([]);
      }
    };
    fetchSuggestions();
    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchWeatherData = async () => {
      if (!selected) return;
      setLoading(true);
      setError(null);
      try {
        const isMetric = units === "metric";
        const url = new URL("https://api.open-meteo.com/v1/forecast");
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
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        const res = await fetch(url.toString(), { signal: controller.signal });
        const weatherData = await res.json();
        setData(weatherData);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError")
          setError("Failed to fetch weather data.");
      } finally {
        setLoading(false);
      }
    };
    fetchWeatherData();
    return () => controller.abort();
  }, [selected, units]);

  const handleSelectCity = useCallback((city: GeoPlace) => {
    isSelectingRef.current = true;
    setSelected(city);
    setQuery(city.name);
    setSuggestions([]);
    setActiveIndex(-1);
    inputRef.current?.blur();
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 500);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIndex === -1 ? suggestions[0] : suggestions[activeIndex];
      if (target) handleSelectCity(target);
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  const unitLabels = useMemo(() => ({
    wind: units === "metric" ? "km/h" : "mph",
    temp: units === "metric" ? "°C" : "°F",
  }), [units]);

  const feelsLike = useMemo(() => 
    data ? nearestHourValue(data.hourly?.time, data.hourly?.apparent_temperature) : 0, 
  [data]);
  
  const humidityNow = useMemo(() => 
    data ? nearestHourValue(data.hourly?.time, data.hourly?.relative_humidity_2m) : 0, 
  [data]);

  const cardTheme = useMemo(() =>
    isDark
      ? "bg-slate-900/60 border-slate-700/50 text-slate-100 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
      : "bg-white/70 border-white/50 text-slate-900 shadow-xl backdrop-blur-xl ring-1 ring-indigo-500/5",
    [isDark]
  );

  return (
    <div className={cn(
        "min-h-screen transition-colors duration-1000 relative font-sans",
        isDark ? "dark bg-[#020617]" : "bg-gradient-to-br from-indigo-50 via-white to-sky-50"
      )}>
      {/* Background Blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={cn("absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20", isDark ? "bg-indigo-500" : "bg-indigo-300")} />
        <div className={cn("absolute bottom-[10%] -right-[10%] w-[30%] h-[30%] rounded-full blur-[120px] opacity-20", isDark ? "bg-blue-500" : "bg-blue-300")} />
      </div>

      <div className="mx-auto max-w-6xl p-4 sm:p-8 relative z-10">
        <header className="sticky top-0 z-[100] flex items-center justify-between mb-8 py-4 px-4 -mx-4 backdrop-blur-xl bg-transparent transition-all border-b border-white/10">
          <button 
            onClick={scrollToTop}
            className="text-2xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-500 to-sky-500 hover:scale-105 transition-transform"
          >
            AI Weather
          </button>

          <div className="flex items-center gap-3">
            <div className={cn("flex rounded-xl p-1 ring-1", isDark ? "bg-slate-800/80 ring-white/10" : "bg-white ring-black/5 shadow-sm")}>
              {["metric", "imperial"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnits(u as Units)}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                    units === u ? "bg-indigo-600 text-white shadow-lg" : isDark ? "text-slate-400 hover:text-slate-100" : "opacity-50 hover:opacity-80"
                  )}
                >
                  {u === "metric" ? "°C" : "°F"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
            >
              {isDark ? <Moon className="text-blue-400 h-5 w-5" /> : <Sun className="text-orange-500 h-5 w-5" />}
            </button>
          </div>
        </header>

        <div className="relative mb-8 z-50">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search city"
            className={cn(
              "h-14 pl-12 pr-12 rounded-2xl shadow-lg border-white/20 backdrop-blur-md focus:ring-2 focus:ring-indigo-500/50 transition-all text-base",
              isDark ? "bg-slate-900/80 text-white placeholder:text-slate-500" : "bg-white/50 text-slate-900"
            )}
          />
          <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5", isDark ? "text-slate-500" : "opacity-40")} />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity">
              <X className={cn("h-5 w-5", isDark && "text-white")} />
            </button>
          )}

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
              {suggestions.map((s, idx) => (
                <button
                  key={s.id}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelectCity(s)}
                  className={cn(
                    "w-full p-4 text-left transition-all flex items-center gap-3 border-b last:border-0 border-gray-100 dark:border-slate-800",
                    activeIndex === idx ? "bg-indigo-600 text-white" : "hover:bg-indigo-500/10 dark:text-slate-200"
                  )}
                >
                  <MapPin className={cn("h-4 w-4", activeIndex === idx ? "text-white" : "text-indigo-500")} />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className={cn("text-xs", activeIndex === idx ? "text-indigo-100" : "opacity-50 dark:opacity-70")}>
                      {s.admin1 ? `${s.admin1}, ` : ""}{s.country}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <Card className={cn(cardTheme, "overflow-hidden group hover:scale-[1.01] transition-transform duration-300 border-none shadow-2xl")}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500" />
              <CardHeader className="flex-row justify-between items-start pb-2">
                <div>
                  <CardTitle className="text-4xl font-bold tracking-tight">{selected?.name}</CardTitle>
                  <p className={cn("text-xs uppercase font-bold tracking-[0.1em] mt-1", isDark ? "text-slate-400" : "opacity-60")}>
                    {selected?.admin1 ? `${selected.admin1}, ` : ""}{selected?.country}
                  </p>
                  {data && (
                  <Badge className="mt-3 bg-indigo-600/90 text-white hover:bg-indigo-600 border-none px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider">
                    {WEATHER_CODE_MAP[data.current_weather.weathercode as keyof typeof WEATHER_CODE_MAP]?.label}
                  </Badge>
                )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-48 w-full rounded-xl" /> : data && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-6 py-4">
                      <div className={cn("text-[100px] font-black leading-none tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                        {Math.round(data.current_weather.temperature)}°
                      </div>
                      <div className="text-sky-500 transform group-hover:scale-110 transition-transform duration-500 w-14 h-14">
                        {iconForCode(data.current_weather.weathercode)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailBox label="FEELS LIKE" value={`${Math.round(feelsLike)}°`} icon={<Thermometer className="h-4 w-4" />} />
                      <DetailBox label="HUMIDITY" value={`${Math.round(humidityNow)}%`} icon={<Droplets className="h-4 w-4" />} />
                      <DetailBox label="WIND" value={`${Math.round(data.current_weather.windspeed)} ${unitLabels.wind}`} icon={<Wind className="h-4 w-4" />} />
                      <DetailBox label="UV INDEX" value={fmt(data.daily.uv_index_max[0])} icon={<Sun className="h-4 w-4" />} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cn(cardTheme, "hover:bg-indigo-500/[0.02] transition-colors")}>
              <CardHeader className="pb-2">
                <CardTitle className={cn("text-xs uppercase tracking-widest font-bold", isDark ? "text-slate-400" : "opacity-50")}>Astronomical</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className={cn("p-4 rounded-2xl border border-white/10", isDark ? "bg-white/5" : "bg-slate-100/50")}>
                  <p className={cn("text-[10px] font-bold uppercase mb-1", isDark ? "text-slate-500" : "opacity-40")}>Sunrise</p>
                  <p className="text-lg font-black text-orange-400">{data ? isoToHour(data.daily.sunrise[0]) : "–"}</p>
                </div>
                <div className={cn("p-4 rounded-2xl border border-white/10", isDark ? "bg-white/5" : "bg-slate-100/50")}>
                  <p className={cn("text-[10px] font-bold uppercase mb-1", isDark ? "text-slate-500" : "opacity-40")}>Sunset</p>
                  <p className="text-lg font-black text-indigo-400">{data ? isoToHour(data.daily.sunset[0]) : "–"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <Card className={cardTheme}>
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="h-5 w-1 bg-indigo-500 rounded-full" />
                  Hourly Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
                  {data && hourlySlice(data.hourly, 24).map((h) => (
                    <div key={h.time} className={cn(
                      "flex flex-col items-center min-w-[100px] p-6 rounded-2xl transition-all border border-transparent hover:border-indigo-500/20 snap-center group",
                      isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100/50 hover:bg-white hover:shadow-xl"
                    )}>
                      <span className={cn("text-[10px] font-bold mb-3 uppercase tracking-wider", isDark ? "text-slate-500" : "opacity-40")}>{isoToHour(h.time)}</span>
                      <div className="text-indigo-500 mb-3 transform group-hover:scale-110 transition-transform">
                        <Thermometer className="h-5 w-5" />
                      </div>
                      <span className="font-black text-2xl">{Math.round(h.temperature)}°</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={cardTheme}>
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="h-5 w-1 bg-sky-500 rounded-full" />
                  7-Day Outlook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.daily.time.map((day, i) => (
                  <div key={day} className={cn(
                    "flex items-center justify-between p-5 rounded-2xl transition-all border border-transparent hover:border-indigo-500/20 group",
                    isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100/50 hover:bg-white hover:shadow-lg"
                  )}>
                    <span className="font-bold w-20 text-indigo-600 dark:text-indigo-400">{isoToWeekday(day)}</span>
                    <div className="flex items-center gap-4 flex-1 px-4">
                      <div className="transform group-hover:scale-110 transition-transform text-sky-500">
                        {iconForCode(data.daily.weathercode[i])}
                      </div>
                      <span className={cn("text-sm font-semibold hidden sm:inline", isDark ? "text-slate-300" : "opacity-70")}>
                        {WEATHER_CODE_MAP[data.daily.weathercode[i] as keyof typeof WEATHER_CODE_MAP]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-black">
                      <span className={cn("text-sm", isDark ? "text-slate-500" : "opacity-30")}>{Math.round(data.daily.temperature_2m_min[i])}°</span>
                      <div className="h-1.5 w-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative hidden xs:block">
                         <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-400" />
                      </div>
                      <span className="text-lg">{Math.round(data.daily.temperature_2m_max[i])}°</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}