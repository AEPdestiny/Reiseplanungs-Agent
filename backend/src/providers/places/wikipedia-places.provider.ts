import { Injectable } from "@nestjs/common";
import type { GeocodingResult } from "../../modules/geocoding/geocoding-provider.interface";
import type { PlaceCategory, PlaceResult, PlacesProvider } from "../../modules/places/places-provider.interface";

interface WikipediaGeoSearchItem {
  pageid?: unknown;
  title?: unknown;
  lat?: unknown;
  lon?: unknown;
}

interface WikipediaGeoSearchResponse {
  query?: {
    geosearch?: WikipediaGeoSearchItem[];
  };
}

interface WikipediaPageItem {
  pageid?: unknown;
  title?: unknown;
  extract?: unknown;
  coordinates?: Array<{
    lat?: unknown;
    lon?: unknown;
  }>;
}

interface WikipediaPagesResponse {
  query?: {
    pages?: Record<string, WikipediaPageItem>;
  };
}

@Injectable()
export class WikipediaPlacesProvider implements PlacesProvider {
  private readonly apiUrl = "https://en.wikipedia.org/w/api.php";
  private readonly timeoutMs = 5000;
  private readonly userAgent = "Reiseplanungs-Agent/0.1 (https://github.com/AEPdestiny/Reiseplanungs-Agent)";
  private readonly knownHighlightTitlesByDestination: Record<string, string[]> = {
    rome: ["Colosseum", "Pantheon, Rome", "Roman Forum", "Trevi Fountain"],
    rom: ["Colosseum", "Pantheon, Rome", "Roman Forum", "Trevi Fountain"],
    paris: ["Eiffel Tower", "Louvre", "Arc de Triomphe", "Notre-Dame de Paris"],
    barcelona: ["Sagrada Familia", "Park Guell", "Casa Batllo", "Casa Mila"],
    istanbul: ["Hagia Sophia", "Sultan Ahmed Mosque", "Topkapi Palace", "Galata Tower"],
    berlin: ["Brandenburg Gate", "Reichstag building", "Museum Island", "Berlin Victory Column"]
  };

  async getPlacesForDestination(
    _destination: string,
    _interests: string[],
    geocoding?: GeocodingResult | null
  ): Promise<PlaceResult[]> {
    if (!geocoding) {
      return [];
    }

    try {
      const [geoSearchResponse, knownPagesResponse] = await Promise.all([
        this.fetchGeoSearch(geocoding).catch(() => ({})),
        this.fetchKnownPages(_destination).catch(() => ({}))
      ]);

      return [...this.normalizePlaces(geoSearchResponse), ...this.normalizeKnownPages(knownPagesResponse)];
    } catch {
      return [];
    }
  }

  private async fetchGeoSearch(geocoding: GeocodingResult): Promise<WikipediaGeoSearchResponse> {
    const url = new URL(this.apiUrl);
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "geosearch");
    url.searchParams.set("gscoord", `${geocoding.latitude}|${geocoding.longitude}`);
    url.searchParams.set("gsradius", "10000");
    url.searchParams.set("gslimit", "20");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": this.userAgent
        },
        signal: controller.signal
      });

      if (!response.ok) {
        return {};
      }

      return (await response.json()) as WikipediaGeoSearchResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizePlaces(response: WikipediaGeoSearchResponse): PlaceResult[] {
    const items = response.query?.geosearch ?? [];

    return items
      .map((item): PlaceResult | null => {
        const pageId = this.toStringValue(item.pageid);
        const title = this.toStringValue(item.title);
        const latitude = this.toCoordinate(item.lat, 90);
        const longitude = this.toCoordinate(item.lon, 180);

        if (!pageId || !title) {
          return null;
        }

        const category = this.categoryFromTitle(title);

        return {
          id: `wikipedia-${pageId}`,
          name: title,
          description: `Wikipedia GeoSearch POI: ${title}.`,
          category,
          tags: this.tagsForCategory(category),
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
          estimatedCostPerPerson: this.estimatedCostForCategory(category),
          indoor: this.isIndoorCategory(category),
          source: "wikipedia"
        };
      })
      .filter((place): place is PlaceResult => Boolean(place));
  }

  private async fetchKnownPages(destination: string): Promise<WikipediaPagesResponse> {
    const titles = this.knownHighlightTitlesByDestination[this.normalizeDestination(destination)] ?? [];

    if (titles.length === 0) {
      return {};
    }

    const url = new URL(this.apiUrl);
    url.searchParams.set("action", "query");
    url.searchParams.set("prop", "coordinates|extracts");
    url.searchParams.set("titles", titles.join("|"));
    url.searchParams.set("exintro", "1");
    url.searchParams.set("explaintext", "1");
    url.searchParams.set("redirects", "1");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": this.userAgent
        },
        signal: controller.signal
      });

      if (!response.ok) {
        return {};
      }

      return (await response.json()) as WikipediaPagesResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeKnownPages(response: WikipediaPagesResponse): PlaceResult[] {
    const pages = Object.values(response.query?.pages ?? {});

    return pages
      .map((page): PlaceResult | null => {
        const pageId = this.toStringValue(page.pageid);
        const title = this.toStringValue(page.title);

        if (!pageId || !title) {
          return null;
        }

        const category = this.categoryFromTitle(title);
        const firstCoordinate = page.coordinates?.[0];
        const latitude = this.toCoordinate(firstCoordinate?.lat, 90);
        const longitude = this.toCoordinate(firstCoordinate?.lon, 180);
        const extract = this.toStringValue(page.extract);

        return {
          id: `wikipedia-highlight-${pageId}`,
          name: title,
          description: extract ?? `Wikipedia Highlight: ${title}.`,
          category,
          tags: this.tagsForCategory(category),
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
          estimatedCostPerPerson: this.estimatedCostForCategory(category),
          indoor: this.isIndoorCategory(category),
          qualityScore: 78,
          source: "wikipedia"
        };
      })
      .filter((place): place is PlaceResult => Boolean(place));
  }

  private categoryFromTitle(title: string): PlaceCategory {
    const normalized = title.toLowerCase();

    if (normalized.includes("museum") || normalized.includes("gallery")) {
      return "museum";
    }

    if (normalized.includes("park") || normalized.includes("garden")) {
      return "park";
    }

    if (normalized.includes("forum") || normalized.includes("mosque") || normalized.includes("sophia")) {
      return "historic_site";
    }

    if (normalized.includes("fountain") || normalized.includes("gate") || normalized.includes("tower")) {
      return "landmark";
    }

    if (normalized.includes("market") || normalized.includes("mall") || normalized.includes("shop")) {
      return "shopping";
    }

    if (normalized.includes("restaurant") || normalized.includes("cafe") || normalized.includes("food")) {
      return "food";
    }

    if (normalized.includes("tower") || normalized.includes("view") || normalized.includes("hill")) {
      return "viewpoint";
    }

    if (normalized.includes("palace") || normalized.includes("castle") || normalized.includes("church")) {
      return "historic_site";
    }

    return "landmark";
  }

  private tagsForCategory(category: PlaceCategory): string[] {
    const tagsByCategory: Record<PlaceCategory, string[]> = {
      museum: ["museum", "museen", "kultur", "indoor", "rain_safe"],
      landmark: ["landmark", "wahrzeichen", "sehenswuerdigkeiten", "outdoor"],
      park: ["park", "spaziergaenge", "natur", "outdoor"],
      historic_site: ["historic_site", "geschichte", "sehenswuerdigkeiten", "outdoor"],
      food: ["food", "gutes essen", "restaurant", "indoor"],
      shopping: ["shopping", "einkaufen", "indoor"],
      viewpoint: ["viewpoint", "aussicht", "sehenswuerdigkeiten", "outdoor"]
    };

    return tagsByCategory[category];
  }

  private estimatedCostForCategory(category: PlaceCategory): number {
    const costsByCategory: Record<PlaceCategory, number> = {
      museum: 14,
      landmark: 0,
      park: 0,
      historic_site: 8,
      food: 24,
      shopping: 10,
      viewpoint: 0
    };

    return costsByCategory[category];
  }

  private isIndoorCategory(category: PlaceCategory): boolean {
    return category === "museum" || category === "food" || category === "shopping";
  }

  private toStringValue(value: unknown): string | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  private toCoordinate(value: unknown, maxAbsoluteValue: number): number | null {
    const parsed = typeof value === "string" ? Number(value) : typeof value === "number" ? value : Number.NaN;
    return Number.isFinite(parsed) && Math.abs(parsed) <= maxAbsoluteValue ? parsed : null;
  }

  private normalizeDestination(destination: string): string {
    return destination
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }
}
