import type { ActivityScore } from "./activity-score";

export type ActivityCategory =
  | "museum"
  | "restaurant"
  | "sightseeing"
  | "walk"
  | "activity"
  | "transport"
  | "break";

export type IndoorOutdoor = "indoor" | "outdoor" | "mixed";
export type ActivitySource = "mock" | "openai" | "external_api";

export interface Location {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  area?: string;
}

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;
  location: Location;
  estimatedCostPerPerson: number;
  estimatedCostTotal: number;
  durationMinutes: number;
  indoorOutdoor: IndoorOutdoor;
  tags: string[];
  reasoning: string;
  score?: ActivityScore;
  source: ActivitySource;
}
