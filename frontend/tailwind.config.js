/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F2EB",
        charcoal: "#252724",
        "charcoal-muted": "#5A5D56",
        olive: "#727D60",
        "olive-light": "#EAEFE6",
        "olive-dark": "#515A44",
        "warm-grey": "#E5E1D8",
        "warm-grey-light": "#F0EDE6",
        "warm-grey-dark": "#CAC5B8",
        terracotta: "#C85A32",
        "terracotta-light": "#FBECE7",
        "terracotta-dark": "#9E401E",
        card: "#FFFFFF",
      },

      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(37, 39, 36, 0.05), 0 1px 2px rgba(37, 39, 36, 0.03)",
        card: "0 2px 8px -2px rgba(37, 39, 36, 0.06), 0 1px 4px -1px rgba(37, 39, 36, 0.04)",
        dropdown: "0 10px 25px -5px rgba(37, 39, 36, 0.1), 0 8px 10px -6px rgba(37, 39, 36, 0.05)",
      },
    },
  },
  plugins: [],
};
