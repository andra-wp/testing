/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif"
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          "monospace"
        ]
      },
      colors: {
        vault: {
          950: "#050508", // pitch black background
          900: "#09090c", // dark surface
          850: "#0f0f14", // card backdrop
          800: "#14141b", // elevated surface
          750: "#1e1e27", // active / hover
          700: "#272733", // borders
          600: "#383847", // muted borders
          500: "#71717a", // muted labels
          400: "#a1a1aa", // secondary text
          300: "#d4d4d8", // primary body text
          100: "#fafafa", // pure white highlights
        },
        security: {
          blue: "#3b82f6",
          emerald: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444"
        }
      }
    },
  },
  plugins: [],
}

