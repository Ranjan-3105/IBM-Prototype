import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // In dev, the browser calls /api on the Vite origin and Vite forwards it to the API (no CORS needed).
  server: { proxy: { "/api": "http://localhost:5000" } },
});
