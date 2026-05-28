import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import preact from "@astrojs/preact";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [preact()],
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
