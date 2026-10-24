import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wand2,
  UploadCloud,
  ImageIcon,
  Download,
  RotateCcw,
  Cpu,
  Zap,
  Eye,
  Sparkles,
  X,
} from "lucide-react";
import { removeBackground, preload } from "@imgly/background-removal";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ToolFAQ from "../components/common/ToolFAQ";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const VALID_TYPES = ["image/png", "image/jpeg", "image/webp"];

const LOADING_MESSAGES = [
  "🔍 Detecting subject...",
  "✂️ Separating foreground...",
  "✨ Refining edges...",
  "📦 Finalizing PNG...",
];

const FAQ = [
  {
    q: "Is this background remover really free?",
    a: "Yes. It is free, needs no account and has no watermark.",
  },
  {
    q: "Are my images uploaded to a server?",
    a: "No. The AI model runs inside your browser, so your photos never leave your device.",
  },
  {
    q: "Why is it faster on some devices?",
    a: "If your device supports GPU acceleration (WebGPU) we use it at high quality. Otherwise we switch to a lighter model and a smaller working size so it stays fast on CPUs.",
  },
];

const CHECKER_STYLE = {
  backgroundImage:
    "linear-gradient(45deg,#1e293b 25%,transparent 25%,transparent 75%,#1e293b 75%),linear-gradient(45deg,#1e293b 25%,transparent 25%,transparent 75%,#1e293b 75%)",
  backgroundSize: "24px 24px",
  backgroundPosition: "0 0,12px 12px",
};

/* ------------------------------------------------------------------ */
/* Device detection + AI engine helpers (module level, cached)         */
/* ------------------------------------------------------------------ */

// Folder inside /public that holds resources.json + the model chunks.
const LOCAL_MODEL_PATH = "/assets/bgRemoverModel/";

let localModelsPromise = null;

// Checks which models exist in the local folder. Returns null if the folder
// is missing/invalid, in which case the library falls back to its CDN.
function detectLocalModels() {
  if (!localModelsPromise) {
    localModelsPromise = (async () => {
      try {
        const base = new URL(LOCAL_MODEL_PATH, window.location.origin).href;
        const res = await fetch(base + "resources.json");
        if (!res.ok) return null;
        const manifest = await res.json();
        const keys = Object.keys(manifest);
        const models = ["isnet", "isnet_fp16", "isnet_quint8"].filter((m) =>
          keys.some((k) => k.endsWith(`/models/${m}`))
        );
        return models.length ? { base, models } : null;
      } catch {
        return null;
      }
    })();
  }
  return localModelsPromise;
}

async function pickModel(preferred) {
  const local = await detectLocalModels();
  const model = local
    ? preferred.find((m) => local.models.includes(m)) || preferred[0]
    : preferred[0];
  return { model, publicPath: local?.base };
}

async function buildGpuProfile() {
  const { model, publicPath } = await pickModel([
    "isnet_fp16",
    "isnet",
    "isnet_quint8",
  ]);
  return {
    device: "gpu",
    quality: "high",
    model,
    publicPath,
    maxSide: 2048,
    label: "GPU accelerated",
  };
}

async function buildCpuProfile(low) {
  // quantized model is much faster on CPU; smaller size = less time
  const { model, publicPath } = await pickModel([
    "isnet_quint8",
    "isnet_fp16",
    "isnet",
  ]);
  return {
    device: "cpu",
    quality: "standard",
    model,
    publicPath,
    maxSide: low ? 768 : 1024,
    label: low ? "Lite mode (CPU)" : "Balanced mode (CPU)",
  };
}

// Used by the "Improve quality" button on CPU devices: bigger, more accurate
// model + larger working size. Slower, but only runs when the user asks.
async function buildHighQualityProfile() {
  const { model, publicPath } = await pickModel([
    "isnet_fp16",
    "isnet",
    "isnet_quint8",
  ]);
  return {
    device: "cpu",
    quality: "high",
    model,
    publicPath,
    maxSide: 2048,
    label: "High detail (CPU)",
  };
}

let profilePromise = null;

function detectProfile() {
  if (!profilePromise) {
    profilePromise = (async () => {
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      // add this line:
      const forceCpu = new URLSearchParams(window.location.search).get("cpu") === "1";
      try {
        // change this line to include !forceCpu:
        if (!forceCpu && navigator.gpu) {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter && !adapter.isFallbackAdapter) return buildGpuProfile();
        }
      } catch {
        /* fall through to CPU */
      }
      return buildCpuProfile(cores <= 4 || memory <= 4);
    })();
  }
  return profilePromise;
}

const preloadCache = new Map();

function buildConfig(profile, progress) {
  return {
    model: profile.model,
    device: profile.device,
    debug: false,
    ...(profile.publicPath ? { publicPath: profile.publicPath } : {}),
    progress,
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

function preloadModel(profile, onPercent) {
  const id = `${profile.device}:${profile.model}`;
  if (!preloadCache.has(id)) {
    const p = Promise.resolve(
      preload(buildConfig(profile, makeProgressTracker(onPercent)))
    ).catch((err) => {
      preloadCache.delete(id); // allow retry
      throw err;
    });
    preloadCache.set(id, p);
  }
  return preloadCache.get(id);
}

// Shrinks big images before inference – the biggest speed win on CPUs.
async function downscaleIfNeeded(file, maxSide) {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxSide / Math.max(width, height));

    if (scale === 1) {
      bitmap.close?.();
      return file;
    }

    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    canvas.width = canvas.height = 0;
    return blob || file;
  } catch {
    return file;
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function BackgroundRemover() {
  const inputRef = useRef(null);
  const previewRef = useRef(null);
  const runIdRef = useRef(0);

  const [profile, setProfile] = useState(null);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState(false);

  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultQuality, setResultQuality] = useState(null); // "standard" | "high"
  const [showOriginal, setShowOriginal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceProgress, setEnhanceProgress] = useState(null); // null = processing
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  /* ---- detect device + preload the matching model ---- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const p = await detectProfile();
        if (cancelled) return;
        setProfile(p);
        await preloadModel(p, (pct) => !cancelled && setModelProgress(pct));
        if (cancelled) return;
        setModelProgress(100);
        setModelReady(true);
      } catch (err) {
        console.error("AI failed to load", err);
        if (!cancelled) setModelError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- object URL lifecycle (no memory leaks) ---- */
  useEffect(() => {
    if (!file) {
      setOriginalUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!resultUrl) return;
    return () => URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  /* ---- rotating status text while processing ---- */
  useEffect(() => {
    if (!loading) return;
    setMessageIndex(0);
    const id = setInterval(
      () => setMessageIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1)),
      1800
    );
    return () => clearInterval(id);
  }, [loading]);

  /* ---- file handling ---- */
  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!VALID_TYPES.includes(f.type)) {
      setError("Only PNG, JPG and WEBP images are supported.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError("Maximum file size is 20 MB.");
      return;
    }
    runIdRef.current++; // invalidate any run in progress
    setError("");
    setLoading(false);
    setEnhancing(false);
    setEnhanceProgress(null);
    setResultUrl(null);
    setResultQuality(null);
    setShowOriginal(false);
    setFile(f);
  }, []);

  // Paste an image from the clipboard (Ctrl/Cmd + V)
  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) =>
        i.type.startsWith("image/")
      );
      if (item) handleFile(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  const reset = () => {
    runIdRef.current++;
    setFile(null);
    setResultUrl(null);
    setResultQuality(null);
    setLoading(false);
    setEnhancing(false);
    setEnhanceProgress(null);
    setError("");
    setShowOriginal(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Cancel the quality upgrade. On the main thread the engine can't be
  // interrupted mid-run, so we simply ignore its result and keep the old one.
  const cancelEnhance = () => {
    runIdRef.current++;
    setLoading(false);
    setEnhancing(false);
    setEnhanceProgress(null);
  };

  /* ---- main action ---- */
  const handleRemoveBackground = async () => {
    if (!file || loading) return;
    if (!modelReady || !profile) {
      setError("The AI engine is still preparing. Please wait a moment.");
      return;
    }

    const runId = ++runIdRef.current;
    setError("");
    setLoading(true);
    setEnhancing(false);
    setShowOriginal(false);
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

    const process = async (p) => {
      const input = await downscaleIfNeeded(file, p.maxSide);
      return removeBackground(input, buildConfig(p));
    };

    try {
      let blob;
      let used = profile;
      try {
        blob = await process(profile);
      } catch (err) {
        // GPU can fail on some drivers – transparently retry on CPU.
        if (profile.device !== "gpu") throw err;
        console.warn("GPU failed, falling back to CPU", err);
        const cpu = await buildCpuProfile(false);
        setProfile(cpu);
        used = cpu;
        blob = await process(cpu);
      }

      if (runId !== runIdRef.current) return; // user changed image meanwhile
      setResultUrl(URL.createObjectURL(blob));
      setResultQuality(used.quality);
    } catch (err) {
      console.error("Background removal error", err);
      if (runId === runIdRef.current) {
        setError(
          err?.message
            ? `Failed to remove background: ${err.message}`
            : "Failed to remove background. Please try another image."
        );
      }
    } finally {
      if (runId === runIdRef.current) setLoading(false);
    }
  };

  /* ---- optional: re-run with the high-detail model (CPU devices) ---- */
  const handleEnhance = async () => {
    if (!file || loading || !resultUrl) return;

    const runId = ++runIdRef.current;
    setError("");
    setLoading(true);
    setEnhancing(true);
    setEnhanceProgress(0);
    setShowOriginal(false);
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

    try {
      const hq = await buildHighQualityProfile();

      // 1) download / load the bigger model (cached after the first time)
      await preloadModel(
        hq,
        (pct) => runId === runIdRef.current && setEnhanceProgress(pct)
      );
      if (runId !== runIdRef.current) return;
      setEnhanceProgress(null); // now processing

      // 2) run on the ORIGINAL file at the larger working size
      const input = await downscaleIfNeeded(file, hq.maxSide);
      const blob = await removeBackground(input, buildConfig(hq));
      if (runId !== runIdRef.current) return;

      setResultUrl(URL.createObjectURL(blob));
      setResultQuality("high");
    } catch (err) {
      console.error("Enhance error", err);
      if (runId === runIdRef.current) {
        setError(
          "Couldn't improve the quality on this device. Your previous result is still available."
        );
      }
    } finally {
      if (runId === runIdRef.current) {
        setLoading(false);
        setEnhancing(false);
        setEnhanceProgress(null);
      }
    }
  };

  const downloadName = file
    ? `${file.name.replace(/\.[^.]+$/, "")}-no-bg.png`
    : "background-removed.png";

  const shownImage = showOriginal ? originalUrl : resultUrl || originalUrl;
  const canRun = !!file && !loading && modelReady;
  const canEnhance = !!resultUrl && resultQuality === "standard" && !loading;

  const overlayMessage = enhancing
    ? enhanceProgress !== null
      ? `📥 Downloading detail model… ${enhanceProgress}%`
      : "🔬 Refining fine details..."
    : LOADING_MESSAGES[messageIndex];

  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          {/* Hero */}
          <header className="text-center">
            {/* <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              Background Remover
            </span> */}

            <h1 className="mt-6 text-4xl font-black sm:text-5xl">
              Remove Image Backgrounds
              <br />
              Instantly.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
              Upload an image and remove its background in seconds. Free, private
              and no account required – everything runs in your browser.
            </p>

            {/* AI engine status */}
            <div
              className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm"
              role="status"
              aria-live="polite"
            >
              {modelError ? (
                <span className="rounded-full bg-red-500/10 px-4 py-2 text-red-400">
                  AI failed to load – check your connection and refresh.
                </span>
              ) : modelReady ? (
                <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-emerald-400">
                  {profile?.device === "gpu" ? <Zap size={16} /> : <Cpu size={16} />}
                  AI ready · {profile?.label}
                </span>
              ) : (
                <span className="flex items-center gap-3 rounded-full bg-slate-800/80 px-4 py-2 text-slate-300">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  Preparing AI… {modelProgress}%
                </span>
              )}
            </div>
          </header>

          {/* Workspace */}
          <section
            aria-label="Background remover tool"
            className="mx-auto mt-14 grid gap-8 lg:grid-cols-2 lg:items-start"
          >
            {/* Upload */}
            <div>
              <input
                ref={inputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              <div
                role="button"
                tabIndex={0}
                aria-label="Upload an image"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-14 ${
                  dragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 hover:border-blue-500 hover:bg-slate-900/50"
                }`}
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                  <UploadCloud size={40} />
                </div>

                <h2 className="mt-8 text-2xl font-bold">
                  {file ? "Choose a different image" : "Drag & drop your image"}
                </h2>

                <p className="mt-3 text-slate-400">
                  or click to browse · you can also paste with Ctrl+V
                </p>

                {file && (
                  <p className="mx-auto mt-4 max-w-full truncate text-sm text-blue-300">
                    {file.name}
                  </p>
                )}

                <span className="mt-8 inline-block rounded-xl bg-blue-600 px-8 py-4 font-semibold transition hover:bg-blue-500">
                  Browse Files
                </span>

                <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-2">
                    <ImageIcon size={18} /> PNG
                  </span>
                  <span>JPG</span>
                  <span>JPEG</span>
                  <span>WEBP</span>
                </div>

                <p className="mt-5 text-sm text-slate-500">
                  Maximum size: 20 MB
                </p>
              </div>
            </div>

            {/* Preview */}
            <div
              id="preview"
              ref={previewRef}
              className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60"
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <h2 className="font-semibold">Preview</h2>

                {resultUrl && (
                  <button
                    type="button"
                    onPointerDown={() => setShowOriginal(true)}
                    onPointerUp={() => setShowOriginal(false)}
                    onPointerLeave={() => setShowOriginal(false)}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    <Eye size={16} /> Hold to see original
                  </button>
                )}
              </div>

              <div
                style={CHECKER_STYLE}
                className="relative flex h-[340px] items-center justify-center sm:h-[420px]"
              >
                {loading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
                    <div
                      className="w-full max-w-[340px] rounded-2xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex justify-center">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
                      </div>
                      <h3 className="mt-6 text-center text-2xl font-bold">
                        {enhancing ? "Improving Quality" : "Removing Background"}
                      </h3>
                      <p className="mt-6 animate-pulse text-center text-lg font-medium text-blue-400">
                        {overlayMessage}
                      </p>
                      <p className="mt-4 text-center text-xs text-slate-500">
                        {enhancing
                          ? "High-detail mode can take 30–90 seconds on this device. Your current result is kept if you cancel."
                          : profile?.device === "gpu"
                          ? "Usually takes 2–5 seconds."
                          : "Usually takes 5–15 seconds."}
                      </p>

                      {enhancing && (
                        <button
                          type="button"
                          onClick={cancelEnhance}
                          className="mx-auto mt-5 flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                          <X size={16} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {shownImage ? (
                  <img
                    src={shownImage}
                    alt={resultUrl && !showOriginal ? "Image with background removed" : "Original image preview"}
                    className="max-h-full max-w-full object-contain p-4"
                    draggable={false}
                    decoding="async"
                  />
                ) : (
                  <p className="px-6 text-center text-slate-500">
                    Your image will appear here
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-800 p-4">
                {resultUrl ? (
                  <a
                    href={resultUrl}
                    download={downloadName}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500"
                  >
                    <Download size={18} /> Download PNG
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled={!canRun}
                    onClick={handleRemoveBackground}
                    className="flex items-center gap-3 rounded-xl bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Wand2 size={20} />
                    {loading
                      ? "Processing..."
                      : !modelReady && !modelError
                      ? `Preparing AI ${modelProgress}%`
                      : "Remove Background"}
                  </button>
                )}

                {canEnhance && (
                  <button
                    type="button"
                    onClick={handleEnhance}
                    className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-6 py-3 font-semibold text-violet-200 transition hover:bg-violet-500/20"
                  >
                    <Sparkles size={18} /> Improve quality
                  </button>
                )}

                {file && (
                  <button
                    type="button"
                    onClick={reset}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 font-semibold transition hover:bg-slate-800"
                  >
                    <RotateCcw size={18} /> Start over
                  </button>
                )}

                {canEnhance && (
                  <p className="w-full text-center text-xs text-slate-500">
                    Edges not perfect? Re-run with the high-detail model. It is
                    slower on this device and may download extra data once.
                  </p>
                )}
              </div>
            </div>
          </section>

          {error && (
            <p
              role="alert"
              className="mx-auto mt-6 max-w-xl rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <ToolFAQ
            faqs={FAQ}
            description="Learn what the browser-based background remover supports and how AI processing works on your device."
          />
        </main>

        <Footer />
      </div>
    </>
  );
}