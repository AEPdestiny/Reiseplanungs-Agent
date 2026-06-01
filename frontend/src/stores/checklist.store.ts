import { defineStore } from "pinia";
import type { Checklist } from "@travel-agent/shared";

interface ChecklistState {
  checklist: Checklist | null;
}

export const useChecklistStore = defineStore("checklist", {
  state: (): ChecklistState => ({
    checklist: null
  })
});
