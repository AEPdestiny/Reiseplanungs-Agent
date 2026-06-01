<template>
  <DashboardLayout>
    <template #chat>
      <ChatPanel />
    </template>
    <template #day-plan>
      <DayPlanPanel />
    </template>
    <template #budget>
      <BudgetPanel />
    </template>
    <template #route>
      <RouteMapPanel />
    </template>
    <template #checklist>
      <ChecklistPanel />
    </template>
    <template #agent-insights>
      <AgentInsightsPanel />
    </template>
    <template #replanning>
      <ReplanningProposalPanel />
    </template>
  </DashboardLayout>
</template>

<script setup lang="ts">
import AgentInsightsPanel from "@/components/agent-insights/AgentInsightsPanel.vue";
import BudgetPanel from "@/components/budget/BudgetPanel.vue";
import ChatPanel from "@/components/chat/ChatPanel.vue";
import ChecklistPanel from "@/components/checklist/ChecklistPanel.vue";
import DashboardLayout from "@/components/dashboard/DashboardLayout.vue";
import ReplanningProposalPanel from "@/components/replanning/ReplanningProposalPanel.vue";
import DayPlanPanel from "@/components/trip/DayPlanPanel.vue";
import RouteMapPanel from "@/components/trip/RouteMapPanel.vue";
</script>
