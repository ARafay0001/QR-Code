import { useEffect, useRef, useState } from "react";
import {
  Upload, Download, Copy, Check, Loader2, Sparkles, ImagePlus, Zap, AlertTriangle, RefreshCw,
} from "lucide-react";

import Footer from "../components/common/Footer";

/* ========================================================================== */
/*  Image → SVG vectorizer. No dependencies, nothing uploaded.               */
/*                                                                            */
/*  Pipeline (runs in a Web Worker so the page never freezes):               */
/*   1. colour quantisation   farthest-first seeding + k-means, 5-bit LUT    */
/*   2. layer stacking        biggest colour first; each layer also covers   */
/*                            everything above it → no hairline seams        */
/*   3. contour tracing       exact pixel-edge following on a Uint8 grid     */
/*   4. simplification        iterative Douglas–Peucker                      */
/*   5. curve smoothing       quadratic Béziers, sharp corners preserved     */
/* ========================================================================== */

/** Self-contained on purpose: its source is injected into the worker via toString(). */
function trace(px, w, h, o, onProgress) {
  const N = w * h;
  const rank = new Int16Array(N).fill(-1);
  const palette = [];

  /* ---- 1. palette + per-pixel layer rank ---- */
  if (o.mode === "bw") {
    palette.push(o.ink);
    for (let i = 0; i < N; i++) {
      if (px[i * 4 + 3] < 128) continue;
      if (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2] < o.threshold) rank[i] = 0;
    }
  } else {
    const step = Math.max(1, Math.floor(N / 20000));
    const S = [];
    for (let i = 0; i < N; i += step) if (px[i * 4 + 3] >= 128) S.push(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
    const sn = S.length / 3;
    if (sn) {
      const K = Math.max(1, Math.min(o.colors, sn));
      const cen = [S[0], S[1], S[2]];
      const dmin = new Float64Array(sn).fill(Infinity);
      while (cen.length / 3 < K) {
        const last = cen.length - 3;
        let best = -1, bd = -1;
        for (let i = 0; i < sn; i++) {
          const dr = S[i * 3] - cen[last], dg = S[i * 3 + 1] - cen[last + 1], db = S[i * 3 + 2] - cen[last + 2];
          const d = dr * dr + dg * dg + db * db;
          if (d < dmin[i]) dmin[i] = d;
          if (dmin[i] > bd) { bd = dmin[i]; best = i; }
        }
        if (bd <= 0) break;
        cen.push(S[best * 3], S[best * 3 + 1], S[best * 3 + 2]);
      }
      const KK = cen.length / 3;
      const nearest = (r, g, b) => {
        let bj = 0, bdist = Infinity;
        for (let j = 0; j < KK; j++) {
          const dr = r - cen[j * 3], dg = g - cen[j * 3 + 1], db = b - cen[j * 3 + 2];
          const d = dr * dr + dg * dg + db * db;
          if (d < bdist) { bdist = d; bj = j; }
        }
        return bj;
      };
      for (let it = 0; it < 6; it++) {
        const sum = new Float64Array(KK * 3), cnt = new Int32Array(KK);
        for (let i = 0; i < sn; i++) {
          const j = nearest(S[i * 3], S[i * 3 + 1], S[i * 3 + 2]);
          sum[j * 3] += S[i * 3]; sum[j * 3 + 1] += S[i * 3 + 1]; sum[j * 3 + 2] += S[i * 3 + 2]; cnt[j]++;
        }
        for (let j = 0; j < KK; j++) if (cnt[j]) { cen[j * 3] = sum[j * 3] / cnt[j]; cen[j * 3 + 1] = sum[j * 3 + 1] / cnt[j]; cen[j * 3 + 2] = sum[j * 3 + 2] / cnt[j]; }
      }
      const lut = new Int8Array(32768).fill(-1), counts = new Int32Array(KK);
      for (let i = 0; i < N; i++) {
        if (px[i * 4 + 3] < 128) continue;
        const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
        let j = lut[key];
        if (j < 0) { j = nearest(((r >> 3) << 3) + 4, ((g >> 3) << 3) + 4, ((b >> 3) << 3) + 4); lut[key] = j; }
        rank[i] = j;
        counts[j]++;
      }
      const order = [];
      for (let j = 0; j < KK; j++) if (counts[j] > 0) order.push(j);
      order.sort((a, b) => counts[b] - counts[a]);
      const remap = new Int16Array(KK).fill(-1);
      order.forEach((j, k) => { remap[j] = k; palette.push([cen[j * 3], cen[j * 3 + 1], cen[j * 3 + 2]]); });
      for (let i = 0; i < N; i++) if (rank[i] >= 0) rank[i] = remap[rank[i]];
    }
  }

  /* ---- helpers ---- */
  const W1 = w + 1;
  const dirs = new Uint8Array(W1 * (h + 1));
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const f1 = (v) => String(Math.round(v * 10) / 10);
  const hex = (c) => "#" + c.map((v) => ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2)).join("");
  const eps = 0.8 + (o.smooth / 100) * 2.2;
  const cornerAng = 40 + o.smooth * 0.4;

  function rdp(P, a, b, e, keep) {
    const st = [a, b];
    while (st.length) {
      const hi = st.pop(), lo = st.pop();
      const x1 = P[lo * 2], y1 = P[lo * 2 + 1], dx = P[hi * 2] - x1, dy = P[hi * 2 + 1] - y1, L = Math.hypot(dx, dy) || 1e-9;
      let md = 0, mi = -1;
      for (let i = lo + 1; i < hi; i++) {
        const d = Math.abs(dy * (P[i * 2] - x1) - dx * (P[i * 2 + 1] - y1)) / L;
        if (d > md) { md = d; mi = i; }
      }
      if (md > e) { keep[mi] = 1; st.push(lo, mi, mi, hi); }
    }
  }

  function simplify(pts) {
    const n = pts.length / 2;
    if (n <= 4) return pts;
    const Q = pts.concat([pts[0], pts[1]]);
    let f = 0, fd = -1;
    for (let i = 1; i < n; i++) { const d = Math.hypot(pts[i * 2] - pts[0], pts[i * 2 + 1] - pts[1]); if (d > fd) { fd = d; f = i; } }
    const keep = new Uint8Array(n + 1);
    keep[0] = 1; keep[f] = 1; keep[n] = 1;
    rdp(Q, 0, f, eps, keep);
    rdp(Q, f, n, eps, keep);
    const out = [];
    for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i * 2], pts[i * 2 + 1]);
    return out;
  }

  function pathOf(V) {
    const m = V.length / 2;
    if (o.smooth === 0 || m < 3) {
      let s = "M" + f1(V[0]) + " " + f1(V[1]);
      for (let i = 1; i < m; i++) s += "L" + f1(V[i * 2]) + " " + f1(V[i * 2 + 1]);
      return s + "Z";
    }
    const mx = new Float64Array(m), my = new Float64Array(m), corner = new Uint8Array(m);
    for (let i = 0; i < m; i++) {
      const q = (i + 1) % m, p = (i + m - 1) % m;
      mx[i] = (V[i * 2] + V[q * 2]) / 2;
      my[i] = (V[i * 2 + 1] + V[q * 2 + 1]) / 2;
      const ax = V[i * 2] - V[p * 2], ay = V[i * 2 + 1] - V[p * 2 + 1], bx = V[q * 2] - V[i * 2], by = V[q * 2 + 1] - V[i * 2 + 1];
      const c = (ax * bx + ay * by) / ((Math.hypot(ax, ay) * Math.hypot(bx, by)) || 1);
      corner[i] = (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI > cornerAng ? 1 : 0;
    }
    let s = "M" + f1(mx[m - 1]) + " " + f1(my[m - 1]);
    for (let i = 0; i < m; i++) {
      const px_ = f1(V[i * 2]) + " " + f1(V[i * 2 + 1]), mp = f1(mx[i]) + " " + f1(my[i]);
      s += corner[i] ? "L" + px_ + "L" + mp : "Q" + px_ + " " + mp;
    }
    return s + "Z";
  }

  /* ---- 2-5. trace every stacked layer ---- */
  const parts = [];
  let nodes = 0;
  for (let k = 0; k < palette.length; k++) {
    if (onProgress) onProgress(k / palette.length);
    dirs.fill(0);
    let any = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (rank[y * w + x] < k) continue;
        any = true;
        if (y === 0 || rank[(y - 1) * w + x] < k) dirs[y * W1 + x] |= 1;
        if (x === w - 1 || rank[y * w + x + 1] < k) dirs[y * W1 + x + 1] |= 2;
        if (y === h - 1 || rank[(y + 1) * w + x] < k) dirs[(y + 1) * W1 + x + 1] |= 4;
        if (x === 0 || rank[y * w + x - 1] < k) dirs[(y + 1) * W1 + x] |= 8;
      }
    }
    if (!any) continue;
    let d = "";
    for (let v0 = 0; v0 < dirs.length; v0++) {
      while (dirs[v0]) {
        const sx = v0 % W1, sy = (v0 / W1) | 0;
        let d0 = 0;
        while (!(dirs[v0] & (1 << d0))) d0++;
        let cx = sx, cy = sy, dd = d0, guard = 0;
        const pts = [];
        for (;;) {
          dirs[cy * W1 + cx] &= ~(1 << dd);
          cx += DX[dd]; cy += DY[dd];
          const av = dirs[cy * W1 + cx], t1 = (dd + 1) & 3, t3 = (dd + 3) & 3;
          let nd = -1;
          if (av & (1 << t1)) nd = t1; else if (av & (1 << dd)) nd = dd; else if (av & (1 << t3)) nd = t3;
          if (nd < 0) { if (dd !== d0) pts.push(cx, cy); break; }
          if (nd !== dd) pts.push(cx, cy);
          dd = nd;
          if (++guard > 8e6) break;
        }
        const n = pts.length / 2;
        if (n < 3) continue;
        let area = 0;
        for (let i = 0; i < n; i++) { const j = (i + 1) % n; area += pts[i * 2] * pts[j * 2 + 1] - pts[j * 2] * pts[i * 2 + 1]; }
        if (Math.abs(area / 2) < o.speck) continue;
        const V = simplify(pts);
        nodes += V.length / 2;
        d += pathOf(V);
      }
    }
    if (d) parts.push('<path fill="' + hex(palette[k]) + '" fill-rule="evenodd" d="' + d + '"/>');
  }

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + h + '" width="' + o.W + '" height="' + o.H + '">' + parts.join("") + "</svg>";
  return { svg, paths: parts.length, nodes };
}

const WORKER_SRC = `const trace=${trace.toString()};
self.onmessage=(e)=>{try{const{buf,w,h,o}=e.data;const r=trace(new Uint8ClampedArray(buf),w,h,o,(p)=>self.postMessage({progress:p}));self.postMessage({result:r});}catch(err){self.postMessage({error:String((err&&err.message)||err)});}};`;

let workerUrl = null;
const getWorkerUrl = () => (workerUrl ||= URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" })));

/* ---------------------------------- UI ------------------------------------ */

const PRESETS = [
  ["Logo / Icon", { mode: "color", colors: 6, smooth: 60, speck: 8, detail: 1000 }],
  ["Illustration", { mode: "color", colors: 16, smooth: 50, speck: 6, detail: 1000 }],
  ["Photo", { mode: "color", colors: 32, smooth: 40, speck: 4, detail: 1600 }],
  ["Line art", { mode: "bw", threshold: 140, smooth: 60, speck: 6, detail: 1000 }],
];

const fmtBytes = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`);
const card = "rounded-2xl border border-border bg-surface/60 backdrop-blur-xl";
const lbl = "text-xs font-semibold uppercase tracking-wide text-muted";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/70 px-4 py-2.5 text-sm font-semibold text-text transition hover:border-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-semibold text-text shadow-[0_0_24px_color-mix(in_srgb,var(--theme-brand)_30%,transparent)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40";
const Chip = ({ on, onClick, children }) => (
  <button onClick={onClick} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${on ? "border-brand bg-brand/15 text-text" : "border-border text-text hover:border-muted"}`}>{children}</button>
);
const Slider = ({ text, value, min, max, onChange, suffix = "" }) => (
  <label className="block">
    <span className="flex justify-between text-xs text-muted"><span className={lbl}>{text}</span><span className="tabular-nums">{value}{suffix}</span></span>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-3 w-full accent-brand" />
  </label>
);

const CHECKER = {
  backgroundColor: "#e5e7eb",
  backgroundImage: "linear-gradient(45deg,#cbd5e1 25%,transparent 25%),linear-gradient(-45deg,#cbd5e1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cbd5e1 75%),linear-gradient(-45deg,transparent 75%,#cbd5e1 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
};

/* ================================== PAGE ================================== */

export default function ImageToVector() {
  const [img, setImg] = useState(null);
  const [p, setP] = useState({ mode: "color", colors: 12, threshold: 140, smooth: 50, speck: 6, detail: 1000 });
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pos, setPos] = useState(55);
  const [bg, setBg] = useState("checker");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef(null), workerRef = useRef(null), jobRef = useRef(0), resRef = useRef(null);
  const pxCache = useRef({ key: "", val: null }), lastImg = useRef(null), imgRef = useRef(null);
  imgRef.current = img;

  /* ------------------------------ load image ------------------------------ */

  const loadFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return setMsg("Please choose an image file (PNG, JPG, WebP, GIF…).");
    try {
      const bmp = await createImageBitmap(file);
      setMsg("");
      setImg((old) => {
        if (old) { URL.revokeObjectURL(old.url); old.bmp.close?.(); }
        return { id: Math.random().toString(36).slice(2), url: URL.createObjectURL(file), name: file.name, w: bmp.width, h: bmp.height, bmp };
      });
      setPos(55);
    } catch { setMsg("Couldn’t read that image."); }
  };

  useEffect(() => {
    const onPaste = (e) => { const f = e.clipboardData?.files?.[0]; if (f) loadFile(f); };
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("paste", onPaste);
      workerRef.current?.terminate();
      if (resRef.current) URL.revokeObjectURL(resRef.current.url);
      if (imgRef.current) URL.revokeObjectURL(imgRef.current.url);
    };
  }, []);

  /* ------------------------------- tracing -------------------------------- */

  const getPixels = (im, detail) => {
    const key = `${im.id}|${detail}`;
    if (pxCache.current.key === key) return pxCache.current.val;
    const longest = Math.max(im.w, im.h);
    let sc = Math.min(1, detail / longest);
    if (longest < 600) sc = Math.min(4, 600 / longest); // upscale tiny images for smoother curves
    const w = Math.max(1, Math.round(im.w * sc)), h = Math.max(1, Math.round(im.h * sc));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(im.bmp, 0, 0, w, h);
    const val = { data: ctx.getImageData(0, 0, w, h).data, w, h };
    pxCache.current = { key, val };
    return val;
  };

  useEffect(() => {
    if (!img) return;
    const delay = lastImg.current !== img ? 20 : 320;
    lastImg.current = img;
    const timer = setTimeout(() => {
      const id = ++jobRef.current;
      workerRef.current?.terminate();
      workerRef.current = null;
      setBusy(true);
      setProgress(0);
      const t0 = performance.now();
      const { data, w, h } = getPixels(img, p.detail);
      const o = { mode: p.mode, colors: p.colors, threshold: p.threshold, smooth: p.smooth, speck: p.speck * 2, ink: [0, 0, 0], W: img.w, H: img.h };

      const finish = (r) => {
        if (id !== jobRef.current) return;
        const blob = new Blob([r.svg], { type: "image/svg+xml" });
        if (resRef.current) URL.revokeObjectURL(resRef.current.url);
        resRef.current = { url: URL.createObjectURL(blob), svg: r.svg, size: blob.size, paths: r.paths, nodes: r.nodes, ms: Math.round(performance.now() - t0) };
        setRes(resRef.current);
        setBusy(false);
      };

      if (typeof Worker === "undefined") {
        setTimeout(() => { try { finish(trace(new Uint8ClampedArray(data), w, h, o)); } catch (e) { setMsg(String(e)); setBusy(false); } }, 30);
        return;
      }
      const worker = new Worker(getWorkerUrl());
      workerRef.current = worker;
      worker.onmessage = (e) => {
        if (id !== jobRef.current) return;
        if (e.data.progress != null) setProgress(e.data.progress);
        else if (e.data.result) { finish(e.data.result); worker.terminate(); }
        else if (e.data.error) { setMsg(`Tracing failed: ${e.data.error}`); setBusy(false); }
      };
      worker.onerror = () => { if (id === jobRef.current) { setMsg("Tracing failed in the background worker."); setBusy(false); } };
      const copy = new Uint8ClampedArray(data); // keep cached pixels intact; transfer the copy
      worker.postMessage({ buf: copy.buffer, w, h, o }, [copy.buffer]);
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, p]);

  /* ------------------------------- actions -------------------------------- */

  const saveSvg = () => {
    const a = document.createElement("a");
    a.href = res.url;
    a.download = `${img.name.replace(/\.[^.]+$/, "")}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const copySvg = async () => {
    try { await navigator.clipboard.writeText(res.svg); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { setMsg("Couldn’t copy — use Download instead."); }
  };
  const reset = () => {
    jobRef.current++;
    workerRef.current?.terminate();
    if (res) URL.revokeObjectURL(res.url);
    if (img) { URL.revokeObjectURL(img.url); img.bmp.close?.(); }
    resRef.current = null;
    pxCache.current = { key: "", val: null };
    lastImg.current = null;
    setRes(null);
    setImg(null);
    setBusy(false);
  };

  const ratio = img ? img.w / img.h : 1;
  const stageBg = bg === "checker" ? CHECKER : { background: bg };

  const Empty = (
    <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]); }}>
      <button onClick={() => inputRef.current.click()}
        className={`flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed py-16 text-center transition sm:py-24 ${dragging ? "scale-[1.01] border-brand bg-brand/10" : "border-border bg-surface/60 hover:border-accent"}`}>
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Upload size={30} /></span>
        <span className="text-xl font-bold">{dragging ? "Drop to vectorize" : "Drop an image here"}</span>
        <span className="text-sm text-muted">PNG, JPG, WebP, GIF · click to browse · or paste with Ctrl+V</span>
      </button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-brand/15 blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-brand/10 blur-[150px]" />
      </div>

      <div className="min-h-screen overflow-x-clip bg-gradient-to-br from-page via-surface to-page text-text">

        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="text-center">
            <span className="rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-sm font-medium text-brand">Image to Vector</span>
            <h1 className="mt-5 text-4xl font-black sm:text-5xl">Turn Images into SVG / Vector.</h1>
            <p className="mx-auto mt-3 flex max-w-xl items-center justify-center gap-2 text-muted">
             Scalable vectors for logos, icons and illustrations — traced on your device.
            </p>
          </div>

          <input ref={inputRef} hidden type="file" accept="image/*" onChange={(e) => { loadFile(e.target.files[0]); e.target.value = ""; }} />

          <div className="mt-8 space-y-5">
            {msg && (
              <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />{msg}
              </div>
            )}

            {!img ? Empty : (
              <>
                {/* Preview */}
                <section className={`${card} p-3 sm:p-5`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      Preview background:
                      {[["checker", "Transparent"], ["#ffffff", "White"], ["#0f172a", "Dark"]].map(([v, l]) => (
                        <button key={v} onClick={() => setBg(v)} className={`rounded-full border px-2.5 py-1 transition ${bg === v ? "border-brand text-text" : "border-border hover:border-muted"}`}>{l}</button>
                      ))}
                    </div>
                    <span className="text-xs text-muted">Drag the slider to compare</span>
                  </div>

                  <div className="relative mx-auto select-none overflow-hidden rounded-xl" style={{ width: `min(100%, ${65 * ratio}vh)`, aspectRatio: `${img.w} / ${img.h}`, ...stageBg }}>
                    <img src={img.url} alt="Original" draggable={false} className="absolute inset-0 h-full w-full object-fill" />
                    {res && <img src={res.url} alt="Vector result" draggable={false} className="absolute inset-0 h-full w-full object-fill"
                      style={{ clipPath: `inset(0 ${100 - pos}% 0 0)`, ...stageBg }} />}
                    {res && (
                      <>
                        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-text shadow-[0_0_8px_rgba(0,0,0,.6)]" style={{ left: `${pos}%` }}>
                          <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-text bg-brand px-1.5 py-1 text-[10px] font-bold">⇆</span>
                        </div>
                        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Compare original and vector"
                          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
                        <span className="pointer-events-none absolute left-2 top-2 rounded bg-page/60 px-2 py-0.5 text-[11px] font-semibold">Vector</span>
                        <span className="pointer-events-none absolute right-2 top-2 rounded bg-page/60 px-2 py-0.5 text-[11px] font-semibold">Original</span>
                      </>
                    )}
                    {busy && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-page/55 backdrop-blur-[2px]">
                        <Loader2 size={28} className="animate-spin text-brand" />
                        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-border"><div className="h-full bg-brand transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
                      </div>
                    )}
                  </div>

                  {res && (
                    <p className="mt-3 text-center text-xs text-muted">
                      {res.paths} layer{res.paths !== 1 ? "s" : ""} · {res.nodes.toLocaleString()} nodes · <span className="font-semibold text-text">{fmtBytes(res.size)}</span> SVG · traced in {res.ms} ms
                    </p>
                  )}
                </section>

                {/* Controls */}
                <section className={`${card} space-y-5 p-4 sm:p-6`}>
                  <div className="space-y-2.5">
                    <p className={lbl}>Quick presets</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map(([l, v]) => <Chip key={l} on={false} onClick={() => setP((o) => ({ ...o, ...v }))}><Sparkles size={13} className="mr-1.5 inline" />{l}</Chip>)}
                    </div>
                  </div>

                  <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
                    <div className="space-y-2.5">
                      <p className={lbl}>Style</p>
                      <div className="flex gap-2">
                        <Chip on={p.mode === "color"} onClick={() => setP({ ...p, mode: "color" })}>Colour</Chip>
                        <Chip on={p.mode === "bw"} onClick={() => setP({ ...p, mode: "bw" })}>Black &amp; white</Chip>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <p className={lbl}>Detail level</p>
                      <div className="flex gap-2">
                        {[[600, "Fast"], [1000, "Balanced"], [1600, "High"]].map(([v, l]) => <Chip key={v} on={p.detail === v} onClick={() => setP({ ...p, detail: v })}>{l}</Chip>)}
                      </div>
                    </div>
                    {p.mode === "color"
                      ? <Slider text="Number of colours" min={2} max={32} value={p.colors} onChange={(v) => setP({ ...p, colors: v })} />
                      : <Slider text="Threshold (darkness)" min={30} max={230} value={p.threshold} onChange={(v) => setP({ ...p, threshold: v })} />}
                    <Slider text="Smoothness" min={0} max={100} value={p.smooth} suffix="%" onChange={(v) => setP({ ...p, smooth: v })} />
                    <Slider text="Remove specks" min={0} max={40} value={p.speck} onChange={(v) => setP({ ...p, speck: v })} />
                  </div>
                </section>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={saveSvg} disabled={!res || busy} className={btnPrimary}><Download size={16} />Download SVG</button>
                  <button onClick={copySvg} disabled={!res || busy} className={btn}>{copied ? <><Check size={16} className="text-success" />Copied</> : <><Copy size={16} />Copy SVG code</>}</button>
                  <button onClick={() => inputRef.current.click()} className={btn}><ImagePlus size={16} />New image</button>
                  <button onClick={reset} className={btn}><RefreshCw size={16} />Start over</button>
                </div>
              </>
            )}

            <p className="pb-4 text-center text-xs text-muted">
              Best with logos, icons, drawings and flat artwork. Photos become stylised posters — raise the colours and detail for closer results.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}