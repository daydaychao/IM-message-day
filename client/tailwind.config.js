/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        hacker: {
          green: "#00ff41",
          "green-dark": "#00b32d",
          "green-light": "#66ff8a",
        },
        dark: {
          bg: "#0a0a0a",
          surface: "#1a1a1a",
          border: "#2a2a2a",
        },
      },
      fontFamily: {
        mono: ["Courier New", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 1s infinite",
        "slide-in-right-right": "slideInRight 0.3s ease-out",
        "slide-out-right-right": "slideOutRight 0.3s ease-in",
      },
    },
  },
  plugins: [],
};
