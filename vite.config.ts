/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/pte-class-coverage/",
  plugins: [react()],
  test: { environment: "jsdom" },
});
