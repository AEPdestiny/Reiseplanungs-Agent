import { defineStore } from "pinia";

interface ChatState {
  messages: string[];
  isLoading: boolean;
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => ({
    messages: [],
    isLoading: false
  })
});
