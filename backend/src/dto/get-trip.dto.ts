import type { AgentInsight, BudgetSummary, Checklist, ReplanningProposal, TravelPlan } from "@travel-agent/shared";

export class GetTripParamsDto {
  tripId!: string;
}

export class GetTripResponseDto {
  tripId!: string;
  plan?: TravelPlan;
  budget?: BudgetSummary;
  checklist?: Checklist;
  pendingProposal?: ReplanningProposal | null;
  agentInsights?: AgentInsight[];
}
