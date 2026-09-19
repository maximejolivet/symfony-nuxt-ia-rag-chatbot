<template>
  <main class="flex min-h-screen flex-col bg-background text-foreground">
    <section class="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div class="flex flex-col justify-center px-6 py-14 sm:px-10 lg:pl-16 lg:pr-10 xl:pl-24">
        <h1 class="max-w-[14ch] text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          {{ heading.slice(0, -1) }}<span class="text-accent">{{ heading.slice(-1) }}</span>
        </h1>

        <p class="mt-6 max-w-[40ch] text-lg leading-relaxed text-muted-foreground">
          {{ $t('home.subheading') }}
        </p>

        <a
          href="https://maxime.bzh"
          class="mt-8 w-fit border-b-2 border-accent pb-0.5 font-medium transition-colors hover:text-accent-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          {{ $t('home.portfolio') }}
        </a>
      </div>

      <div class="px-6 pb-14 sm:px-10 lg:flex lg:items-center lg:p-0 lg:pl-4">
        <HeroChatBar class="w-full" />
      </div>
    </section>

    <StickyChatBubble />
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n();
const heading = computed(() => t('home.heading'));
</script>
