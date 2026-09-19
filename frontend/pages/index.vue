<template>
  <main class="flex min-h-screen flex-col bg-background text-foreground">
    <SiteHeader />

    <section class="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div
        class="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-14 lg:pl-[max(1.5rem,calc((100vw-1180px)/2+1.5rem))] lg:pr-10"
      >
        <div class="flex flex-col gap-6">
          <BetaBadge class="w-fit" />

          <h1
            class="text-balance font-sans text-[clamp(2.5rem,4.4vw,3.875rem)] leading-[1.1] font-bold tracking-[-1.8px] text-foreground"
          >
            {{ heading.slice(0, -1) }}<span class="text-accent">{{ heading.slice(-1) }}</span>
          </h1>

          <button
            type="button"
            class="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-sans text-xs font-semibold text-accent-ink transition-colors hover:bg-accent/20 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            @click="focusChat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
              class="size-3.5"
            >
              <g
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              >
                <path
                  d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4"
                />
                <circle cx="4" cy="20" r="2" />
              </g>
            </svg>
            {{ $t('home.badge') }}
          </button>

          <p
            class="max-w-[440px] text-pretty font-sans text-base leading-[1.68] text-muted-foreground"
          >
            {{ $t('home.subheading') }}
          </p>
        </div>
      </div>

      <div class="px-6 pb-8 sm:px-10 sm:pb-14 lg:flex lg:items-center lg:p-0 lg:pl-4">
        <HeroChatBar class="w-full" />
      </div>
    </section>

    <StickyChatBubble />
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n();
const heading = computed(() => t('home.heading'));

// The badge announces the assistant; the hero chat bar is that assistant.
const focusChat = () => document.getElementById('hero-question')?.focus();
</script>
