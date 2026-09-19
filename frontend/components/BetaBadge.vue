<template>
  <span
    :class="[
      'inline-flex shrink-0 items-center rounded-full border border-accent/60 font-mono leading-none text-foreground',
      size === 'lg' ? 'gap-2 px-4 py-2 text-sm' : 'gap-1.5 px-2.5 py-1.5 text-xs',
    ]"
  >
    <span
      aria-hidden="true"
      :class="['animate-pulse-dot rounded-full bg-accent', size === 'lg' ? 'size-2' : 'size-1.5']"
    />
    {{ $t('chatbot.betaBadge') }}
  </span>
</template>

<script setup lang="ts">
// `lg` on the hero and the /chat identity sidebar, `md` where room is tight
// (the compact mobile chat header).
withDefaults(defineProps<{ size?: 'md' | 'lg' }>(), { size: 'lg' });
</script>
