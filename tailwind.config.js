import forms from "@tailwindcss/forms";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: "#4338ca",
          indigoLight: "#6366f1"
        }
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans]
      },
      borderRadius: {
        xl: "0.75rem"
      },
      boxShadow: {
        card: "0 20px 25px -15px rgba(15, 23, 42, 0.15)"
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem"
      }
    }
  },
  plugins: [forms]
};
