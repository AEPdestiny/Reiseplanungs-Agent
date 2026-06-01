import { defineStore } from "pinia";
import type { TravelPlan } from "@travel-agent/shared";

interface TripState {
  tripId: string | null;
  plan: TravelPlan | null;
}

export const useTripStore = defineStore("trip", {
  state: (): TripState => ({
    tripId: null,
    plan: null
  })
});
