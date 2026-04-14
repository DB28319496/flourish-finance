import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        flourish: {
          orange: "#E5633A",
          coral: "#F28C66",
          bg: "#F6F5F3",
          card: "#FFFFFF",
          text: "#22201D",
          secondary: "#736E66",
          tertiary: "#A6A19A",
          green: "#2B8A3E",
          red: "#E03131",
          blue: "#4D8FDB",
          "chart-income": "#BFE6C8",
          "chart-expense": "#F2CCCC",
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        body: ['"Geist"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Geist"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        "money-xl": ["2rem", { lineHeight: "1", fontWeight: "700", letterSpacing: "-0.02em" }],
        "money-lg": ["1.5rem", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.01em" }],
        "money-md": ["1rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      borderRadius: {
        flourish: "12px",
        "flourish-lg": "16px",
        "flourish-xl": "20px",
      },
      boxShadow: {
        flourish: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        "flourish-hover": "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
