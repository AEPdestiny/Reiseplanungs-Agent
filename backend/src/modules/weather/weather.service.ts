import { Injectable } from "@nestjs/common";
import type { TripRequest, WeatherEvent, WeatherSummary } from "@travel-agent/shared";
import { MockWeatherProvider } from "../../providers/weather/mock-weather-provider";
import { GeocodingService } from "../geocoding/geocoding.service";
import { OpenMeteoWeatherProvider } from "./providers/open-meteo-weather.provider";

export type WeatherSource = "open-meteo" | "mock-fallback";
export type GeocodingSource = "nominatim" | "static-fallback" | "none";

interface WeatherLookupMetadata {
  weatherSource: WeatherSource;
  geocodingSource: GeocodingSource;
}

@Injectable()
export class WeatherService {
  private readonly weatherMetadata = new WeakMap<WeatherSummary[], WeatherLookupMetadata>();

  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly openMeteoWeatherProvider: OpenMeteoWeatherProvider,
    private readonly mockWeatherProvider: MockWeatherProvider
  ) {}

  async getWeatherForTrip(request: TripRequest): Promise<WeatherSummary[]> {
    const geocodingResult = await this.geocodingService.geocodeDestination(request.destination);

    if (!geocodingResult) {
      return await this.getMockWeather(request, "none");
    }

    try {
      const weather = await this.openMeteoWeatherProvider.getWeatherForCoordinates(geocodingResult, request.durationDays);
      this.weatherMetadata.set(weather, {
        weatherSource: "open-meteo",
        geocodingSource: geocodingResult.source
      });
      return weather;
    } catch {
      return await this.getMockWeather(request, geocodingResult.source);
    }
  }

  simulateWeatherEvent(event: WeatherEvent): Promise<WeatherEvent> {
    return this.mockWeatherProvider.simulateWeatherEvent(event);
  }

  getWeatherSource(weather: WeatherSummary[]): WeatherSource {
    return this.weatherMetadata.get(weather)?.weatherSource ?? "mock-fallback";
  }

  getGeocodingSource(weather: WeatherSummary[]): GeocodingSource {
    return this.weatherMetadata.get(weather)?.geocodingSource ?? "none";
  }

  getWeatherSourceSummary(weather: WeatherSummary[]): string {
    return this.getWeatherSource(weather) === "open-meteo" ? "Weather Source: Open-Meteo" : "Weather Source: Mock Fallback";
  }

  getGeocodingSourceSummary(weather: WeatherSummary[]): string {
    const geocodingSource = this.getGeocodingSource(weather);

    if (geocodingSource === "nominatim") {
      return "Geocoding Source: Nominatim";
    }

    return geocodingSource === "static-fallback"
      ? "Geocoding Fallback: static coordinates"
      : "Geocoding Fallback: no coordinates available";
  }

  private async getMockWeather(request: TripRequest, geocodingSource: GeocodingSource): Promise<WeatherSummary[]> {
    const weather = await this.mockWeatherProvider.getWeatherForTrip(request);
    this.weatherMetadata.set(weather, {
      weatherSource: "mock-fallback",
      geocodingSource
    });
    return weather;
  }
}
