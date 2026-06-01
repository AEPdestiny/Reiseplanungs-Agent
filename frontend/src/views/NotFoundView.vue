<template>
  <main class="not-found-view">
    <h1>Seite nicht gefunden</h1>
    <RouterLink to="/">Zurueck zum Dashboard</RouterLink>
  </main>
</template>

<style scoped>
.not-found-view {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: var(--space-4);
  color: var(--color-text-primary);
  background: var(--color-background);
}
</style>
