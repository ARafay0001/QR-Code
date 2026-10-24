import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, Download, Trash2, X, Loader2, AlertTriangle, FileImage, Archive, Plus,
} from "lucide-react";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ToolFAQ from "../components/common/ToolFAQ";

const FAQ = [
  {
    question: "Can I convert multiple WebP images at once?",
    answer:
      "Yes. Add several WebP files, choose JPG or PNG, and download the converted images individually or together as a ZIP.",
  },
  {
    question: "What happens to transparent areas when converting to JPG?",
    answer:
      "JPG does not support transparency, so transparent pixels are filled with the background color you choose. PNG keeps transparency.",
  },
  {
    question: "Are my images uploaded?",
    answer:
      "No. Conversion runs in your browser, so your WebP files stay on your device.",
  },
];

/* ========================================================================== */
/*  Performance design                                                        */
/*  • Decoding + encoding happen in a pool of Web Workers (cores − 1, max 6), */
/*    so the UI never freezes, even with hundreds of files.                  */
/*  • createImageBitmap + OffscreenCanvas = hardware-accelerated decode.     */
/*  • Thumbnails are made inside the worker (tiny JPEGs) — the page never    */
/*    decodes full-size images just to show a preview.                       */
/*  • Results are batched into one React update per animation frame.         */
/*  • ZIP uses STORE (no re-compression — JPG/PNG are already compressed).   */
/*  • Everything is revoked/closed after use; files never leave the device.  */
/*  Optional dep: `npm i jszip` (only loaded when you click “Download ZIP”). */
/* ========================================================================== */

const MIME = { jpg: "image/jpeg", png: "image/png" };
const BGS = ["#ffffff", "#000000", "#f3f4f6", "#fef3c7"];
const SIZES = [[0, "Original"], [4096, "4096 px"], [2048, "2048 px"], [1280, "1280 px"], [800, "800 px"]];

const fmtBytes = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`);
const baseName = (n) => n.replace(/\.[^.]+$/, "");
const isWebp = (f) => f.type === "image/webp" || /\.webp$/i.test(f.name);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/* ------------------------------ worker code ------------------------------- */

const WORKER_SRC = `
self.onmessage = async (e) => {
  const { file, type, quality, bg, maxDim } = e.data;
  try {
    const bmp = await createImageBitmap(file);
    let w = bmp.width, h = bmp.height;
    if (maxDim && Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    const png = type === "image/png";
    const c = new OffscreenCanvas(w, h);
    const ctx = c.getContext("2d", { alpha: png });
    if (!png) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await c.convertToBlob(png ? { type } : { type, quality });
    const t = Math.min(1, 96 / Math.max(w, h)), tw = Math.max(1, Math.round(w * t)), th = Math.max(1, Math.round(h * t));
    const tc = new OffscreenCanvas(tw, th), tctx = tc.getContext("2d");
    tctx.fillStyle = "#ffffff"; tctx.fillRect(0, 0, tw, th);
    tctx.drawImage(c, 0, 0, tw, th);
    const thumb = await tc.convertToBlob({ type: "image/jpeg", quality: 0.7 });
    self.postMessage({ blob, thumb, w, h });
  } catch (err) { self.postMessage({ error: String((err && err.message) || err) }); }
};`;

class Pool {
  constructor(size) {
    this.url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
    this.workers = [];
    this.idle = [];
    this.queue = [];
    for (let i = 0; i < size; i++) this.spawn();
  }
  spawn() {
    const w = new Worker(this.url);
    w.job = null;
    const done = (fn) => { const j = w.job; w.job = null; this.idle.push(w); if (j) fn(j); this.pump(); };
    w.onmessage = (e) => done((j) => (e.data.error ? j.reject(new Error(e.data.error)) : j.resolve(e.data)));
    w.onerror = (e) => done((j) => j.reject(new Error(e.message || "Worker error")));
    this.workers.push(w);
    this.idle.push(w);
  }
  run(file, opts) {
    return new Promise((resolve, reject) => { this.queue.push({ file, opts, resolve, reject }); this.pump(); });
  }
  pump() {
    while (this.idle.length && this.queue.length) {
      const w = this.idle.pop(), job = this.queue.shift();
      w.job = job;
      w.postMessage({ file: job.file, ...job.opts });
    }
  }
  cancelQueued() { this.queue.splice(0).forEach((j) => j.reject(new Error("cancelled"))); }
  destroy() { this.cancelQueued(); this.workers.forEach((w) => w.terminate()); URL.revokeObjectURL(this.url); }
}

/** Fallback for browsers without OffscreenCanvas/Workers (runs on the main thread, one at a time). */
async function convertMain(file, { type, quality, bg, maxDim }) {
  const bmp = await createImageBitmap(file);
  let w = bmp.width, h = bmp.height;
  if (maxDim && Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { alpha: type === "image/png" });
  if (type !== "image/png") { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise((r) => c.toBlob(r, type, quality));
  const t = Math.min(1, 96 / Math.max(w, h)), tc = document.createElement("canvas");
  tc.width = Math.max(1, Math.round(w * t));
  tc.height = Math.max(1, Math.round(h * t));
  const tctx = tc.getContext("2d");
  tctx.fillStyle = "#fff";
  tctx.fillRect(0, 0, tc.width, tc.height);
  tctx.drawImage(c, 0, 0, tc.width, tc.height);
  const thumb = await new Promise((r) => tc.toBlob(r, "image/jpeg", 0.7));
  await new Promise((r) => setTimeout(r, 0));
  return { blob, thumb, w, h };
}

const download = (url, name) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/* --------------------------------- UI ------------------------------------- */

const card = "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl";
const lbl = "text-xs font-semibold uppercase tracking-wide text-slate-500";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40";
const Chip = ({ on, onClick, children }) => (
  <button onClick={onClick} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${on ? "border-blue-500 bg-blue-500/15 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}>{children}</button>
);

const Row = memo(function Row({ it, ext, onRemove, onSave }) {
  const o = it.out;
  const delta = o ? Math.round(((o.size - it.size) / it.size) * 100) : 0;
  return (
    <li style={{ contentVisibility: "auto", containIntrinsicSize: "0 72px" }}
      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 sm:gap-4 sm:p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800 sm:h-14 sm:w-14">
        {o ? <img src={o.thumb} alt="" decoding="async" className="h-full w-full object-cover" />
          : it.status === "error" ? <AlertTriangle size={18} className="text-red-400" /> : <Loader2 size={18} className="animate-spin text-blue-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{baseName(it.name)}.{ext}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {it.status === "error" ? <span className="text-red-400">{it.error}</span> : (
            <>
              {fmtBytes(it.size)}{o && <> → <span className="font-semibold text-slate-200">{fmtBytes(o.size)}</span>
                <span className={delta > 0 ? " text-amber-400" : " text-emerald-400"}> ({delta > 0 ? "+" : ""}{delta}%)</span> · {o.w}×{o.h}</>}
              {!o && " · converting…"}
            </>
          )}
        </p>
      </div>
      {o && <button onClick={() => onSave(it)} aria-label="Download" className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-blue-500 hover:text-white"><Download size={16} /></button>}
      <button onClick={() => onRemove(it.id)} aria-label="Remove" className="rounded-lg p-2 text-slate-500 transition hover:text-red-400"><X size={16} /></button>
    </li>
  );
});

/* ================================== PAGE ================================== */

export default function WebPToImage() {
  const [items, setItems] = useState([]);
  const [s, setS] = useState({ format: "jpg", quality: 0.92, bg: "#ffffff", maxDim: 0 });
  const [msg, setMsg] = useState("");
  const [zipPct, setZipPct] = useState(null);
  const [dragging, setDragging] = useState(false);

  const poolRef = useRef(null), verRef = useRef(0), pending = useRef(new Map()), raf = useRef(0);
  const mainChain = useRef(Promise.resolve()), inputRef = useRef(null), firstRun = useRef(true);
  const itemsRef = useRef(items), sRef = useRef(s);
  itemsRef.current = items;
  sRef.current = s;

  const ext = s.format;

  /* pool lifecycle */
  useEffect(() => {
    if (typeof OffscreenCanvas !== "undefined" && typeof Worker !== "undefined") {
      const n = Math.max(2, Math.min(6, (navigator.hardwareConcurrency || 4) - 1));
      poolRef.current = new Pool(n);
    }
    return () => {
      poolRef.current?.destroy();
      itemsRef.current.forEach((i) => { if (i.out) { URL.revokeObjectURL(i.out.url); URL.revokeObjectURL(i.out.thumb); } });
    };
  }, []);

  const revoke = (o) => { if (o) { URL.revokeObjectURL(o.url); URL.revokeObjectURL(o.thumb); } };

  const flush = () => {
    raf.current = 0;
    const upd = pending.current;
    pending.current = new Map();
    setItems((prev) => prev.map((it) => {
      const u = upd.get(it.id);
      if (!u) return it;
      return u.error ? { ...it, status: "error", error: u.error } : { ...it, status: "done", error: "", out: u.out };
    }));
  };
  const schedule = (id, u) => {
    pending.current.set(id, u);
    if (!raf.current) raf.current = requestAnimationFrame(flush);
  };

  const run = (file, opts) => {
    if (poolRef.current) return poolRef.current.run(file, opts);
    const p = mainChain.current.then(() => convertMain(file, opts));
    mainChain.current = p.catch(() => {});
    return p;
  };

  const convertItems = useCallback((list, settings, v) => {
    const opts = { type: MIME[settings.format], quality: settings.quality, bg: settings.bg, maxDim: settings.maxDim };
    list.forEach((it) => {
      run(it.file, opts)
        .then((r) => {
          if (v !== verRef.current) return;
          const cur = itemsRef.current.find((i) => i.id === it.id);
          if (!cur) return;
          revoke(cur.out);
          schedule(it.id, { out: { url: URL.createObjectURL(r.blob), thumb: URL.createObjectURL(r.thumb), size: r.blob.size, w: r.w, h: r.h, blob: r.blob } });
        })
        .catch((err) => {
          if (v !== verRef.current || err.message === "cancelled") return;
          schedule(it.id, { error: err.message.includes("decode") || err.name === "InvalidStateError" ? "Couldn’t read this image" : err.message });
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((fileList) => {
    const all = Array.from(fileList || []);
    const ok = all.filter(isWebp);
    if (all.length && ok.length < all.length) setMsg(`${all.length - ok.length} file${all.length - ok.length > 1 ? "s were" : " was"} skipped — only .webp files are supported.`);
    else setMsg("");
    if (!ok.length) return;
    const fresh = ok.map((file) => ({ id: uid(), file, name: file.name, size: file.size, status: "working", error: "", out: null }));
    itemsRef.current = [...itemsRef.current, ...fresh];
    setItems(itemsRef.current);
    convertItems(fresh, sRef.current, verRef.current);
  }, [convertItems]);

  /* re-convert everything when settings change (debounced) */
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const t = setTimeout(() => {
      verRef.current++;
      poolRef.current?.cancelQueued();
      const list = itemsRef.current;
      if (!list.length) return;
      setItems((p) => p.map((i) => ({ ...i, status: "working", error: "" })));
      convertItems(list, s, verRef.current);
    }, 250);
    return () => clearTimeout(t);
  }, [s, convertItems]);

  /* paste images from the clipboard */
  useEffect(() => {
    const onPaste = (e) => { const f = [...(e.clipboardData?.files || [])]; if (f.length) addFiles(f); };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const remove = useCallback((id) => {
    const cur = itemsRef.current.find((i) => i.id === id);
    revoke(cur?.out);
    itemsRef.current = itemsRef.current.filter((i) => i.id !== id);
    setItems(itemsRef.current);
  }, []);

  const clearAll = () => {
    verRef.current++;
    poolRef.current?.cancelQueued();
    itemsRef.current.forEach((i) => revoke(i.out));
    itemsRef.current = [];
    setItems([]);
    setMsg("");
  };

  const saveOne = useCallback((it) => download(it.out.url, `${baseName(it.name)}.${sRef.current.format}`), []);

  const downloadZip = async () => {
    const done = items.filter((i) => i.out);
    if (!done.length) return;
    try {
      setZipPct(0);
      const JSZip = (await import("jszip")).default, zip = new JSZip(), used = new Map();
      done.forEach((i) => {
        let name = baseName(i.name);
        const n = used.get(name) || 0;
        used.set(name, n + 1);
        if (n) name += `-${n}`;
        zip.file(`${name}.${ext}`, i.out.blob);
      });
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" }, (m) => setZipPct(Math.round(m.percent)));
      const url = URL.createObjectURL(blob);
      download(url, `webp-to-${ext}.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.error(e);
      setMsg("Couldn’t create the ZIP. Run `npm i jszip`, or download files one by one.");
    } finally { setZipPct(null); }
  };

  /* stats */
  const done = items.filter((i) => i.status === "done");
  const working = items.filter((i) => i.status === "working").length;
  const origTotal = done.reduce((a, i) => a + i.size, 0), outTotal = done.reduce((a, i) => a + i.out.size, 0);
  const pct = items.length ? Math.round(((items.length - working) / items.length) * 100) : 0;

  const Drop = (compact) => (
    <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
      <button onClick={() => inputRef.current.click()}
        className={`flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-dashed transition ${compact ? "py-5" : "flex-col py-16 text-center sm:py-20"} ${dragging ? "scale-[1.01] border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-900/60 hover:border-blue-500"}`}>
        {compact ? <><Plus size={20} />Add more WebP files</> : (
          <>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400"><Upload size={30} /></span>
            <span className="text-xl font-bold">{dragging ? "Drop to convert" : "Drop WebP files here"}</span>
            <span className="text-sm text-slate-400">or click to browse · paste with Ctrl+V · convert hundreds at once</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="text-center">
            {/* <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">WebP Converter</span> */}
            <h1 className="mt-5 text-4xl font-black sm:text-5xl">WebP to JPG &amp; PNG.</h1>
            <p className="mx-auto mt-3 flex max-w-xl items-center justify-center gap-2 text-slate-400">
              Multi-core batch conversion that runs entirely in your browser.
            </p>
          </div>

          <input ref={inputRef} hidden multiple type="file" accept="image/webp,.webp" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

          <div className="mt-8 space-y-5">
            {/* Settings */}
            <section className={`${card} space-y-5 p-4 sm:p-6`}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <p className={lbl}>Convert to</p>
                  <div className="flex gap-2"><Chip on={s.format === "jpg"} onClick={() => setS({ ...s, format: "jpg" })}>JPG</Chip><Chip on={s.format === "png"} onClick={() => setS({ ...s, format: "png" })}>PNG</Chip></div>
                  <p className="text-xs text-slate-500">{s.format === "jpg" ? "Smaller files. Transparent areas get a solid background." : "Lossless, keeps transparency. Files are larger."}</p>
                </div>
                <div className="space-y-2.5">
                  <p className={lbl}>Max size</p>
                  <div className="flex flex-wrap gap-2">{SIZES.map(([v, l]) => <Chip key={v} on={s.maxDim === v} onClick={() => setS({ ...s, maxDim: v })}>{l}</Chip>)}</div>
                </div>
              </div>

              {s.format === "jpg" && (
                <div className="grid gap-5 border-t border-slate-800 pt-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="flex justify-between text-xs text-slate-400"><span className={lbl}>Quality</span><span className="tabular-nums">{Math.round(s.quality * 100)}%</span></span>
                    <input type="range" min={0.5} max={1} step={0.01} value={s.quality} onChange={(e) => setS({ ...s, quality: +e.target.value })} className="mt-3 w-full accent-blue-500" />
                  </label>
                  <div className="space-y-2.5">
                    <p className={lbl}>Background (for transparency)</p>
                    <div className="flex gap-2.5">
                      {BGS.map((c) => <button key={c} aria-label={c} onClick={() => setS({ ...s, bg: c })} style={{ background: c }} className={`h-8 w-8 rounded-full border-2 transition ${s.bg === c ? "scale-110 border-blue-500" : "border-slate-600"}`} />)}
                      <input type="color" value={s.bg} onChange={(e) => setS({ ...s, bg: e.target.value })} className="h-8 w-10 cursor-pointer rounded border border-slate-700 bg-transparent" aria-label="Custom colour" />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Drop zone */}
            {Drop(items.length > 0)}

            {msg && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />{msg}
              </div>
            )}

            {/* Results */}
            {items.length > 0 && (
              <section className={`${card} p-4 sm:p-6`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{items.length} file{items.length > 1 ? "s" : ""}</h2>
                    <p className="text-xs text-slate-400">
                      {working ? `Converting… ${items.length - working}/${items.length}` : done.length ? <>Total {fmtBytes(origTotal)} → <span className="font-semibold text-slate-200">{fmtBytes(outTotal)}</span></> : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={clearAll} className={btn}><Trash2 size={15} />Clear</button>
                    {done.length === 1 ? (
                      <button onClick={() => saveOne(done[0])} className={btnPrimary}><Download size={16} />Download {ext.toUpperCase()}</button>
                    ) : (
                      <button onClick={downloadZip} disabled={!done.length || zipPct !== null} className={btnPrimary}>
                        {zipPct !== null ? <><Loader2 size={16} className="animate-spin" />{zipPct}%</> : <><Archive size={16} />Download {done.length} {ext.toUpperCase()} files (ZIP)</>}
                      </button>
                    )}
                  </div>
                </div>

                {working > 0 && (
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300" style={{ width: `${pct}%` }} /></div>
                )}

                <ul className="mt-5 space-y-2.5">
                  {items.map((it) => <Row key={it.id} it={it} ext={ext} onRemove={remove} onSave={saveOne} />)}
                </ul>
              </section>
            )}

            <p className="flex items-center justify-center gap-2 pb-4 text-center text-xs text-slate-500">
              <FileImage size={14} />Animated WebP files convert to a single still frame. Nothing is uploaded — all processing stays on your device.
            </p>
          </div>
          <ToolFAQ
            faqs={FAQ}
            description="Learn about batch conversion, transparency, and output formats before converting your WebP images."
          />
        </main>

        <Footer />
      </div>
    </>
  );
}