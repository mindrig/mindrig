/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // Webview HTML
    "../extension/src/**/html.ts",
    // UI packages
    "../logo/src/**/html.tsx",
    // DS packages
    "../../subs/ds/pkgs/icons/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/modal/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/theme/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
};
