import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import type { AcceptProposalResponseDto } from "../../dto/accept-proposal.dto";
import type { ChatMessageRequestDto, ChatMessageResponseDto } from "../../dto/chat-message.dto";
import type { DemoTripResponseDto } from "../../dto/demo-trip.dto";
import type { GetTripResponseDto } from "../../dto/get-trip.dto";
import type { PlanTripRequestDto, PlanTripResponseDto } from "../../dto/plan-trip.dto";
import type { RejectProposalResponseDto } from "../../dto/reject-proposal.dto";
import type { SimulateWeatherRequestDto, SimulateWeatherResponseDto } from "../../dto/simulate-weather.dto";
import { TravelService } from "./travel.service";

@Controller("trips")
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post("demo")
  createDemoTrip(): Promise<DemoTripResponseDto> {
    return this.travelService.createDemoTrip();
  }

  @Post("plan")
  createPlannedTrip(@Body() body: PlanTripRequestDto): Promise<PlanTripResponseDto> {
    return this.travelService.createPlannedTrip(body);
  }

  @Get(":tripId")
  getTrip(@Param("tripId") tripId: string): GetTripResponseDto {
    const trip = this.travelService.getTrip(tripId);

    if (!trip) {
      throw new NotFoundException({
        error: {
          code: "TRIP_NOT_FOUND",
          message: "Trip existiert nicht."
        }
      });
    }

    return {
      tripId: trip.id,
      plan: trip.activePlan,
      budget: trip.activePlan?.budgetSummary,
      checklist: trip.checklist,
      pendingProposal: trip.proposals.find((proposal) => proposal.status === "pending") ?? null,
      agentInsights: trip.agentInsights
    };
  }

  @Post(":tripId/simulate-weather")
  simulateWeather(
    @Param("tripId") tripId: string,
    @Body() body: SimulateWeatherRequestDto
  ): Promise<SimulateWeatherResponseDto> {
    return this.travelService.simulateWeather(tripId, body);
  }

  @Post(":tripId/chat")
  sendChatMessage(
    @Param("tripId") tripId: string,
    @Body() body: ChatMessageRequestDto
  ): Promise<ChatMessageResponseDto> {
    return this.travelService.handleChatMessage(tripId, body);
  }

  @Post(":tripId/proposals/:proposalId/accept")
  acceptProposal(
    @Param("tripId") tripId: string,
    @Param("proposalId") proposalId: string
  ): AcceptProposalResponseDto {
    return this.travelService.acceptProposal(tripId, proposalId);
  }

  @Post(":tripId/proposals/:proposalId/reject")
  rejectProposal(
    @Param("tripId") tripId: string,
    @Param("proposalId") proposalId: string
  ): RejectProposalResponseDto {
    return this.travelService.rejectProposal(tripId, proposalId);
  }
}
