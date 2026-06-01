import { defineStore } from "pinia";
import type { Checklist } from "@travel-agent/shared";

interface ChecklistState {
  checklist: Checklist | null;
}

export const useChecklistStore = defineStore("checklist", {
  state: (): ChecklistState => ({
    checklist: null
  }),
  actions: {
    setChecklist(checklist?: Checklist): void {
      this.checklist = checklist ? structuredClone(checklist) : null;
    },
    toggleItem(itemId: string): void {
      const item = this.checklist?.items.find((entry) => entry.id === itemId);

      if (item) {
        item.completed = !item.completed;
      }
    },
    clear(): void {
      this.checklist = null;
    }
  }
});
