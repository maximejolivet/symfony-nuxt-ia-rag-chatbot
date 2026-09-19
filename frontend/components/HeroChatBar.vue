<template>
  <div
    class="on-panel flex w-full flex-col overflow-hidden rounded-2xl shadow-xl shadow-foreground/10 lg:min-h-[32rem] lg:rounded-r-none"
  >
    <div class="flex items-center gap-2 bg-panel-2 px-4 py-3">
      <span class="h-3 w-3 rounded-full bg-[#c65b4f]" aria-hidden="true" />
      <span class="h-3 w-3 rounded-full bg-[#d9a441]" aria-hidden="true" />
      <span class="h-3 w-3 rounded-full bg-accent" aria-hidden="true" />
      <span class="ml-2 font-mono text-xs text-muted-foreground">
        {{ $t('heroChatBar.windowTitle') }}
      </span>
    </div>

    <div
      class="flex flex-1 flex-col justify-between gap-8 p-5 font-mono text-sm sm:p-7 sm:text-[15px]"
    >
      <div>
        <p class="text-muted-foreground">{{ $t('heroChatBar.hint') }}</p>
        <ul v-if="suggestedQuestions.length" class="mt-4 space-y-1">
          <li v-for="(suggestion, i) in suggestedQuestions" :key="suggestion" class="flex gap-4">
            <span
              class="w-4 shrink-0 select-none py-2 text-right text-muted-foreground/60"
              aria-hidden="true"
            >
              {{ i + 1 }}
            </span>
            <button
              type="button"
              class="group flex min-w-0 flex-1 items-baseline gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-panel-2 focus:outline-none focus-visible:bg-panel-2 focus-visible:ring-2 focus-visible:ring-accent"
              @click="askSuggestion(suggestion)"
            >
              <span class="text-primary" aria-hidden="true">&gt;</span>
              <span class="group-hover:link-dashed">{{
                suggestion.replace(/ ([?!:;])/g, '\u00A0$1')
              }}</span>
            </button>
          </li>
        </ul>
      </div>

      <form class="flex items-center gap-3 border-t border-border pt-5" @submit="onSubmit">
        <label class="sr-only" for="hero-question">{{ $t('heroChatBar.placeholder') }}</label>
        <span class="select-none text-accent" aria-hidden="true">&rsaquo;</span>
        <input
          id="hero-question"
          v-model="question"
          type="text"
          autocomplete="off"
          :placeholder="$t('heroChatBar.placeholder')"
          class="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-panel-foreground placeholder-muted-foreground caret-primary focus:outline-none focus:ring-0"
        />
        <button
          type="submit"
          :disabled="!question.trim()"
          :aria-label="$t('heroChatBar.send')"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted-foreground disabled:ring-1 disabled:ring-inset disabled:ring-border"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.25"
              d="M5 12h14M13 6l6 6-6 6"
            />
          </svg>
        </button>
      </form>
    </div>
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
