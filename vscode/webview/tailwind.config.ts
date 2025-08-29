/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // Webview HTML
    "../extension/src/**/html.ts",
  ],
  theme: {
    extend: {},
  },
  plugins: {},
};
