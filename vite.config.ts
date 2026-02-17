/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  base: "/pte-class-coverage/",
  plugins: [react(), checker({ typescript: true })],
  test: {
    environment: "jsdom",
  },
});
