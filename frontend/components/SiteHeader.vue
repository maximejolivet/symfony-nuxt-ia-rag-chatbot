<template>
  <header class="border-b border-border bg-background">
    <div
      :class="[
        'mx-auto flex h-[4.5rem] items-center justify-between px-6',
        fluid ? 'lg:px-8 xl:px-9' : 'max-w-[1180px]',
      ]"
    >
      <SiteLogo />

      <nav class="flex items-center gap-6">
        <a
          href="https://maxime.bzh"
          class="hidden min-h-11 items-center rounded-lg text-sm font-medium transition-colors hover:text-accent-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink focus-visible:ring-offset-4 focus-visible:ring-offset-background min-[360px]:inline-flex"
        >
          <span class="sm:hidden">{{ $t('header.portfolioShort') }}</span>
          <span class="hidden sm:inline">{{ $t('header.portfolio') }}</span>
        </a>
        <a
          :href="CV_URL"
          target="_blank"
          rel="noopener"
          class="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {{ $t('header.cv') }}
          <span class="sr-only">{{ $t('header.newTab') }}</span>
        </a>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
// `fluid`: full-width content box, for pages whose body is a full-bleed
// layout (pages/chat.vue's identity sidebar) so the logo lines up with that
// sidebar's own horizontal padding instead of floating in a centered column.
defineProps<{ fluid?: boolean }>();
</script>
