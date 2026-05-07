/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "rgb(var(--app-bg) / <alpha-value>)",
        surface: "rgb(var(--app-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--app-surface-2) / <alpha-value>)",
        border: "rgb(var(--app-border) / <alpha-value>)",
        fg: "rgb(var(--app-fg) / <alpha-value>)",
        muted: "rgb(var(--app-muted) / <alpha-value>)",
        accent: "rgb(var(--app-accent) / <alpha-value>)",
        "accent-2": "rgb(var(--app-accent-2) / <alpha-value>)",
        danger: "rgb(var(--app-danger) / <alpha-value>)",
        warn: "rgb(var(--app-warn) / <alpha-value>)",
        success: "rgb(var(--app-success) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)",
        "soft-sm": "0 8px 20px rgba(0,0,0,0.28)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
}