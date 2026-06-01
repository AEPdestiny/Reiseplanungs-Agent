import { defineStore } from "pinia";
import type { ReplanningProposal } from "@travel-agent/shared";

interface ProposalState {
  pendingProposal: ReplanningProposal | null;
}

export const useProposalStore = defineStore("proposal", {
  state: (): ProposalState => ({
    pendingProposal: null
  })
});
