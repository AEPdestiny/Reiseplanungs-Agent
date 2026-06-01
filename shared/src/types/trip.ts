import type { AgentInsight, AgentTraceEntry } from "./agent-insight";
import type { Checklist } from "./checklist";
import type { ReplanningProposal } from "./replanning-proposal";
import type { TravelPlan } from "./travel-plan";
import type { TripRequest } from "./trip-request";

export interface Trip {
  id: string;
  request: TripRequest;
  activePlan?: TravelPlan;
  checklist?: Checklist;
  proposals: ReplanningProposal[];
  agentTrace: AgentTraceEntry[];
  agentInsights: AgentInsight[];
  createdAt: string;
  updatedAt: string;
}
