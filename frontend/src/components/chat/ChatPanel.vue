<template>
  <section class="panel chat-panel">
    <div class="panel-header">
      <h2>Chat</h2>
      <span v-if="chatStore.loading" class="loading-pill">sendet</span>
    </div>

    <div class="messages" aria-live="polite">
      <p v-if="messages.length === 0" class="empty-state">
        Lade eine Demo-Reise und frage den Agenten nach Begruendungen oder Alternativen.
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
      />
      <button type="submit" :disabled="!tripStore.tripId || chatStore.loading || !draftMessage.trim()">
        Senden
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useChatStore } from "@/stores/chat.store";
import { useTripStore } from "@/stores/trip.store";

const chatStore = useChatStore();
const tripStore = useTripStore();
const { messages } = storeToRefs(chatStore);
const draftMessage = ref("");

async function sendMessage(): Promise<void> {
  if (!tripStore.tripId) {
    return;
  }

  const message = draftMessage.value;
  draftMessage.value = "";
  await chatStore.sendMessage(tripStore.tripId, message);
}
</script>

<style scoped>
.chat-panel {
  display: grid;
  gap: var(--space-3);
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
  gap: var(--space-3);
  max-height: 360px;
  overflow: auto;
}

.message {
  display: grid;
  gap: var(--space-1);
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
}

.chat-form {
  display: grid;
  gap: var(--space-2);
}

textarea {
  width: 100%;
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
</style>
