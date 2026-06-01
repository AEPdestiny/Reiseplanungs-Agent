import { defineStore } from "pinia";
import type { BudgetSummary } from "@travel-agent/shared";

interface BudgetState {
  summary: BudgetSummary | null;
}

export const useBudgetStore = defineStore("budget", {
  state: (): BudgetState => ({
    summary: null
  })
});
