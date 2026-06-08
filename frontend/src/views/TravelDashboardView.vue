<template>
  <DashboardLayout
    :has-trip="tripStore.hasTrip"
    :is-loading-demo="tripStore.loading"
    :is-replanning="proposalStore.loading"
    :has-pending-proposal="Boolean(proposalStore.pendingProposal)"
    :api-status="apiStatus"
    :error="pageError"
    @load-demo="loadDemoTrip"
    @simulate-rain="simulateRain"
  >
    <template #planning>
      <TripPlanningForm :is-planning="tripStore.planningLoading" @submit="createPlannedTrip" />
    </template>
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
import { computed, onMounted, ref } from "vue";
import type { TripRequest } from "@travel-agent/shared";
import AgentInsightsPanel from "@/components/agent-insights/AgentInsightsPanel.vue";
import BudgetPanel from "@/components/budget/BudgetPanel.vue";
import ChatPanel from "@/components/chat/ChatPanel.vue";
import ChecklistPanel from "@/components/checklist/ChecklistPanel.vue";
import DashboardLayout from "@/components/dashboard/DashboardLayout.vue";
import ReplanningProposalPanel from "@/components/replanning/ReplanningProposalPanel.vue";
import DayPlanPanel from "@/components/trip/DayPlanPanel.vue";
import RouteMapPanel from "@/components/trip/RouteMapPanel.vue";
import TripPlanningForm from "@/components/trip/TripPlanningForm.vue";
import { healthCheck } from "@/services/travel-api.service";
import { useProposalStore } from "@/stores/proposal.store";
import { useTripStore } from "@/stores/trip.store";

const tripStore = useTripStore();
const proposalStore = useProposalStore();
const apiStatus = ref<"checking" | "online" | "offline">("checking");

const pageError = computed(() => tripStore.error ?? proposalStore.error);

onMounted(async () => {
  try {
    await healthCheck();
    apiStatus.value = "online";
  } catch {
    apiStatus.value = "offline";
  }
});

async function loadDemoTrip(): Promise<void> {
  await tripStore.loadDemoTrip();
}

async function createPlannedTrip(request: TripRequest): Promise<void> {
  await tripStore.createPlannedTrip(request);
}

async function simulateRain(): Promise<void> {
  if (tripStore.tripId) {
    await proposalStore.simulateRainForDay2(tripStore.tripId);
  }
}
</script>
