import { Injectable } from "@nestjs/common";
import type { TripRequest, WeatherEvent, WeatherSummary, WeatherCondition } from "@travel-agent/shared";
import type { GeocodingResult } from "../../geocoding/geocoding-provider.interface";
import type { WeatherProvider } from "../weather-provider.interface";

interface OpenMeteoDailyForecast {
  time?: unknown;
  weather_code?: unknown;
  precipitation_sum?: unknown;
  temperature_2m_max?: unknown;
  temperature_2m_min?: unknown;
}

interface OpenMeteoForecastResponse {
  daily?: OpenMeteoDailyForecast;
}

@Injectable()
export class OpenMeteoWeatherProvider implements WeatherProvider {
  private readonly forecastUrl = "https://api.open-meteo.com/v1/forecast";
  private readonly timeoutMs = 5000;

  async getWeatherForTrip(request: TripRequest): Promise<WeatherSummary[]> {
    throw new Error(`Open-Meteo requires geocoded coordinates for destination: ${request.destination}`);
  }

  async getWeatherForCoordinates(geocodingResult: GeocodingResult, durationDays: number): Promise<WeatherSummary[]> {
    const payload = await this.fetchForecast(geocodingResult, durationDays);
    return this.normalizeForecast(payload, durationDays);
  }

  async simulateWeatherEvent(event: WeatherEvent): Promise<WeatherEvent> {
    return event;
  }

  private async fetchForecast(coordinates: GeocodingResult, durationDays: number): Promise<OpenMeteoForecastResponse> {
    const url = new URL(this.forecastUrl);
    url.searchParams.set("latitude", String(coordinates.latitude));
    url.searchParams.set("longitude", String(coordinates.longitude));
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", String(durationDays));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Open-Meteo request failed with status ${response.status}`);
      }

      return (await response.json()) as OpenMeteoForecastResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeForecast(payload: OpenMeteoForecastResponse, durationDays: number): WeatherSummary[] {
    const daily = payload.daily;
    const weatherCodes = this.asNumberArray(daily?.weather_code);
    const maxTemperatures = this.asNumberArray(daily?.temperature_2m_max);
    const minTemperatures = this.asNumberArray(daily?.temperature_2m_min);
    const precipitationSums = this.asNumberArray(daily?.precipitation_sum);

    if (weatherCodes.length < durationDays) {
      throw new Error("Open-Meteo response does not contain enough daily weather codes.");
    }

    return Array.from({ length: durationDays }, (_, index) => {
      const weatherCode = weatherCodes[index];
      const precipitationSum = precipitationSums[index] ?? 0;
      const condition = this.mapWeatherCode(weatherCode, precipitationSum);
      const maxTemperature = maxTemperatures[index];
      const minTemperature = minTemperatures[index];

      return {
        dayNumber: index + 1,
        condition,
        description: this.createDescription(condition, weatherCode, precipitationSum, minTemperature, maxTemperature),
        affectsOutdoorActivities: this.affectsOutdoorActivities(condition, precipitationSum)
      };
    });
  }

  private asNumberArray(value: unknown): number[] {
    return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item)) : [];
  }

  private mapWeatherCode(weatherCode: number, precipitationSum: number): WeatherCondition {
    if (weatherCode >= 95) {
      return "storm";
    }

    if (weatherCode >= 71 && weatherCode <= 86) {
      return "snow";
    }

    if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || precipitationSum >= 2) {
      return "rain";
    }

    if (weatherCode >= 1 && weatherCode <= 48) {
      return "cloudy";
    }

    return "sunny";
  }

  private createDescription(
    condition: WeatherCondition,
    weatherCode: number,
    precipitationSum: number,
    minTemperature?: number,
    maxTemperature?: number
  ): string {
    const temperaturePart =
      typeof minTemperature === "number" && typeof maxTemperature === "number"
        ? ` Temperaturen ca. ${Math.round(minTemperature)}-${Math.round(maxTemperature)} C.`
        : "";
    const precipitationPart = precipitationSum > 0 ? ` Niederschlag ca. ${Number(precipitationSum.toFixed(1))} mm.` : "";

    return `Weather Source: Open-Meteo. ${this.describeCondition(condition, weatherCode)}.${temperaturePart}${precipitationPart}`.trim();
  }

  private describeCondition(condition: WeatherCondition, weatherCode: number): string {
    const descriptions: Record<WeatherCondition, string> = {
      sunny: "Freundliches Wetter",
      cloudy: "Bewoelktes Wetter",
      rain: "Regenwahrscheinlichkeit fuer die Tagesplanung relevant",
      storm: "Gewitterrisiko fuer Outdoor-Aktivitaeten relevant",
      snow: "Schnee oder winterliche Bedingungen moeglich"
    };

    return `${descriptions[condition]} (WMO ${weatherCode})`;
  }

  private affectsOutdoorActivities(condition: WeatherCondition, precipitationSum: number): boolean {
    return condition === "rain" || condition === "storm" || condition === "snow" || precipitationSum >= 2;
  }
}
