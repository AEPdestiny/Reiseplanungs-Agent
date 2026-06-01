import { defineStore } from "pinia";
import { sendChatMessage } from "@/services/travel-api.service";
import { useAgentInsightsStore } from "./agent-insights.store";
import { useProposalStore } from "./proposal.store";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => ({
    messages: [],
    loading: false,
    error: null
  }),
  actions: {
    async sendMessage(tripId: string, message: string): Promise<void> {
      const trimmedMessage = message.trim();

      if (!trimmedMessage) {
        return;
      }

      this.messages.push({
        id: `user_${Date.now()}`,
        role: "user",
        content: trimmedMessage
      });
      this.loading = true;
      this.error = null;

      try {
        const response = await sendChatMessage(tripId, trimmedMessage);

        this.messages.push({
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: response.message
        });
        useProposalStore().setPendingProposal(response.proposal ?? null);
        useAgentInsightsStore().setAgentInsights(response.agentInsights);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Nachricht konnte nicht gesendet werden.";
      } finally {
        this.loading = false;
      }
    },
    clear(): void {
      this.messages = [];
      this.error = null;
      this.loading = false;
    }
  }
});
