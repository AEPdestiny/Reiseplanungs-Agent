import { defineStore } from "pinia";
import type { AgentInsight } from "@travel-agent/shared";

interface AgentInsightsState {
  insights: AgentInsight[];
}

export const useAgentInsightsStore = defineStore("agentInsights", {
  state: (): AgentInsightsState => ({
    insights: []
  })
});
