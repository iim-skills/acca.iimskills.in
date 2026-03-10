import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "theme-blue": "#118aef",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        bounceOnce: {
          "0%, 100%": { transform: "translateY(0) translateX(-50%)", opacity: "1" },
          "50%": { transform: "translateY(-10px) translateX(-50%)", opacity: "1" },
        },
        fadeInScaleUp: {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        growHeight: {
          "0%": { height: "0", opacity: "0" },
          "100%": { height: "4rem", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        bounceOnce: "bounceOnce 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        fadeInScaleUp: "fadeInScaleUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        growHeight: "growHeight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        fadeIn: "fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
