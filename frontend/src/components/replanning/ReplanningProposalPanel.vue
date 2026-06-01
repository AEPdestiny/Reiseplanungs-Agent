<template>
  <section v-if="pendingProposal" class="panel proposal-panel">
    <div class="proposal-header">
      <div>
        <p class="eyebrow">Pending Proposal</p>
        <h2>Neuplanungsvorschlag</h2>
      </div>
      <span>{{ pendingProposal.status }}</span>
    </div>

    <p class="reason">{{ pendingProposal.reason }}</p>

    <div class="proposal-meta">
      <span>Betroffene Tage: {{ pendingProposal.affectedDayNumbers.join(", ") }}</span>
      <span>Kosten-Differenz: {{ formatCurrency(costDelta) }}</span>
    </div>

    <div class="budget-compare">
      <div>
        <span>Vorher</span>
        <strong>{{ formatCurrency(pendingProposal.budgetBefore.plannedTotal) }}</strong>
      </div>
      <div>
        <span>Nachher</span>
        <strong>{{ formatCurrency(pendingProposal.budgetAfter.plannedTotal) }}</strong>
      </div>
    </div>

    <ul class="change-list">
      <li v-for="(change, index) in pendingProposal.changes" :key="index">
        <strong>{{ formatChangeType(change.type) }} an Tag {{ change.dayNumber }}</strong>
        <p>{{ change.explanation }}</p>
        <span>{{ formatCurrency(change.costDelta) }}</span>
      </li>
    </ul>

    <p v-if="proposalStore.error" class="inline-error">{{ proposalStore.error }}</p>

    <div class="proposal-actions">
      <button type="button" :disabled="proposalStore.loading" @click="acceptProposal">
        Aenderungen uebernehmen
      </button>
      <button type="button" class="secondary" :disabled="proposalStore.loading" @click="rejectProposal">
        Ablehnen
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useProposalStore } from "@/stores/proposal.store";
import { useTripStore } from "@/stores/trip.store";

const proposalStore = useProposalStore();
const tripStore = useTripStore();
const { pendingProposal } = storeToRefs(proposalStore);

const costDelta = computed(() => {
  if (!pendingProposal.value) {
    return 0;
  }

  return pendingProposal.value.budgetAfter.plannedTotal - pendingProposal.value.budgetBefore.plannedTotal;
});

async function acceptProposal(): Promise<void> {
  if (tripStore.tripId) {
    await proposalStore.acceptProposal(tripStore.tripId);
  }
}

async function rejectProposal(): Promise<void> {
  if (tripStore.tripId) {
    await proposalStore.rejectProposal(tripStore.tripId);
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    signDisplay: "exceptZero"
  }).format(amount);
}

function formatChangeType(type: string): string {
  const labels: Record<string, string> = {
    replace: "Ersetzen",
    move: "Verschieben",
    remove: "Entfernen",
    add: "Hinzufuegen"
  };

  return labels[type] ?? type;
}
</script>

<style scoped>
.proposal-panel {
  display: grid;
  gap: var(--space-4);
  border-color: var(--color-warning);
  background: var(--color-warning-soft);
}

.proposal-header,
.proposal-meta,
.proposal-actions,
.budget-compare {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.proposal-header h2,
.proposal-header p,
.reason,
.change-list p {
  margin: 0;
}

.proposal-header > span {
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  color: var(--color-warning);
  background: var(--color-surface);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
}

.proposal-meta {
  justify-content: flex-start;
  flex-wrap: wrap;
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.budget-compare {
  align-items: stretch;
}

.budget-compare div {
  display: grid;
  gap: var(--space-1);
  flex: 1;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-surface);
}

.budget-compare span,
.change-list span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.change-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.change-list li {
  display: grid;
  gap: var(--space-1);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-surface);
}

button {
  border: 0;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  color: white;
  background: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

button.secondary {
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 640px) {
  .proposal-header,
  .proposal-actions,
  .budget-compare {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
