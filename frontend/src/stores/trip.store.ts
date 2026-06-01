import { defineStore } from "pinia";
import type { TravelPlan } from "@travel-agent/shared";
import { getTrip, loadDemoTrip, type TripApiResponse } from "@/services/travel-api.service";
import { useAgentInsightsStore } from "./agent-insights.store";
import { useBudgetStore } from "./budget.store";
import { useChecklistStore } from "./checklist.store";
import { useProposalStore } from "./proposal.store";

interface TripState {
  tripId: string | null;
  plan: TravelPlan | null;
  loading: boolean;
  error: string | null;
}

export const useTripStore = defineStore("trip", {
  state: (): TripState => ({
    tripId: null,
    plan: null,
    loading: false,
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
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Demo-Reise konnte nicht geladen werden.";
      } finally {
        this.loading = false;
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
    }
  }
});
