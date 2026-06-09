import { Injectable } from "@nestjs/common";
import { GeocodingService } from "../geocoding/geocoding.service";
import type { PlaceResult, PlaceSource } from "./places-provider.interface";
import { OpenTripMapPlacesProvider } from "../../providers/places/opentripmap-places.provider";
import { WikidataPlacesProvider } from "../../providers/places/wikidata-places.provider";
import { WikipediaPlacesProvider } from "../../providers/places/wikipedia-places.provider";
import { PlaceRankingService } from "./place-ranking.service";

export type PlacesSource =
  | "wikidata"
  | "wikipedia"
  | "opentripmap"
  | "mixed-real-sources"
  | "generic-destination-plan";

export interface PlacesLookupResult {
  places: PlaceResult[];
  source: PlacesSource;
  sources: PlaceSource[];
  hasMinimumPlaces: boolean;
}

@Injectable()
export class PlacesService {
  private readonly minRealPlaces = 8;

  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly wikidataPlacesProvider: WikidataPlacesProvider,
    private readonly wikipediaPlacesProvider: WikipediaPlacesProvider,
    private readonly openTripMapPlacesProvider: OpenTripMapPlacesProvider,
    private readonly placeRankingService: PlaceRankingService
  ) {}

  async getPlacesForDestination(destination: string, interests: string[]): Promise<PlacesLookupResult> {
    const geocoding = await this.geocodingService.geocodeDestination(destination);
    const allPlaces: PlaceResult[] = [];

    allPlaces.push(...(await this.wikidataPlacesProvider.getPlacesForDestination(destination, interests, geocoding)));
    allPlaces.push(...(await this.wikipediaPlacesProvider.getPlacesForDestination(destination, interests, geocoding)));

    if (this.deduplicatePlaces(allPlaces).length < this.minRealPlaces && this.openTripMapPlacesProvider.isEnabled()) {
      allPlaces.push(...(await this.openTripMapPlacesProvider.getPlacesForDestination(destination, interests, geocoding)));
    }

    const places = this.placeRankingService.rankPlaces(this.deduplicatePlaces(allPlaces));
    const sources = this.getSources(places);
    const hasMinimumPlaces = places.length >= this.minRealPlaces;

    return {
      places,
      source: hasMinimumPlaces ? this.resolvePlacesSource(sources) : "generic-destination-plan",
      sources,
      hasMinimumPlaces
    };
  }

  getPlacesSourceSummary(result: PlacesLookupResult): string {
    if (!result.hasMinimumPlaces) {
      return "Places Source: Generic Destination Plan";
    }

    if (result.source === "mixed-real-sources") {
      return "Places Source: Mixed Real Sources";
    }

    if (result.source === "opentripmap") {
      return "Places Source: OpenTripMap";
    }

    if (result.source === "wikipedia") {
      return "Places Source: Wikipedia";
    }

    return "Places Source: Wikidata";
  }

  getDetailedSourceSummaries(result: PlacesLookupResult): string[] {
    if (!result.hasMinimumPlaces) {
      return ["Places Source: Generic Destination Plan"];
    }

    return ["Places ranked by quality", "Top POIs selected", ...result.sources.map((source) => {
      if (source === "opentripmap") {
        return "Places Source: OpenTripMap";
      }

      if (source === "wikipedia") {
        return "Places Source: Wikipedia";
      }

      return "Places Source: Wikidata";
    })];
  }

  private deduplicatePlaces(places: PlaceResult[]): PlaceResult[] {
    const placesByKey = new Map<string, PlaceResult>();

    for (const place of places) {
      const key = this.createPlaceKey(place);
      const existing = placesByKey.get(key);

      if (!existing) {
        placesByKey.set(key, place);
        continue;
      }

      placesByKey.set(key, {
        ...existing,
        tags: Array.from(new Set([...existing.tags, ...place.tags])),
        latitude: existing.latitude ?? place.latitude,
        longitude: existing.longitude ?? place.longitude,
        description: existing.description.length >= place.description.length ? existing.description : place.description,
        qualityScore: Math.max(existing.qualityScore ?? 0, place.qualityScore ?? 0) || undefined
      });
    }

    return Array.from(placesByKey.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  private createPlaceKey(place: PlaceResult): string {
    const normalizedName = place.name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    return this.canonicalPlaceKey(normalizedName);
  }

  private canonicalPlaceKey(normalizedName: string): string {
    const aliasGroups: string[][] = [
      ["colosseum", "kolosseum"],
      ["roman-forum", "forum-romanum"],
      ["pantheon", "pantheon-rome"],
      ["trevi-fountain", "trevi-brunnen", "fontana-di-trevi"],
      ["eiffel-tower", "eiffelturm"],
      ["brandenburg-gate", "brandenburger-tor"],
      ["museum-island", "museumsinsel"],
      ["sagrada-familia", "basilica-de-la-sagrada-familia"],
      ["park-guell", "park-guell"]
    ];

    for (const aliases of aliasGroups) {
      if (aliases.includes(normalizedName)) {
        return aliases[0];
      }
    }

    return normalizedName;
  }

  private getSources(places: PlaceResult[]): PlaceSource[] {
    return Array.from(new Set(places.map((place) => place.source).filter((source) => source !== "generic")));
  }

  private resolvePlacesSource(sources: PlaceSource[]): PlacesSource {
    if (sources.length > 1) {
      return "mixed-real-sources";
    }

    const [source] = sources;

    if (source === "wikipedia" || source === "opentripmap") {
      return source;
    }

    return "wikidata";
  }
}
