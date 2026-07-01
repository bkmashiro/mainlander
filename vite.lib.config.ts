import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/index.ts",
      name: "Mainlander",
      formats: ["es", "umd"],
      fileName: (format) => format === "es" ? "mainlander.js" : "mainlander.umd.cjs",
    },
    outDir: "dist-lib",
    sourcemap: true,
  },
});
