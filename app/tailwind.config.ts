import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class", ".dark"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"], // Optional heading font
      },
      colors: {
        // Custom Palette
        abyss: "#092C56",    // Deep Blue (Dark Bg)
        lapis: "#225688",    // Medium Blue (Primary)
        slate: "#668CA9",    // Lighter Blue (Muted)
        glacier: "#A9CBE0",  // Very Light Blue (Border/Input)
        quartz: "#F0F5F4",   // Off-white (Light Bg)
        
        // Shadcn UI Semantic Mapping
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        border: "hsl(var(--border))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("tailwindcss-animate"),
  ],
}
export default config