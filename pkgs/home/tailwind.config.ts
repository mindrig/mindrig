import type { Config } from "tailwindcss";
import pluginCapsize from "tailwindcss-capsize";

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // UI packages
    "../logo/src/**/html.tsx",
    // DS packages
    "../../subs/ds/pkgs/icons/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/modal/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/theme/src/**/*.{js,ts,jsx,tsx}",
    "../../subs/ds/pkgs/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: '"MonaSans", "sans-serif"',
      mono: '"MartianMono", "monospace"',
    },
    // Get metrics at: https://seek-oss.github.io/capsize/
    fontMetrics: {
      // Mona Sans
      sans: {
        capHeight: 729,
        ascent: 1090,
        descent: -320,
        lineGap: 0,
        unitsPerEm: 1000,
        xHeight: 525,
        xWidthAvg: 464,
        subsets: {
          latin: {
            xWidthAvg: 464,
          },
          thai: {
            xWidthAvg: 866,
          },
        },
      },
      // Martian Mono
      mono: {
        capHeight: 800,
        ascent: 1000,
        descent: -200,
        lineGap: 0,
        unitsPerEm: 1000,
        xHeight: 600,
        xWidthAvg: 700,
        subsets: {
          latin: {
            xWidthAvg: 700,
          },
          thai: {
            xWidthAvg: 700,
          },
        },
      },
    },
  },
  plugins: [pluginCapsize],
};
export default config;
