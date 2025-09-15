import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
        // AI Platform Specific Colors
        agent: {
          analyst: "hsl(var(--agent-analyst))",
          creative: "hsl(var(--agent-creative))",
          technical: "hsl(var(--agent-technical))",
          judge: "hsl(var(--agent-judge))",
          researcher: "hsl(var(--agent-researcher))",
        },
        status: {
          working: "hsl(var(--status-working))",
          complete: "hsl(var(--status-complete))",
          pending: "hsl(var(--status-pending))",
          error: "hsl(var(--status-error))",
        },
      },
      backgroundImage: {
        'gradient-ai': 'var(--gradient-ai)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-working': 'var(--gradient-working)',
      },
      boxShadow: {
        'ai': 'var(--shadow-ai)',
        'working': 'var(--shadow-working)',
        'complete': 'var(--shadow-complete)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ai-pulse": "ai-pulse 2s ease-in-out infinite",
        "working-glow": "working-glow 1.5s ease-in-out infinite",
        "agent-thinking": "agent-thinking 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
