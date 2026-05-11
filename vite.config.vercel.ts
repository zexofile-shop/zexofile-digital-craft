// Vercel-specific Vite config. Used ONLY when deploying to Vercel.
// Locally (Lovable preview / sandbox) the default `vite.config.ts` is used,
// which targets Cloudflare Workers via the Lovable preset.
//
// Vercel uses TanStack Start's built-in "vercel" target which emits the
// Vercel Build Output API format (.vercel/output/) — serverless functions
// for SSR + server functions, plus static assets.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      target: "vercel",
      // Keep our SSR error wrapper as the server entry.
      server: { entry: "server" },
    }),
    viteReact(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
});
