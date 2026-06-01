import type { BudgetSummary } from "./budget-summary";
import type { TravelPlan } from "./travel-plan";

export type ReplanningProposalStatus = "pending" | "accepted" | "rejected";
export type PlanChangeType = "replace" | "move" | "remove" | "add";

export interface PlanChange {
  type: PlanChangeType;
  dayNumber: number;
  originalActivityId?: string;
  newActivityId?: string;
  explanation: string;
  costDelta: number;
}

export interface ReplanningProposal {
  id: string;
  planId: string;
  reason: string;
  affectedDayNumbers: number[];
  changes: PlanChange[];
  proposedPlan: TravelPlan;
  budgetBefore: BudgetSummary;
  budgetAfter: BudgetSummary;
  status: ReplanningProposalStatus;
  createdAt: string;
}
