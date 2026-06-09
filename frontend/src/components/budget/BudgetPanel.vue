<template>
  <section class="panel budget-panel">
    <div class="panel-header">
      <h2>Budget</h2>
      <span v-if="budget" class="budget-status" :class="budget.status">{{ formatStatus(budget.status) }}</span>
    </div>

    <p v-if="!budget" class="empty-state">Noch keine Budgetdaten geladen.</p>

    <div v-else class="budget-content">
      <div class="budget-total">
        <span>Geplant</span>
        <strong>{{ formatCurrency(budget.plannedTotal) }}</strong>
        <small>von {{ formatCurrency(budget.budgetTotal) }}</small>
      </div>

      <dl class="budget-metrics">
        <div>
          <dt>Restbudget</dt>
          <dd>{{ formatCurrency(budget.remaining) }}</dd>
        </div>
        <div>
          <dt>Pro Person</dt>
          <dd>{{ formatCurrency(budget.perPersonTotal) }}</dd>
        </div>
      </dl>

      <div class="category-list">
        <div v-for="category in budget.categories" :key="category.category" class="category-row">
          <div class="category-label">
            <span>{{ category.category }}</span>
            <strong>{{ formatCurrency(category.amount) }}</strong>
          </div>
          <div class="progress-track">
            <div class="progress-bar" :style="{ width: `${Math.min(category.percentageOfBudget, 100)}%` }" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useBudgetStore } from "@/stores/budget.store";

const { budget } = storeToRefs(useBudgetStore());

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(amount);
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    within_budget: "Im Budget",
    near_limit: "Nahe Limit",
    over_budget: "Über Budget"
  };

  return labels[status] ?? status;
}
</script>

<style scoped>
.budget-panel,
.budget-content {
  display: grid;
  gap: var(--space-4);
}

.panel-header,
.category-label,
.budget-metrics div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.budget-status {
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
}

.budget-status.within_budget {
  color: var(--color-success);
  background: var(--color-success-soft);
}

.budget-status.near_limit {
  color: var(--color-warning);
  background: var(--color-warning-soft);
}

.budget-status.over_budget {
  color: var(--color-error);
  background: var(--color-error-soft);
}

.budget-total {
  display: grid;
  gap: var(--space-1);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  color: white;
  background: linear-gradient(135deg, var(--color-primary), var(--color-info));
}

.budget-total span,
.budget-total small {
  opacity: 0.85;
}

.budget-total strong {
  font-size: 1.8rem;
}

.budget-metrics {
  display: grid;
  gap: var(--space-2);
  margin: 0;
}

.budget-metrics div {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-2);
}

.budget-metrics dt,
.budget-metrics dd {
  margin: 0;
}

.budget-metrics dt {
  color: var(--color-text-secondary);
}

.budget-metrics dd {
  font-weight: var(--font-weight-semibold);
}

.category-list {
  display: grid;
  gap: var(--space-3);
}

.category-row {
  display: grid;
  gap: var(--space-2);
}

.category-label {
  font-size: var(--font-size-meta);
}

.category-label span {
  color: var(--color-text-secondary);
}

.progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-background);
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}
</style>
