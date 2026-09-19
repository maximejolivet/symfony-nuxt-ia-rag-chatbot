<template>
  <header
    ref="header"
    :class="[
      'sticky top-0 z-50 h-18 border-b border-border bg-background transition-transform duration-300 ease-out motion-reduce:transition-none',
      hidden ? '-translate-y-full' : 'translate-y-0',
    ]"
    @focusin="hidden = false"
  >
    <div
      :class="[
        'mx-auto flex h-full items-center justify-between px-4 md:px-6',
        fluid ? 'lg:px-8 xl:px-9' : 'max-w-[1180px]',
      ]"
    >
      <SiteLogo />

      <nav :aria-label="$t('header.nav')" class="flex items-center gap-2 sm:gap-4">
        <a :href="SITE_URL" :class="[ctaBase, ctaReverse]">
          {{ $t('header.portfolioShort') }}
        </a>
        <a :href="CV_URL" target="_blank" rel="noopener" :class="[ctaBase, ctaPrimary]">
          {{ $t('header.cv') }}
          <CtaArrow class="hidden min-[370px]:block" />
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

// Like maxime.bzh: the header slides away when scrolling down and comes back
// as soon as the user scrolls up (or moves keyboard focus into it).
const header = ref<HTMLElement | null>(null);
const hidden = ref(false);
let lastY = 0;

function onScroll() {
  const y = window.scrollY;

  if (Math.abs(y - lastY) < 4) {
    return;
  }

  hidden.value = y > lastY && y > 72 && !header.value?.contains(document.activeElement);
  lastY = y;
}

onMounted(() => {
  lastY = window.scrollY;
  window.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));

const SITE_URL = 'https://maxime.bzh';

// The maxime.bzh header CTA: pill, gold (primary) or reversed (foreground on
// background) for the secondary one. The arrow slides right on hover. Below
// 370px the arrow goes and the padding shrinks so both CTAs fit next to the logo.
const ctaBase =
  'group inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-3 min-[370px]:px-4 sm:px-6.5 font-sans text-sm font-semibold transition-colors hover:bg-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const ctaPrimary = 'bg-primary text-primary-foreground';
const ctaReverse = 'bg-foreground text-background hover:text-accent-foreground';
</script>
