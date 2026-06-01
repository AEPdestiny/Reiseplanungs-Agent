<template>
  <section class="panel checklist-panel">
    <h2>Checkliste</h2>

    <p v-if="!checklist" class="empty-state">Noch keine Checkliste geladen.</p>

    <ul v-else class="checklist">
      <li v-for="item in checklist.items" :key="item.id" class="checklist-item">
        <label>
          <input type="checkbox" :checked="item.completed" @change="checklistStore.toggleItem(item.id)" />
          <span :class="{ completed: item.completed }">{{ item.label }}</span>
        </label>
        <div class="item-meta">
          <span>{{ formatCategory(item.category) }}</span>
          <span :class="['priority', item.priority]">{{ formatPriority(item.priority) }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useChecklistStore } from "@/stores/checklist.store";

const checklistStore = useChecklistStore();
const { checklist } = storeToRefs(checklistStore);

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    packing: "Packen",
    documents: "Dokumente",
    booking: "Buchung",
    preparation: "Vorbereitung"
  };

  return labels[category] ?? category;
}

function formatPriority(priority: string): string {
  const labels: Record<string, string> = {
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch"
  };

  return labels[priority] ?? priority;
}
</script>

<style scoped>
.checklist-panel,
.checklist {
  display: grid;
  gap: var(--space-3);
}

.checklist {
  margin: 0;
  padding: 0;
  list-style: none;
}

.checklist-item {
  display: grid;
  gap: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-3);
}

.checklist-item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

input {
  margin-top: 0.15rem;
  accent-color: var(--color-primary);
}

.completed {
  color: var(--color-text-secondary);
  text-decoration: line-through;
}

.item-meta {
  display: flex;
  gap: var(--space-2);
  padding-left: 1.35rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.priority {
  border-radius: var(--radius-sm);
  padding: 0 var(--space-2);
  background: var(--color-background);
}

.priority.high {
  color: var(--color-error);
  background: var(--color-error-soft);
}

.priority.medium {
  color: var(--color-warning);
  background: var(--color-warning-soft);
}
</style>
