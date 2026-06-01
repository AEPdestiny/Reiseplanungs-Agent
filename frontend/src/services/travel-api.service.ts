import type { TripResponseContract } from "@travel-agent/shared";

export const TRAVEL_API_BASE_PATH = "/api";

export async function createDemoTrip(): Promise<TripResponseContract> {
  const response = await fetch(`${TRAVEL_API_BASE_PATH}/trips/demo`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error("Demo-Reise konnte nicht geladen werden.");
  }

  return response.json() as Promise<TripResponseContract>;
}

export async function getTrip(tripId: string): Promise<TripResponseContract> {
  const response = await fetch(`${TRAVEL_API_BASE_PATH}/trips/${tripId}`);

  if (!response.ok) {
    throw new Error("Reise konnte nicht geladen werden.");
  }

  return response.json() as Promise<TripResponseContract>;
}
