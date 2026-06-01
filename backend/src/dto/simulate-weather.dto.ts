import type { AgentInsight, ReplanningProposal, WeatherCondition, WeatherSeverity } from "@travel-agent/shared";

export class SimulateWeatherRequestDto {
  dayNumber!: number;
  condition!: WeatherCondition;
  severity!: WeatherSeverity;
  description!: string;
}

export class SimulateWeatherResponseDto {
  message!: string;
  proposal?: ReplanningProposal;
  requiresUserConfirmation!: boolean;
  agentInsights?: AgentInsight[];
}
