import type { Config } from "tailwindcss";

// Tailwind CSS v4 configuration
// Most configuration is done in globals.css using @theme
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Lazada brand colors
        'lazada': {
          navy: '#0f146d',
          orange: '#f57224',
          'orange-light': '#ff6600',
        },
      },
    },
  },
  plugins: [],
};

export default config;
