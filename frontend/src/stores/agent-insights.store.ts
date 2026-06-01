import { defineStore } from "pinia";
import type { AgentInsight } from "@travel-agent/shared";

interface AgentInsightsState {
  agentInsights: AgentInsight[];
}

export const useAgentInsightsStore = defineStore("agentInsights", {
  state: (): AgentInsightsState => ({
    agentInsights: []
  }),
  actions: {
    setAgentInsights(agentInsights?: AgentInsight[]): void {
      this.agentInsights = agentInsights ?? [];
    },
    clear(): void {
      this.agentInsights = [];
    }
  }
});
