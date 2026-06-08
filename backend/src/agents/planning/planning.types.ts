import type { ActivityCategory, IndoorOutdoor, TravelDay } from "@travel-agent/shared";

export interface OpenAiPlanningAttempt {
  rawText?: string;
  usedFallback: boolean;
  fallbackReason?: string;
}

export interface RawStructuredPlanActivity {
  name?: unknown;
  category?: unknown;
  description?: unknown;
  location?: {
    name?: unknown;
    area?: unknown;
  };
  estimatedCostPerPerson?: unknown;
  durationMinutes?: unknown;
  indoorOutdoor?: unknown;
  tags?: unknown;
  reasoning?: unknown;
}

export interface RawStructuredPlanTimeSlot {
  startTime?: unknown;
  endTime?: unknown;
  activity?: RawStructuredPlanActivity;
}

export interface RawStructuredPlanDay {
  dayNumber?: unknown;
  title?: unknown;
  timeSlots?: unknown;
}

export interface RawStructuredPlanProposal {
  days?: unknown;
}

export interface NormalizedStructuredPlanResult {
  days?: TravelDay[];
  isValid: boolean;
  fallbackReason?: string;
}

export const ALLOWED_ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "museum",
  "restaurant",
  "sightseeing",
  "walk",
  "activity",
  "transport",
  "break"
];

export const ALLOWED_INDOOR_OUTDOOR_VALUES: IndoorOutdoor[] = ["indoor", "outdoor", "mixed"];
