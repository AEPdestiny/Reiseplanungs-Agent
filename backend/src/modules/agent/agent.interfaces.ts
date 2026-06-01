import type { ActivityScore, TripRequest, TravelPlan, WeatherEvent, WeatherSummary } from "@travel-agent/shared";

export interface AgentContext {
  tripRequest: TripRequest;
  currentPlan?: TravelPlan;
  weatherSummary?: WeatherSummary[];
  weatherEvent?: WeatherEvent;
  userMessage?: string;
}

export interface AgentResult<TData> {
  agentName: string;
  status: "success" | "partial" | "failed";
  data: TData;
  reasoningSummary: string;
  scores?: ActivityScore[];
  warnings: string[];
}
