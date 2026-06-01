import type { AgentInsight, AgentTraceEntry, BudgetSummary, Checklist, TravelPlan, TravelType } from "@travel-agent/shared";

export class PlanTripRequestDto {
  destination!: string;
  startDate?: string;
  endDate?: string;
  durationDays!: number;
  budgetTotal!: number;
  currency!: "EUR";
  numberOfPeople!: number;
  travelType!: TravelType;
  interests!: string[];
}

export class PlanTripResponseDto {
  tripId!: string;
  message!: string;
  plan?: TravelPlan;
  budget?: BudgetSummary;
  checklist?: Checklist;
  agentTrace?: AgentTraceEntry[];
  agentInsights?: AgentInsight[];
}
