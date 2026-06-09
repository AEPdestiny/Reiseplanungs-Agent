import { defineStore } from "pinia";
import type { TravelPlan, TripRequest } from "@travel-agent/shared";
import { getTrip, loadDemoTrip, planTrip, type TripApiResponse } from "@/services/travel-api.service";
import { useAgentInsightsStore } from "./agent-insights.store";
import { useBudgetStore } from "./budget.store";
import { useChecklistStore } from "./checklist.store";
import { useProposalStore } from "./proposal.store";

const SAVED_TRIPS_STORAGE_KEY = "travel-agent-saved-trips";

export interface SavedTripEntry {
  tripId: string;
  destination: string;
  createdAt: string;
  durationDays: number;
  budget: number;
  response: TripApiResponse;
}

interface TripState {
  tripId: string | null;
  plan: TravelPlan | null;
  savedTrips: SavedTripEntry[];
  loading: boolean;
  planningLoading: boolean;
  error: string | null;
}

export const useTripStore = defineStore("trip", {
  state: (): TripState => ({
    tripId: null,
    plan: null,
    savedTrips: readSavedTrips(),
    loading: false,
    planningLoading: false,
    error: null
  }),
  getters: {
    hasTrip: (state) => Boolean(state.tripId && state.plan)
  },
  actions: {
    async loadDemoTrip(): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const response = await loadDemoTrip();
        this.applyTripResponse(response);
        this.saveTripResponse(response);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Demo-Reise konnte nicht geladen werden.";
      } finally {
        this.loading = false;
      }
    },
    async createPlannedTrip(request: TripRequest): Promise<void> {
      this.planningLoading = true;
      this.error = null;

      try {
        const response = await planTrip(request);
        this.applyTripResponse(response);
        this.saveTripResponse(response);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Reise konnte nicht geplant werden.";
      } finally {
        this.planningLoading = false;
      }
    },
    async refreshTrip(): Promise<void> {
      if (!this.tripId) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await getTrip(this.tripId);
        this.applyTripResponse(response);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Reise konnte nicht aktualisiert werden.";
      } finally {
        this.loading = false;
      }
    },
    applyTripResponse(response: TripApiResponse): void {
      const budgetStore = useBudgetStore();
      const checklistStore = useChecklistStore();
      const proposalStore = useProposalStore();
      const agentInsightsStore = useAgentInsightsStore();

      this.tripId = response.tripId;
      this.plan = response.plan ?? null;
      budgetStore.setBudget(response.budget ?? response.plan?.budgetSummary);
      checklistStore.setChecklist(response.checklist);
      proposalStore.setPendingProposal(response.pendingProposal ?? response.proposal ?? null);
      agentInsightsStore.setAgentInsights(response.agentInsights);
    },
    loadSavedTrip(tripId: string): void {
      const savedTrip = this.savedTrips.find((entry) => entry.tripId === tripId);

      if (!savedTrip) {
        this.error = "Gespeicherte Reise konnte nicht gefunden werden.";
        return;
      }

      this.error = null;
      this.applyTripResponse(savedTrip.response);
    },
    deleteSavedTrip(tripId: string): void {
      this.savedTrips = this.savedTrips.filter((entry) => entry.tripId !== tripId);
      persistSavedTrips(this.savedTrips);
    },
    clearSavedTrips(): void {
      this.savedTrips = [];
      persistSavedTrips(this.savedTrips);
    },
    saveTripResponse(response: TripApiResponse): void {
      const entry = createSavedTripEntry(response);

      if (!entry) {
        return;
      }

      this.savedTrips = [entry, ...this.savedTrips.filter((savedTrip) => savedTrip.tripId !== entry.tripId)].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
      persistSavedTrips(this.savedTrips);
    }
  }
});

function createSavedTripEntry(response: TripApiResponse): SavedTripEntry | null {
  if (!response.tripId || !response.plan) {
    return null;
  }

  return {
    tripId: response.tripId,
    destination: response.plan.request.destination,
    createdAt: response.plan.createdAt ?? new Date().toISOString(),
    durationDays: response.plan.request.durationDays,
    budget: response.budget?.budgetTotal ?? response.plan.budgetSummary.budgetTotal,
    response
  };
}

function readSavedTrips(): SavedTripEntry[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const rawValue = localStorage.getItem(SAVED_TRIPS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as SavedTripEntry[];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isSavedTripEntry)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  } catch {
    return [];
  }
}

function persistSavedTrips(savedTrips: SavedTripEntry[]): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(savedTrips));
}

function isSavedTripEntry(value: unknown): value is SavedTripEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as SavedTripEntry;

  return (
    typeof candidate.tripId === "string" &&
    typeof candidate.destination === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.durationDays === "number" &&
    typeof candidate.budget === "number" &&
    typeof candidate.response === "object"
  );
}
