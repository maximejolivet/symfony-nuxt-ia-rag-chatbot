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

    <!-- Below lg the prompt comes first: on a phone the input has to be on
         screen without scrolling past the suggestions. From lg up the
         terminal reads top-down (suggestions, then the prompt line). -->
    <div
      class="flex flex-1 flex-col gap-6 p-5 font-mono text-sm sm:p-7 sm:text-[15px] lg:justify-between lg:gap-8"
    >
      <form
        class="order-1 flex items-center gap-3 border-b border-border pb-5 lg:order-2 lg:border-b-0 lg:border-t lg:pb-0 lg:pt-5"
        @submit="onSubmit"
      >
        <div
          class="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 focus-within:ring-2 focus-within:ring-accent-ink"
        >
          <label class="sr-only" for="hero-question">{{ $t('heroChatBar.placeholder') }}</label>
          <span class="select-none text-primary" aria-hidden="true">&rsaquo;</span>
          <input
            id="hero-question"
            v-model="question"
            type="text"
            autocomplete="off"
            :placeholder="$t('heroChatBar.placeholder')"
            class="min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-base text-panel-foreground placeholder:text-muted-foreground caret-primary focus:outline-hidden focus:ring-0"
          />
        </div>
        <button
          type="submit"
          :disabled="!question.trim()"
          :aria-label="$t('heroChatBar.send')"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent-ink focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted-foreground disabled:ring-1 disabled:ring-inset disabled:ring-border"
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

      <div class="order-2 lg:order-1">
        <p class="text-muted-foreground">{{ $t('heroChatBar.hint') }}</p>
        <ul v-if="suggestedQuestions.length" class="mt-3 space-y-1">
          <li v-for="(suggestion, i) in suggestedQuestions" :key="suggestion" class="flex gap-4">
            <span
              class="w-4 shrink-0 select-none self-center text-right text-muted-foreground"
              aria-hidden="true"
            >
              {{ i + 1 }}
            </span>
            <button
              type="button"
              class="group flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-panel-2 focus:outline-hidden focus-visible:bg-panel-2 focus-visible:ring-2 focus-visible:ring-accent-ink"
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
