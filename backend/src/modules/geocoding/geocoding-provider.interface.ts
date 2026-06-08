export type GeocodingSource = "nominatim" | "static-fallback";

export interface GeocodingResult {
  destinationName: string;
  latitude: number;
  longitude: number;
  country?: string;
  source: GeocodingSource;
}

export interface GeocodingProvider {
  geocodeDestination(destination: string): Promise<GeocodingResult | null>;
}
