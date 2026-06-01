import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AGENT_NAMES,
  DEMO_TRIP_REQUEST,
  type AgentInsight,
  type TravelPlan,
  type Trip
} from "@travel-agent/shared";
import { ReplanningAgentService } from "../../agents/replanning/replanning-agent.service";
import type { AcceptProposalResponseDto } from "../../dto/accept-proposal.dto";
import type { ChatMessageRequestDto, ChatMessageResponseDto } from "../../dto/chat-message.dto";
import type { DemoTripResponseDto } from "../../dto/demo-trip.dto";
import type { RejectProposalResponseDto } from "../../dto/reject-proposal.dto";
import type { SimulateWeatherRequestDto, SimulateWeatherResponseDto } from "../../dto/simulate-weather.dto";
import { AgentOrchestratorService } from "../agent/agent-orchestrator.service";
import { BudgetService } from "../budget/budget.service";
import { ProposalService } from "../proposal/proposal.service";
import { WeatherService } from "../weather/weather.service";
import { DemoTripFactory } from "./demo-trip.factory";

@Injectable()
export class TravelService {
  private readonly trips = new Map<string, Trip>();

  constructor(
    private readonly demoTripFactory: DemoTripFactory,
    private readonly budgetService: BudgetService,
    private readonly weatherService: WeatherService,
    private readonly replanningAgentService: ReplanningAgentService,
    private readonly proposalService: ProposalService,
    private readonly agentOrchestratorService: AgentOrchestratorService
  ) {}

  async createDemoTrip(): Promise<DemoTripResponseDto> {
    const request = DEMO_TRIP_REQUEST;
    const now = new Date().toISOString();
    const tripId = `trip_demo_berlin_${Date.now()}`;
    const planId = `plan_${tripId}`;
    const weather = await this.weatherService.getWeatherForTrip(request);
    const demoTrip = this.demoTripFactory.buildBerlinDemoTrip(tripId, request, weather, now);

    const planWithoutBudget = {
      id: planId,
      request,
      days: demoTrip.days,
      status: "active" as const,
      createdAt: now,
      updatedAt: now
    };
    const budgetSummary = this.budgetService.calculateForPlan(planWithoutBudget);
    const plan: TravelPlan = {
      ...planWithoutBudget,
      budgetSummary
    };
    const trip: Trip = {
      id: tripId,
      request,
      activePlan: plan,
      checklist: demoTrip.checklist,
      proposals: [],
      agentTrace: demoTrip.agentTrace,
      agentInsights: demoTrip.agentInsights,
      createdAt: now,
      updatedAt: now
    };

    this.trips.set(trip.id, trip);

    return {
      tripId: trip.id,
      message: "Die Demo-Reise fuer Berlin wurde geladen.",
      plan,
      budget: budgetSummary,
      checklist: demoTrip.checklist,
      agentTrace: demoTrip.agentTrace,
      agentInsights: demoTrip.agentInsights
    };
  }

  getTrip(tripId: string): Trip | undefined {
    return this.trips.get(tripId);
  }

  async simulateWeather(tripId: string, request: SimulateWeatherRequestDto): Promise<SimulateWeatherResponseDto> {
    const trip = this.getRequiredTrip(tripId);

    if (!trip.activePlan) {
      throw new BadRequestException({
        error: {
          code: "NO_ACTIVE_PLAN",
          message: "Es gibt keinen aktiven Plan."
        }
      });
    }

    if (!trip.activePlan.days.some((day) => day.dayNumber === request.dayNumber)) {
      throw new BadRequestException({
        error: {
          code: "INVALID_DAY",
          message: "Tag liegt ausserhalb der Reise."
        }
      });
    }

    const weatherEvent = await this.weatherService.simulateWeatherEvent(request);
    const replanning = this.replanningAgentService.createWeatherReplanningProposal(trip, weatherEvent);
    const proposal = this.proposalService.savePendingProposal(trip.id, replanning.proposal);

    trip.proposals = this.proposalService.getTripProposals(trip.id);
    trip.agentInsights = replanning.agentInsights;
    trip.updatedAt = new Date().toISOString();

    return {
      message: replanning.message,
      proposal,
      requiresUserConfirmation: true,
      agentInsights: replanning.agentInsights
    };
  }

  async handleChatMessage(tripId: string, request: ChatMessageRequestDto): Promise<ChatMessageResponseDto> {
    const trip = this.getRequiredTrip(tripId);

    if (!request.message?.trim()) {
      throw new BadRequestException({
        error: {
          code: "CHAT_MESSAGE_EMPTY",
          message: "Nachricht ist leer."
        }
      });
    }

    const response = await this.agentOrchestratorService.handleChatMessage(trip, request.message.trim());

    trip.agentInsights = response.agentInsights ?? [];
    trip.updatedAt = new Date().toISOString();

    return response;
  }

  acceptProposal(tripId: string, proposalId: string): AcceptProposalResponseDto {
    const trip = this.getRequiredTrip(tripId);
    const proposal = this.proposalService.acceptProposal(trip, proposalId);
    const agentInsights = this.createProposalDecisionInsights("accepted");

    trip.agentInsights = agentInsights;

    return {
      message: "Die Aenderungen wurden uebernommen.",
      plan: trip.activePlan,
      budget: trip.activePlan?.budgetSummary,
      proposal,
      agentInsights
    };
  }

  rejectProposal(tripId: string, proposalId: string): RejectProposalResponseDto {
    const trip = this.getRequiredTrip(tripId);
    const proposal = this.proposalService.rejectProposal(trip, proposalId);
    const agentInsights = this.createProposalDecisionInsights("rejected");

    trip.agentInsights = agentInsights;

    return {
      message: "Der Vorschlag wurde abgelehnt. Der aktuelle Plan bleibt unveraendert.",
      plan: trip.activePlan,
      proposal,
      agentInsights
    };
  }

  private getRequiredTrip(tripId: string): Trip {
    const trip = this.trips.get(tripId);

    if (!trip) {
      throw new NotFoundException({
        error: {
          code: "TRIP_NOT_FOUND",
          message: "Trip existiert nicht."
        }
      });
    }

    return trip;
  }

  private createProposalDecisionInsights(decision: "accepted" | "rejected"): AgentInsight[] {
    return decision === "accepted"
      ? [
          {
            agentName: AGENT_NAMES.coordinator,
            displayLabel: "Coordinator Agent",
            status: "completed",
            summary: "Nutzerbestaetigung erhalten"
          },
          {
            agentName: "Proposal Service",
            displayLabel: "Proposal Service",
            status: "completed",
            summary: "Aenderung uebernommen"
          }
        ]
      : [
          {
            agentName: AGENT_NAMES.coordinator,
            displayLabel: "Coordinator Agent",
            status: "completed",
            summary: "Nutzerentscheidung verarbeitet"
          },
          {
            agentName: "Proposal Service",
            displayLabel: "Proposal Service",
            status: "completed",
            summary: "Vorschlag abgelehnt"
          }
        ];
  }
}
