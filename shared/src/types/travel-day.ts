import type { TimeSlot } from "./time-slot";
import type { WeatherSummary } from "./weather";

export interface TravelDay {
  dayNumber: number;
  title: string;
  date?: string;
  weather?: WeatherSummary;
  timeSlots: TimeSlot[];
}
