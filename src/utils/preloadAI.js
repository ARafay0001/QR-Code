import { removeBackground } from "@imgly/background-removal";

let loaded = false;
let loadingPromise = null;

const config = {
  model: "isnet_fp16",
  device: "cpu",

  publicPath: "/assets/",

  output: {
    format: "image/png",
    quality: 1,
    type: "foreground",
  },
};

export async function preloadBackgroundModel() {
  if (loaded) {
    console.log("✅ AI Model already loaded.");
    return;
  }

  if (loadingPromise) {
    console.log("⏳ AI Model is already downloading...");
    return loadingPromise;
  }

  console.log("🚀 Starting AI model download...");

  const start = performance.now();

  loadingPromise = (async () => {
    try {
      const tinyImage =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y0L0n8AAAAASUVORK5CYII=";

      const blob = await fetch(tinyImage).then((r) => r.blob());

      await removeBackground(blob, config);

      loaded = true;

      console.log(
        `✅ AI model ready in ${(
          (performance.now() - start) /
          1000
        ).toFixed(2)}s`
      );
    } catch (err) {
      console.error("❌ AI preload failed:", err);
    }
  })();

  return loadingPromise;
}

export function isModelLoaded() {
  return loaded;
}