import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    tsConfigPaths(),
    nitro({
      preset: "vercel",
      output: {
        dir: ".vercel/output",
        publicDir: ".vercel/output/static",
        serverDir: ".vercel/output/functions/__server.func",
      },
    }),
  ],
});
