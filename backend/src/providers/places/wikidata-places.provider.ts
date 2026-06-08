import { Injectable } from "@nestjs/common";
import type { PlaceCategory, PlaceResult, PlacesProvider } from "../../modules/places/places-provider.interface";

interface WikidataBindingValue {
  value?: unknown;
}

interface WikidataPlaceBinding {
  place?: WikidataBindingValue;
  placeLabel?: WikidataBindingValue;
  placeDescription?: WikidataBindingValue;
  coord?: WikidataBindingValue;
  category?: WikidataBindingValue;
}

interface WikidataSparqlResponse {
  results?: {
    bindings?: WikidataPlaceBinding[];
  };
}

@Injectable()
export class WikidataPlacesProvider implements PlacesProvider {
  private readonly sparqlUrl = "https://query.wikidata.org/sparql";
  private readonly timeoutMs = 8000;
  private readonly userAgent = "Reiseplanungs-Agent/0.1 (https://github.com/AEPdestiny/Reiseplanungs-Agent)";

  async getPlacesForDestination(destination: string, _interests: string[]): Promise<PlaceResult[]> {
    const normalizedDestination = destination.trim();

    if (!normalizedDestination) {
      return [];
    }

    try {
      const response = await this.fetchPlaces(normalizedDestination);
      const places = this.normalizePlaces(response);
      return places.sort((left, right) => left.name.localeCompare(right.name)).slice(0, 18);
    } catch {
      return [];
    }
  }

  private async fetchPlaces(destination: string): Promise<WikidataSparqlResponse> {
    const query = this.buildQuery(this.resolveDestinationAlias(destination));
    const url = new URL(this.sparqlUrl);
    url.searchParams.set("query", query);
    url.searchParams.set("format", "json");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": this.userAgent
        },
        signal: controller.signal
      });

      if (!response.ok) {
        return {};
      }

      return (await response.json()) as WikidataSparqlResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildQuery(destination: string): string {
    const escapedDestination = destination.replace(/["\\]/g, "");
    const cityCenterBinding = this.createCityCenterBinding(escapedDestination);

    return `
SELECT DISTINCT ?place ?placeLabel ?placeDescription ?coord ?category WHERE {
  ${cityCenterBinding}
  SERVICE wikibase:around {
    ?place wdt:P625 ?coord.
    bd:serviceParam wikibase:center ?cityCoord.
    bd:serviceParam wikibase:radius "18".
  }
  ?place wdt:P31/wdt:P279* wd:Q570116.
  OPTIONAL {
    ?place wdt:P31/wdt:P279* ?category.
    VALUES ?category {
      wd:Q33506
      wd:Q570116
      wd:Q22698
      wd:Q839954
      wd:Q23413
      wd:Q4989906
      wd:Q1248784
      wd:Q41253
      wd:Q11707
      wd:Q12280
      wd:Q24354
      wd:Q179700
    }
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "de,en".
    ?place rdfs:label ?placeLabel.
    ?place schema:description ?placeDescription.
  }
}
LIMIT 40`;
  }

  private createCityCenterBinding(destination: string): string {
    const cityCenters: Record<string, string> = {
      Berlin: '"Point(13.4050 52.5200)"^^geo:wktLiteral',
      Rome: '"Point(12.4964 41.9028)"^^geo:wktLiteral',
      Paris: '"Point(2.3522 48.8566)"^^geo:wktLiteral',
      Barcelona: '"Point(2.1734 41.3851)"^^geo:wktLiteral',
      Istanbul: '"Point(28.9784 41.0082)"^^geo:wktLiteral'
    };
    const staticCenter = cityCenters[destination];

    return staticCenter
      ? `BIND(${staticCenter} AS ?cityCoord)`
      : `?city rdfs:label "${destination}"@en;
        wdt:P625 ?cityCoord.`;
  }

  private resolveDestinationAlias(destination: string): string {
    const aliases: Record<string, string> = {
      rom: "Rome",
      paris: "Paris",
      berlin: "Berlin",
      barcelona: "Barcelona",
      istanbul: "Istanbul",
      "istanbul, tuerkei": "Istanbul"
    };
    const normalizedDestination = destination.trim().toLowerCase();

    return aliases[normalizedDestination] ?? destination;
  }

  private normalizePlaces(response: WikidataSparqlResponse): PlaceResult[] {
    const bindings = response.results?.bindings ?? [];
    const placesById = new Map<string, PlaceResult>();

    for (const binding of bindings) {
      const wikidataUrl = this.asString(binding.place?.value);
      const name = this.asString(binding.placeLabel?.value);
      const categoryEntity = this.asString(binding.category?.value);

      if (!wikidataUrl || !name) {
        continue;
      }

      const id = this.wikidataIdFromUrl(wikidataUrl);
      const category = categoryEntity ? this.categoryFromEntity(categoryEntity) : "landmark";
      const coordinates = this.parseCoordinates(this.asString(binding.coord?.value));

      if (!id || !category) {
        continue;
      }

      const tags = this.tagsForCategory(category);
      const existing = placesById.get(id);

      if (existing) {
        existing.tags = Array.from(new Set([...existing.tags, ...tags]));
        continue;
      }

      placesById.set(id, {
        id: `wikidata-${id}`,
        name,
        description: this.asString(binding.placeDescription?.value) ?? `Wikidata POI in Kategorie ${category}.`,
        category,
        tags,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        estimatedCostPerPerson: this.estimatedCostForCategory(category),
        indoor: this.isIndoorCategory(category),
        source: "wikidata"
      });
    }

    return Array.from(placesById.values());
  }

  private categoryFromEntity(entityUrl: string): PlaceCategory | null {
    const entityId = this.wikidataIdFromUrl(entityUrl);
    const categoryByEntity: Record<string, PlaceCategory> = {
      Q33506: "museum",
      Q570116: "landmark",
      Q22698: "park",
      Q839954: "historic_site",
      Q23413: "landmark",
      Q4989906: "landmark",
      Q1248784: "landmark",
      Q41253: "food",
      Q11707: "food",
      Q12280: "shopping",
      Q24354: "viewpoint",
      Q179700: "viewpoint"
    };

    return entityId ? categoryByEntity[entityId] ?? null : null;
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
      viewpoint: 6
    };

    return costsByCategory[category];
  }

  private isIndoorCategory(category: PlaceCategory): boolean {
    return category === "museum" || category === "food" || category === "shopping";
  }

  private parseCoordinates(value: string | null): { latitude: number; longitude: number } | null {
    if (!value) {
      return null;
    }

    const match = /^Point\(([-\d.]+) ([-\d.]+)\)$/.exec(value);

    if (!match) {
      return null;
    }

    const longitude = Number(match[1]);
    const latitude = Number(match[2]);

    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  }

  private wikidataIdFromUrl(value: string): string | null {
    return value.match(/Q\d+$/)?.[0] ?? null;
  }

  private asString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }
}
