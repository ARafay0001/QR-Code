import { removeBackground } from "@imgly/background-removal";

let loaded = false;
let loadingPromise = null;
let currentDevice = "cpu";

async function getDevice() {
  if ("gpu" in navigator) {
    try {
      const adapter = await navigator.gpu.requestAdapter();

      if (adapter) {
        console.log("🚀 GPU detected");
        return "gpu";
      }
    } catch (e) {
      console.log("⚠️ GPU unavailable.");
    }
  }

  console.log("🖥️ Using CPU");
  return "cpu";
}

export async function preloadBackgroundModel() {
  if (loaded) {
    console.log("✅ AI Model already loaded.");
    return;
  }

  if (loadingPromise) {
    console.log("⏳ AI Model is already loading...");
    return loadingPromise;
  }

  console.log("🚀 Initializing AI model...");

  const start = performance.now();

  loadingPromise = (async () => {
    try {
      currentDevice = await getDevice();

      const config = {
        model: "isnet_fp16",
        device: currentDevice,
        publicPath: "/assets/",
        output: {
          format: "image/png",
          quality: 1,
          type: "foreground",
        },
      };

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
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

export function isModelLoaded() {
  return loaded;
}

export function getCurrentDevice() {
  return currentDevice;
}