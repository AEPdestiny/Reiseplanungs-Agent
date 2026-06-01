import type { AgentInsight, AgentTraceEntry, BudgetSummary, Checklist, TravelPlan } from "@travel-agent/shared";

export class DemoTripResponseDto {
  tripId!: string;
  message!: string;
  plan?: TravelPlan;
  budget?: BudgetSummary;
  checklist?: Checklist;
  agentTrace?: AgentTraceEntry[];
  agentInsights?: AgentInsight[];
}
