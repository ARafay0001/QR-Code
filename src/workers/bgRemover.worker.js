/* ------------------------------------------------------------------ */
/* Background remover worker                                           */
/* All heavy AI work (model load, downscale, inference) happens here   */
/* so the page's main thread never freezes.                            */
/* ------------------------------------------------------------------ */

import { removeBackground, preload } from "@imgly/background-removal";

function buildConfig(cfg, progress) {
  return {
    model: cfg.model,
    device: cfg.device,
    debug: false,
    ...(cfg.publicPath ? { publicPath: cfg.publicPath } : {}),
    ...(progress ? { progress } : {}),
    output: { format: "image/png", quality: 1, type: "foreground" },
  };
}

// Aggregates the library's per-file progress into one 0-99 percentage.
function makeProgressTracker(onPercent) {
  const parts = {};
  return (key, current, total) => {
    if (!total) return;
    parts[key] = [current, total];
    let c = 0;
    let t = 0;
    for (const k in parts) {
      c += parts[k][0];
      t += parts[k][1];
    }
    if (t) onPercent(Math.min(99, Math.round((c / t) * 100)));
  };
}

// Shrinks big images before inference (biggest speed win on CPUs).
async function downscaleIfNeeded(file, maxSide) {
  try {
    if (typeof OffscreenCanvas === "undefined") return file;

    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxSide / Math.max(width, height));

    if (scale === 1) {
      bitmap.close?.();
      return file;
    }

    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    return await canvas.convertToBlob({ type: "image/png" });
  } catch {
    return file;
  }
}

self.onmessage = async (e) => {
  const { id, type } = e.data;

  try {
    if (type === "preload") {
      const progress = makeProgressTracker((percent) =>
        self.postMessage({ id, type: "progress", percent })
      );
      await preload(buildConfig(e.data.config, progress));
      self.postMessage({ id, type: "preloaded" });
      return;
    }

    if (type === "remove") {
      const input = await downscaleIfNeeded(e.data.file, e.data.maxSide);
      const blob = await removeBackground(input, buildConfig(e.data.config));
      self.postMessage({ id, type: "result", blob });
      return;
    }
  } catch (err) {
    self.postMessage({
      id,
      type: "error",
      message: err?.message || String(err),
    });
  }
};
