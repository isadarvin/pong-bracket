import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "sand-50": "#f7f2ea",
        "sand-100": "#e6ddcf",
        "sand-300": "#d3c6b2",
        "sand-900": "#231b15",
        ball: "#f5e663",
        "court-100": "#d4e7c7",
        "court-300": "#8fbe7f",
        "court-500": "#4f8b44",
        "court-700": "#2f5b2a",
        "court-blue": "#4d9de0",
        "clay-100": "#f5d0b8",
        "clay-300": "#e68f66",
        "clay-500": "#c95e3f",
        "clay-700": "#8a3622",
        success: "#4f8b44",
        danger: "#d64545",
        warning: "#f5a623",
      },
      borderRadius: {
        card: "18px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 14px 30px rgba(0,0,0,0.06)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
