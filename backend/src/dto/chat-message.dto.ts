import type { AgentInsight, ReplanningProposal, TravelPlan } from "@travel-agent/shared";

export class ChatMessageRequestDto {
  message!: string;
}

export class ChatMessageResponseDto {
  message!: string;
  plan?: TravelPlan;
  proposal?: ReplanningProposal | null;
  requiresUserConfirmation?: boolean;
  agentInsights?: AgentInsight[];
}
