export type Units = "metric" | "imperial";

export interface GeoPlace {
  id: number | string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather: {
    time: string;
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day?: 0 | 1;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    windspeed_10m: number[];
    surface_pressure: number[];
    cloudcover: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    uv_index_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}