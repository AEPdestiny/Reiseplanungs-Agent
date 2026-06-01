export type BudgetStatus = "within_budget" | "near_limit" | "over_budget";

export interface BudgetCategory {
  category: string;
  amount: number;
  percentageOfBudget: number;
}

export interface BudgetSummary {
  budgetTotal: number;
  plannedTotal: number;
  remaining: number;
  currency: "EUR";
  perPersonTotal: number;
  categories: BudgetCategory[];
  status: BudgetStatus;
}
