import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// fileURLToPath works on Node 12+ (import.meta.dirname requires Node 21+)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isReplit = !!process.env.REPL_ID;

export default defineConfig(async () => {
  const plugins: any[] = [react()];

  // Replit-only plugins — skipped on Vercel (REPL_ID absent)
  if (isReplit) {
    try {
      const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal");
      plugins.push(runtimeErrorOverlay());
    } catch {}
    if (process.env.NODE_ENV !== "production") {
      try {
        const { cartographer } = await import("@replit/vite-plugin-cartographer");
        plugins.push(cartographer());
      } catch {}
      try {
        const { devBanner } = await import("@replit/vite-plugin-dev-banner");
        plugins.push(devBanner());
      } catch {}
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-three": ["three", "react-globe.gl"],
            "vendor-ui": ["framer-motion", "lucide-react", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select", "@radix-ui/react-tabs", "@radix-ui/react-tooltip"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-charts": ["recharts"],
          },
        },
      },
    },
    server: {
      allowedHosts: true,
      hmr: {
        clientPort: 443,
        protocol: "wss",
        path: "/vite-hmr",
      },
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
