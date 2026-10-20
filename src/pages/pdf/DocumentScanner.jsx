import { useEffect, useRef, useState } from "react";
import {
  Upload, Camera, Crop, Sparkles, Type, Pencil, LayoutTemplate, RotateCw,
  Trash2, Plus, Undo2, X, Loader2, ScanLine, Download, Check,
} from "lucide-react";
import { PDFDocument, StandardFonts } from "pdf-lib";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

/* ========================================================================== */
/*  npm i pdf-lib pdfjs-dist jszip tesseract.js                              */
/*  100% in-browser, no OpenCV / no CDN.                                      */
/*                                                                            */
/*  What's new in this version                                                */
/*   - Much stronger edge detection: 4 independent detectors (luminance both  */
/*     polarities, colour-distance from background, edge-fill) -> convex     */
/*     hull -> minimum-area enclosing quadrilateral -> best-scoring wins.    */
/*   - True "flat" scans: the page's real aspect ratio is recovered from the  */
/*     perspective (pinhole-camera model) and snapped to A4 / Letter.        */
/*   - After capture/upload you land on the CROP screen with the detected     */
/*     outline so you can verify it, page by page, before filtering.         */
/*   - Filters & page layout apply to ALL pages at once. Switch to           */
/*     "This page only" to customise one page, or reset it back.             */
/*   - Magnifier loupe while dragging corners, auto-capture in the camera.   */
/* ========================================================================== */

const FULL = [{ x: 0.06, y: 0.06 }, { x: 0.94, y: 0.06 }, { x: 0.94, y: 0.94 }, { x: 0.06, y: 0.94 }];
const FULL_IMG = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
const ASPECTS = { auto: null, a4: 210 / 297, letter: 8.5 / 11, square: 1 };
const FONTS = {
  sans: "Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
  script: "'Brush Script MT','Segoe Script',cursive",
};
const INK = ["#111827", "#dc2626", "#2563eb", "#16a34a", "#f59e0b", "#ffffff"];
const BGS = ["#ffffff", "#fef3c7", "#e5e7eb", "#0f172a"];
const DEFAULT_FILTER = {
  mode: "magic", brightness: 0, contrast: 0, saturation: 0, warmth: 0,
  effect: 100, shadowAmt: 100, bwLevel: 0, preset: "none",
};
const DEFAULT_LAYOUT = { aspect: "auto", margin: 0, border: 0, borderColor: "#0f172a", bg: "#ffffff" };

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

/* ========================================================================== */
/*                     EDGE DETECTION  (pure JS, multi-strategy)              */
/* ========================================================================== */

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

/* separable [1 2 1] blur */
function blur3(src, w, h) {
  const t = new Uint8Array(w * h), o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      t[i] = (src[i - (x > 0 ? 1 : 0)] + 2 * src[i] + src[i + (x < w - 1 ? 1 : 0)]) >> 2;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      o[i] = (t[i - (y > 0 ? w : 0)] + 2 * t[i] + t[i + (y < h - 1 ? w : 0)]) >> 2;
    }
  }
  return o;
}

/* cross-shaped dilate (grow=true) / erode (grow=false), n iterations */
function morph(src, w, h, grow, n) {
  let cur = src;
  for (let k = 0; k < n; k++) {
    const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let v = cur[i];
        if (grow) { if (!v && ((x > 0 && cur[i - 1]) || (x < w - 1 && cur[i + 1]))) v = 1; }
        else if (v && ((x > 0 && !cur[i - 1]) || (x < w - 1 && !cur[i + 1]))) v = 0;
        tmp[i] = v;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let v = tmp[i];
        if (grow) { if (!v && ((y > 0 && tmp[i - w]) || (y < h - 1 && tmp[i + w]))) v = 1; }
        else if (v && ((y > 0 && !tmp[i - w]) || (y < h - 1 && !tmp[i + w]))) v = 0;
        out[i] = v;
      }
    }
    cur = out;
  }
  return cur;
}

/* ---- geometry ---- */
const cross2 = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

function convexHull(input) {
  const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const lo = [];
  for (const p of pts) {
    while (lo.length >= 2 && cross2(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (up.length >= 2 && cross2(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  lo.pop(); up.pop();
  return lo.concat(up);
}

const polyArea = (p) => {
  let a = 0;
  for (let i = 0; i < p.length; i++) { const q = p[i], n = p[(i + 1) % p.length]; a += q[0] * n[1] - n[0] * q[1]; }
  return Math.abs(a) / 2;
};

/*  Reduce a convex hull to the 4-gon that ENCLOSES it with the least added
    area: repeatedly delete the edge whose neighbours' lines meet closest to it.
    This keeps true page corners even when blur/morphology rounded them off.   */
function hullToQuad(hull) {
  const p = hull.slice();
  while (p.length > 4) {
    const n = p.length;
    let bi = -1, bc = Infinity, bx = null;
    for (let i = 0; i < n; i++) {
      const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], d = p[(i + 2) % n];
      const d1x = b[0] - a[0], d1y = b[1] - a[1], d2x = d[0] - c[0], d2y = d[1] - c[1];
      const den = d1x * d2y - d1y * d2x;
      if (Math.abs(den) < 1e-9) continue;
      const ex = c[0] - a[0], ey = c[1] - a[1];
      const t = (ex * d2y - ey * d2x) / den, u = (ex * d1y - ey * d1x) / den;
      if (t < 1 || u > 0) continue; // intersection must lie beyond both neighbours
      const x = [a[0] + t * d1x, a[1] + t * d1y];
      const cost = Math.abs(cross2(b, x, c)) / 2;
      if (cost < bc) { bc = cost; bi = i; bx = x; }
    }
    if (bi < 0) { // fallback: drop the least significant vertex
      let m = Infinity, k = 0;
      for (let i = 0; i < n; i++) {
        const ar = Math.abs(cross2(p[(i - 1 + n) % n], p[i], p[(i + 1) % n]));
        if (ar < m) { m = ar; k = i; }
      }
      p.splice(k, 1);
    } else {
      const j = (bi + 1) % n;
      p[bi] = bx;
      p.splice(j, 1);
    }
  }
  return p;
}

/* clockwise from top-left: TL, TR, BR, BL */
function orderCorners(pts) {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const s = [...pts].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  let k = 0;
  for (let i = 1; i < 4; i++) if (s[i].x + s[i].y < s[k].x + s[k].y) k = i;
  return [...s.slice(k), ...s.slice(0, k)];
}

function quadIsSane(q, minSide) {
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
    const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y];
    const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
    if (l1 < minSide || l2 < minSide) return false;
    const ang = Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2))));
    if (ang < 0.8 || ang > 2.35) return false; // 46° .. 135°
  }
  return true;
}

/* find best page-like blob in a binary mask */
function evalMask(mask, w, h) {
  const lab = new Int32Array(w * h), q = new Int32Array(w * h), areas = [0];
  let nl = 0;
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || lab[s]) continue;
    nl++;
    let head = 0, tail = 0;
    q[tail++] = s;
    lab[s] = nl;
    while (head < tail) {
      const i = q[head++], x = i % w, y = (i / w) | 0;
      if (x > 0 && mask[i - 1] && !lab[i - 1]) { lab[i - 1] = nl; q[tail++] = i - 1; }
      if (x < w - 1 && mask[i + 1] && !lab[i + 1]) { lab[i + 1] = nl; q[tail++] = i + 1; }
      if (y > 0 && mask[i - w] && !lab[i - w]) { lab[i - w] = nl; q[tail++] = i - w; }
      if (y < h - 1 && mask[i + w] && !lab[i + w]) { lab[i + w] = nl; q[tail++] = i + w; }
    }
    areas[nl] = tail;
  }
  const top = areas
    .map((a, L) => ({ a, L }))
    .filter((o) => o.L > 0 && o.a >= w * h * 0.1)
    .sort((a, b) => b.a - a.a)
    .slice(0, 3);

  let best = null;
  for (const { L, a } of top) {
    const bpts = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (lab[i] !== L) continue;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || lab[i - 1] !== L || lab[i + 1] !== L || lab[i - w] !== L || lab[i + w] !== L) bpts.push([x, y]);
      }
    }
    const hull = convexHull(bpts);
    if (hull.length < 4) continue;
    const quad0 = hullToQuad(hull);
    if (quad0.length !== 4) continue;
    const quad = orderCorners(quad0.map(([x, y]) => ({ x: Math.min(w - 1, Math.max(0, x)), y: Math.min(h - 1, Math.max(0, y)) })));
    const qa = polyArea(quad.map((p) => [p.x, p.y]));
    const ha = polyArea(hull);
    if (qa <= 0 || ha <= 0) continue;
    const fq = qa / (w * h);
    if (fq < 0.12 || fq > 0.97) continue;
    if (!quadIsSane(quad, Math.max(w, h) * 0.12)) continue;
    const tight = Math.min(1, ha / qa);
    if (tight < 0.8) continue;
    const fill = Math.min(1, a / ha);
    const cx = quad.reduce((s, p) => s + p.x, 0) / 4 / w - 0.5, cy = quad.reduce((s, p) => s + p.y, 0) / 4 / h - 0.5;
    const score = tight * (0.55 + 0.45 * fill) * (0.6 + 0.4 * Math.sqrt(fq)) * (1 - 0.3 * Math.hypot(cx, cy));
    if (!best || score > best.score) {
      best = { score, quad: quad.map((p) => ({ x: (p.x + 0.5) / w, y: (p.y + 0.5) / h })) };
    }
  }
  return best;
}

/*  Returns 4 corners (TL,TR,BR,BL, normalised 0..1) or null.                */
function detectCorners(source, size = 420) {
  const sw = source.naturalWidth || source.videoWidth || source.width;
  const sh = source.naturalHeight || source.videoHeight || source.height;
  if (!sw || !sh) return null;
  const sc = size / Math.max(sw, sh);
  const w = Math.max(16, Math.round(sw * sc)), h = Math.max(16, Math.round(sh * sc));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;

  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) gray[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) | 0;
  const g = blur3(blur3(gray, w, h), w, h);

  const clean = (m) => morph(morph(morph(morph(m, w, h, true, 2), w, h, false, 2), w, h, false, 2), w, h, true, 2);
  const masks = [];

  /* A — luminance, both polarities */
  const thr = otsu(g);
  const a1 = new Uint8Array(w * h), a2 = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { a1[i] = g[i] > thr ? 1 : 0; a2[i] = 1 - a1[i]; }
  masks.push(clean(a1), clean(a2));

  /* B — colour distance from the (median) border colour */
  {
    const S = { r: [], g: [], b: [] };
    const take = (x, y) => { const k = (y * w + x) * 4; S.r.push(px[k]); S.g.push(px[k + 1]); S.b.push(px[k + 2]); };
    for (let x = 0; x < w; x += 3) { take(x, 0); take(x, h - 1); }
    for (let y = 0; y < h; y += 3) { take(0, y); take(w - 1, y); }
    const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
    const mr = med(S.r), mg = med(S.g), mb = med(S.b);
    const dist = new Uint8Array(w * h);
    let mx = 0;
    for (let i = 0; i < w * h; i++) {
      const d = Math.min(255, ((Math.abs(px[i * 4] - mr) + Math.abs(px[i * 4 + 1] - mg) + Math.abs(px[i * 4 + 2] - mb)) / 3) * 1.6);
      dist[i] = d;
      if (d > mx) mx = d;
    }
    if (mx > 40) {
      const ds = blur3(dist, w, h);
      const dt = otsu(ds);
      if (dt >= 12) {
        const m = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) m[i] = ds[i] > dt ? 1 : 0;
        masks.push(clean(m));
      }
    }
  }

  /* C — edges, close the outline, fill from outside */
  {
    const mag = new Float32Array(w * h);
    let mx = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = -g[i - w - 1] + g[i - w + 1] - 2 * g[i - 1] + 2 * g[i + 1] - g[i + w - 1] + g[i + w + 1];
        const gy = -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] + g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
        const m = Math.abs(gx) + Math.abs(gy);
        mag[i] = m;
        if (m > mx) mx = m;
      }
    }
    if (mx > 80) {
      const hist = new Uint32Array(256);
      for (let i = 0; i < w * h; i++) hist[Math.min(255, ((mag[i] / mx) * 255) | 0)]++;
      let acc = 0, bin = 255;
      for (; bin > 0; bin--) { acc += hist[bin]; if (acc >= w * h * 0.12) break; }
      const et = Math.max(60, (bin / 255) * mx);
      const edge = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) edge[i] = mag[i] > et ? 1 : 0;
      const dil = morph(edge, w, h, true, 2);
      const outside = new Uint8Array(w * h), q = new Int32Array(w * h);
      let head = 0, tail = 0;
      const seed = (i) => { if (!dil[i] && !outside[i]) { outside[i] = 1; q[tail++] = i; } };
      for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
      while (head < tail) {
        const i = q[head++], x = i % w, y = (i / w) | 0;
        if (x > 0) seed(i - 1);
        if (x < w - 1) seed(i + 1);
        if (y > 0) seed(i - w);
        if (y < h - 1) seed(i + w);
      }
      const inside = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) inside[i] = outside[i] ? 0 : 1;
      masks.push(morph(inside, w, h, false, 2));
    }
  }

  let best = null;
  for (const m of masks) {
    const r = evalMask(m, w, h);
    if (r && (!best || r.score > best.score)) best = r;
  }
  return best && best.score > 0.45 ? best.quad : null;
}

/* ========================================================================== */
/*                    PERSPECTIVE WARP  (flat, true aspect ratio)             */
/* ========================================================================== */

function homography(dst, src) {
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

/*  Recover the real width/height of a rectangle seen in perspective
    (Zhang & He, "Whiteboard scanning", assumes the principal point is the
    image centre). Returns null if it can't be computed reliably.            */
function estimateAspect(p, W, H) {
  const u0 = W / 2, v0 = H / 2;
  const m1 = [p[0].x, p[0].y, 1], m2 = [p[1].x, p[1].y, 1], m3 = [p[3].x, p[3].y, 1], m4 = [p[2].x, p[2].y, 1];
  const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dt = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const k2 = dt(cr(m1, m4), m3) / dt(cr(m2, m4), m3);
  const k3 = dt(cr(m1, m4), m2) / dt(cr(m3, m4), m2);
  if (!isFinite(k2) || !isFinite(k3)) return null;
  const n2 = [k2 * m2[0] - m1[0], k2 * m2[1] - m1[1], k2 * m2[2] - m1[2]];
  const n3 = [k3 * m3[0] - m1[0], k3 * m3[1] - m1[1], k3 * m3[2] - m1[2]];
  const den = n2[2] * n3[2];
  if (Math.abs(den) < 1e-4) return null; // (almost) no perspective -> use plain edge lengths
  const f2 = -((n2[0] * n3[0] - (n2[0] * n3[2] + n2[2] * n3[0]) * u0 + den * u0 * u0) +
    (n2[1] * n3[1] - (n2[1] * n3[2] + n2[2] * n3[1]) * v0 + den * v0 * v0)) / den;
  const f = Math.sqrt(f2);
  const M = Math.max(W, H);
  if (!isFinite(f) || f < M * 0.35 || f > M * 5) return null;
  const top = (n2[0] - u0 * n2[2]) ** 2 + (n2[1] - v0 * n2[2]) ** 2 + f2 * n2[2] ** 2;
  const bot = (n3[0] - u0 * n3[2]) ** 2 + (n3[1] - v0 * n3[2]) ** 2 + f2 * n3[2] ** 2;
  const r = Math.sqrt(top / bot);
  return isFinite(r) && r > 0 ? r : null;
}

const PAPER = [210 / 297, 8.5 / 11]; // A4, Letter (portrait)
function snapAspect(a) {
  for (const r of PAPER) {
    if (Math.abs(a / r - 1) < 0.04) return r;
    if (Math.abs(a * r - 1) < 0.04) return 1 / r;
  }
  return a;
}

function isConvex(p) {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const a = p[i], b = p[(i + 1) % 4], c = p[(i + 2) % 4];
    const z = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(z) < 1) return false;
    const sg = Math.sign(z);
    if (!s) s = sg; else if (s !== sg) return false;
  }
  return true;
}

async function warp(img, corners, maxOut = 2400) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const p = corners.map((q) => ({ x: q.x * W, y: q.y * H }));
  if (!isConvex(p)) throw new Error("twisted");
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const top = d(p[0], p[1]), bot = d(p[3], p[2]), left = d(p[0], p[3]), right = d(p[1], p[2]);

  let aspect = (top + bot) / (left + right);
  const est = estimateAspect(p, W, H);
  if (est && est / aspect > 0.7 && est / aspect < 1.45) aspect = est;
  aspect = snapAspect(aspect);

  let ow = Math.sqrt(Math.max(top, bot) * Math.max(left, right) * aspect), oh = ow / aspect;
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
      const uu = u + 0.5, vv = v + 0.5;
      const den = h[6] * uu + h[7] * vv + 1;
      let x = (h[0] * uu + h[1] * vv + h[2]) / den - 0.5;
      let y = (h[3] * uu + h[4] * vv + h[5]) / den - 0.5;
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

/* ========================================================================== */
/*        BENT-PAGE FLATTENING  (text-line based, pure JS, no OpenCV)         */
/*                                                                            */
/*  1. find text lines (adaptive ink mask -> horizontal smear -> blobs)       */
/*  2. fit a smooth curve to every line                                       */
/*  3. fit ONE smooth displacement surface that makes all lines straight      */
/*     (+ a horizontal arc-length correction for squashed text near a spine) */
/*  4. remap the page through that surface (strength is adjustable)           */
/* ========================================================================== */

function makeLS(n) {
  const A = Array.from({ length: n }, () => new Float64Array(n + 1));
  return {
    add(phi, y) {
      for (let i = 0; i < n; i++) {
        const pi = phi[i];
        for (let j = 0; j < n; j++) A[i][j] += pi * phi[j];
        A[i][n] += pi * y;
      }
    },
    solve() {
      for (let i = 0; i < n; i++) A[i][i] += 1e-6;
      for (let c = 0; c < n; c++) {
        let p = c;
        for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
        [A[c], A[p]] = [A[p], A[c]];
        if (Math.abs(A[c][c]) < 1e-12) return null;
        for (let r = 0; r < n; r++) {
          if (r === c) continue;
          const f = A[r][c] / A[c][c];
          for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
        }
      }
      return A.map((row, i) => row[n] / row[i]);
    },
  };
}

const polyEval = (c, t) => { let r = 0; for (let i = c.length - 1; i >= 0; i--) r = r * t + c[i]; return r; };
const polyDer = (c, t) => { let r = 0; for (let i = c.length - 1; i >= 1; i--) r = r * t + i * c[i]; return r; };

/* robust polynomial fit y(x) with outlier rejection */
function fitLine(xs, ys, deg, xc, xr) {
  const run = (use) => {
    const ls = makeLS(deg + 1);
    for (let i = 0; i < xs.length; i++) {
      if (!use[i]) continue;
      const t = (xs[i] - xc) / xr, phi = [];
      let p = 1;
      for (let k = 0; k <= deg; k++) { phi.push(p); p *= t; }
      ls.add(phi, ys[i]);
    }
    return ls.solve();
  };
  let use = xs.map(() => true);
  let c = run(use);
  for (let it = 0; it < 2 && c; it++) {
    const res = xs.map((x, i) => ys[i] - polyEval(c, (x - xc) / xr));
    let s2 = 0, n = 0;
    res.forEach((r, i) => { if (use[i]) { s2 += r * r; n++; } });
    const lim = Math.max(1, Math.sqrt(s2 / Math.max(1, n))) * 2.2;
    const nu = res.map((r) => Math.abs(r) <= lim);
    if (nu.filter(Boolean).length < deg + 3) break;
    use = nu;
    c = run(use);
  }
  if (!c) return null;
  let s2 = 0, n = 0;
  for (let i = 0; i < xs.length; i++) {
    if (!use[i]) continue;
    const r = ys[i] - polyEval(c, (xs[i] - xc) / xr);
    s2 += r * r; n++;
  }
  return { c, rms: Math.sqrt(s2 / Math.max(1, n)) };
}

const basisD = (u, v) => {
  const out = [];
  let pu = 1;
  for (let m = 0; m < 5; m++) { out.push(pu, pu * v, pu * v * v); pu *= u; }
  return out; // index = m*3 + n
};
const basisG = (u) => [1, u, u * u, u ** 3, u ** 4];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

function evalD(m, u, v) {
  const b = basisD(clamp(u, m.uMin, m.uMax), clamp(v, m.vMin, m.vMax));
  let s = 0;
  for (let i = 0; i < 15; i++) s += m.cd[i] * b[i];
  return clamp(s, -0.12, 0.12);
}
function evalG(m, u) {
  const b = basisG(clamp(u, m.uMin, m.uMax));
  let s = 0;
  for (let i = 0; i < 5; i++) s += m.cg[i] * b[i];
  return clamp(s, 0, 0.5);
}

/*  Returns a correction model, or null when the page has no (usable) text
    lines or is already flat.                                                */
async function analyzeCurves(img) {
  const sw = img.naturalWidth, sh = img.naturalHeight;
  const sc = Math.min(1, 1000 / Math.max(sw, sh));
  const w = Math.round(sw * sc), h = Math.round(sh * sc);
  if (w < 240 || h < 240) return null;

  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  cx.drawImage(img, 0, 0, w, h);
  const px = cx.getImageData(0, 0, w, h).data;
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) gray[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) | 0;

  /* adaptive ink mask (integral image local mean) */
  const W1 = w + 1;
  const I = new Float64Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) { row += gray[y * w + x]; I[(y + 1) * W1 + x + 1] = I[y * W1 + x + 1] + row; }
  }
  const r = Math.max(10, Math.round(Math.min(w, h) / 45));
  const mx = Math.round(w * 0.03), my = Math.round(h * 0.03);
  const ink = new Uint8Array(w * h);
  let inkN = 0;
  for (let y = my; y < h - my; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = mx; x < w - mx; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      const m = (I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0]) / ((x1 - x0) * (y1 - y0));
      if (gray[y * w + x] < m - Math.max(14, m * 0.12)) { ink[y * w + x] = 1; inkN++; }
    }
  }
  if (inkN < w * h * 0.004 || inkN > w * h * 0.4) return null;
  await tick();

  /* smear along x so each text line becomes one blob */
  const rs = Math.max(6, Math.round(w * 0.011));
  const sm = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let last = -1e9;
    for (let x = 0; x < w; x++) { if (ink[y * w + x]) last = x; if (x - last <= rs) sm[y * w + x] = 1; }
    last = 1e9;
    for (let x = w - 1; x >= 0; x--) { if (ink[y * w + x]) last = x; if (last - x <= rs) sm[y * w + x] = 1; }
  }
  const mask = morph(sm, w, h, true, 1);

  /* connected components */
  const lab = new Int32Array(w * h), q = new Int32Array(w * h);
  const info = [null];
  let nl = 0;
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || lab[s]) continue;
    nl++;
    let head = 0, tail = 0, minX = w, maxX = 0;
    q[tail++] = s;
    lab[s] = nl;
    while (head < tail) {
      const i = q[head++], x = i % w, y = (i / w) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (x > 0 && mask[i - 1] && !lab[i - 1]) { lab[i - 1] = nl; q[tail++] = i - 1; }
      if (x < w - 1 && mask[i + 1] && !lab[i + 1]) { lab[i + 1] = nl; q[tail++] = i + 1; }
      if (y > 0 && mask[i - w] && !lab[i - w]) { lab[i - w] = nl; q[tail++] = i - w; }
      if (y < h - 1 && mask[i + w] && !lab[i + w]) { lab[i + w] = nl; q[tail++] = i + w; }
    }
    info[nl] = { L: nl, area: tail, minX, maxX, width: maxX - minX + 1 };
  }
  let cand = info.filter((o) => o && o.width >= w * 0.2 && o.area / o.width >= 3);
  if (cand.length < 4) return null;
  const thick = cand.map((o) => o.area / o.width).sort((a, b) => a - b);
  const medT = thick[thick.length >> 1];
  cand = cand.filter((o) => o.area / o.width <= medT * 2.2 && o.area / o.width >= medT * 0.45);
  if (cand.length < 4) return null;

  const idx = new Int32Array(nl + 1).fill(-1);
  cand.forEach((c, k) => { idx[c.L] = k; c.sum = new Float32Array(c.width); c.cnt = new Uint16Array(c.width); });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const L = lab[y * w + x];
      if (!L) continue;
      const k = idx[L];
      if (k < 0) continue;
      const c = cand[k];
      c.sum[x - c.minX] += y;
      c.cnt[x - c.minX]++;
    }
  }
  await tick();

  /* fit a curve to each line */
  const lines = [];
  for (const c of cand) {
    const xs = [], ys = [];
    for (let i = 0; i < c.width; i++) {
      if (c.cnt[i] >= Math.max(2, medT * 0.5)) { xs.push(c.minX + i); ys.push(c.sum[i] / c.cnt[i]); }
    }
    if (xs.length < c.width * 0.6) continue;
    const xc = (c.minX + c.maxX) / 2, xr = Math.max(1, (c.maxX - c.minX) / 2);
    const f = fitLine(xs, ys, c.width >= w * 0.45 ? 3 : 2, xc, xr);
    if (!f || f.rms > Math.max(2.5, medT * 0.4)) continue;
    const pts = [];
    let sumY = 0, bad = 0;
    for (let x = c.minX; x <= c.maxX; x += 4) {
      const t = (x - xc) / xr;
      const slope = polyDer(f.c, t) / xr;
      if (Math.abs(slope) > 0.15) bad++;
      const y = polyEval(f.c, t);
      pts.push({ x, y, slope });
      sumY += y;
    }
    if (pts.length < 5 || bad > pts.length * 0.3) continue;
    lines.push({ pts, mean: sumY / pts.length });
  }
  if (lines.length < 4) return null;

  /* one smooth displacement surface (+ horizontal stretch profile) */
  const lsD = makeLS(15), lsG = makeLS(5);
  let maxAbs = 0, uMin = 1, uMax = -1, vMin = 1, vMax = -1;
  for (const ln of lines) {
    for (const p of ln.pts) {
      const u = (p.x / (w - 1)) * 2 - 1, v = (p.y / (h - 1)) * 2 - 1;
      const d = (ln.mean - p.y) / h;
      lsD.add(basisD(u, v), d);
      lsG.add(basisG(u), Math.sqrt(1 + p.slope * p.slope) - 1);
      maxAbs = Math.max(maxAbs, Math.abs(d));
      uMin = Math.min(uMin, u); uMax = Math.max(uMax, u);
      vMin = Math.min(vMin, v); vMax = Math.max(vMax, v);
    }
  }
  if (maxAbs * h < 3) return null; // already straight -> don't resample the page
  const cd = lsD.solve(), cg = lsG.solve();
  if (!cd || !cg) return null;
  return { cd, cg, uMin, uMax, vMin, vMax, lines: lines.length };
}

/*  Remap `img` through the model. strength 0..100.                          */
async function applyMesh(img, mesh, strength) {
  const s = strength / 100;
  const W = img.naturalWidth, H = img.naturalHeight;
  const NX = 48, NY = 64;

  /* vertical: per mesh column an inverse table  output-row -> source-row */
  const yTab = new Float32Array((NX + 1) * H);
  for (let j = 0; j <= NX; j++) {
    const u = (j / NX) * 2 - 1;
    const ysrc = [], ypr = [];
    for (let i = 0; i <= NY; i++) {
      const v = (i / NY) * 2 - 1, y = (i / NY) * (H - 1);
      ysrc.push(y);
      ypr.push(y + s * evalD(mesh, u, v) * H);
    }
    for (let i = 1; i <= NY; i++) { // never fold the page over itself
      const minStep = 0.25 * (ysrc[i] - ysrc[i - 1]);
      if (ypr[i] < ypr[i - 1] + minStep) ypr[i] = ypr[i - 1] + minStep;
    }
    ysrc.unshift(ysrc[0] - H); ypr.unshift(ypr[0] - H);
    ysrc.push(ysrc[ysrc.length - 1] + H); ypr.push(ypr[ypr.length - 1] + H);
    let k = 0;
    for (let yo = 0; yo < H; yo++) {
      while (k < ypr.length - 2 && ypr[k + 1] < yo) k++;
      const t = (yo - ypr[k]) / (ypr[k + 1] - ypr[k]);
      yTab[j * H + yo] = ysrc[k] + t * (ysrc[k + 1] - ysrc[k]);
    }
  }

  /* horizontal: arc-length correction (expands squashed text near a spine) */
  const Xp = new Float64Array(W);
  for (let x = 1; x < W; x++) Xp[x] = Xp[x - 1] + 1 + s * evalG(mesh, ((x - 0.5) / (W - 1)) * 2 - 1);
  const scl = (W - 1) / Xp[W - 1];
  for (let x = 0; x < W; x++) Xp[x] *= scl;
  const xs = new Float32Array(W);
  {
    let k = 0;
    for (let xo = 0; xo < W; xo++) {
      while (k < W - 2 && Xp[k + 1] < xo) k++;
      xs[xo] = k + (xo - Xp[k]) / (Xp[k + 1] - Xp[k]);
    }
  }

  const sc = document.createElement("canvas");
  sc.width = W;
  sc.height = H;
  const sctx = sc.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(img, 0, 0);
  const sd = sctx.getImageData(0, 0, W, H).data;
  const out = new ImageData(W, H), od = out.data;

  for (let yo = 0; yo < H; yo++) {
    for (let xo = 0; xo < W; xo++) {
      let x = xs[xo];
      const jf = (x / (W - 1)) * NX, j = Math.min(NX - 1, jf | 0), fx = jf - j;
      let y = yTab[j * H + yo] * (1 - fx) + yTab[(j + 1) * H + yo] * fx;
      x = Math.min(W - 1.001, Math.max(0, x));
      y = Math.min(H - 1.001, Math.max(0, y));
      const x0 = x | 0, y0 = y | 0, ax = x - x0, ay = y - y0;
      const i = (y0 * W + x0) * 4, o = (yo * W + xo) * 4;
      for (let c = 0; c < 3; c++) {
        od[o + c] =
          (sd[i + c] * (1 - ax) + sd[i + 4 + c] * ax) * (1 - ay) +
          (sd[i + W * 4 + c] * (1 - ax) + sd[i + W * 4 + 4 + c] * ax) * ay;
      }
      od[o + 3] = 255;
    }
    if (yo % 200 === 0) await tick();
  }
  const oc = document.createElement("canvas");
  oc.width = W;
  oc.height = H;
  oc.getContext("2d").putImageData(out, 0, 0);
  return oc.toDataURL("image/jpeg", 0.95);
}

/*  perspective-correct, then flatten bent text lines                        */
async function buildPage(original, corners, flat) {
  const img = await loadImage(original);
  const warped = corners ? await warp(img, corners) : original;
  const wimg = corners ? await loadImage(warped) : img;
  let mesh = null;
  try { mesh = await analyzeCurves(wimg); } catch (e) { console.error(e); }
  const base = mesh && flat > 0 ? await applyMesh(wimg, mesh, flat) : warped;
  return { warped, mesh, base };
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

async function buildBase(page, maxDim, filter, layout) {
  const img = await loadImage(page.base);
  const rot = page.rotation || 0, odd = rot % 180 !== 0;
  const sw = odd ? img.naturalHeight : img.naturalWidth, sh = odd ? img.naturalWidth : img.naturalHeight;
  const ratio = ASPECTS[layout.aspect] || sw / sh;
  const W = ratio >= 1 ? maxDim : Math.round(maxDim * ratio), H = ratio >= 1 ? Math.round(maxDim / ratio) : maxDim;
  const m = Math.round((Math.min(W, H) * layout.margin) / 100);
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
  applyFilters(content, filter);

  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d");
  ctx.fillStyle = layout.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(content, dx, dy);
  if (layout.border > 0) {
    const lw = (layout.border * W) / 800;
    ctx.lineWidth = lw;
    ctx.strokeStyle = layout.borderColor;
    ctx.strokeRect(dx + lw / 2, dy + lw / 2, dw - lw, dh - lw);
  }
  return out;
}

const baseCache = new Map();
function getBase(page, maxDim, filter, layout) {
  const key = JSON.stringify([page.baseVer, page.rotation, filter, layout, maxDim]);
  const slot = `${page.id}|${maxDim}`, hit = baseCache.get(slot);
  if (hit && hit.key === key) return hit.p;
  const p = buildBase(page, maxDim, filter, layout);
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

/*  filter / layout = null  ->  page follows the "all pages" setting          */
const newPage = (src) => ({
  id: uid(), original: src, base: src, baseVer: 0, rotation: 0, corners: FULL, detected: false, warped: null, mesh: null,
  filter: null, layout: null, texts: [], strokes: [],
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

const LOUPE = 112;

function CropEditor({ page, onChange, onCommit }) {
  const wrap = useRef(null), drag = useRef(null);
  const [loupe, setLoupe] = useState(null);

  const move = (e) => {
    if (drag.current === null) return;
    const r = wrap.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    onChange(page.corners.map((c, i) => (i === drag.current ? { x, y } : c)));
    setLoupe({ x, y, W: r.width, H: r.height });
  };
  const end = () => {
    if (drag.current !== null) { drag.current = null; setLoupe(null); onCommit?.(); }
  };
  const quad = page.corners.map((c) => `${c.x * 100},${c.y * 100}`).join(" ");

  return (
    <div ref={wrap} className="relative mx-auto inline-block max-w-full touch-none select-none" onPointerMove={move}
      onPointerUp={end} onPointerCancel={end}>
      <img src={page.original} alt="" draggable={false} className="block max-h-[65vh] max-w-full rounded-lg" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={`M0 0H100V100H0Z ${page.corners.map((c, i) => `${i ? "L" : "M"}${c.x * 100} ${c.y * 100}`).join(" ")}Z`}
          fill="rgba(2,6,23,.55)" fillRule="evenodd" />
        <polygon points={quad} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {page.corners.map((c, i) => (
        <div key={i} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = i; }}
          style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
          className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center">
          <span className="h-5 w-5 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
        </div>
      ))}
      {loupe && (
        <div className={`pointer-events-none absolute top-2 ${loupe.x < 0.5 && loupe.y < 0.4 ? "right-2" : "left-2"} overflow-hidden rounded-full border-2 border-white shadow-2xl`}
          style={{
            width: LOUPE, height: LOUPE, backgroundImage: `url(${page.original})`, backgroundRepeat: "no-repeat",
            backgroundSize: `${loupe.W * 3}px ${loupe.H * 3}px`,
            backgroundPosition: `${-(loupe.x * loupe.W * 3 - LOUPE / 2)}px ${-(loupe.y * loupe.H * 3 - LOUPE / 2)}px`,
          }}>
          <span className="absolute left-1/2 top-0 h-full w-px bg-blue-500/80" />
          <span className="absolute left-0 top-1/2 h-px w-full bg-blue-500/80" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ camera modal ------------------------------ */

function CameraModal({ onClose, onCapture }) {
  const videoRef = useRef(null), overlayRef = useRef(null);
  const cornersRef = useRef(null), rawRef = useRef(null), stable = useRef(0), miss = useRef(0), cooldown = useRef(0);
  const autoRef = useRef(false), captureRef = useRef(() => {});
  const [err, setErr] = useState(""), [shots, setShots] = useState(0);
  const [auto, setAuto] = useState(false), [found, setFound] = useState(false), [flash, setFlash] = useState(false);
  autoRef.current = auto;

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
          const raw = detectCorners(v, 300);
          const prev = cornersRef.current;
          if (raw) {
            const move = rawRef.current ? Math.max(...raw.map((p, i) => Math.hypot(p.x - rawRef.current[i].x, p.y - rawRef.current[i].y))) : 1;
            rawRef.current = raw;
            miss.current = 0;
            stable.current = move < 0.015 ? stable.current + 1 : 0;
            cornersRef.current = prev && move < 0.1
              ? raw.map((p, i) => ({ x: prev[i].x + (p.x - prev[i].x) * 0.6, y: prev[i].y + (p.y - prev[i].y) * 0.6 }))
              : raw;
          } else if (++miss.current > 2) {
            cornersRef.current = null;
            rawRef.current = null;
            stable.current = 0;
          }
          const c = cornersRef.current;
          o.width = v.videoWidth;
          o.height = v.videoHeight;
          const ctx = o.getContext("2d");
          ctx.clearRect(0, 0, o.width, o.height);
          const steady = stable.current >= 2;
          if (c) {
            ctx.beginPath();
            c.forEach((p, i) => (i ? ctx.lineTo(p.x * o.width, p.y * o.height) : ctx.moveTo(p.x * o.width, p.y * o.height)));
            ctx.closePath();
            ctx.fillStyle = steady ? "rgba(34,197,94,.22)" : "rgba(59,130,246,.2)";
            ctx.fill();
            ctx.lineWidth = Math.max(3, o.width / 250);
            ctx.strokeStyle = steady ? "#22c55e" : "#3b82f6";
            ctx.stroke();
          }
          setFound(!!c);
          if (autoRef.current && c && stable.current >= 4 && Date.now() > cooldown.current) {
            stable.current = 0;
            cooldown.current = Date.now() + 2500;
            captureRef.current();
          }
        }
        timer = setTimeout(loop, 250);
      };
      loop();
    })();
    return () => { alive = false; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const capture = () => {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    onCapture({ src: c.toDataURL("image/jpeg", 0.92), hint: cornersRef.current });
    setShots((n) => n + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  };
  captureRef.current = capture;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 p-4">
      <div className="flex items-center justify-between text-white">
        <span className="text-sm text-slate-300">
          {found ? "Document found — hold steady" : "Place the document on a contrasting surface"}
        </span>
        <button onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><X size={18} /></button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {err ? <p className="max-w-sm text-center text-red-400">{err}</p> : (
          <div className="relative max-h-full max-w-full">
            <video ref={videoRef} playsInline muted className="block max-h-[72vh] max-w-full rounded-xl" />
            <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
            {flash && <div className="absolute inset-0 rounded-xl bg-white/70" />}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-4 pt-4">
        <Chip on={auto} onClick={() => setAuto((a) => !a)}>Auto-capture</Chip>
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

  /* look shared by every page; a page only differs if it has its own override */
  const [gFilter, setGFilter] = useState(DEFAULT_FILTER);
  const [gLayout, setGLayout] = useState(DEFAULT_LAYOUT);
  const [scope, setScope] = useState("all"); // "all" | "page"
  const [flat, setFlat] = useState(100); // 0..100 strength of bent-page flattening (all pages)
  const flatRef = useRef(100), pagesRef = useRef([]);

  const fileRef = useRef(null), canvasRef = useRef(null), baseRef = useRef(null), activeRef = useRef(null);
  const liveRef = useRef(null), dragRef = useRef(null), dragIdx = useRef(null), thumbKeys = useRef({});

  const active = pages.find((p) => p.id === activeId) || pages[0] || null;
  activeRef.current = active;
  pagesRef.current = pages;
  flatRef.current = flat;
  const activeIdx = active ? pages.findIndex((p) => p.id === active.id) : -1;

  const activeFilter = active ? active.filter || gFilter : null;
  const activeLayout = active ? active.layout || gLayout : null;

  const note = (msg, busy = false) => {
    setToast({ msg, busy });
    if (msg && !busy) setTimeout(() => setToast((t) => (t.msg === msg ? { msg: "", busy: false } : t)), 4000);
  };
  const patch = (id, fn) => setPages((ps) => ps.map((p) => (p.id === id ? { ...p, ...(typeof fn === "function" ? fn(p) : fn) } : p)));

  /* ---- edit scope (all pages vs this page) ---- */
  const editScope = pages.length > 1 ? scope : "all";
  const curF = editScope === "all" ? gFilter : activeFilter;
  const curL = editScope === "all" ? gLayout : activeLayout;
  const setFilter = (v) => (editScope === "all"
    ? setGFilter((f) => ({ ...f, ...v }))
    : patch(active.id, { filter: { ...activeFilter, ...v } }));
  const setLayout = (v) => (editScope === "all"
    ? setGLayout((l) => ({ ...l, ...v }))
    : patch(active.id, { layout: { ...activeLayout, ...v } }));

  const resetKind = (kind) => setPages((ps) => ps.map((p) => ({ ...p, [kind]: null })));
  const useForAll = (kind) => {
    if (kind === "filter") setGFilter(active.filter);
    else setGLayout(active.layout);
    resetKind(kind);
  };

  const scopeBar = (kind) => {
    if (pages.length < 2) return null;
    const custom = pages.filter((p) => p[kind]).length;
    const mine = !!active[kind];
    const what = kind === "filter" ? "its own filter" : "its own layout";
    return (
      <div className="space-y-2">
        <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          {[["all", `All pages (${pages.length})`], ["page", "This page only"]].map(([v, l]) => (
            <button key={v} onClick={() => setScope(v)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${scope === v ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
          ))}
        </div>
        {scope === "all" && custom > 0 && (
          <p className="text-xs text-amber-400">
            {custom} page{custom > 1 ? "s use" : " uses"} {what} and won’t change here.{" "}
            <button onClick={() => resetKind(kind)} className="font-semibold underline">Match all pages</button>
          </p>
        )}
        {scope === "page" && (
          mine ? (
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <button onClick={() => useForAll(kind)} className="text-blue-400 hover:text-blue-300">Use this for all pages</button>
              <button onClick={() => patch(active.id, { [kind]: null })} className="text-slate-400 hover:text-white">Reset this page</button>
            </div>
          ) : <p className="text-xs text-slate-500">Matches all pages — change anything to customise this page only.</p>
        )}
      </div>
    );
  };

  /* ----------------------------- import / add ----------------------------- */

  const addPages = async (items) => {
    if (!items.length) return;
    const created = items.map((it) => newPage(it.src));
    setPages((ps) => [...ps, ...created]);
    setActiveId(created[0].id);
    const scanned = items.some((it) => !it.noAuto);
    setPanel(scanned ? "crop" : "filters"); // show the detected outline so it can be verified
    let missed = 0;
    for (let i = 0; i < created.length; i++) {
      if (items[i].noAuto) continue;
      try {
        note("Finding the page edges…", true);
        await tick();
        const img = await loadImage(created[i].original);
        const corners = detectCorners(img, 480) || items[i].hint || null;
        if (corners) patch(created[i].id, { corners, detected: true });
        else missed++;
        note("Straightening the page…", true);
        await tick();
        const r = await buildPage(created[i].original, corners, flatRef.current);
        patch(created[i].id, (x) => ({ warped: r.warped, mesh: r.mesh, base: r.base, baseVer: x.baseVer + 1 }));
      } catch (e) {
        console.error(e);
        missed++;
      }
    }
    note(missed
      ? "Couldn’t find every page edge — drag the corners onto the page."
      : scanned ? "Edges detected — adjust if needed, then tap Done." : "");
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
      note("Couldn’t read one of the files.");
    }
  };

  const removePage = (id) => {
    [1400, 240].forEach((s) => baseCache.delete(`${id}|${s}`));
    delete thumbKeys.current[id];
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
      const r = await buildPage(pg.original, corners || pg.corners, flatRef.current);
      if (token !== cropToken.current) return;
      patch(pg.id, (x) => ({ warped: r.warped, mesh: r.mesh, base: r.base, baseVer: x.baseVer + 1 }));
      note("");
    } catch (e) {
      console.error(e);
      if (token === cropToken.current) note("Those corners overlap or are too close — spread them out.");
    }
  };

  const autoCrop = async () => {
    const c = detectCorners(await loadImage(active.original), 480);
    if (c) { patch(active.id, { corners: c, detected: true }); commitCrop(c); }
    else note("Couldn’t detect the edges — drag the corners instead.");
  };

  const resetCrop = () => { patch(active.id, { corners: FULL_IMG, detected: false }); commitCrop(FULL_IMG); };

  const nextOrDone = () => {
    if (activeIdx < pages.length - 1) setActiveId(pages[activeIdx + 1].id);
    else setPanel("filters");
  };

  /* ------------------------------- rendering ------------------------------ */

  const fKey = JSON.stringify(activeFilter), lKey = JSON.stringify(activeLayout);

  const paint = () => {
    const b = baseRef.current, cv = canvasRef.current, pg = activeRef.current;
    if (!b || !cv || !pg) return;
    if (cv.width !== b.width || cv.height !== b.height) { cv.width = b.width; cv.height = b.height; }
    const ctx = cv.getContext("2d");
    ctx.drawImage(b, 0, 0);
    drawAnnots(ctx, b.width, b.height, pg, panel === "text" ? selText : null, liveRef.current);
  };

  useEffect(() => {
    if (!active || panel === "crop") return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getBase(active, 1400, activeFilter, activeLayout).then((b) => {
        if (cancelled) return;
        baseRef.current = b;
        paint();
      });
    }, 60);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.baseVer, active?.rotation, fKey, lKey, panel === "crop"]);

  useEffect(() => {
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.texts, active?.strokes, selText, panel]);

  /* bent-page flattening strength -> re-render every page that has a model */
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const targets = pagesRef.current.filter((p) => p.mesh && p.warped);
      if (!targets.length) return;
      note("Straightening…", true);
      for (const p of targets) {
        if (cancelled) return;
        try {
          const base = flat > 0 ? await applyMesh(await loadImage(p.warped), p.mesh, flat) : p.warped;
          if (cancelled) return;
          patch(p.id, (x) => ({ base, baseVer: x.baseVer + 1 }));
        } catch (e) { console.error(e); }
        await tick();
      }
      note("");
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flat]);

  /* thumbnails for EVERY page (so a look applied to all pages shows everywhere) */
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      for (const p of pages) {
        if (cancelled) return;
        const f = p.filter || gFilter, l = p.layout || gLayout;
        const key = JSON.stringify([p.baseVer, p.rotation, f, l, p.texts, p.strokes]);
        if (thumbKeys.current[p.id] === key) continue;
        try {
          const b = await getBase(p, 240, f, l);
          if (cancelled) return;
          const c = document.createElement("canvas");
          c.width = b.width;
          c.height = b.height;
          const x = c.getContext("2d");
          x.drawImage(b, 0, 0);
          drawAnnots(x, c.width, c.height, p, null, null);
          thumbKeys.current[p.id] = key;
          setThumbs((t) => ({ ...t, [p.id]: c.toDataURL("image/jpeg", 0.75) }));
        } catch (e) { console.error(e); }
        await tick();
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [pages, gFilter, gLayout]);

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
        const pg = pages[i];
        const c = await buildBase(pg, 2200, pg.filter || gFilter, pg.layout || gLayout); // not cached -> memory friendly
        drawAnnots(c.getContext("2d"), c.width, c.height, pg, null, null);
        canvases.push(c);
        await tick();
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
          const c = canvases[i], a = (pages[i].layout || gLayout).aspect;
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
      <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
        {["Auto edge detection", "Perspective straightening", "One look for every page", "Searchable PDF"].map((t) => (
          <span key={t} className="rounded-full border border-slate-800 px-3 py-1">{t}</span>
        ))}
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
                        <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[10px] font-semibold">{i + 1}</span>
                        {(p.filter || p.layout) && <span title="Custom look" className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-amber-400" />}
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
                    <CropEditor page={active} onChange={(corners) => patch(active.id, { corners, detected: false })} onCommit={() => setTimeout(() => commitCrop(), 0)} />
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
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-slate-400">
                          {active.detected
                            ? <span className="font-medium text-emerald-400">✓ Edges detected automatically. </span>
                            : <span className="font-medium text-amber-400">Drag the dots onto the page corners. </span>}
                          {active.mesh && flat > 0 && <span className="font-medium text-sky-400">Bent text lines found and flattened. </span>}
                          Fine-tune any corner — the scan straightens itself.
                        </p>
                        <span className="shrink-0 text-xs tabular-nums text-slate-500">Page {activeIdx + 1} / {pages.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={autoCrop} className={btn}><ScanLine size={15} />Auto-detect</button>
                        <button onClick={resetCrop} className={btn}>Full image</button>
                        <button onClick={nextOrDone} className={btnPrimary + " ml-auto"}>
                          <Check size={16} />{activeIdx < pages.length - 1 ? "Next page" : "Done"}
                        </button>
                      </div>
                    </>
                  )}

                  {panel === "filters" && (
                    <>
                      <Row title="Straighten bent pages">
                        <Slider text={active.mesh ? "Curved text lines found — flatten" : "No bent text lines found on this page"}
                          min={0} max={100} value={flat} onChange={setFlat} />
                        <p className="text-xs text-slate-500">Flattens curled paper and book spines using the text lines. Applies to every page.</p>
                      </Row>
                      {scopeBar("filter")}
                      <Row title="Scan style">
                        <div className="flex flex-wrap gap-2">
                          {[["magic", "Magic Color"], ["bw", "Black & White"], ["gray", "Grayscale"], ["original", "Original"]].map(([v, l]) => (
                            <Chip key={v} on={curF.mode === v} onClick={() => setFilter({ mode: v, shadowAmt: v === "original" ? 0 : 100 })}>{l}</Chip>
                          ))}
                        </div>
                      </Row>
                      <Row title="Colour effect">
                        <div className="flex flex-wrap gap-2">
                          {[["none", "None"], ["vintage", "Vintage"], ["vibrant", "Vibrant"], ["warm", "Warm"], ["cool", "Cool"]].map(([v, l]) => (
                            <Chip key={v} on={curF.preset === v} onClick={() => setFilter({ preset: v })}>{l}</Chip>
                          ))}
                        </div>
                        {curF.preset !== "none" && (
                          <Slider text="Effect strength" min={0} max={100} value={curF.effect} onChange={(v) => setFilter({ effect: v })} />
                        )}
                      </Row>
                      <div className="space-y-4 border-t border-slate-800 pt-5">
                        <div className="flex items-center justify-between">
                          <p className={lbl}>Adjust</p>
                          <button onClick={() => setFilter({ brightness: 0, contrast: 0, saturation: 0, warmth: 0, effect: 100, bwLevel: 0, shadowAmt: curF.mode === "original" ? 0 : 100 })}
                            className="text-xs text-slate-400 hover:text-white">Reset adjustments</button>
                        </div>
                        <Slider text="Brightness" value={curF.brightness} onChange={(v) => setFilter({ brightness: v })} />
                        <Slider text="Contrast" value={curF.contrast} onChange={(v) => setFilter({ contrast: v })} />
                        <Slider text="Saturation" value={curF.saturation} onChange={(v) => setFilter({ saturation: v })} />
                        <Slider text="Warmth (cool ↔ warm)" value={curF.warmth} onChange={(v) => setFilter({ warmth: v })} />
                        <Slider text="Shadow removal" min={0} max={100} value={curF.shadowAmt} onChange={(v) => setFilter({ shadowAmt: v })} />
                        {curF.mode === "bw" && (
                          <Slider text="Black & White darkness" min={-60} max={60} value={curF.bwLevel} onChange={(v) => setFilter({ bwLevel: v })} />
                        )}
                      </div>
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
                      {scopeBar("layout")}
                      <Row title="Page size">
                        <div className="flex flex-wrap gap-2">
                          {[["auto", "Fit image"], ["a4", "A4"], ["letter", "Letter"], ["square", "Square"]].map(([v, l]) => <Chip key={v} on={curL.aspect === v} onClick={() => setLayout({ aspect: v })}>{l}</Chip>)}
                        </div>
                      </Row>
                      <Row title="Margin">
                        <div className="flex flex-wrap gap-2">
                          {[[0, "None"], [4, "Small"], [8, "Medium"], [14, "Large"]].map(([v, l]) => <Chip key={v} on={curL.margin === v} onClick={() => setLayout({ margin: v })}>{l}</Chip>)}
                        </div>
                      </Row>
                      <Row title="Border">
                        <div className="flex flex-wrap gap-2">
                          {[[0, "None"], [4, "Thin"], [10, "Thick"]].map(([v, l]) => <Chip key={v} on={curL.border === v} onClick={() => setLayout({ border: v })}>{l}</Chip>)}
                        </div>
                      </Row>
                      <Row title="Background">
                        <Swatches colors={BGS} value={curL.bg} onChange={(c) => setLayout({ bg: c, borderColor: c === "#0f172a" ? "#ffffff" : "#0f172a" })} />
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
