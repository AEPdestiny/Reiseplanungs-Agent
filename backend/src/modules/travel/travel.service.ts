import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AGENT_NAMES,
  DEMO_TRIP_REQUEST,
  type AgentInsight,
  type TravelPlan,
  type TravelType,
  type Trip,
  type TripRequest
} from "@travel-agent/shared";
import { PlanningAgentService } from "../../agents/planning/planning-agent.service";
import { ReplanningAgentService } from "../../agents/replanning/replanning-agent.service";
import type { AcceptProposalResponseDto } from "../../dto/accept-proposal.dto";
import type { ChatMessageRequestDto, ChatMessageResponseDto } from "../../dto/chat-message.dto";
import type { DemoTripResponseDto } from "../../dto/demo-trip.dto";
import type { PlanTripRequestDto, PlanTripResponseDto } from "../../dto/plan-trip.dto";
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
  private readonly supportedTravelTypes: TravelType[] = ["solo", "couple", "family", "group"];

  constructor(
    private readonly demoTripFactory: DemoTripFactory,
    private readonly budgetService: BudgetService,
    private readonly weatherService: WeatherService,
    private readonly planningAgentService: PlanningAgentService,
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

  async createPlannedTrip(requestDto: PlanTripRequestDto): Promise<PlanTripResponseDto> {
    const request = this.validatePlanTripRequest(requestDto);
    const now = new Date().toISOString();
    const tripId = `trip_plan_${Date.now()}`;
    const planId = `plan_${tripId}`;
    const planningResult = await this.planningAgentService.createInitialPlanFromRequest(request, {
      tripId,
      timestamp: now
    });
    const planWithoutBudget = {
      id: planId,
      request,
      days: planningResult.days,
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
      checklist: planningResult.checklist,
      proposals: [],
      agentTrace: planningResult.agentTrace,
      agentInsights: planningResult.agentInsights,
      createdAt: now,
      updatedAt: now
    };

    this.trips.set(trip.id, trip);

    return {
      tripId: trip.id,
      message: this.createPlanningMessage(planningResult.messageParts, planningResult.warnings),
      plan,
      budget: budgetSummary,
      checklist: planningResult.checklist,
      agentTrace: planningResult.agentTrace,
      agentInsights: planningResult.agentInsights
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

  private validatePlanTripRequest(request: Partial<PlanTripRequestDto> | undefined): TripRequest {
    const validationErrors: string[] = [];
    const destination = typeof request?.destination === "string" ? request.destination.trim() : "";
    const durationDays = typeof request?.durationDays === "number" ? request.durationDays : 0;
    const budgetTotal = typeof request?.budgetTotal === "number" ? request.budgetTotal : 0;
    const numberOfPeople = typeof request?.numberOfPeople === "number" ? request.numberOfPeople : 0;
    const travelType = request?.travelType;
    const interests = Array.isArray(request?.interests)
      ? request.interests
          .filter((interest): interest is string => typeof interest === "string")
          .map((interest) => interest.trim())
          .filter(Boolean)
      : [];

    if (!destination) {
      validationErrors.push("destination ist erforderlich.");
    }

    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 14) {
      validationErrors.push("durationDays muss eine ganze Zahl zwischen 1 und 14 sein.");
    }

    if (!Number.isFinite(budgetTotal) || budgetTotal <= 0) {
      validationErrors.push("budgetTotal muss groesser als 0 sein.");
    }

    if (request?.currency !== "EUR") {
      validationErrors.push("currency muss EUR sein.");
    }

    if (!Number.isInteger(numberOfPeople) || numberOfPeople < 1 || numberOfPeople > 20) {
      validationErrors.push("numberOfPeople muss eine ganze Zahl zwischen 1 und 20 sein.");
    }

    if (!travelType || !this.supportedTravelTypes.includes(travelType)) {
      validationErrors.push("travelType muss solo, couple, family oder group sein.");
    }

    if (interests.length === 0) {
      validationErrors.push("interests muss mindestens einen Eintrag enthalten.");
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_ERROR",
          message: "Die Reiseanfrage ist ungueltig.",
          details: validationErrors
        }
      });
    }

    return {
      destination,
      startDate: request?.startDate?.trim() || undefined,
      endDate: request?.endDate?.trim() || undefined,
      durationDays,
      budgetTotal: Number(budgetTotal.toFixed(2)),
      currency: "EUR",
      numberOfPeople,
      travelType: travelType as TravelType,
      interests
    };
  }

  private createPlanningMessage(messageParts: string[], warnings: string[]): string {
    return [...messageParts, ...warnings.map((warning) => `Hinweis: ${warning}`)].join(" ");
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
