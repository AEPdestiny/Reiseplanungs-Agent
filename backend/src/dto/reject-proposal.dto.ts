import type { AgentInsight, ReplanningProposal, TravelPlan } from "@travel-agent/shared";

export class RejectProposalParamsDto {
  tripId!: string;
  proposalId!: string;
}

export class RejectProposalResponseDto {
  message!: string;
  plan?: TravelPlan;
  proposal?: ReplanningProposal;
  agentInsights?: AgentInsight[];
}
