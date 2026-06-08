import { Injectable } from "@nestjs/common";
import { NominatimGeocodingProvider } from "../../providers/geocoding/nominatim-geocoding.provider";
import type { GeocodingResult } from "./geocoding-provider.interface";

interface StaticCoordinates {
  latitude: number;
  longitude: number;
  country: string;
}

const STATIC_CITY_COORDINATES: Record<string, StaticCoordinates> = {
  berlin: { latitude: 52.52, longitude: 13.405, country: "Deutschland" },
  rom: { latitude: 41.9028, longitude: 12.4964, country: "Italien" },
  rome: { latitude: 41.9028, longitude: 12.4964, country: "Italien" },
  paris: { latitude: 48.8566, longitude: 2.3522, country: "Frankreich" },
  barcelona: { latitude: 41.3874, longitude: 2.1686, country: "Spanien" },
  london: { latitude: 51.5072, longitude: -0.1276, country: "Vereinigtes Koenigreich" },
  istanbul: { latitude: 41.0082, longitude: 28.9784, country: "Tuerkei" }
};

@Injectable()
export class GeocodingService {
  constructor(private readonly nominatimGeocodingProvider: NominatimGeocodingProvider) {}

  async geocodeDestination(destination: string): Promise<GeocodingResult | null> {
    const nominatimResult = await this.nominatimGeocodingProvider.geocodeDestination(destination);

    if (nominatimResult) {
      return nominatimResult;
    }

    return this.resolveStaticFallback(destination);
  }

  getGeocodingSourceSummary(result: GeocodingResult | null): string {
    if (!result) {
      return "Geocoding Fallback: no coordinates available";
    }

    return result.source === "nominatim"
      ? "Geocoding Source: Nominatim"
      : "Geocoding Fallback: static coordinates";
  }

  private resolveStaticFallback(destination: string): GeocodingResult | null {
    const normalizedDestination = this.normalizeDestination(destination);
    const coordinates = STATIC_CITY_COORDINATES[normalizedDestination];

    if (!coordinates) {
      return null;
    }

    return {
      destinationName: destination.trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      country: coordinates.country,
      source: "static-fallback"
    };
  }

  private normalizeDestination(destination: string): string {
    return destination
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }
}
