import { Injectable } from "@nestjs/common";
import type { TripRequest, WeatherEvent, WeatherSummary } from "@travel-agent/shared";
import { MockWeatherProvider } from "../../providers/weather/mock-weather-provider";

@Injectable()
export class WeatherService {
  constructor(private readonly weatherProvider: MockWeatherProvider) {}

  getWeatherForTrip(request: TripRequest): Promise<WeatherSummary[]> {
    return this.weatherProvider.getWeatherForTrip(request);
  }

  simulateWeatherEvent(event: WeatherEvent): Promise<WeatherEvent> {
    return this.weatherProvider.simulateWeatherEvent(event);
  }
}
