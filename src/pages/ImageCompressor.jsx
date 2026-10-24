import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ToolFAQ from "../components/common/ToolFAQ";

/* -------------------------------------------------------------------------- */
/*                                 Constants                                  */
/* -------------------------------------------------------------------------- */

const MAX_INPUT_MB = 25;
const MAX_FILES = 20;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MODES = {
  quality: {
    label: "Best Quality",
    hint: "Minimal visible loss",
    options: { maxWidthOrHeight: 4000, initialQuality: 0.95 },
  },
  balanced: {
    label: "Balanced",
    hint: "Recommended for most uses",
    options: { maxWidthOrHeight: 2560, initialQuality: 0.8 },
  },
  small: {
    label: "Smallest Size",
    hint: "Maximum reduction",
    options: { maxWidthOrHeight: 1920, initialQuality: 0.55 },
  },
};

const FORMATS = [
  { value: "original", label: "Original" },
  { value: "image/webp", label: "WebP" },
  { value: "image/jpeg", label: "JPEG" },
];

const PRESETS = [
  { label: "100 KB", size: 100, unit: "KB" },
  { label: "200 KB", size: 200, unit: "KB" },
  { label: "500 KB", size: 500, unit: "KB" },
  { label: "1 MB", size: 1, unit: "MB" },
];

const FAQ = [
  {
    q: "Can I compress multiple images at once?",
    a: `Yes. Add up to ${MAX_FILES} images at a time, compress them all with the same settings, then download each one or everything together as a ZIP file.`,
  },
  {
    q: "Is my image uploaded to a server?",
    a: "No. Compression runs entirely inside your browser, so your photos never leave your device.",
  },
  {
    q: "Which image formats are supported?",
    a: `JPEG, PNG and WebP images up to ${MAX_INPUT_MB} MB each. You can also convert the output to WebP or JPEG for smaller files.`,
  },
  {
    q: "How do I compress an image to a specific size like 100 KB?",
    a: "Add your images, enter a target size (for example 100 KB), choose a compression mode and click Compress. The tool lowers quality and dimensions until each image reaches the target.",
  },
  {
    q: "Will compressing reduce my image quality?",
    a: "Best Quality mode keeps images nearly identical to the original. Smallest Size trades some detail for the lowest possible file size.",
  },
];

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildFileName(original, blobType) {
  const base = original.replace(/\.[^.]+$/, "");
  const ext = blobType === "image/jpeg" ? "jpg" : blobType.split("/")[1] || "jpg";
  return `${base}-compressed.${ext}`;
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

function CompareSlider({ originalUrl, compressedUrl }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative h-[300px] select-none overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 sm:h-[400px]">
      <img src={compressedUrl} alt="Compressed version" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      <img
        src={originalUrl}
        alt="Original version"
        className="absolute inset-0 h-full w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold backdrop-blur">Original</span>
      <span className="absolute right-3 top-3 rounded-full bg-blue-600/80 px-3 py-1 text-xs font-semibold backdrop-blur">Compressed</span>
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.6)]"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-900/90 text-xs backdrop-blur">
          ⇄
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare original and compressed image"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

function StatusBadge({ item }) {
  if (item.status === "processing")
    return (
      <span className="flex items-center gap-1.5 text-xs text-blue-300">
        <Spinner className="h-3 w-3" /> {item.progress}%
      </span>
    );
  if (item.status === "queued") return <span className="text-xs text-slate-400">Queued</span>;
  if (item.status === "error") return <span className="text-xs text-red-400">Failed</span>;
  if (item.status === "done") {
    const saved = Math.max(0, Math.round((1 - item.result.size / item.file.size) * 100));
    return <span className="text-xs font-semibold text-emerald-400">−{saved}%</span>;
  }
  return <span className="text-xs text-slate-500">Ready</span>;
}

/* -------------------------------------------------------------------------- */
/*                                Main component                              */
/* -------------------------------------------------------------------------- */

export default function ImageCompressor() {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [running, setRunning] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState(null);

  const [mode, setMode] = useState("balanced");
  const [targetSize, setTargetSize] = useState(500);
  const [targetUnit, setTargetUnit] = useState("KB");
  const [format, setFormat] = useState("original");

  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const toastTimer = useRef(null);
  const runId = useRef(0);
  const itemsRef = useRef([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /* ----------------------------- Toast helper ----------------------------- */
  const notify = useCallback((message, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  /* ------------------------------ Item helpers ----------------------------- */
  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const revokeItem = (i) => {
    if (i.url) URL.revokeObjectURL(i.url);
    if (i.resultUrl) URL.revokeObjectURL(i.resultUrl);
  };

  // Clean up everything on unmount
  useEffect(
    () => () => {
      abortRef.current?.abort();
      clearTimeout(toastTimer.current);
      itemsRef.current.forEach(revokeItem);
    },
    []
  );

  /* ----------------------------- File handling ---------------------------- */
  const addFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      const valid = [];
      let rejected = 0;
      for (const f of files) {
        if (ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_INPUT_MB * 1024 * 1024) valid.push(f);
        else rejected += 1;
      }

      const slots = MAX_FILES - itemsRef.current.length;
      const accepted = valid.slice(0, Math.max(0, slots));
      const overflow = valid.length - accepted.length;

      if (accepted.length) {
        const fresh = accepted.map((file) => ({
          id: uid(),
          file,
          url: URL.createObjectURL(file),
          status: "idle",
          progress: 0,
          result: null,
          resultUrl: null,
        }));
        setItems((prev) => [...prev, ...fresh]);
        setActiveId((cur) => cur ?? fresh[0].id);
      }

      if (rejected) notify(`${rejected} file(s) skipped – only JPG, PNG, WebP up to ${MAX_INPUT_MB} MB.`, "error");
      else if (overflow > 0) notify(`Limit is ${MAX_FILES} images. ${overflow} file(s) were not added.`, "error");
    },
    [notify]
  );

  const removeItem = (id) => {
    const target = itemsRef.current.find((i) => i.id === id);
    if (target) revokeItem(target);
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      setActiveId((cur) => (cur === id ? next[0]?.id ?? null : cur));
      return next;
    });
  };

  const clearAll = () => {
    runId.current += 1;
    abortRef.current?.abort();
    itemsRef.current.forEach(revokeItem);
    setItems([]);
    setActiveId(null);
    setRunning(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Paste images from clipboard
  useEffect(() => {
    const onPaste = (e) => {
      const files = [...(e.clipboardData?.items || [])]
        .filter((i) => i.type.startsWith("image/"))
        .map((i) => i.getAsFile())
        .filter(Boolean);
      if (files.length) addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!running) addFiles(e.dataTransfer.files);
  };

  /* ------------------------------ Compression ----------------------------- */
  const targetSizeMB = useMemo(() => {
    const n = Number(targetSize) || 0;
    return targetUnit === "MB" ? n : n / 1024;
  }, [targetSize, targetUnit]);

  const compressAll = async () => {
    if (!items.length) return notify("Please add at least one image.", "error");
    if (targetSizeMB <= 0.005) return notify("Target size must be at least 5 KB.", "error");

    const run = ++runId.current;
    const controller = new AbortController();
    abortRef.current = controller;

    const queue = itemsRef.current.slice();

    // Reset previous results
    queue.forEach((i) => i.resultUrl && URL.revokeObjectURL(i.resultUrl));
    setItems((prev) =>
      prev.map((i) => ({ ...i, status: "queued", progress: 0, result: null, resultUrl: null }))
    );
    setRunning(true);

    let ok = 0;
    let failed = 0;

    for (const item of queue) {
      if (runId.current !== run) return;
      if (!itemsRef.current.some((i) => i.id === item.id)) continue; // removed meanwhile

      updateItem(item.id, { status: "processing", progress: 0 });

      try {
        const options = {
          ...MODES[mode].options,
          maxSizeMB: targetSizeMB,
          useWebWorker: true,
          signal: controller.signal,
          onProgress: (p) => runId.current === run && updateItem(item.id, { progress: p }),
          ...(format !== "original" && { fileType: format }),
        };

        const result = await imageCompression(item.file, options);
        if (runId.current !== run) return;
        if (!itemsRef.current.some((i) => i.id === item.id)) continue;

        // Never return something bigger than the original
        const final = result.size >= item.file.size && format === "original" ? item.file : result;

        updateItem(item.id, {
          status: "done",
          progress: 100,
          result: final,
          resultUrl: URL.createObjectURL(final),
        });
        ok += 1;
      } catch (err) {
        if (controller.signal.aborted || runId.current !== run) return;
        console.error(err);
        updateItem(item.id, { status: "error" });
        failed += 1;
      }
    }

    if (runId.current === run) {
      setRunning(false);
      notify(
        failed ? `${ok} compressed, ${failed} failed.` : `Done! ${ok} image${ok === 1 ? "" : "s"} compressed.`,
        failed ? "error" : "success"
      );
    }
  };

  /* -------------------------------- Downloads ------------------------------ */
  const doneItems = items.filter((i) => i.status === "done");

  const downloadOne = (item) =>
    saveBlob(item.result, buildFileName(item.file.name, item.result.type));

  const downloadZip = async () => {
    if (!doneItems.length) return;
    if (doneItems.length === 1) return downloadOne(doneItems[0]);

    try {
      setZipping(true);
      const { default: JSZip } = await import("jszip"); // loaded only when needed
      const zip = new JSZip();
      const used = new Set();

      for (const item of doneItems) {
        let name = buildFileName(item.file.name, item.result.type);
        let n = 1;
        while (used.has(name)) {
          name = buildFileName(item.file.name, item.result.type).replace(/(\.[^.]+)$/, `-${n++}$1`);
        }
        used.add(name);
        zip.file(name, item.result);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      saveBlob(blob, "compressed-images.zip");
    } catch (err) {
      console.error(err);
      notify("Couldn't create the ZIP file.", "error");
    } finally {
      setZipping(false);
    }
  };

  /* ------------------------------- Derived data ---------------------------- */
  const totals = useMemo(() => {
    const original = doneItems.reduce((s, i) => s + i.file.size, 0);
    const compressed = doneItems.reduce((s, i) => s + i.result.size, 0);
    return {
      original,
      compressed,
      saved: original ? Math.max(0, Math.round((1 - compressed / original) * 100)) : 0,
    };
  }, [doneItems]);

  const active = items.find((i) => i.id === activeId) || items[0];
  const processedCount = items.filter((i) => i.status === "done" || i.status === "error").length;
  const processingItem = items.find((i) => i.status === "processing");

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
              Compress Images
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Without Losing Quality.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg">
              Reduce image size for websites, forms and social media in seconds. Compress up to {MAX_FILES} images
              at once — private by design, your files never leave your browser.
            </p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 sm:text-sm">
              {["100% Free", "Bulk compression", "No upload to servers", "JPG · PNG · WebP"].map((t) => (
                <li key={t} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                  {t}
                </li>
              ))}
            </ul>
          </header>

          {/* Workspace */}
          <section aria-label="Image compressor tool" className="mt-12 grid gap-8 lg:grid-cols-[380px_1fr]">
            {/* ------------------------------ Toolbar ------------------------------ */}
            <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:sticky lg:top-6">
              <h2 className="text-lg font-bold">Settings</h2>
              <p className="mt-1 text-xs text-slate-500">Applied to every image in the list.</p>

              {/* Mode */}
              <fieldset className="mt-5" disabled={running}>
                <legend className="mb-2 text-sm font-medium text-slate-300">Compression mode</legend>
                <div className="grid gap-2">
                  {Object.entries(MODES).map(([key, m]) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                        mode === key ? "border-blue-500/60 bg-blue-500/10" : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{m.label}</span>
                        <span className="block text-xs text-slate-400">{m.hint}</span>
                      </span>
                      <input
                        type="radio"
                        name="mode"
                        value={key}
                        checked={mode === key}
                        onChange={() => setMode(key)}
                        className="h-4 w-4 accent-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Target size */}
              <div className="mt-6">
                <label htmlFor="target-size" className="mb-2 block text-sm font-medium text-slate-300">
                  Target size per image
                </label>
                <div className="flex gap-2">
                  <input
                    id="target-size"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={targetSize}
                    disabled={running}
                    onChange={(e) => setTargetSize(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                  />
                  <select
                    aria-label="Size unit"
                    value={targetUnit}
                    disabled={running}
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
                      disabled={running}
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
              </div>

              {/* Format */}
              <fieldset className="mt-6" disabled={running}>
                <legend className="mb-2 text-sm font-medium text-slate-300">Output format</legend>
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-slate-900/50 p-1">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      aria-pressed={format === f.value}
                      onClick={() => setFormat(f.value)}
                      className={`rounded-lg py-2 text-xs font-semibold transition ${
                        format === f.value ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">WebP usually gives the smallest files at the same quality.</p>
              </fieldset>

              {/* Actions */}
              <div className="mt-7 grid gap-3">
                <button
                  type="button"
                  onClick={compressAll}
                  disabled={running || !items.length}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-semibold shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {running ? (
                    <>
                      <Spinner /> Compressing {Math.min(processedCount + 1, items.length)}/{items.length}…
                    </>
                  ) : items.length > 1 ? (
                    `Compress ${items.length} Images`
                  ) : (
                    "Compress Image"
                  )}
                </button>

                {running && (
                  <div
                    role="progressbar"
                    aria-valuenow={processedCount}
                    aria-valuemin={0}
                    aria-valuemax={items.length}
                    className="h-1.5 overflow-hidden rounded-full bg-white/10"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                      style={{
                        width: `${((processedCount + (processingItem?.progress || 0) / 100) / items.length) * 100}%`,
                      }}
                    />
                  </div>
                )}

                {doneItems.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadZip}
                    disabled={zipping || running}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-center font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {zipping ? <Spinner /> : "⬇"}
                    {doneItems.length > 1 ? `Download all (ZIP) · ${formatBytes(totals.compressed)}` : `Download ${formatBytes(totals.compressed)}`}
                  </button>
                )}

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-xl px-5 py-2 text-sm text-slate-400 transition hover:text-white"
                  >
                    {running ? "Cancel & clear all" : "Clear all"}
                  </button>
                )}
              </div>
            </aside>

            {/* ------------------------------ Right panel ------------------------------ */}
            <div
              className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6"
              onDragOver={(e) => {
                e.preventDefault();
                if (!running) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {!items.length ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className={`flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
                    dragging ? "border-blue-400 bg-blue-500/10" : "border-white/15 hover:border-blue-500/50 hover:bg-white/5"
                  }`}
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 text-3xl">
                    🖼️
                  </span>
                  <span className="mt-5 text-xl font-bold">{dragging ? "Drop them here" : "Drop your images here"}</span>
                  <span className="mt-2 text-sm text-slate-400">or click to browse · paste with Ctrl/⌘ + V</span>
                  <span className="mt-4 text-xs text-slate-500">
                    JPG, PNG, WebP · up to {MAX_FILES} images · {MAX_INPUT_MB} MB each
                  </span>
                </button>
              ) : (
                <div className="space-y-5">
                  {/* Active preview */}
                  {active && (
                    <div>
                      {active.status === "done" ? (
                        <CompareSlider key={active.id} originalUrl={active.url} compressedUrl={active.resultUrl} />
                      ) : (
                        <div className="relative flex h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 sm:h-[400px]">
                          <img
                            src={active.url}
                            alt={`Preview of ${active.file.name}`}
                            className={`h-full w-full object-contain transition ${
                              active.status === "processing" ? "opacity-40 blur-sm" : ""
                            }`}
                          />
                          {active.status === "processing" && (
                            <div className="absolute flex flex-col items-center gap-3">
                              <Spinner className="h-8 w-8 text-blue-400" />
                              <span className="text-sm text-slate-300">Optimising… {active.progress}%</span>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="mt-2 truncate text-center text-xs text-slate-400">
                        {active.file.name} · {formatBytes(active.file.size)}
                        {active.status === "done" && ` → ${formatBytes(active.result.size)}`}
                      </p>
                    </div>
                  )}

                  {/* Summary */}
                  {doneItems.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Stat label="Images" value={`${doneItems.length}/${items.length}`} />
                      <Stat label="Original" value={formatBytes(totals.original)} />
                      <Stat label="Compressed" value={formatBytes(totals.compressed)} accent="text-blue-400" />
                      <Stat label="Saved" value={`${totals.saved}%`} accent="text-emerald-400" />
                    </div>
                  )}

                  {/* File list */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-300">
                        Images ({items.length}/{MAX_FILES})
                      </h3>
                      <button
                        type="button"
                        disabled={running || items.length >= MAX_FILES}
                        onClick={() => inputRef.current?.click()}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition disabled:opacity-50 ${
                          dragging
                            ? "border-blue-400 bg-blue-500/10 text-white"
                            : "border-white/10 text-slate-300 hover:border-blue-500/50 hover:text-white"
                        }`}
                      >
                        {dragging ? "Drop to add" : "+ Add more"}
                      </button>
                    </div>

                    <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                            item.id === active?.id ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 hover:border-white/25"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveId(item.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            aria-label={`Preview ${item.file.name}`}
                          >
                            <img
                              src={item.url}
                              alt=""
                              loading="lazy"
                              className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{item.file.name}</span>
                              <span className="block text-xs text-slate-400">
                                {formatBytes(item.file.size)}
                                {item.status === "done" && (
                                  <span className="text-blue-300"> → {formatBytes(item.result.size)}</span>
                                )}
                              </span>
                            </span>
                          </button>

                          <StatusBadge item={item} />

                          {item.status === "done" && (
                            <button
                              type="button"
                              onClick={() => downloadOne(item)}
                              aria-label={`Download ${item.file.name}`}
                              className="rounded-lg border border-emerald-500/30 px-2.5 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                            >
                              ⬇
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={item.status === "processing"}
                            aria-label={`Remove ${item.file.name}`}
                            className="rounded-lg px-2 py-1.5 text-xs text-slate-500 transition hover:text-red-400 disabled:opacity-30"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = ""; // allow re-selecting the same files
                }}
                aria-label="Choose images to compress"
                tabIndex={-1}
              />
            </div>
          </section>

          <ToolFAQ
            faqs={FAQ}
            description="Understand supported image formats, compression settings, and how to reach a target file size."
          />
        </main>

        <Toast toast={toast} onClose={() => setToast(null)} />
        <Footer />
      </div>
    </>
  );
}