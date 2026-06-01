import { BadRequestException, Injectable } from "@nestjs/common";
import {
  AGENT_NAMES,
  type Activity,
  type AgentInsight,
  type PlanChange,
  type ReplanningProposal,
  type TimeSlot,
  type TravelDay,
  type TravelPlan,
  type Trip,
  type WeatherEvent,
  type WeatherSummary
} from "@travel-agent/shared";
import { BudgetService } from "../../modules/budget/budget.service";
import { MockDataService, type MockActivity } from "../../modules/mock-data/mock-data.service";
import { ActivityScoringService } from "../../modules/recommendation/activity-scoring.service";

export interface ReplanningResult {
  message: string;
  proposal: ReplanningProposal;
  agentInsights: AgentInsight[];
}

@Injectable()
export class ReplanningAgentService {
  constructor(
    private readonly mockDataService: MockDataService,
    private readonly activityScoringService: ActivityScoringService,
    private readonly budgetService: BudgetService
  ) {}

  createWeatherReplanningProposal(trip: Trip, weatherEvent: WeatherEvent): ReplanningResult {
    const activePlan = trip.activePlan;

    if (!activePlan) {
      throw new BadRequestException({
        error: {
          code: "NO_ACTIVE_PLAN",
          message: "Es gibt keinen aktiven Plan."
        }
      });
    }

    const affectedDay = activePlan.days.find((day) => day.dayNumber === weatherEvent.dayNumber);

    if (!affectedDay) {
      throw new BadRequestException({
        error: {
          code: "INVALID_DAY",
          message: "Tag liegt ausserhalb der Reise."
        }
      });
    }

    const replanningWeather = this.toWeatherSummary(weatherEvent);
    const usedActivityIds = new Set(activePlan.days.flatMap((day) => day.timeSlots.map((slot) => slot.activity.id)));
    const changes: PlanChange[] = [];
    const proposedDays = activePlan.days.map((day) =>
      day.dayNumber === weatherEvent.dayNumber
        ? this.replanDay(day, activePlan, replanningWeather, usedActivityIds, changes)
        : this.cloneDay(day)
    );
    const planWithoutBudget = {
      ...activePlan,
      id: `${activePlan.id}_proposal_${Date.now()}`,
      days: proposedDays,
      status: "proposal_pending" as const,
      updatedAt: new Date().toISOString()
    };
    const budgetAfter = this.budgetService.calculateForPlan(planWithoutBudget);
    const proposedPlan: TravelPlan = {
      ...planWithoutBudget,
      budgetSummary: budgetAfter
    };
    const proposal: ReplanningProposal = {
      id: `proposal_${Date.now()}`,
      planId: activePlan.id,
      reason:
        changes.length > 0
          ? `Wetterereignis an Tag ${weatherEvent.dayNumber}: ${weatherEvent.description}`
          : `Wetterereignis an Tag ${weatherEvent.dayNumber}: keine passende Plananpassung erforderlich.`,
      affectedDayNumbers: [weatherEvent.dayNumber],
      changes,
      proposedPlan,
      budgetBefore: activePlan.budgetSummary,
      budgetAfter,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    return {
      message:
        changes.length > 0
          ? `Fuer Tag ${weatherEvent.dayNumber} schlage ich wetterfeste Alternativen vor.`
          : `Fuer Tag ${weatherEvent.dayNumber} sind keine Aenderungen erforderlich.`,
      proposal,
      agentInsights: this.createReplanningInsights(weatherEvent.dayNumber, changes.length)
    };
  }

  private replanDay(
    day: TravelDay,
    activePlan: TravelPlan,
    weather: WeatherSummary,
    usedActivityIds: Set<string>,
    changes: PlanChange[]
  ): TravelDay {
    const timeSlots = day.timeSlots.map((slot) => {
      const originalActivity = slot.activity;

      if (!this.isWeatherAffected(originalActivity, weather)) {
        return this.cloneTimeSlot(slot);
      }

      const alternative = this.findBestAlternative(originalActivity, activePlan, weather, usedActivityIds);

      if (!alternative) {
        return this.cloneTimeSlot(slot);
      }

      usedActivityIds.add(alternative.id);
      changes.push({
        type: "replace",
        dayNumber: day.dayNumber,
        originalActivityId: originalActivity.id,
        newActivityId: alternative.id,
        explanation: `${originalActivity.name} ist bei Regen wetterkritisch. ${alternative.name} ist eine wetterfeste Alternative mit Score ${alternative.score?.overallScore ?? "n/a"}.`,
        costDelta: Number((alternative.estimatedCostTotal - originalActivity.estimatedCostTotal).toFixed(2))
      });

      return {
        ...slot,
        activity: alternative
      };
    });

    return {
      ...day,
      weather,
      timeSlots
    };
  }

  private findBestAlternative(
    originalActivity: Activity,
    activePlan: TravelPlan,
    weather: WeatherSummary,
    usedActivityIds: Set<string>
  ): Activity | undefined {
    const candidates = this.mockDataService
      .getBerlinDemoData()
      .activities.filter((activity) => activity.id !== originalActivity.id)
      .filter((activity) => !usedActivityIds.has(activity.id))
      .filter((activity) => activity.indoorOutdoor === "indoor" || activity.tags.includes("rain_safe"))
      .map((activity) => this.toPlannedActivity(activity, activePlan, weather, originalActivity.location.area))
      .map((activity) => ({
        activity,
        rank: this.calculateAlternativeRank(originalActivity, activity)
      }))
      .sort((left, right) => right.rank - left.rank);

    return candidates[0]?.activity;
  }

  private toPlannedActivity(
    activity: MockActivity,
    activePlan: TravelPlan,
    weather: WeatherSummary,
    preferredArea?: string
  ): Activity {
    const estimatedCostTotal = activity.estimatedCostPerPerson * activePlan.request.numberOfPeople;

    return {
      ...activity,
      estimatedCostTotal,
      location: { ...activity.location },
      score: this.activityScoringService.calculateActivityScore(activity, activePlan.request, weather, preferredArea)
    };
  }

  private calculateAlternativeRank(originalActivity: Activity, candidate: Activity): number {
    const categoryScore = candidate.category === originalActivity.category ? 0.2 : 0;
    const durationDelta = Math.abs(candidate.durationMinutes - originalActivity.durationMinutes);
    const durationScore = Math.max(0, 0.15 - durationDelta / 600);
    const sharedTags = candidate.tags.filter((tag) => originalActivity.tags.includes(tag)).length;
    const tagScore = Math.min(0.15, sharedTags * 0.05);

    return (candidate.score?.overallScore ?? 0) + categoryScore + durationScore + tagScore;
  }

  private isWeatherAffected(activity: Activity, weather: WeatherSummary): boolean {
    return weather.condition === "rain" && activity.indoorOutdoor === "outdoor";
  }

  private cloneDay(day: TravelDay): TravelDay {
    return {
      ...day,
      weather: day.weather ? { ...day.weather } : undefined,
      timeSlots: day.timeSlots.map((slot) => this.cloneTimeSlot(slot))
    };
  }

  private cloneTimeSlot(slot: TimeSlot): TimeSlot {
    return {
      ...slot,
      activity: {
        ...slot.activity,
        location: { ...slot.activity.location },
        tags: [...slot.activity.tags],
        score: slot.activity.score ? { ...slot.activity.score } : undefined
      }
    };
  }

  private toWeatherSummary(event: WeatherEvent): WeatherSummary {
    return {
      dayNumber: event.dayNumber,
      condition: event.condition,
      description: event.description,
      affectsOutdoorActivities: event.condition === "rain" || event.condition === "storm" || event.condition === "snow"
    };
  }

  private createReplanningInsights(dayNumber: number, changeCount: number): AgentInsight[] {
    return [
      {
        agentName: AGENT_NAMES.coordinator,
        displayLabel: "Coordinator Agent",
        status: "completed",
        summary: "Wetteraenderung erkannt"
      },
      {
        agentName: AGENT_NAMES.replanning,
        displayLabel: "Replanning Agent",
        status: "completed",
        summary:
          changeCount > 0
            ? `Outdoor-Aktivitaeten an Tag ${dayNumber} gefunden`
            : `Keine betroffenen Outdoor-Aktivitaeten an Tag ${dayNumber}`
      },
      {
        agentName: AGENT_NAMES.recommendation,
        displayLabel: "Recommendation Agent",
        status: "completed",
        summary: "Indoor-Alternativen bewertet"
      },
      {
        agentName: AGENT_NAMES.budget,
        displayLabel: "Budget Agent",
        status: "completed",
        summary: "Budget neu berechnet"
      },
      {
        agentName: AGENT_NAMES.coordinator,
        displayLabel: "Coordinator Agent",
        status: "completed",
        summary: "Aenderungsvorschlag erstellt"
      }
    ];
  }
}
