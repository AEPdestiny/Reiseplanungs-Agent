import type { Activity } from "./activity";

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  activity: Activity;
  notes?: string;
}
