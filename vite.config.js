import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this repository under /dijkstra-d3js/.
  base: command === "serve" ? "/" : "/dijkstra-d3js/",
}));
