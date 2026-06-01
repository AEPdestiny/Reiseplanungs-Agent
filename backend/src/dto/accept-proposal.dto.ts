import type { AgentInsight, BudgetSummary, ReplanningProposal, TravelPlan } from "@travel-agent/shared";

export class AcceptProposalParamsDto {
  tripId!: string;
  proposalId!: string;
}

export class AcceptProposalResponseDto {
  message!: string;
  plan?: TravelPlan;
  budget?: BudgetSummary;
  proposal?: ReplanningProposal;
  agentInsights?: AgentInsight[];
}
