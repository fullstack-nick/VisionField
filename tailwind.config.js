/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}", // if you use src/
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // simple “theme tokens”
        background: "#ffffff",
        foreground: "#111827",
        primary: "#2563eb",
        muted: "#f3f4f6",
      },
    },
  },
  plugins: [],
};
