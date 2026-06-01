import { defineStore } from "pinia";
import type { ReplanningProposal, WeatherEvent } from "@travel-agent/shared";
import {
  acceptProposal as acceptProposalRequest,
  rejectProposal as rejectProposalRequest,
  simulateWeather
} from "@/services/travel-api.service";
import { useAgentInsightsStore } from "./agent-insights.store";
import { useBudgetStore } from "./budget.store";
import { useTripStore } from "./trip.store";

interface ProposalState {
  pendingProposal: ReplanningProposal | null;
  loading: boolean;
  error: string | null;
}

export const useProposalStore = defineStore("proposal", {
  state: (): ProposalState => ({
    pendingProposal: null,
    loading: false,
    error: null
  }),
  actions: {
    setPendingProposal(proposal?: ReplanningProposal | null): void {
      this.pendingProposal = proposal?.status === "pending" ? proposal : null;
    },
    async simulateRainForDay2(tripId: string): Promise<void> {
      const weatherEvent: WeatherEvent = {
        dayNumber: 2,
        condition: "rain",
        severity: "medium",
        description: "Am zweiten Tag ist Regen vorhergesagt."
      };

      this.loading = true;
      this.error = null;

      try {
        const response = await simulateWeather(tripId, weatherEvent);
        this.setPendingProposal(response.proposal ?? null);
        useAgentInsightsStore().setAgentInsights(response.agentInsights);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Wetteraenderung konnte nicht simuliert werden.";
      } finally {
        this.loading = false;
      }
    },
    async acceptProposal(tripId: string): Promise<void> {
      if (!this.pendingProposal) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await acceptProposalRequest(tripId, this.pendingProposal.id);
        const budgetStore = useBudgetStore();

        useTripStore().plan = response.plan ?? null;
        budgetStore.setBudget(response.budget ?? response.plan?.budgetSummary);
        useAgentInsightsStore().setAgentInsights(response.agentInsights);
        this.pendingProposal = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Vorschlag konnte nicht uebernommen werden.";
      } finally {
        this.loading = false;
      }
    },
    async rejectProposal(tripId: string): Promise<void> {
      if (!this.pendingProposal) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await rejectProposalRequest(tripId, this.pendingProposal.id);
        useAgentInsightsStore().setAgentInsights(response.agentInsights);
        this.pendingProposal = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Vorschlag konnte nicht abgelehnt werden.";
      } finally {
        this.loading = false;
      }
    },
    clear(): void {
      this.pendingProposal = null;
      this.error = null;
      this.loading = false;
    }
  }
});
