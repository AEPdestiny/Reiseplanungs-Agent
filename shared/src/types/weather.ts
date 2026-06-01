export type WeatherCondition = "sunny" | "cloudy" | "rain" | "storm" | "snow";
export type WeatherSeverity = "low" | "medium" | "high";

export interface WeatherSummary {
  dayNumber: number;
  condition: WeatherCondition;
  description: string;
  affectsOutdoorActivities: boolean;
}

export interface WeatherEvent {
  dayNumber: number;
  condition: WeatherCondition;
  severity: WeatherSeverity;
  description: string;
}
