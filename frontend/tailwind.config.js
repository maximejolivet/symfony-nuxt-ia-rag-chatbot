import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // "Ciré" palette: fog paper + marine navy base, oilskin-yellow fill,
      // sea-green accent, buoy-red highlight (see assets/css/main.css for the
      // full rationale and the `:root`/`.dark` RGB triplet values).
      //
      // Each token is a CSS variable (RGB triplet) rather than a fixed hex,
      // so dark mode (composables/useColorScheme.ts, `.dark` class on
      // Chatbot.vue's root) works with the same `bg-background`/
      // `text-foreground`/etc. classes already used everywhere, without
      // touching components. `<alpha-value>` is substituted by Tailwind
      // itself when an opacity modifier is used (`bg-accent/10`), so every
      // token supports it natively.
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: 'rgb(var(--destructive) / <alpha-value>)',
        highlight: {
          DEFAULT: 'rgb(var(--highlight) / <alpha-value>)',
          foreground: 'rgb(var(--highlight-foreground) / <alpha-value>)',
        },
        panel: {
          DEFAULT: 'rgb(var(--panel) / <alpha-value>)',
          foreground: 'rgb(var(--panel-foreground) / <alpha-value>)',
        },
        'panel-2': 'rgb(var(--panel-2) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        // Fixed 0.16 alpha baked in (not <alpha-value>): border-border is
        // never used with an opacity modifier anywhere in this app, and this
        // matches the brand palette's own --line/--stripe hairline alpha in
        // both themes.
        border: 'rgb(var(--border) / 0.16)',
      },
      borderRadius: {
        // Deliberate scale instead of pill-everything: signage-sharp controls,
        // slightly softer surfaces; full only for avatars and status lights.
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '14px',
        '3xl': '18px',
      },
      fontFamily: {
        // Archivo: UI + display (its width axis gives the condensed poster
        // headline, see .display in main.css). Newsreader: reading text --
        // assistant replies and greetings.
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        blink: 'blink 1.1s step-end infinite',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        beacon: 'beacon 6s ease-in-out infinite',
        celebrate: 'celebrate 700ms ease-out',
        'loading-bar': 'loading-bar 1.2s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: 1 },
          '50%, 100%': { opacity: 0 },
        },
        // One-shot "pop + fading ring" played once when a booking
        // confirmation card is first inserted (see MessageBubble.vue) --
        // deliberately not a loop, just a brief moment of positive feedback
        // on the one spot in the widget where something concrete just
        // happened (a real Cal.eu booking).
        celebrate: {
          '0%': { transform: 'scale(0.92)', boxShadow: '0 0 0 0 rgb(var(--accent) / 0.45)' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 14px rgb(var(--accent) / 0)' },
        },
        // Indeterminate progress bar (GitHub/YouTube-style) -- a segment
        // sliding across a track, no real percentage to report while a
        // reply is generating (see MessageBubble.vue's blinking cursor for
        // the complementary token-level signal once content starts arriving).
        'loading-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: 0.6 },
          '70%': { transform: 'scale(1.6)', opacity: 0 },
          '100%': { transform: 'scale(1.6)', opacity: 0 },
        },
        // Group-flashing light, Fl(2) 6s: two short flashes, then a long dark
        // rest -- how a lighthouse identifies itself. Used for the online
        // status dot and the typing indicator, the one recurring motion in
        // the app.
        beacon: {
          '0%, 8%, 20%, 100%': { opacity: 0.25 },
          '10%, 16%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [typography],
};
