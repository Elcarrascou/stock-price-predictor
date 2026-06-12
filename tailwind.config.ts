import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta institucional Universidad de Santiago de Chile
        usach: {
          navy: "#00324D", // azul oscuro institucional
          blue: "#007FA3", // azul/cian corporativo
          sky: "#3FA9C9", // celeste complementario
          orange: "#EA7600", // naranjo institucional
          amber: "#F5A623",
          paper: "#F4F7FA", // fondo claro
          ink: "#1B2A38", // texto principal
        },
      },
    },
  },
  plugins: [],
};

export default config;
