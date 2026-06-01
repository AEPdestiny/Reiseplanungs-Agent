import type { TripRequest } from "../types/trip-request";

export const DEMO_TRIP_DESTINATION = "Berlin";
export const DEMO_TRIP_DURATION_DAYS = 3;
export const DEMO_TRIP_BUDGET_EUR = 600;
export const DEMO_TRIP_PEOPLE = 2;

export const DEMO_TRIP_REQUEST = {
  destination: DEMO_TRIP_DESTINATION,
  durationDays: DEMO_TRIP_DURATION_DAYS,
  budgetTotal: DEMO_TRIP_BUDGET_EUR,
  currency: "EUR",
  numberOfPeople: DEMO_TRIP_PEOPLE,
  travelType: "couple",
  interests: ["Museen", "gutes Essen", "Sehenswuerdigkeiten", "Spaziergaenge"]
} satisfies TripRequest;
