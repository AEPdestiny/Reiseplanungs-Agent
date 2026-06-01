import type { TripRequest, WeatherEvent, WeatherSummary } from "@travel-agent/shared";

export interface WeatherProvider {
  getWeatherForTrip(request: TripRequest): Promise<WeatherSummary[]>;
  simulateWeatherEvent(event: WeatherEvent): Promise<WeatherEvent>;
}
