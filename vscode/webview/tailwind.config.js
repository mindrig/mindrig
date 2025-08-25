/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // Webview HTML
    "../extension/**/html.ts",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
