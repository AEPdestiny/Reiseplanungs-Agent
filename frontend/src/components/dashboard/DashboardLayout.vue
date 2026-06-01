<template>
  <main class="dashboard-shell">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">MVP 1</p>
        <h1>Reiseplanungs-Agent</h1>
      </div>
      <div class="dashboard-actions">
        <button type="button">Demo-Reise laden</button>
        <button type="button" class="secondary">Regen an Tag 2 simulieren</button>
      </div>
    </header>

    <section class="dashboard-grid" aria-label="Reiseplanungs-Dashboard">
      <slot name="chat" />
      <slot name="day-plan" />
      <slot name="budget" />
      <slot name="route" />
      <slot name="checklist" />
      <slot name="agent-insights" />
    </section>

    <slot name="replanning" />
  </main>
</template>

<style scoped>
.dashboard-shell {
  min-height: 100vh;
  padding: var(--space-6);
  color: var(--color-text-primary);
  background: var(--color-background);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.dashboard-header h1 {
  margin: 0;
  font-size: var(--font-size-headline);
}

.eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
}

.dashboard-actions {
  display: flex;
  gap: var(--space-3);
}

button {
  border: 0;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  color: white;
  background: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

button.secondary {
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.85fr) minmax(360px, 1.4fr) minmax(260px, 0.85fr);
  gap: var(--space-4);
  align-items: start;
}

@media (max-width: 960px) {
  .dashboard-header,
  .dashboard-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
