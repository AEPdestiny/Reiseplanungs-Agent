export type PlaceCategory = "museum" | "landmark" | "park" | "historic_site" | "food" | "shopping" | "viewpoint";
export type PlaceSource = "wikidata";

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
  getPlacesForDestination(destination: string, interests: string[]): Promise<PlaceResult[]>;
}
