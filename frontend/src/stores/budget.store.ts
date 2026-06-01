import { defineStore } from "pinia";
import type { BudgetSummary } from "@travel-agent/shared";

interface BudgetState {
  budget: BudgetSummary | null;
}

export const useBudgetStore = defineStore("budget", {
  state: (): BudgetState => ({
    budget: null
  }),
  actions: {
    setBudget(budget?: BudgetSummary): void {
      this.budget = budget ?? null;
    },
    clear(): void {
      this.budget = null;
    }
  }
});
