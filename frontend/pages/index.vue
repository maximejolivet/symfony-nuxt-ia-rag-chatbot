<template>
  <main class="hero-field relative min-h-screen overflow-hidden">
    <div
      class="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-x-12 px-6 pb-10 pt-12 sm:px-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:pt-16"
    >
      <div class="flex flex-col justify-center">
        <h1
          class="display text-[clamp(3.5rem,11.5vw,8.5rem)] leading-[0.88] text-balance sm:leading-[0.86]"
        >
          {{ $t('home.heading') }}
        </h1>

        <p class="mt-8 max-w-[38ch] font-serif text-xl leading-relaxed sm:text-2xl">
          {{ $t('home.subheading') }}
        </p>

        <HeroChatBar class="mt-10 max-w-2xl" />
      </div>

      <NuxtImg
        src="/maximejolivet.jpg"
        alt="Maxime"
        width="288"
        height="360"
        format="webp"
        class="mt-10 hidden aspect-[4/5] w-full self-end rounded-md object-cover object-top lg:block"
      />
    </div>

    <StickyChatBubble />
  </main>
</template>
