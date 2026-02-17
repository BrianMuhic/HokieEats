import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "vt-maroon": "#861F41",
        "vt-orange": "#E87722",
        "vt-burgundy": "#6B2D3C",
      },
    },
  },
  plugins: [],
};
export default config;
