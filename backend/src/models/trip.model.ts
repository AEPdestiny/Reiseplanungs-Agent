import type { AgentInsight, AgentTraceEntry, Checklist, ReplanningProposal, TravelPlan, TripRequest } from "@travel-agent/shared";

export interface TripModel {
  id: string;
  request: TripRequest;
  activePlan?: TravelPlan;
  checklist?: Checklist;
  proposals: ReplanningProposal[];
  agentTrace: AgentTraceEntry[];
  agentInsights: AgentInsight[];
}
