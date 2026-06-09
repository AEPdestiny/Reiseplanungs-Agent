export type PlaceCategory = "museum" | "landmark" | "park" | "historic_site" | "food" | "shopping" | "viewpoint";
import type { GeocodingResult } from "../geocoding/geocoding-provider.interface";

export type PlaceSource = "wikidata" | "wikipedia" | "opentripmap" | "generic";

export const PLACES_PROVIDER = Symbol("PLACES_PROVIDER");

export interface PlaceResult {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  tags: string[];
  latitude?: number;
  longitude?: number;
  estimatedCostPerPerson?: number;
  indoor?: boolean;
  source: PlaceSource;
}

export interface PlacesProvider {
  getPlacesForDestination(destination: string, interests: string[], geocoding?: GeocodingResult | null): Promise<PlaceResult[]>;
}
