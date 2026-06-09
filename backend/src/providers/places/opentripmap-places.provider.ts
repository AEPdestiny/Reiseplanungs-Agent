import { Injectable } from "@nestjs/common";
import type { GeocodingResult } from "../../modules/geocoding/geocoding-provider.interface";
import type { PlaceCategory, PlaceResult, PlacesProvider } from "../../modules/places/places-provider.interface";

interface OpenTripMapRadiusItem {
  xid?: unknown;
  name?: unknown;
  kinds?: unknown;
  point?: {
    lat?: unknown;
    lon?: unknown;
  };
  rate?: unknown;
}

interface OpenTripMapDetails {
  xid?: unknown;
  name?: unknown;
  kinds?: unknown;
  wikipedia_extracts?: {
    text?: unknown;
  };
  point?: {
    lat?: unknown;
    lon?: unknown;
  };
  rate?: unknown;
}

@Injectable()
export class OpenTripMapPlacesProvider implements PlacesProvider {
  private readonly baseUrl = "https://api.opentripmap.com/0.1/en/places";
  private readonly timeoutMs = 5000;
  private readonly maxDetails = 12;

  isEnabled(): boolean {
    return Boolean(this.getApiKey());
  }

  async getPlacesForDestination(
    _destination: string,
    _interests: string[],
    geocoding?: GeocodingResult | null
  ): Promise<PlaceResult[]> {
    const apiKey = this.getApiKey();

    if (!apiKey || !geocoding) {
      return [];
    }

    try {
      const radiusItems = await this.fetchRadiusItems(geocoding, apiKey);
      const selectedItems = radiusItems.filter((item) => this.toNonEmptyString(item.name)).slice(0, this.maxDetails);
      const places: PlaceResult[] = [];

      for (const item of selectedItems) {
        const xid = this.toNonEmptyString(item.xid);
        const details = xid ? await this.fetchDetails(xid, apiKey) : null;
        const normalized = this.normalizePlace(details ?? item);

        if (normalized) {
          places.push(normalized);
        }
      }

      return places;
    } catch {
      return [];
    }
  }

  private async fetchRadiusItems(geocoding: GeocodingResult, apiKey: string): Promise<OpenTripMapRadiusItem[]> {
    const url = new URL(`${this.baseUrl}/radius`);
    url.searchParams.set("radius", "10000");
    url.searchParams.set("lon", String(geocoding.longitude));
    url.searchParams.set("lat", String(geocoding.latitude));
    url.searchParams.set("limit", "20");
    url.searchParams.set("format", "json");
    url.searchParams.set("apikey", apiKey);

    const payload = await this.fetchJson(url);
    return Array.isArray(payload) ? (payload as OpenTripMapRadiusItem[]) : [];
  }

  private async fetchDetails(xid: string, apiKey: string): Promise<OpenTripMapDetails | null> {
    const url = new URL(`${this.baseUrl}/xid/${encodeURIComponent(xid)}`);
    url.searchParams.set("apikey", apiKey);

    const payload = await this.fetchJson(url);
    return payload && typeof payload === "object" ? (payload as OpenTripMapDetails) : null;
  }

  private async fetchJson(url: URL): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizePlace(item: OpenTripMapRadiusItem | OpenTripMapDetails): PlaceResult | null {
    const xid = this.toNonEmptyString(item.xid);
    const name = this.toNonEmptyString(item.name);

    if (!xid || !name) {
      return null;
    }

    const kinds = this.toNonEmptyString(item.kinds) ?? "";
    const category = this.categoryFromKinds(kinds);
    const latitude = this.toCoordinate(item.point?.lat, 90);
    const longitude = this.toCoordinate(item.point?.lon, 180);
    const details = item as OpenTripMapDetails;
    const description = this.toNonEmptyString(details.wikipedia_extracts?.text) ?? `OpenTripMap POI: ${name}.`;

    return {
      id: `opentripmap-${xid}`,
      name,
      description,
      category,
      tags: this.tagsForCategory(category, kinds),
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      estimatedCostPerPerson: this.estimatedCostForCategory(category),
      indoor: this.isIndoorCategory(category),
      qualityScore: this.qualityScoreFromRate(item.rate, description),
      source: "opentripmap"
    };
  }

  private qualityScoreFromRate(rate: unknown, description: string): number | undefined {
    const parsedRate = typeof rate === "string" ? Number(rate) : typeof rate === "number" ? rate : Number.NaN;
    const rateScore = Number.isFinite(parsedRate) ? Math.min(35, Math.max(0, parsedRate * 7)) : 0;
    const extractScore = description.length > 80 ? 10 : 0;
    const score = 45 + rateScore + extractScore;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private categoryFromKinds(kinds: string): PlaceCategory {
    const normalized = kinds.toLowerCase();

    if (normalized.includes("museums")) {
      return "museum";
    }

    if (normalized.includes("parks") || normalized.includes("gardens")) {
      return "park";
    }

    if (normalized.includes("foods") || normalized.includes("restaurants")) {
      return "food";
    }

    if (normalized.includes("shops")) {
      return "shopping";
    }

    if (normalized.includes("view_points") || normalized.includes("towers")) {
      return "viewpoint";
    }

    if (normalized.includes("historic") || normalized.includes("religion")) {
      return "historic_site";
    }

    return "landmark";
  }

  private tagsForCategory(category: PlaceCategory, kinds: string): string[] {
    const baseTags: Record<PlaceCategory, string[]> = {
      museum: ["museum", "museen", "kultur", "indoor", "rain_safe"],
      landmark: ["landmark", "wahrzeichen", "sehenswuerdigkeiten", "outdoor"],
      park: ["park", "spaziergaenge", "natur", "outdoor"],
      historic_site: ["historic_site", "geschichte", "sehenswuerdigkeiten", "outdoor"],
      food: ["food", "gutes essen", "restaurant", "indoor"],
      shopping: ["shopping", "einkaufen", "indoor"],
      viewpoint: ["viewpoint", "aussicht", "sehenswuerdigkeiten", "outdoor"]
    };
    const kindTags = kinds
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5);

    return Array.from(new Set([...baseTags[category], ...kindTags]));
  }

  private estimatedCostForCategory(category: PlaceCategory): number {
    const costsByCategory: Record<PlaceCategory, number> = {
      museum: 16,
      landmark: 0,
      park: 0,
      historic_site: 8,
      food: 28,
      shopping: 10,
      viewpoint: 0
    };

    return costsByCategory[category];
  }

  private isIndoorCategory(category: PlaceCategory): boolean {
    return category === "museum" || category === "food" || category === "shopping";
  }

  private getApiKey(): string | undefined {
    return process.env.OPENTRIPMAP_API_KEY?.trim() || undefined;
  }

  private toNonEmptyString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  private toCoordinate(value: unknown, maxAbsoluteValue: number): number | null {
    const parsed = typeof value === "string" ? Number(value) : typeof value === "number" ? value : Number.NaN;
    return Number.isFinite(parsed) && Math.abs(parsed) <= maxAbsoluteValue ? parsed : null;
  }
}
