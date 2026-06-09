<template>
  <section class="panel chat-panel">
    <div class="panel-header">
      <h2>Chat</h2>
      <span v-if="chatStore.loading" class="loading-pill">sendet</span>
    </div>

    <div ref="messagesElement" class="messages" aria-live="polite">
      <p v-if="messages.length === 0" class="empty-state">
        Lade eine Demo-Reise und frage den Agenten nach Begründungen oder Alternativen.
      </p>
      <article v-for="message in messages" :key="message.id" :class="['message', message.role]">
        <span>{{ message.role === "user" ? "Du" : "Agent" }}</span>
        <p>{{ message.content }}</p>
      </article>
    </div>

    <p v-if="chatStore.error" class="inline-error">{{ chatStore.error }}</p>

    <form class="chat-form" @submit.prevent="sendMessage">
      <textarea
        v-model="draftMessage"
        rows="3"
        :disabled="!tripStore.tripId || chatStore.loading"
        placeholder="Frage z. B. warum Tag 2 so geplant wurde..."
        @keydown.enter="handleEnter"
      />
      <button type="submit" :disabled="!tripStore.tripId || chatStore.loading || !draftMessage.trim()">
        Senden
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { nextTick, ref, watch } from "vue";
import { useChatStore } from "@/stores/chat.store";
import { useTripStore } from "@/stores/trip.store";

const chatStore = useChatStore();
const tripStore = useTripStore();
const { messages } = storeToRefs(chatStore);
const draftMessage = ref("");
const messagesElement = ref<HTMLDivElement | null>(null);

watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    scrollMessagesToBottom();
  }
);

async function sendMessage(): Promise<void> {
  if (!tripStore.tripId) {
    return;
  }

  const message = draftMessage.value;
  draftMessage.value = "";
  await chatStore.sendMessage(tripStore.tripId, message);
}

function handleEnter(event: KeyboardEvent): void {
  if (event.shiftKey) {
    return;
  }

  event.preventDefault();
  void sendMessage();
}

function scrollMessagesToBottom(): void {
  if (!messagesElement.value) {
    return;
  }

  messagesElement.value.scrollTop = messagesElement.value.scrollHeight;
}
</script>

<style scoped>
.chat-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: var(--space-3);
  height: clamp(520px, calc(100vh - 48px), 680px);
  min-height: 0;
  max-height: calc(100vh - 48px);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.loading-pill {
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  color: var(--color-info);
  background: var(--color-info-soft);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
}

.messages {
  display: grid;
  align-content: start;
  gap: var(--space-3);
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: var(--space-1);
  overscroll-behavior: contain;
}

.message {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-background);
}

.message.user {
  background: var(--color-info-soft);
}

.message.assistant {
  background: var(--color-success-soft);
}

.message span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-meta);
  font-weight: var(--font-weight-semibold);
}

.message p {
  margin: 0;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: normal;
  line-height: 1.45;
}

.chat-form {
  display: grid;
  gap: var(--space-2);
  background: var(--color-surface);
}

textarea {
  width: 100%;
  min-height: 92px;
  max-height: 160px;
  resize: vertical;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  color: var(--color-text-primary);
  font: inherit;
}

textarea:disabled {
  background: var(--color-background);
}

button {
  border: 0;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  color: white;
  background: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 980px) {
  .chat-panel {
    height: auto;
    min-height: 420px;
    max-height: none;
    overflow: visible;
  }

  .messages {
    min-height: 280px;
    max-height: 560px;
    overflow-y: auto;
  }
}
</style>
