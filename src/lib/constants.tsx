import { Sun, Cloud, CloudRain, CloudLightning, Snowflake } from "lucide-react";
import { GeoPlace } from "./types";

export const DEFAULT_CITY: GeoPlace = {
  id: 1261481,
  name: "New Delhi",
  country: "India",
  admin1: "Delhi",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia",
};

export const WEATHER_CODE_MAP = {
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