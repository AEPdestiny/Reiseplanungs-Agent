import { Injectable } from "@nestjs/common";
import type { GeocodingProvider, GeocodingResult } from "../../modules/geocoding/geocoding-provider.interface";

interface NominatimSearchResult {
  display_name?: unknown;
  lat?: unknown;
  lon?: unknown;
  address?: {
    country?: unknown;
  };
}

@Injectable()
export class NominatimGeocodingProvider implements GeocodingProvider {
  private readonly searchUrl = "https://nominatim.openstreetmap.org/search";
  private readonly timeoutMs = 5000;
  private readonly userAgent = "Reiseplanungs-Agent/0.1 (https://github.com/AEPdestiny/Reiseplanungs-Agent)";

  async geocodeDestination(destination: string): Promise<GeocodingResult | null> {
    const normalizedDestination = destination.trim();

    if (!normalizedDestination) {
      return null;
    }

    try {
      const results = await this.fetchSearchResults(normalizedDestination);
      const firstResult = results[0];

      return firstResult ? this.toGeocodingResult(firstResult, normalizedDestination) : null;
    } catch {
      return null;
    }
  }

  private async fetchSearchResults(destination: string): Promise<NominatimSearchResult[]> {
    const url = new URL(this.searchUrl);
    url.searchParams.set("q", destination);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json"
        },
        signal: controller.signal
      });

      if (!response.ok) {
        return [];
      }

      const payload = await response.json();
      return Array.isArray(payload) ? (payload as NominatimSearchResult[]) : [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private toGeocodingResult(result: NominatimSearchResult, fallbackName: string): GeocodingResult | null {
    const latitude = this.toCoordinate(result.lat, 90);
    const longitude = this.toCoordinate(result.lon, 180);

    if (latitude === null || longitude === null) {
      return null;
    }

    return {
      destinationName: this.toNonEmptyString(result.display_name) ?? fallbackName,
      latitude,
      longitude,
      country: this.toNonEmptyString(result.address?.country) ?? undefined,
      source: "nominatim"
    };
  }

  private toCoordinate(value: unknown, maxAbsoluteValue: number): number | null {
    const parsed = typeof value === "string" ? Number(value) : typeof value === "number" ? value : Number.NaN;
    return Number.isFinite(parsed) && Math.abs(parsed) <= maxAbsoluteValue ? parsed : null;
  }

  private toNonEmptyString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }
}
