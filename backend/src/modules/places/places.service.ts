import { Inject, Injectable } from "@nestjs/common";
import { PLACES_PROVIDER, type PlaceResult, type PlacesProvider } from "./places-provider.interface";

export type PlacesSource = "wikidata" | "mock-fallback";

export interface PlacesLookupResult {
  places: PlaceResult[];
  source: PlacesSource;
}

@Injectable()
export class PlacesService {
  constructor(@Inject(PLACES_PROVIDER) private readonly placesProvider: PlacesProvider) {}

  async getPlacesForDestination(destination: string, interests: string[]): Promise<PlacesLookupResult> {
    const places = await this.placesProvider.getPlacesForDestination(destination, interests);

    if (places.length === 0) {
      return {
        places: [],
        source: "mock-fallback"
      };
    }

    return {
      places,
      source: "wikidata"
    };
  }

  getPlacesSourceSummary(result: PlacesLookupResult): string {
    return result.source === "wikidata" ? "Places Source: Wikidata" : "Places Source: Mock Fallback";
  }
}
