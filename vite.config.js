// Merge these parts into your existing vite.config.js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Enables crossOriginIsolated -> multi-threaded WASM (fixes the numThreads warning)
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless", // use "require-corp" if you need Safari
};

export default defineConfig({
  plugins: [react(),
    tailwindcss(), /* , your other plugins (tailwind, etc.) */],
  server: { headers: isolationHeaders },   // npm run dev
  preview: { headers: isolationHeaders },  // npm run preview
  worker: { format: "es" },                // needed for the module worker in production builds
});

/* ---------------- Production hosting ----------------

Netlify / Cloudflare Pages -> create public/_headers:

  /*
    Cross-Origin-Opener-Policy: same-origin
    Cross-Origin-Embedder-Policy: credentialless

Vercel -> vercel.json:

  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
          { "key": "Cross-Origin-Embedder-Policy", "value": "credentialless" }
        ]
      }
    ]
  }

nginx -> inside your server block:

  add_header Cross-Origin-Opener-Policy "same-origin" always;
  add_header Cross-Origin-Embedder-Policy "credentialless" always;

Check it worked: open DevTools console and run `crossOriginIsolated` -> should be true.
------------------------------------------------------ */
