import { useEffect, useRef, useState } from "react";
import {
  Upload, Camera, Crop, Sparkles, Type, Pencil, LayoutTemplate, RotateCw,
  Trash2, Plus, Undo2, X, Loader2, ScanLine, Download,
} from "lucide-react";
import { PDFDocument, StandardFonts } from "pdf-lib";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

/* ========================================================================== */
/*  npm i pdf-lib pdfjs-dist jszip tesseract.js                              */
/*  100% in-browser. Edge detection + perspective warp are plain JavaScript   */
/*  (no OpenCV / no CDN), so they work offline and never "fail to load".     */
/* ========================================================================== */

const FULL = [{ x: 0.03, y: 0.03 }, { x: 0.97, y: 0.03 }, { x: 0.97, y: 0.97 }, { x: 0.03, y: 0.97 }];
const ASPECTS = { auto: null, a4: 210 / 297, letter: 8.5 / 11, square: 1 };
const FONTS = {
  sans: "Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
  script: "'Brush Script MT','Segoe Script',cursive",
};
const INK = ["#111827", "#dc2626", "#2563eb", "#16a34a", "#f59e0b", "#ffffff"];
const BGS = ["#ffffff", "#fef3c7", "#e5e7eb", "#0f172a"];
const uid = () => Math.random().toString(36).slice(2, 9);
const tick = () => new Promise((r) => setTimeout(r, 0));

/* ------------------------------ image helpers ----------------------------- */

const imgCache = new Map();
const loadImage = (src) => {
  if (!imgCache.has(src)) {
    imgCache.set(src, new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    }));
  }
  return imgCache.get(src);
};

async function fileToSrc(file, max = 3000) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.92);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function pdfToImages(file) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 2 });
    const c = document.createElement("canvas");
    c.width = vp.width;
    c.height = vp.height;
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    out.push({ src: c.toDataURL("image/jpeg", 0.92), noAuto: true });
  }
  return out;
}

/* ------------------- edge detection (pure JS, no OpenCV) ------------------ */
/*  Otsu threshold -> largest connected blob (the page) -> its 4 extreme     */
/*  corners. Works for a light page on a darker surface (or vice-versa).     */

function otsu(g) {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < g.length; i++) hist[g[i]]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, thr = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = g.length - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const between = wB * wF * (sumB / wB - (sum - sumB) / wF) ** 2;
    if (between > best) { best = between; thr = t; }
  }
  return thr;
}

function detectCorners(source) {
  const sw = source.naturalWidth || source.videoWidth || source.width;
  const sh = source.naturalHeight || source.videoHeight || source.height;
  if (!sw || !sh) return null;
  const sc = 280 / Math.max(sw, sh);
  const w = Math.max(8, Math.round(sw * sc)), h = Math.max(8, Math.round(sh * sc));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) gray[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) | 0;

  const thr = otsu(gray);
  let borderBright = 0, borderTotal = 0;
  const probe = (i) => { borderTotal++; if (gray[i] > thr) borderBright++; };
  for (let x = 0; x < w; x++) { probe(x); probe((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { probe(y * w); probe(y * w + w - 1); }
  const fgBright = borderBright / borderTotal < 0.5; // page = the side that is NOT the border

  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = (gray[i] > thr) === fgBright ? 1 : 0;

  const seen = new Uint8Array(w * h), q = new Int32Array(w * h);
  let best = null;
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    let head = 0, tail = 0, area = 0, minS = 1e9, maxS = -1e9, minD = 1e9, maxD = -1e9, tl, br, tr, bl;
    q[tail++] = s;
    seen[s] = 1;
    while (head < tail) {
      const i = q[head++], x = i % w, y = (i / w) | 0;
      area++;
      const sm = x + y, df = x - y;
      if (sm < minS) { minS = sm; tl = [x, y]; }
      if (sm > maxS) { maxS = sm; br = [x, y]; }
      if (df > maxD) { maxD = df; tr = [x, y]; }
      if (df < minD) { minD = df; bl = [x, y]; }
      if (x > 0 && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; q[tail++] = i - 1; }
      if (x < w - 1 && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; q[tail++] = i + 1; }
      if (y > 0 && mask[i - w] && !seen[i - w]) { seen[i - w] = 1; q[tail++] = i - w; }
      if (y < h - 1 && mask[i + w] && !seen[i + w]) { seen[i + w] = 1; q[tail++] = i + w; }
    }
    if (!best || area > best.area) best = { area, pts: [tl, tr, br, bl] };
  }
  if (!best || best.area < w * h * 0.12 || best.area > w * h * 0.97) return null;

  const pts = best.pts.map(([x, y]) => ({ x: (x + 0.5) / w, y: (y + 0.5) / h }));
  let a = 0; // shoelace area sanity check
  for (let i = 0; i < 4; i++) { const p = pts[i], n = pts[(i + 1) % 4]; a += p.x * n.y - n.x * p.y; }
  return Math.abs(a) / 2 > 0.1 ? pts : null;
}

/* ------------------ perspective warp (pure JS homography) ----------------- */

function homography(dst, src) {
  // maps output (u,v) -> source (x,y); solves the 8 unknowns by Gaussian elimination
  const A = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = dst[i], [x, y] = src[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x, x]);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y, y]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    if (Math.abs(A[c][c]) < 1e-12) throw new Error("degenerate");
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => row[8] / row[i]);
}

async function warp(img, corners, maxOut = 2000) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const p = corners.map((q) => ({ x: q.x * W, y: q.y * H }));
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  let ow = Math.max(d(p[0], p[1]), d(p[3], p[2]));
  let oh = Math.max(d(p[0], p[3]), d(p[1], p[2]));
  const s = Math.min(1, maxOut / Math.max(ow, oh));
  ow = Math.round(ow * s);
  oh = Math.round(oh * s);
  if (ow < 20 || oh < 20) throw new Error("too small");

  const sc = document.createElement("canvas");
  sc.width = W;
  sc.height = H;
  const sctx = sc.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(img, 0, 0);
  const sd = sctx.getImageData(0, 0, W, H).data;

  const h = homography([[0, 0], [ow, 0], [ow, oh], [0, oh]], p.map((q) => [q.x, q.y]));
  const out = new ImageData(ow, oh), od = out.data;
  for (let v = 0; v < oh; v++) {
    for (let u = 0; u < ow; u++) {
      const den = h[6] * u + h[7] * v + 1;
      let x = (h[0] * u + h[1] * v + h[2]) / den;
      let y = (h[3] * u + h[4] * v + h[5]) / den;
      x = Math.min(W - 1.001, Math.max(0, x));
      y = Math.min(H - 1.001, Math.max(0, y));
      const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0;
      const i = (y0 * W + x0) * 4, o = (v * ow + u) * 4;
      for (let c = 0; c < 3; c++) {
        od[o + c] =
          (sd[i + c] * (1 - fx) + sd[i + 4 + c] * fx) * (1 - fy) +
          (sd[i + W * 4 + c] * (1 - fx) + sd[i + W * 4 + 4 + c] * fx) * fy;
      }
      od[o + 3] = 255;
    }
    if (v % 200 === 0) await tick();
  }
  const oc = document.createElement("canvas");
  oc.width = ow;
  oc.height = oh;
  oc.getContext("2d").putImageData(out, 0, 0);
  return oc.toDataURL("image/jpeg", 0.95);
}

/* ---------------------------- enhancement engine -------------------------- */

function applyFilters(canvas, f) {
  const w = canvas.width, h = canvas.height, ctx = canvas.getContext("2d", { willReadFrequently: true });
  const sAmt = f.shadowAmt / 100;
  const needBg = sAmt > 0 || f.mode === "magic" || f.mode === "bw";
  let bg = null;
  if (needBg) {
    const k = Math.max(8, Math.round(Math.max(w, h) / 40));
    const sm = document.createElement("canvas");
    sm.width = Math.max(1, Math.round(w / k));
    sm.height = Math.max(1, Math.round(h / k));
    const sctx = sm.getContext("2d");
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(canvas, 0, 0, sm.width, sm.height);
    const big = document.createElement("canvas");
    big.width = w;
    big.height = h;
    const bctx = big.getContext("2d", { willReadFrequently: true });
    bctx.imageSmoothingQuality = "high";
    bctx.drawImage(sm, 0, 0, w, h);
    bg = bctx.getImageData(0, 0, w, h).data;
  }
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  const fc = (259 * (f.contrast + 255)) / (255 * (259 - f.contrast));
  const br = f.brightness * 2.55;
  const sat = 1 + f.saturation / 100;
  const warm = f.warmth * 0.4;
  const thr = 175 + f.bwLevel;
  const eff = f.effect / 100;
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    if (bg && sAmt > 0) {
      r += (Math.min(255, (r * 255) / Math.max(bg[i], 40)) - r) * sAmt;
      g += (Math.min(255, (g * 255) / Math.max(bg[i + 1], 40)) - g) * sAmt;
      b += (Math.min(255, (b * 255) / Math.max(bg[i + 2], 40)) - b) * sAmt;
    }
    r = fc * (r - 128) + 128 + br;
    g = fc * (g - 128) + 128 + br;
    b = fc * (b - 128) + 128 + br;
    let l = lum(r, g, b);
    if (sat !== 1) { r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; }
    l = lum(r, g, b);
    if (f.mode === "gray") r = g = b = l;
    else if (f.mode === "bw") r = g = b = l < thr ? 0 : 255;
    else if (f.mode === "magic") {
      r = (l + (r - l) * 1.3 - 128) * 1.15 + 128;
      g = (l + (g - l) * 1.3 - 128) * 1.15 + 128;
      b = (l + (b - l) * 1.3 - 128) * 1.15 + 128;
    }
    if (warm && f.mode !== "bw") { r += warm; b -= warm; }
    if (f.preset !== "none") {
      let pr = r, pg = g, pb = b;
      if (f.preset === "vintage") {
        pr = (0.393 * r + 0.769 * g + 0.189 * b) * 0.9 + 22;
        pg = (0.349 * r + 0.686 * g + 0.168 * b) * 0.9 + 20;
        pb = (0.272 * r + 0.534 * g + 0.131 * b) * 0.9 + 18;
      } else if (f.preset === "vibrant") {
        const l2 = lum(r, g, b);
        pr = (l2 + (r - l2) * 1.5 - 128) * 1.08 + 128;
        pg = (l2 + (g - l2) * 1.5 - 128) * 1.08 + 128;
        pb = (l2 + (b - l2) * 1.5 - 128) * 1.08 + 128;
      } else if (f.preset === "cool") { pr = r * 0.92; pb = b * 1.1; }
      else if (f.preset === "warm") { pr = r * 1.1; pb = b * 0.9; }
      r += (pr - r) * eff; g += (pg - g) * eff; b += (pb - b) * eff;
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
}

/* --------------------------- page rendering pipeline ---------------------- */

async function buildBase(page, maxDim) {
  const img = await loadImage(page.base);
  const rot = page.rotation || 0, odd = rot % 180 !== 0;
  const sw = odd ? img.naturalHeight : img.naturalWidth, sh = odd ? img.naturalWidth : img.naturalHeight;
  const ratio = ASPECTS[page.layout.aspect] || sw / sh;
  const W = ratio >= 1 ? maxDim : Math.round(maxDim * ratio), H = ratio >= 1 ? Math.round(maxDim / ratio) : maxDim;
  const m = Math.round((Math.min(W, H) * page.layout.margin) / 100);
  const sc = Math.min((W - 2 * m) / sw, (H - 2 * m) / sh);
  const dw = Math.round(sw * sc), dh = Math.round(sh * sc);
  const dx = Math.round((W - dw) / 2), dy = Math.round((H - dh) / 2);

  const content = document.createElement("canvas");
  content.width = dw;
  content.height = dh;
  const cx = content.getContext("2d");
  cx.translate(dw / 2, dh / 2);
  cx.rotate((rot * Math.PI) / 180);
  cx.drawImage(img, -(odd ? dh : dw) / 2, -(odd ? dw : dh) / 2, odd ? dh : dw, odd ? dw : dh);
  applyFilters(content, page.filter);

  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d");
  ctx.fillStyle = page.layout.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(content, dx, dy);
  if (page.layout.border > 0) {
    const lw = (page.layout.border * W) / 800;
    ctx.lineWidth = lw;
    ctx.strokeStyle = page.layout.borderColor;
    ctx.strokeRect(dx + lw / 2, dy + lw / 2, dw - lw, dh - lw);
  }
  return out;
}

const baseCache = new Map();
function getBase(page, maxDim) {
  const key = JSON.stringify([page.baseVer, page.rotation, page.filter, page.layout, maxDim]);
  const slot = `${page.id}|${maxDim}`, hit = baseCache.get(slot);
  if (hit && hit.key === key) return hit.p;
  const p = buildBase(page, maxDim);
  baseCache.set(slot, { key, p });
  return p;
}

const fontStr = (t, W) => `400 ${(t.size * W) / 800}px ${FONTS[t.font]}`;
const textBox = (ctx, W, H, t) => {
  ctx.font = fontStr(t, W);
  return { x: t.x * W, y: t.y * H, w: ctx.measureText(t.text || " ").width, h: ((t.size * W) / 800) * 1.2 };
};

function drawAnnots(ctx, W, H, page, selectedId, live) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of live ? [...page.strokes, live] : page.strokes) {
    if (!s.points.length) continue;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = (s.width * W) / 800;
    ctx.beginPath();
    s.points.forEach((p, i) => (i ? ctx.lineTo(p.x * W, p.y * H) : ctx.moveTo(p.x * W, p.y * H)));
    if (s.points.length === 1) ctx.lineTo(s.points[0].x * W + 0.1, s.points[0].y * H);
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const t of page.texts) {
    ctx.font = fontStr(t, W);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x * W, t.y * H);
    if (t.id === selectedId) {
      const b = textBox(ctx, W, H, t);
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x - b.w / 2 - 8, b.y - b.h / 2 - 4, b.w + 16, b.h + 8);
      ctx.restore();
    }
  }
}

const newPage = (src) => ({
  id: uid(), original: src, base: src, baseVer: 0, rotation: 0, corners: FULL,
  filter: { mode: "magic", brightness: 0, contrast: 0, saturation: 0, warmth: 0, effect: 100, shadowAmt: 100, bwLevel: 0, preset: "none" },
  layout: { aspect: "auto", margin: 0, border: 0, borderColor: "#0f172a", bg: "#ffffff" },
  texts: [], strokes: [],
});

const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const ocrWords = (data) => {
  if (data.words?.length) return data.words;
  const out = [];
  (data.blocks || []).forEach((b) => b.paragraphs?.forEach((p) => p.lines?.forEach((l) => l.words?.forEach((w) => out.push(w)))));
  return out;
};

/* -------------------------------- UI bits --------------------------------- */

const card = "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl";
const lbl = "text-xs font-semibold uppercase tracking-wide text-slate-500";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-40";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,.3)] transition hover:scale-[1.03] disabled:opacity-40";

const Chip = ({ on, onClick, children }) => (
  <button onClick={onClick} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${on ? "border-blue-500 bg-blue-500/15 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}>{children}</button>
);
const Swatches = ({ colors, value, onChange }) => (
  <div className="flex flex-wrap gap-2.5">
    {colors.map((c) => (
      <button key={c} onClick={() => onChange(c)} aria-label={c} style={{ background: c }}
        className={`h-8 w-8 rounded-full border-2 transition ${value === c ? "scale-110 border-blue-500" : "border-slate-600"}`} />
    ))}
  </div>
);
const Row = ({ title, children }) => (
  <div className="space-y-2.5"><p className={lbl}>{title}</p>{children}</div>
);
const Slider = ({ text, value, min = -100, max = 100, onChange }) => (
  <label className="block">
    <span className="flex justify-between text-xs text-slate-400"><span>{text}</span><span className="tabular-nums">{value}</span></span>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-blue-500" />
  </label>
);
const ToolBtn = ({ icon: Icon, text, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-semibold transition ${active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
    <Icon size={20} />{text}
  </button>
);

/* ------------------------------ crop editor ------------------------------- */

function CropEditor({ page, onChange, onCommit }) {
  const wrap = useRef(null), drag = useRef(null);
  const move = (e) => {
    if (drag.current === null) return;
    const r = wrap.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    onChange(page.corners.map((c, i) => (i === drag.current ? { x, y } : c)));
  };
  const end = () => {
    if (drag.current !== null) { drag.current = null; onCommit?.(); }
  };
  return (
    <div ref={wrap} className="relative mx-auto inline-block max-w-full touch-none select-none" onPointerMove={move}
      onPointerUp={end} onPointerLeave={end}>
      <img src={page.original} alt="" draggable={false} className="block max-h-[65vh] max-w-full rounded-lg" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points={page.corners.map((c) => `${c.x * 100},${c.y * 100}`).join(" ")} fill="rgba(59,130,246,.18)" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {page.corners.map((c, i) => (
        <div key={i} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = i; }}
          style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
          className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-blue-500 shadow-lg" />
      ))}
    </div>
  );
}

/* ------------------------------ camera modal ------------------------------ */

function CameraModal({ onClose, onCapture }) {
  const videoRef = useRef(null), overlayRef = useRef(null), cornersRef = useRef(null);
  const [err, setErr] = useState(""), [shots, setShots] = useState(0);

  useEffect(() => {
    let stream, timer, alive = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } } });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch {
        setErr("Camera unavailable or permission denied. You can upload a photo instead.");
        return;
      }
      const loop = () => {
        if (!alive) return;
        const v = videoRef.current, o = overlayRef.current;
        if (v?.videoWidth && o) {
          const c = detectCorners(v);
          cornersRef.current = c;
          o.width = v.videoWidth;
          o.height = v.videoHeight;
          const ctx = o.getContext("2d");
          ctx.clearRect(0, 0, o.width, o.height);
          if (c) {
            ctx.beginPath();
            c.forEach((p, i) => (i ? ctx.lineTo(p.x * o.width, p.y * o.height) : ctx.moveTo(p.x * o.width, p.y * o.height)));
            ctx.closePath();
            ctx.fillStyle = "rgba(59,130,246,.2)";
            ctx.fill();
            ctx.lineWidth = Math.max(3, o.width / 250);
            ctx.strokeStyle = "#3b82f6";
            ctx.stroke();
          }
        }
        timer = setTimeout(loop, 300);
      };
      loop();
    })();
    return () => { alive = false; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const capture = () => {
    const v = videoRef.current, c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    onCapture({ src: c.toDataURL("image/jpeg", 0.92), corners: cornersRef.current });
    setShots((n) => n + 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 p-4">
      <div className="flex items-center justify-between text-white">
        <span className="text-sm text-slate-300">Fit the document inside the blue outline</span>
        <button onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><X size={18} /></button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {err ? <p className="max-w-sm text-center text-red-400">{err}</p> : (
          <div className="relative max-h-full max-w-full">
            <video ref={videoRef} playsInline muted className="block max-h-[72vh] max-w-full rounded-xl" />
            <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-4 pt-4">
        <button onClick={capture} disabled={!!err} aria-label="Capture" className="h-16 w-16 rounded-full border-4 border-white bg-white/20 transition active:scale-90 disabled:opacity-30" />
        <button onClick={onClose} className={btn}>{shots ? `Done (${shots})` : "Cancel"}</button>
      </div>
    </div>
  );
}

/* ================================== PAGE ================================== */

export default function DocumentScanner() {
  const [pages, setPages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [panel, setPanel] = useState("filters"); // crop | filters | text | draw | page
  const [thumbs, setThumbs] = useState({});
  const [toast, setToast] = useState({ msg: "", busy: false });
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [pen, setPen] = useState({ color: "#2563eb", width: 4 });
  const [selText, setSelText] = useState(null);
  const [exp, setExp] = useState({ name: "scan", format: "pdf", ocr: false });

  const fileRef = useRef(null), canvasRef = useRef(null), baseRef = useRef(null), activeRef = useRef(null);
  const liveRef = useRef(null), dragRef = useRef(null), dragIdx = useRef(null), thumbTimer = useRef(null);

  const active = pages.find((p) => p.id === activeId) || pages[0] || null;
  activeRef.current = active;

  const note = (msg, busy = false) => {
    setToast({ msg, busy });
    if (msg && !busy) setTimeout(() => setToast((t) => (t.msg === msg ? { msg: "", busy: false } : t)), 4000);
  };
  const patch = (id, fn) => setPages((ps) => ps.map((p) => (p.id === id ? { ...p, ...(typeof fn === "function" ? fn(p) : fn) } : p)));
  const setFilter = (v) => patch(active.id, { filter: { ...active.filter, ...v } });
  const setLayout = (v) => patch(active.id, { layout: { ...active.layout, ...v } });

  /* ----------------------------- import / add ----------------------------- */

  const addPages = async (items) => {
    if (!items.length) return;
    const created = items.map((it) => newPage(it.src));
    setPages((ps) => [...ps, ...created]);
    setActiveId((cur) => cur || created[0].id);
    setPanel("filters");
    let missed = 0;
    for (let i = 0; i < created.length; i++) {
      if (items[i].noAuto) continue;
      try {
        note("Finding the page edges…", true);
        await tick();
        const img = await loadImage(created[i].original);
        const corners = items[i].corners || detectCorners(img);
        if (!corners) { missed++; continue; }
        const base = await warp(img, corners);
        patch(created[i].id, (x) => ({ corners, base, baseVer: x.baseVer + 1 }));
      } catch (e) {
        console.error(e);
        missed++;
      }
    }
    note(missed ? "Couldn't find the edges automatically — tap Crop to adjust them." : "");
  };

  const handleFiles = async (files) => {
    note("Importing…", true);
    try {
      const items = [];
      for (const f of files) {
        if (f.type === "application/pdf") items.push(...(await pdfToImages(f)));
        else if (f.type.startsWith("image/")) items.push({ src: await fileToSrc(f) });
      }
      if (!items.length) return note("Please choose JPEG, PNG or PDF files.");
      await addPages(items);
    } catch (e) {
      console.error(e);
      note("Couldn't read one of the files.");
    }
  };

  const removePage = (id) => {
    baseCache.delete(`${id}|1400`);
    baseCache.delete(`${id}|2200`);
    setPages((ps) => {
      const next = ps.filter((p) => p.id !== id);
      if (id === activeId) setActiveId(next[0]?.id || null);
      return next;
    });
  };

  const reorder = (to) => {
    const from = dragIdx.current;
    if (from === null || from === to) return;
    setPages((ps) => { const a = [...ps]; a.splice(to, 0, a.splice(from, 1)[0]); return a; });
    dragIdx.current = null;
  };

  /* ------------------------------- crop actions --------------------------- */

  const cropToken = useRef(0);
  const commitCrop = async (corners) => {
    const pg = activeRef.current;
    if (!pg) return;
    const token = ++cropToken.current;
    try {
      note("Updating…", true);
      await tick();
      const base = await warp(await loadImage(pg.original), corners || pg.corners);
      if (token !== cropToken.current) return;
      patch(pg.id, (x) => ({ base, baseVer: x.baseVer + 1 }));
      note("");
    } catch (e) {
      console.error(e);
      if (token === cropToken.current) note("Those corners are too close together — spread them out.");
    }
  };

  const autoCrop = async () => {
    const c = detectCorners(await loadImage(active.original));
    if (c) { patch(active.id, { corners: c }); commitCrop(c); }
    else note("Couldn't detect the edges — drag the corners instead.");
  };

  const resetCrop = () => { patch(active.id, { corners: FULL }); commitCrop(FULL); };

  /* ------------------------------- rendering ------------------------------ */

  const fKey = JSON.stringify(active?.filter), lKey = JSON.stringify(active?.layout);

  const paint = () => {
    const b = baseRef.current, cv = canvasRef.current, pg = activeRef.current;
    if (!b || !cv || !pg) return;
    if (cv.width !== b.width || cv.height !== b.height) { cv.width = b.width; cv.height = b.height; }
    const ctx = cv.getContext("2d");
    ctx.drawImage(b, 0, 0);
    drawAnnots(ctx, b.width, b.height, pg, panel === "text" ? selText : null, liveRef.current);
  };

  const updateThumb = () => {
    const b = baseRef.current, pg = activeRef.current;
    if (!b || !pg) return;
    const s = 160 / Math.max(b.width, b.height), c = document.createElement("canvas");
    c.width = Math.round(b.width * s);
    c.height = Math.round(b.height * s);
    const x = c.getContext("2d");
    x.drawImage(b, 0, 0, c.width, c.height);
    drawAnnots(x, c.width, c.height, pg, null, null);
    setThumbs((t) => ({ ...t, [pg.id]: c.toDataURL("image/jpeg", 0.7) }));
  };

  useEffect(() => {
    if (!active || panel === "crop") return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getBase(active, 1400).then((b) => {
        if (cancelled) return;
        baseRef.current = b;
        paint();
        updateThumb();
      });
    }, 60);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.baseVer, active?.rotation, fKey, lKey, panel === "crop"]);

  useEffect(() => {
    paint();
    clearTimeout(thumbTimer.current);
    thumbTimer.current = setTimeout(updateThumb, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.texts, active?.strokes, selText, panel]);

  /* ----------------------------- canvas pointer --------------------------- */

  const pt = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const onDown = (e) => {
    if (!baseRef.current || (panel !== "draw" && panel !== "text")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pt(e);
    if (panel === "draw") {
      liveRef.current = { color: pen.color, width: pen.width, points: [p] };
      paint();
      return;
    }
    const b = baseRef.current, ctx = canvasRef.current.getContext("2d");
    const hit = [...active.texts].reverse().find((t) => {
      const bx = textBox(ctx, b.width, b.height, t);
      return Math.abs(p.x * b.width - bx.x) < bx.w / 2 + 12 && Math.abs(p.y * b.height - bx.y) < bx.h / 2 + 8;
    });
    setSelText(hit ? hit.id : null);
    dragRef.current = hit ? { id: hit.id, dx: hit.x - p.x, dy: hit.y - p.y } : null;
  };

  const onMove = (e) => {
    if (panel === "draw" && liveRef.current) {
      liveRef.current.points.push(pt(e));
      paint();
    } else if (panel === "text" && dragRef.current) {
      const p = pt(e), d = dragRef.current;
      patch(active.id, (x) => ({ texts: x.texts.map((t) => (t.id === d.id ? { ...t, x: p.x + d.dx, y: p.y + d.dy } : t)) }));
    }
  };

  const onUp = () => {
    if (liveRef.current) {
      const s = liveRef.current;
      liveRef.current = null;
      patch(active.id, (x) => ({ strokes: [...x.strokes, s] }));
    }
    dragRef.current = null;
  };

  const addText = () => {
    const t = { id: uid(), text: "Your text", x: 0.5, y: 0.5, font: "sans", size: 40, color: "#111827" };
    patch(active.id, (x) => ({ texts: [...x.texts, t] }));
    setSelText(t.id);
  };
  const patchText = (id, v) => patch(active.id, (x) => ({ texts: x.texts.map((t) => (t.id === id ? { ...t, ...v } : t)) }));
  const selected = active?.texts.find((t) => t.id === selText);

  /* --------------------------------- export ------------------------------- */

  const exportDoc = async () => {
    try {
      const canvases = [];
      for (let i = 0; i < pages.length; i++) {
        note(`Preparing page ${i + 1} of ${pages.length}…`, true);
        const b = await getBase(pages[i], 2200);
        const c = document.createElement("canvas");
        c.width = b.width;
        c.height = b.height;
        const x = c.getContext("2d");
        x.drawImage(b, 0, 0);
        drawAnnots(x, c.width, c.height, pages[i], null, null);
        canvases.push(c);
      }
      const toBlob = (c) => new Promise((r) => c.toBlob(r, "image/jpeg", 0.92));
      const name = exp.name.trim() || "scan";

      if (exp.format === "zip") {
        const JSZip = (await import("jszip")).default, zip = new JSZip();
        for (let i = 0; i < canvases.length; i++) zip.file(`${name}-${i + 1}.jpg`, await toBlob(canvases[i]));
        download(await zip.generateAsync({ type: "blob" }), `${name}.zip`);
      } else {
        const pdf = await PDFDocument.create();
        const font = exp.ocr ? await pdf.embedFont(StandardFonts.Helvetica) : null;
        let worker = null;
        if (exp.ocr) {
          note("Loading text recognition (first time only)…", true);
          worker = await (await import("tesseract.js")).createWorker("eng");
        }
        for (let i = 0; i < canvases.length; i++) {
          const c = canvases[i], a = pages[i].layout.aspect;
          const pw = a === "letter" || a === "square" ? 612 : 595.28;
          const ph = a === "letter" ? 792 : a === "square" ? 612 : a === "a4" ? 841.89 : (595.28 * c.height) / c.width;
          const jpg = await pdf.embedJpg(await (await toBlob(c)).arrayBuffer());
          const pg = pdf.addPage([pw, ph]);
          pg.drawImage(jpg, { x: 0, y: 0, width: pw, height: ph });
          if (worker) {
            note(`Making page ${i + 1} of ${canvases.length} searchable…`, true);
            const { data } = await worker.recognize(c, {}, { blocks: true });
            const s = pw / c.width;
            for (const w of ocrWords(data)) {
              const t = (w.text || "").replace(/[^\x20-\x7E]/g, "");
              if (!t.trim()) continue;
              pg.drawText(t, { x: w.bbox.x0 * s, y: ph - w.bbox.y1 * s, size: Math.max(4, (w.bbox.y1 - w.bbox.y0) * s * 0.85), font, opacity: 0 });
            }
          }
        }
        if (worker) await worker.terminate();
        download(new Blob([await pdf.save()], { type: "application/pdf" }), `${name}.pdf`);
      }
      note("Saved ✓");
      setSaveOpen(false);
    } catch (e) {
      console.error(e);
      note("Something went wrong while saving. Try turning off “searchable text”.");
    }
  };

  /* ---------------------------------- JSX --------------------------------- */

  const Empty = (
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFiles([...e.dataTransfer.files]); }}
      className="flex flex-col items-center rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 px-6 py-16 text-center transition hover:border-blue-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400"><ScanLine size={30} /></div>
      <h2 className="mt-6 text-2xl font-bold">Add a document</h2>
      <p className="mt-2 text-slate-400">Take a photo or upload JPEG, PNG or PDF files.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={() => setCameraOpen(true)} className={btnPrimary}><Camera size={18} />Scan with camera</button>
        <button onClick={() => fileRef.current.click()} className={btn}><Upload size={18} />Upload files</button>
      </div>
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
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">Document Scanner</span>
            <h1 className="mt-5 text-4xl font-black sm:text-5xl">Scan &amp; Save as PDF.</h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">Photograph a page, we straighten and clean it up. Everything stays on your device.</p>
          </div>

          <input ref={fileRef} hidden multiple type="file" accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => { handleFiles([...e.target.files]); e.target.value = ""; }} />

          <div className="mt-8">
            {!active ? Empty : (
              <div className="space-y-4">
                {/* Pages + Save */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 gap-2.5 overflow-x-auto py-1">
                    {pages.map((p, i) => (
                      <div key={p.id} draggable onDragStart={() => (dragIdx.current = i)} onDragOver={(e) => e.preventDefault()} onDrop={() => reorder(i)}
                        onClick={() => setActiveId(p.id)}
                        className={`relative h-20 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-slate-950 transition ${p.id === active.id ? "border-blue-500" : "border-slate-800"}`}>
                        <img src={thumbs[p.id] || p.base} alt={`Page ${i + 1}`} className="h-full w-full object-cover" draggable={false} />
                        {pages.length > 1 && (
                          <button onClick={(e) => { e.stopPropagation(); removePage(p.id); }} aria-label="Delete page"
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-1 text-red-400"><Trash2 size={10} /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setCameraOpen(true)} aria-label="Scan another page" className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-700 text-slate-400 hover:border-blue-500 hover:text-white"><Camera size={18} /></button>
                    <button onClick={() => fileRef.current.click()} aria-label="Upload more pages" className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-700 text-slate-400 hover:border-blue-500 hover:text-white"><Plus size={18} /></button>
                  </div>
                  <button onClick={() => setSaveOpen((o) => !o)} className={btnPrimary}><Download size={16} />Save</button>
                </div>

                {/* Save panel */}
                {saveOpen && (
                  <div className={`${card} space-y-4 p-4 sm:p-5`}>
                    <div className="flex flex-wrap gap-2">
                      <Chip on={exp.format === "pdf"} onClick={() => setExp({ ...exp, format: "pdf" })}>PDF document</Chip>
                      <Chip on={exp.format === "zip"} onClick={() => setExp({ ...exp, format: "zip" })}>Images (ZIP)</Chip>
                    </div>
                    <input value={exp.name} onChange={(e) => setExp({ ...exp, name: e.target.value })} placeholder="File name"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-blue-500/50" />
                    {exp.format === "pdf" && (
                      <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                        <input type="checkbox" checked={exp.ocr} onChange={(e) => setExp({ ...exp, ocr: e.target.checked })} className="h-4 w-4 accent-blue-500" />
                        Make text searchable <span className="text-xs text-slate-500">(English OCR — slower)</span>
                      </label>
                    )}
                    <button onClick={exportDoc} disabled={toast.busy} className={btnPrimary + " w-full"}>
                      Download {pages.length} page{pages.length > 1 ? "s" : ""}
                    </button>
                  </div>
                )}

                {/* Preview */}
                <section className={`${card} flex min-h-[320px] items-center justify-center overflow-auto p-3 sm:p-6`}>
                  {panel === "crop" ? (
                    <CropEditor page={active} onChange={(corners) => patch(active.id, { corners })} onCommit={() => setTimeout(() => commitCrop(), 0)} />
                  ) : (
                    <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
                      className={`mx-auto h-auto max-h-[65vh] w-auto max-w-full touch-none rounded-lg bg-white shadow-2xl ${panel === "draw" ? "cursor-crosshair" : panel === "text" ? "cursor-move" : ""}`} />
                  )}
                </section>

                {/* Toolbar */}
                <div className={`${card} flex gap-1 p-1.5`}>
                  <ToolBtn icon={Crop} text="Crop" active={panel === "crop"} onClick={() => setPanel("crop")} />
                  <ToolBtn icon={Sparkles} text="Filters" active={panel === "filters"} onClick={() => setPanel("filters")} />
                  <ToolBtn icon={Type} text="Text" active={panel === "text"} onClick={() => setPanel("text")} />
                  <ToolBtn icon={Pencil} text="Draw" active={panel === "draw"} onClick={() => setPanel("draw")} />
                  <ToolBtn icon={LayoutTemplate} text="Page" active={panel === "page"} onClick={() => setPanel("page")} />
                  <ToolBtn icon={RotateCw} text="Rotate" onClick={() => patch(active.id, (x) => ({ rotation: (x.rotation + 90) % 360 }))} />
                </div>

                {/* Contextual options */}
                <div className={`${card} space-y-5 p-4 sm:p-5`}>
                  {panel === "crop" && (
                    <>
                      <p className="text-sm text-slate-400">Drag the blue dots onto the corners of your document — it updates automatically.</p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={autoCrop} className={btn}><ScanLine size={15} />Auto-detect</button>
                        <button onClick={resetCrop} className={btn}>Reset</button>
                      </div>
                    </>
                  )}

                  {panel === "filters" && (
                    <>
                      <Row title="Scan style">
                        <div className="flex flex-wrap gap-2">
                          {[["magic", "Magic Color"], ["bw", "Black & White"], ["gray", "Grayscale"], ["original", "Original"]].map(([v, l]) => (
                            <Chip key={v} on={active.filter.mode === v} onClick={() => setFilter({ mode: v, shadowAmt: v === "original" ? 0 : 100 })}>{l}</Chip>
                          ))}
                        </div>
                      </Row>
                      <Row title="Colour effect">
                        <div className="flex flex-wrap gap-2">
                          {[["none", "None"], ["vintage", "Vintage"], ["vibrant", "Vibrant"], ["warm", "Warm"], ["cool", "Cool"]].map(([v, l]) => (
                            <Chip key={v} on={active.filter.preset === v} onClick={() => setFilter({ preset: v })}>{l}</Chip>
                          ))}
                        </div>
                        {active.filter.preset !== "none" && (
                          <Slider text="Effect strength" min={0} max={100} value={active.filter.effect} onChange={(v) => setFilter({ effect: v })} />
                        )}
                      </Row>
                      <div className="space-y-4 border-t border-slate-800 pt-5">
                        <div className="flex items-center justify-between">
                          <p className={lbl}>Adjust</p>
                          <button onClick={() => setFilter({ brightness: 0, contrast: 0, saturation: 0, warmth: 0, effect: 100, bwLevel: 0, shadowAmt: active.filter.mode === "original" ? 0 : 100 })}
                            className="text-xs text-slate-400 hover:text-white">Reset all</button>
                        </div>
                        <Slider text="Brightness" value={active.filter.brightness} onChange={(v) => setFilter({ brightness: v })} />
                        <Slider text="Contrast" value={active.filter.contrast} onChange={(v) => setFilter({ contrast: v })} />
                        <Slider text="Saturation" value={active.filter.saturation} onChange={(v) => setFilter({ saturation: v })} />
                        <Slider text="Warmth (cool ↔ warm)" value={active.filter.warmth} onChange={(v) => setFilter({ warmth: v })} />
                        <Slider text="Shadow removal" min={0} max={100} value={active.filter.shadowAmt} onChange={(v) => setFilter({ shadowAmt: v })} />
                        {active.filter.mode === "bw" && (
                          <Slider text="Black & White darkness" min={-60} max={60} value={active.filter.bwLevel} onChange={(v) => setFilter({ bwLevel: v })} />
                        )}
                      </div>
                      {pages.length > 1 && (
                        <button onClick={() => setPages((ps) => ps.map((p) => ({ ...p, filter: { ...active.filter } })))} className="text-sm text-blue-400 hover:text-blue-300">Apply this look to all pages</button>
                      )}
                    </>
                  )}

                  {panel === "text" && (
                    <>
                      <button onClick={addText} className={btn}><Type size={16} />Add text</button>
                      {selected ? (
                        <div className="space-y-4">
                          <input value={selected.text} onChange={(e) => patchText(selected.id, { text: e.target.value })}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-blue-500/50" />
                          <div className="flex flex-wrap gap-2">
                            {[["sans", "Clean"], ["serif", "Classic"], ["mono", "Typewriter"], ["script", "Handwritten"]].map(([v, l]) => (
                              <Chip key={v} on={selected.font === v} onClick={() => patchText(selected.id, { font: v })}>{l}</Chip>
                            ))}
                          </div>
                          <input type="range" min={14} max={140} value={selected.size} onChange={(e) => patchText(selected.id, { size: Number(e.target.value) })} className="w-full accent-blue-500" aria-label="Text size" />
                          <div className="flex items-center justify-between gap-3">
                            <Swatches colors={INK} value={selected.color} onChange={(c) => patchText(selected.id, { color: c })} />
                            <button onClick={() => { patch(active.id, (x) => ({ texts: x.texts.filter((t) => t.id !== selected.id) })); setSelText(null); }} className={btn + " !text-red-400"}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ) : <p className="text-sm text-slate-400">Tap “Add text”, then drag it where you want. Tap a text on the page to edit it.</p>}
                    </>
                  )}

                  {panel === "draw" && (
                    <>
                      <p className="text-sm text-slate-400">Draw or sign directly on the page.</p>
                      <Swatches colors={INK} value={pen.color} onChange={(c) => setPen({ ...pen, color: c })} />
                      <div className="flex flex-wrap items-center gap-2">
                        {[[2, "Thin"], [4, "Medium"], [9, "Thick"]].map(([w, l]) => <Chip key={w} on={pen.width === w} onClick={() => setPen({ ...pen, width: w })}>{l}</Chip>)}
                        <button onClick={() => patch(active.id, (x) => ({ strokes: x.strokes.slice(0, -1) }))} className={btn + " ml-auto"}><Undo2 size={15} />Undo</button>
                        <button onClick={() => patch(active.id, { strokes: [] })} className={btn}>Clear</button>
                      </div>
                    </>
                  )}

                  {panel === "page" && (
                    <>
                      <Row title="Page size">
                        <div className="flex flex-wrap gap-2">
                          {[["auto", "Fit image"], ["a4", "A4"], ["letter", "Letter"], ["square", "Square"]].map(([v, l]) => <Chip key={v} on={active.layout.aspect === v} onClick={() => setLayout({ aspect: v })}>{l}</Chip>)}
                        </div>
                      </Row>
                      <Row title="Margin">
                        <div className="flex flex-wrap gap-2">
                          {[[0, "None"], [4, "Small"], [8, "Medium"], [14, "Large"]].map(([v, l]) => <Chip key={v} on={active.layout.margin === v} onClick={() => setLayout({ margin: v })}>{l}</Chip>)}
                        </div>
                      </Row>
                      <Row title="Border">
                        <div className="flex flex-wrap gap-2">
                          {[[0, "None"], [4, "Thin"], [10, "Thick"]].map(([v, l]) => <Chip key={v} on={active.layout.border === v} onClick={() => setLayout({ border: v })}>{l}</Chip>)}
                        </div>
                      </Row>
                      <Row title="Background">
                        <Swatches colors={BGS} value={active.layout.bg} onChange={(c) => setLayout({ bg: c, borderColor: c === "#0f172a" ? "#ffffff" : "#0f172a" })} />
                      </Row>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {toast.msg && (
        <div className="fixed bottom-5 left-1/2 z-[90] flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full border border-slate-700 bg-slate-900/95 px-5 py-3 text-sm shadow-2xl backdrop-blur">
          {toast.busy && <Loader2 size={16} className="shrink-0 animate-spin text-blue-400" />}
          {toast.msg}
        </div>
      )}

      {cameraOpen && <CameraModal onClose={() => setCameraOpen(false)} onCapture={(shot) => addPages([shot])} />}
    </>
  );
}