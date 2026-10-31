import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    base: "/SalesManager/",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
