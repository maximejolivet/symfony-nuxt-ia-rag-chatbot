<template>
  <main class="relative flex h-full flex-col overflow-hidden bg-background">
    <!-- Below lg the chat brings its own compact header (back, photo, title,
         menu -- see Chatbot.vue), so the site header only shows from lg up,
         where the identity sidebar replaces that compact header. -->
    <SiteHeader fluid class="hidden lg:block" />
    <Chatbot
      class="relative"
      variant="page"
      :title="$t('chatbot.defaultTitle')"
      api-url="/api"
      :placeholder="$t('chatbot.writePlaceholder')"
    />
  </main>
</template>
