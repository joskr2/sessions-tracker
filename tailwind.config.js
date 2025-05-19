/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./styles/**/*.{css,scss}"],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
};
