<template>
  <div class="w-full">
    <form
      class="flex w-full items-stretch overflow-hidden rounded-lg bg-primary-foreground text-primary focus-within:ring-2 focus-within:ring-primary-foreground focus-within:ring-offset-2 focus-within:ring-offset-primary"
      @submit="onSubmit"
    >
      <label class="sr-only" for="hero-question">{{ $t('heroChatBar.placeholder') }}</label>
      <input
        id="hero-question"
        v-model="question"
        type="text"
        :placeholder="$t('heroChatBar.placeholder')"
        class="min-w-0 flex-1 border-0 bg-transparent px-5 py-5 text-base text-primary placeholder-primary/70 focus:outline-none focus:ring-0 sm:text-lg"
      />
      <button
        type="submit"
        :disabled="!question.trim()"
        :aria-label="$t('heroChatBar.send')"
        class="flex w-16 shrink-0 items-center justify-center text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:bg-primary focus-visible:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-primary"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.25"
            d="M12 19V5m0 0l-6 6m6-6l6 6"
          />
        </svg>
      </button>
    </form>

    <ul v-if="suggestedQuestions.length" class="mt-4 border-t border-primary-foreground/30">
      <li
        v-for="suggestion in suggestedQuestions"
        :key="suggestion"
        class="border-b border-primary-foreground/30"
      >
        <button
          type="button"
          class="w-full px-1 py-3.5 text-left text-base font-medium transition-colors hover:bg-primary-foreground hover:px-4 hover:text-primary focus:outline-none focus-visible:bg-primary-foreground focus-visible:px-4 focus-visible:text-primary motion-reduce:transition-none sm:text-lg"
          @click="askSuggestion(suggestion)"
        >
          {{ suggestion }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const question = ref('');

// Written directly (not via useChatbot()) so mounting this bar on the
// landing page doesn't also trigger useChatbot's onMounted side effects
// (fetchAgents/checkLlmStatus/restoreConversation) before the visitor has
// even navigated to /chat.
const pendingMessage = useState<string | null>('chatbot-pending-message', () => null);

// Same source as the /chat empty state (see Chatbot.vue) -- both pull from
// the backend FAQ list via useFaqs() instead of a hardcoded list.
const { suggestedQuestions, fetchSuggestedQuestions } = useFaqs();
onMounted(fetchSuggestedQuestions);

const askSuggestion = async (suggestion: string) => {
  pendingMessage.value = suggestion;
  await navigateTo('/chat');
};

const onSubmit = async (e: Event) => {
  e.preventDefault();

  const trimmed = question.value.trim();
  if (!trimmed) return;

  pendingMessage.value = trimmed;
  question.value = '';
  await navigateTo('/chat');
};
</script>
