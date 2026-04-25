import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "sans-serif"],
        mono: ["var(--font-space-grotesk)", "monospace"],
      },
      colors: {
        background: "#0b1326",
        surface: "#0b1326",
        "surface-dim": "#060e20",
        "surface-container-lowest": "#060e20",
        "surface-container-low": "#131b2e",
        "surface-container": "#171f33",
        "surface-container-high": "#222a3d",
        "surface-container-highest": "#2d3449",
        "on-surface": "#dae2fd",
        "on-surface-variant": "#c2c6d6",
        primary: "#adc6ff",
        "primary-container": "#4d8eff",
        "on-primary": "#002e6a",
        secondary: "#c0c1ff",
        "secondary-container": "#3131c0",
        tertiary: "#ffb786",
        error: "#ffb4ab",
        "error-container": "#93000a",
        outline: "#8c909f",
        "outline-variant": "#424754",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out both",
        "fade-in": "fadeIn 0.3s ease-out both",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
