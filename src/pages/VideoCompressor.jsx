import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import {
  loadFFmpeg,
  compressVideo as compressWithFFmpeg,
} from "../utils/ffmpeg";

/* -------------------------------------------------------------------------- */
/*                                 Constants                                  */
/* -------------------------------------------------------------------------- */

// ffmpeg.wasm runs in browser memory, so very large files can crash the tab.
const MAX_INPUT_MB = 500;
const ACCEPTED_EXT = ["mp4", "mov", "avi", "webm", "mkv"];

// NOTE: these `value`s are passed straight to your utils/ffmpeg compressVideo().
// If your util expects different strings, change them here only.
const RESOLUTIONS = [
  { value: "original", label: "Original" },
  { value: "1080", label: "1080p" },
  { value: "720", label: "720p" },
  { value: "480", label: "480p" },
  { value: "360", label: "360p" },
];

const PRESETS = [
  { label: "10 MB", size: 10, unit: "MB" },
  { label: "25 MB", size: 25, unit: "MB" },
  { label: "50 MB", size: 50, unit: "MB" },
  { label: "100 MB", size: 100, unit: "MB" },
];

const FAQ = [
  {
    q: "Are my videos uploaded to a server?",
    a: "No. Compression runs entirely in your browser using WebAssembly, so your videos never leave your device.",
  },
  {
    q: "Which video formats are supported?",
    a: "MP4, MOV, AVI, WebM and MKV files up to 500 MB. The compressed result is exported as MP4, which plays almost everywhere.",
  },
  {
    q: "How do I compress a video to a specific size?",
    a: "Upload your video, enter a target size such as 25 MB, optionally lower the resolution, then click Compress. The tool adjusts the bitrate to land near your target.",
  },
  {
    q: "Why is compression slow on my device?",
    a: "Video encoding in the browser uses your CPU, so longer or higher-resolution videos take more time. Keep the tab open until it finishes.",
  },
];

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getExt(name) {
  return name.split(".").pop().toLowerCase();
}

/* -------------------------------------------------------------------------- */
/*                               Small UI pieces                              */
/* -------------------------------------------------------------------------- */

function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent || "text-white"}`}>{value}</p>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone =
    toast.type === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : toast.type === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : "border-blue-500/30 bg-blue-500/10 text-blue-300";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl ${tone}`}
    >
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="Dismiss notification" className="opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

function VideoCard({ title, badge, src, meta }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
      <div className="flex items-center justify-between px-4 py-3">
        <figcaption className="text-sm font-semibold">{title}</figcaption>
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${badge}`}>{meta}</span>
      </div>
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black object-contain"
      />
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Main component                              */
/* -------------------------------------------------------------------------- */

export default function VideoCompressor() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [duration, setDuration] = useState(null);

  const [compressedFile, setCompressedFile] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [engine, setEngine] = useState("loading"); // loading | ready | error
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState(null);

  const [targetSize, setTargetSize] = useState(25);
  const [targetUnit, setTargetUnit] = useState("MB");
  const [resolution, setResolution] = useState("original");

  const inputRef = useRef(null);
  const toastTimer = useRef(null);
  const runId = useRef(0);

  /* ----------------------------- Toast helper ----------------------------- */
  const notify = useCallback((message, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  /* --------------------------- Preload FFmpeg core ------------------------- */
  useEffect(() => {
    let active = true;
    Promise.resolve(loadFFmpeg())
      .then(() => active && setEngine("ready"))
      .catch((err) => {
        console.error(err);
        if (active) setEngine("error");
      });
    return () => {
      active = false;
      clearTimeout(toastTimer.current);
    };
  }, []);

  /* ------------------------- Object URL life-cycle ------------------------ */
  useEffect(() => {
    if (!selectedVideo) {
      setOriginalUrl(null);
      setDuration(null);
      return;
    }
    const url = URL.createObjectURL(selectedVideo);
    setOriginalUrl(url);

    // Read duration + suggest a sensible default target (half of original)
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => setDuration(probe.duration);
    probe.src = url;

    const originalMB = selectedVideo.size / (1024 * 1024);
    setTargetSize(Math.max(1, Math.round(originalMB / 2)));
    setTargetUnit("MB");

    return () => URL.revokeObjectURL(url);
  }, [selectedVideo]);

  useEffect(() => {
    if (!compressedFile) {
      setCompressedUrl(null);
      return;
    }
    const url = URL.createObjectURL(compressedFile);
    setCompressedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [compressedFile]);

  /* ---------------------- Elapsed timer while compressing ------------------ */
  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  /* ------------- Warn before leaving the tab mid-compression --------------- */
  useEffect(() => {
    if (!loading) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading]);

  /* ----------------------------- File handling ---------------------------- */
  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      const okType = file.type.startsWith("video/") || ACCEPTED_EXT.includes(getExt(file.name));
      if (!okType) {
        notify("Unsupported file. Please choose MP4, MOV, AVI, WebM or MKV.", "error");
        return;
      }
      if (file.size > MAX_INPUT_MB * 1024 * 1024) {
        notify(`File is too large. Maximum size is ${MAX_INPUT_MB} MB.`, "error");
        return;
      }
      runId.current += 1; // invalidate any in-flight run
      setLoading(false);
      setProgress(0);
      setCompressedFile(null);
      setStats(null);
      setSelectedVideo(file);
    },
    [notify]
  );

  const reset = () => {
    runId.current += 1;
    setLoading(false);
    setProgress(0);
    setSelectedVideo(null);
    setCompressedFile(null);
    setStats(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  /* ------------------------------ Compression ----------------------------- */
  const targetBytes =
    (Number(targetSize) || 0) * (targetUnit === "MB" ? 1024 * 1024 : 1024);
  const targetTooBig = selectedVideo && targetBytes >= selectedVideo.size;

  const compressVideo = async () => {
    if (!selectedVideo) return notify("Please choose a video first.", "error");
    if (targetBytes <= 0) return notify("Enter a valid target size.", "error");
    if (targetTooBig)
      return notify("Target is larger than the original. Choose a smaller size.", "error");

    const myRun = ++runId.current;

    try {
      setLoading(true);
      setProgress(0);

      const blob = await compressWithFFmpeg(
        selectedVideo,
        targetSize,
        targetUnit,
        resolution,
        (p) => {
          if (runId.current === myRun) {
            setProgress(Math.max(0, Math.min(100, Math.round(p))));
          }
        }
      );

      if (runId.current !== myRun) return; // user switched file / cleared

      const baseName = selectedVideo.name.replace(/\.[^.]+$/, "");
      const compressed = new File([blob], `${baseName}-compressed.mp4`, {
        type: "video/mp4",
      });

      const originalSize = selectedVideo.size;
      const savedBytes = originalSize - compressed.size;
      const savedPercent = Math.max(0, (savedBytes / originalSize) * 100).toFixed(1);

      setCompressedFile(compressed);
      setStats({
        originalSize,
        compressedSize: compressed.size,
        savedBytes,
        savedPercent,
      });
      setProgress(100);

      if (savedBytes <= 0) {
        notify("Result isn't smaller. Try a lower target size or resolution.", "info");
      } else {
        notify(`Done! Saved ${savedPercent}% of the original size.`, "success");
      }
    } catch (err) {
      console.error(err);
      if (runId.current === myRun) {
        notify("Compression failed. Try a smaller file or lower resolution.", "error");
      }
    } finally {
      if (runId.current === myRun) setLoading(false);
    }
  };

  const canCompress = !!selectedVideo && !loading && engine !== "error";

  /* --------------------------------- Render -------------------------------- */
  return (
    <>
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {/* Hero */}
          <header className="text-center">
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Compress Videos
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Without Losing Quality.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg">
              Compress MP4, MOV, AVI and WebM videos directly in your browser.
              No uploads. Completely private.
            </p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 sm:text-sm">
              {["100% Free", "No upload to servers", "MP4 · MOV · AVI · WebM"].map((t) => (
                <li key={t} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                  {t}
                </li>
              ))}
            </ul>
          </header>

          {/* Workspace */}
          <section
            aria-label="Video compressor tool"
            className="mt-12 grid gap-8 lg:grid-cols-[380px_1fr]"
          >
            {/* ------------------------------ Toolbar ------------------------------ */}
            <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:sticky lg:top-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Settings</h2>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    engine === "ready"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : engine === "error"
                      ? "bg-red-500/10 text-red-300"
                      : "bg-blue-500/10 text-blue-300"
                  }`}
                >
                  {engine === "loading" && <Spinner className="h-3 w-3" />}
                  {engine === "ready" && "Engine ready"}
                  {engine === "loading" && "Loading engine"}
                  {engine === "error" && "Engine failed"}
                </span>
              </div>

              {engine === "error" && (
                <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  The compression engine couldn&apos;t load. Refresh the page and check your
                  connection.
                </p>
              )}

              {/* Target size */}
              <div className="mt-6">
                <label htmlFor="target-size" className="mb-2 block text-sm font-medium text-slate-300">
                  Target size
                </label>
                <div className="flex gap-2">
                  <input
                    id="target-size"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={targetSize}
                    disabled={loading}
                    onChange={(e) => setTargetSize(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                  />
                  <select
                    aria-label="Size unit"
                    value={targetUnit}
                    disabled={loading}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm outline-none focus:border-blue-500/60 disabled:opacity-50"
                  >
                    <option>KB</option>
                    <option>MB</option>
                  </select>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setTargetSize(p.size);
                        setTargetUnit(p.unit);
                      }}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-blue-500/50 hover:text-white disabled:opacity-50"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {targetTooBig && (
                  <p className="mt-2 text-xs text-amber-400">
                    Target must be smaller than the original ({formatBytes(selectedVideo.size)}).
                  </p>
                )}
              </div>

              {/* Resolution */}
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-medium text-slate-300">Resolution</legend>
                <div className="grid grid-cols-5 gap-1 rounded-xl border border-white/10 bg-slate-900/50 p-1">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      disabled={loading}
                      aria-pressed={resolution === r.value}
                      onClick={() => setResolution(r.value)}
                      className={`rounded-lg py-2 text-[11px] font-semibold transition disabled:opacity-50 ${
                        resolution === r.value
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Lower resolution helps hit small targets without heavy blur.
                </p>
              </fieldset>

              {/* Actions */}
              <div className="mt-7 grid gap-3">
                <button
                  type="button"
                  onClick={compressVideo}
                  disabled={!canCompress}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-semibold shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Spinner /> Compressing… {progress}%
                    </>
                  ) : (
                    "Compress Video"
                  )}
                </button>

                {loading && (
                  <div>
                    <div
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-1.5 overflow-hidden rounded-full bg-white/10"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-center text-xs text-slate-400">
                      Elapsed {formatTime(elapsed)} · keep this tab open
                    </p>
                  </div>
                )}

                {compressedFile && (
                  <a
                    href={compressedUrl || undefined}
                    download={compressedFile.name}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-center font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    ⬇ Download {formatBytes(compressedFile.size)}
                  </a>
                )}

                {selectedVideo && (
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl px-5 py-2 text-sm text-slate-400 transition hover:text-white"
                  >
                    {loading ? "Cancel & start over" : "Clear & start over"}
                  </button>
                )}
              </div>
            </aside>

            {/* ------------------------------ Preview ------------------------------ */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
              {!selectedVideo ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
                    dragging
                      ? "border-blue-400 bg-blue-500/10"
                      : "border-white/15 hover:border-blue-500/50 hover:bg-white/5"
                  }`}
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 text-3xl">
                    🎬
                  </span>
                  <span className="mt-5 text-xl font-bold">
                    {dragging ? "Drop it here" : "Drop your video here"}
                  </span>
                  <span className="mt-2 text-sm text-slate-400">or click to browse your files</span>
                  <span className="mt-4 text-xs text-slate-500">
                    MP4, MOV, AVI, WebM, MKV · up to {MAX_INPUT_MB} MB
                  </span>
                </button>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{selectedVideo.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(selectedVideo.size)}
                        {duration ? ` · ${formatTime(duration)}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => inputRef.current?.click()}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue-500/50 hover:text-white disabled:opacity-50"
                    >
                      Change video
                    </button>
                  </div>

                  <div className={`grid gap-4 ${compressedUrl ? "xl:grid-cols-2" : ""}`}>
                    <VideoCard
                      title="Original"
                      src={originalUrl}
                      meta={formatBytes(selectedVideo.size)}
                      badge="bg-white/10 text-slate-200"
                    />
                    {compressedUrl && (
                      <VideoCard
                        title="Compressed"
                        src={compressedUrl}
                        meta={formatBytes(compressedFile.size)}
                        badge="bg-blue-600/80 text-white"
                      />
                    )}
                  </div>

                  {loading && !compressedUrl && (
                    <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-200">
                      <Spinner className="h-5 w-5 shrink-0" />
                      <span>
                        Encoding your video… {progress}%. Larger files can take a few minutes.
                      </span>
                    </div>
                  )}

                  {stats && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Stat label="Original" value={formatBytes(stats.originalSize)} />
                      <Stat label="Compressed" value={formatBytes(stats.compressedSize)} accent="text-blue-400" />
                      <Stat label="Saved" value={`${stats.savedPercent}%`} accent="text-emerald-400" />
                      <Stat label="Space freed" value={formatBytes(Math.max(0, stats.savedBytes))} />
                    </div>
                  )}
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="video/*,.mkv"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
                aria-label="Choose a video to compress"
                tabIndex={-1}
              />
            </div>
          </section>

          {/* SEO content */}
          <section className="mx-auto mt-24 max-w-3xl">
            <h2 className="text-center text-3xl font-black">Frequently Asked Questions</h2>
            <div className="mt-8 space-y-3">
              {FAQ.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl open:border-blue-500/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                    {q}
                    <span className="ml-4 text-slate-400 transition group-open:rotate-45">＋</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </main>

        <Toast toast={toast} onClose={() => setToast(null)} />
        <Footer />
      </div>
    </>
  );
}