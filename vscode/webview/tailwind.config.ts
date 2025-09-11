/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // Webview HTML
    "../extension/src/**/html.ts",
    // DS packages
    "../../subs/ds/pkgs/form/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/icons/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/modal/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/theme/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
};
