import { Injectable } from "@nestjs/common";
import type { TripRequest, WeatherEvent, WeatherSummary } from "@travel-agent/shared";
import { MockWeatherProvider } from "../../providers/weather/mock-weather-provider";
import { OpenMeteoWeatherProvider } from "./providers/open-meteo-weather.provider";

export type WeatherSource = "open-meteo" | "mock-fallback";

@Injectable()
export class WeatherService {
  private readonly weatherSources = new WeakMap<WeatherSummary[], WeatherSource>();

  constructor(
    private readonly openMeteoWeatherProvider: OpenMeteoWeatherProvider,
    private readonly mockWeatherProvider: MockWeatherProvider
  ) {}

  async getWeatherForTrip(request: TripRequest): Promise<WeatherSummary[]> {
    try {
      const weather = await this.openMeteoWeatherProvider.getWeatherForTrip(request);
      this.weatherSources.set(weather, "open-meteo");
      return weather;
    } catch {
      const weather = await this.mockWeatherProvider.getWeatherForTrip(request);
      this.weatherSources.set(weather, "mock-fallback");
      return weather;
    }
  }

  simulateWeatherEvent(event: WeatherEvent): Promise<WeatherEvent> {
    return this.mockWeatherProvider.simulateWeatherEvent(event);
  }

  getWeatherSource(weather: WeatherSummary[]): WeatherSource {
    return this.weatherSources.get(weather) ?? "mock-fallback";
  }

  getWeatherSourceSummary(weather: WeatherSummary[]): string {
    return this.getWeatherSource(weather) === "open-meteo" ? "Weather Source: Open-Meteo" : "Weather Source: Mock Fallback";
  }
}
