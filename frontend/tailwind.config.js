/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Design tokens taken from DESIGN-huawei-com.md
      fontFamily: {
        sans: ["HuaweiSans", '"Helvetica Neue"', "Arial", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: "#c7000b",
          hover: "#e02128",
          disabled: "rgba(231, 67, 74, 0.6)",
        },
        ink: {
          DEFAULT: "#333333",   // body text
          dark: "#191919",      // headings
          secondary: "#595757", // subtitles
          muted: "#666666",     // hints, captions
          placeholder: "#aeaeae",
          disabled: "#999999",
        },
        line: "#e6e6e6",    // borders
        surface: "#f3f3f3", // cards, secondary areas
      },
      borderRadius: {
        input: "4px",
        btn: "6px",
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 6px 0 rgba(0,0,0,0.08)",
        hover: "0 8px 24px 0 rgba(0,0,0,0.08)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.25, 1, 0.5, 1)",
      },
      maxWidth: {
        page: "1200px",
      },
    },
  },
  plugins: [],
}
