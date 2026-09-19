<template>
  <main class="flex min-h-screen flex-col bg-background text-foreground">
    <SiteHeader />

    <section class="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div
        class="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-14 lg:pl-[max(1.5rem,calc((100vw-1180px)/2+1.5rem))] lg:pr-10"
      >
        <h1
          class="max-w-[14ch] font-sans text-4xl font-bold leading-[1.05] tracking-tight min-[400px]:text-5xl sm:text-6xl"
        >
          {{ heading.slice(0, -1) }}<span class="text-accent">{{ heading.slice(-1) }}</span>
        </h1>

        <p class="mt-6 max-w-[40ch] text-lg leading-relaxed text-muted-foreground">
          {{ $t('home.subheading') }}
        </p>
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
</script>
