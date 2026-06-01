import type { BudgetSummary } from "./budget-summary";
import type { TravelDay } from "./travel-day";
import type { TripRequest } from "./trip-request";

export type TravelPlanStatus = "draft" | "active" | "proposal_pending";

export interface TravelPlan {
  id: string;
  request: TripRequest;
  days: TravelDay[];
  budgetSummary: BudgetSummary;
  status: TravelPlanStatus;
  createdAt: string;
  updatedAt: string;
}
