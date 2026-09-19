<template>
  <main class="relative flex h-full flex-col overflow-hidden bg-background">
    <Chatbot
      class="relative"
      variant="page"
      :title="$t('chatbot.defaultTitle')"
      api-url="/api"
      :placeholder="$t('chatbot.writePlaceholder')"
    />
  </main>
</template>
