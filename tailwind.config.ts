import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light, editorial surface scale derived from the design tokens.
        // ink = page/surface neutrals, paper = clean white cards.
        ink: {
          50: "#ffffff", // clean white card / elevated surface
          100: "#fbfbf8", // page background (near-white, warm-neutral)
          200: "#f4f4ed", // muted surface / section fills (token: surface.muted off-state)
          300: "#ededE4", // subtle pill fills
          400: "#e3e3da", // hairlines / borders
          500: "#c9c9bd", // strong borders / slider track
        },
        // Text scale (token: text.primary / text.tertiary).
        graphite: {
          900: "#111112", // text.tertiary — strongest headings
          800: "#282c20", // text.primary — body
          700: "#3e4139", // body on tinted fills
          600: "#55564c", // secondary text
          500: "#727368", // muted / captions
          400: "#9a9b90", // faint
        },
        // Light-blue brand accent.
        //  - DEFAULT / soft: light FILLS — only ever paired with graphite text on top.
        //  - deep: hover/active state for fills.
        //  - text: AA-contrast blue for accent TEXT / icons on light surfaces
        //    (#176bb3 ≈ 4.7:1 on white — never use DEFAULT as a text colour).
        azure: {
          DEFAULT: "#8ecbff",
          soft: "#bfe3ff",
          deep: "#6fb8f5",
          text: "#176bb3",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "Arial", "sans-serif"],
      },
      fontSize: {
        // Type scale from the design tokens (rem-normalised, base 14px).
        xs: ["0.8125rem", { lineHeight: "1.1rem" }], // 13 / token ~11.38–12.65
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14 (token md/base)
        base: ["0.875rem", { lineHeight: "1.42857rem" }], // 14 / 20px line
        md: ["1rem", { lineHeight: "1.5rem" }], // 16
        lg: ["1.125rem", { lineHeight: "1.6rem" }], // 18 (token lg ~15.81)
        xl: ["1.5rem", { lineHeight: "1.75rem" }], // 24 (token xl ~23.72)
        "2xl": ["2rem", { lineHeight: "2.15rem" }], // 32 (token 2xl)
        "3xl": ["2.375rem", { lineHeight: "2.5rem" }], // 38 (token 3xl)
        "4xl": ["3.5rem", { lineHeight: "3.5rem" }], // 56 (token 4xl)
        "5xl": ["4.5rem", { lineHeight: "4.4rem" }],
      },
      borderRadius: {
        // Radius tokens: xs 6.83 / sm 9.36 / md 41.94 (pill).
        xs: "0.4375rem", // 7px
        sm: "0.5625rem", // 9px
        md: "0.875rem", // 14px (card)
        lg: "1.25rem", // 20px
        pill: "2.625rem", // ~42px (token radius.md)
      },
      boxShadow: {
        // Flat, restrained shadows — no glow, no glass.
        card: "0 1px 2px rgba(17,17,18,0.04), 0 8px 24px -16px rgba(17,17,18,0.18)",
        float: "0 2px 4px rgba(17,17,18,0.05), 0 18px 40px -20px rgba(17,17,18,0.28)",
        focus: "0 0 0 3px rgba(17,17,18,0.12)",
      },
      transitionTimingFunction: {
        // One primary easing curve across the app.
        snap: "cubic-bezier(0.22,1,0.36,1)",
      },
      transitionDuration: {
        // Standard motion scale — prefer these over ad-hoc values.
        fast: "150ms",
        normal: "300ms",
        slow: "500ms",
        instant: "750ms", // token motion.duration.instant (intro/cinematic)
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
