import { Injectable } from "@nestjs/common";
import type { TripRequest, WeatherEvent, WeatherSummary } from "@travel-agent/shared";
import type { WeatherProvider } from "../../modules/weather/weather-provider.interface";

@Injectable()
export class MockWeatherProvider implements WeatherProvider {
  async getWeatherForTrip(request: TripRequest): Promise<WeatherSummary[]> {
    return Array.from({ length: request.durationDays }, (_, index) => {
      const dayNumber = index + 1;

      return {
        dayNumber,
        condition: dayNumber === 2 ? "cloudy" : "sunny",
        description: dayNumber === 2 ? "Bewoelkt, aber trocken planbar." : "Freundliches Stadtwetter.",
        affectsOutdoorActivities: false
      };
    });
  }

  async simulateWeatherEvent(event: WeatherEvent): Promise<WeatherEvent> {
    return event;
  }
}
