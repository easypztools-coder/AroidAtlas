import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0F0C",
        card: "#111A15",
        "card-hover": "#18221C",
        primary: "#C3D9A1",
        "primary-dark": "#A8C485",
        muted: "#8B9A92",
        "muted-light": "#A8B5AE",
        heading: "#FFFFFF",
        rarity: "#F87171",
        price: "#B371CF",
        leaf: "#60A5FA",
        "forest-dark": "#060A08",
        "forest-deep": "#0D1612",
        olive: "#5A6B4A",
        "olive-light": "#7A8F66",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse at center 40%, rgba(195, 217, 161, 0.08) 0%, transparent 70%)",
        "card-glow":
          "linear-gradient(135deg, rgba(195, 217, 161, 0.05) 0%, transparent 50%)",
      },
      boxShadow: {
        glass: "0 0 0 1px rgba(195, 217, 161, 0.08), 0 4px 24px rgba(0, 0, 0, 0.3)",
        "glass-hover":
          "0 0 0 1px rgba(195, 217, 161, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(195, 217, 161, 0.05)",
        glow: "0 0 30px rgba(195, 217, 161, 0.06)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-up": "fadeUp 0.8s ease-out forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(195, 217, 161, 0.03)" },
          "50%": { boxShadow: "0 0 40px rgba(195, 217, 161, 0.08)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;