import { Injectable } from "@nestjs/common";
import type { ReplanningProposal, TravelPlan, Trip } from "@travel-agent/shared";
import type { ChatMessageResponseDto } from "../../dto/chat-message.dto";
import { CoordinatorAgentService } from "../../agents/coordinator/coordinator-agent.service";

@Injectable()
export class AgentOrchestratorService {
  constructor(private readonly coordinatorAgentService: CoordinatorAgentService) {}

  async handleChatMessage(trip: Trip, message: string): Promise<ChatMessageResponseDto> {
    const result = await this.coordinatorAgentService.handleChatMessage(trip, message);

    return {
      message: result.message,
      plan: trip.activePlan as TravelPlan | undefined,
      proposal: this.getPendingProposal(trip),
      requiresUserConfirmation: result.requiresUserConfirmation,
      agentInsights: result.agentInsights
    };
  }

  private getPendingProposal(trip: Trip): ReplanningProposal | null {
    return trip.proposals.find((proposal) => proposal.status === "pending") ?? null;
  }
}
