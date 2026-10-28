import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, rectSortingStrategy, arrayMove, useSortable,
} from "@dnd-kit/sortable";
import { PDFDocument, StandardFonts, degrees, rgb, BlendMode, LineCapStyle } from "pdf-lib";
import {
  Upload, Plus, RotateCw, RotateCcw, Trash2, Copy, FilePlus2, Undo2, Redo2, Download,
  MousePointer2, Type, Highlighter, Pencil, Square, Circle, Minus, Eraser, EyeOff, PenTool,
  ImagePlus, LayoutGrid, FileText, Loader2, ChevronLeft, ChevronRight, X, CheckSquare, Scissors,
  Pipette, TextCursorInput, Search, Keyboard, ZoomIn, ZoomOut, Stamp, MoveUpRight, ChevronsUp,
  ChevronsDown, ArrowDownUp, CalendarDays, RotateCcw as ResetIcon,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

/* ========================================================================== */
/*  npm i pdf-lib pdfjs-dist jszip @dnd-kit/core @dnd-kit/sortable           */
/*  npm i @pdf-lib/fontkit        (only needed for the web fonts on export)   */
/*  Runs in the browser — your PDF never leaves the device. (Web fonts are    */
/*  only DOWNLOADED from a font CDN when you pick one.)                       */
/*                                                                            */
/*  Data model: every page = { id, srcId, srcIndex, w, h, baseRot, rotation, */
/*  annots[] }. Annotation coordinates are normalised (0..1) against the     */
/*  UNROTATED page, so they rotate together with the page automatically.     */
/*                                                                            */
/*  Features                                                                  */
/*   - DOUBLE-CLICK any real text to edit it in place (original size/font    */
/*     are kept; "Original size" button restores them).                       */
/*   - 20+ web fonts + Helvetica/Times/Courier, bold/italic/underline/strike. */
/*   - Eraser (auto-matches page), eyedropper, find + highlight/redact all,   */
/*     stamps, arrows, opacity, duplicate, layers, nudge, zoom, shortcuts.    */
/* ========================================================================== */

const A4 = [595.28, 841.89];
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const INK = ["#dc2626", "#2563eb", "#16a34a", "#111827", "#f59e0b", "#ffffff"];
const HL = ["#fde047", "#86efac", "#f9a8d4", "#93c5fd"];
const COVER = ["#ffffff", "#f8fafc", "#fef9c3", "#e5e7eb", "#111827"];
const STAMPS = [["APPROVED", "#16a34a"], ["REJECTED", "#dc2626"], ["DRAFT", "#d97706"], ["PAID", "#16a34a"],
  ["CONFIDENTIAL", "#dc2626"], ["REVIEWED", "#2563eb"], ["URGENT", "#dc2626"], ["COPY", "#6b7280"]];
const HOTKEYS = { v: "select", e: "edittext", t: "text", h: "highlight", d: "draw", r: "rect", o: "ellipse", l: "line", a: "arrow", x: "whiteout", s: "stamp" };
const FONT_CSS = { helvetica: "Helvetica, Arial, sans-serif", times: "'Times New Roman', Times, serif", courier: "'Courier New', monospace" };
const PDF_FONT = {
  helvetica: StandardFonts.Helvetica, "helvetica-b": StandardFonts.HelveticaBold, "helvetica-i": StandardFonts.HelveticaOblique, "helvetica-bi": StandardFonts.HelveticaBoldOblique,
  times: StandardFonts.TimesRoman, "times-b": StandardFonts.TimesRomanBold, "times-i": StandardFonts.TimesRomanItalic, "times-bi": StandardFonts.TimesRomanBoldItalic,
  courier: StandardFonts.Courier, "courier-b": StandardFonts.CourierBold, "courier-i": StandardFonts.CourierOblique, "courier-bi": StandardFonts.CourierBoldOblique,
};

/* ----------------------------- web fonts ---------------------------------- */
/* family, group, has-bold(700), has-italic */
const W = (family, group, b, i) => ({
  family, group, b: !!b, i: !!i,
  fallback: group === "Serif" ? "serif" : group === "Mono" ? "monospace" : group === "Script" ? "cursive" : "sans-serif",
});
const WEB = {
  inter: W("Inter", "Sans", 1, 1), roboto: W("Roboto", "Sans", 1, 1), "open-sans": W("Open Sans", "Sans", 1, 1),
  lato: W("Lato", "Sans", 1, 1), montserrat: W("Montserrat", "Sans", 1, 1), poppins: W("Poppins", "Sans", 1, 1),
  nunito: W("Nunito", "Sans", 1, 1), raleway: W("Raleway", "Sans", 1, 1), oswald: W("Oswald", "Sans", 1, 0),
  "bebas-neue": W("Bebas Neue", "Sans", 0, 0),
  merriweather: W("Merriweather", "Serif", 1, 1), "playfair-display": W("Playfair Display", "Serif", 1, 1), lora: W("Lora", "Serif", 1, 1),
  "roboto-mono": W("Roboto Mono", "Mono", 1, 1), "source-code-pro": W("Source Code Pro", "Mono", 1, 1),
  "dancing-script": W("Dancing Script", "Script", 1, 0), pacifico: W("Pacifico", "Script", 0, 0), caveat: W("Caveat", "Script", 1, 0),
  "great-vibes": W("Great Vibes", "Script", 0, 0), satisfy: W("Satisfy", "Script", 0, 0),
};
const fontUrl = (id, w, st) => `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/latin-${w}-${st}.woff`;
const webLoaded = new Map();
function loadWebFont(id) {
  const f = WEB[id];
  if (!f) return Promise.resolve();
  if (webLoaded.has(id)) return webLoaded.get(id);
  const combos = [];
  for (const w of f.b ? [400, 700] : [400]) for (const st of f.i ? ["normal", "italic"] : ["normal"]) combos.push([w, st]);
  const p = Promise.all(combos.map(async ([w, st]) => {
    try {
      const face = new FontFace(f.family, `url(${fontUrl(id, w, st)})`, { weight: String(w), style: st });
      await face.load();
      document.fonts.add(face);
    } catch (e) { console.warn("font load failed", id, w, st, e); }
  }));
  webLoaded.set(id, p);
  return p;
}
const fontBytes = new Map();
async function fetchFontBytes(id, w, st) {
  const url = fontUrl(id, w, st);
  if (!fontBytes.has(url)) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`font ${r.status}`);
    fontBytes.set(url, await r.arrayBuffer());
  }
  return fontBytes.get(url);
}

const fkey = (a) => a.font + (a.bold || a.italic ? "-" + (a.bold ? "b" : "") + (a.italic ? "i" : "") : "");
const cssFamily = (f) => (WEB[f] ? `"${WEB[f].family}", ${WEB[f].fallback}` : FONT_CSS[f] || FONT_CSS.helvetica);
const cssFont = (a, s = 1) => `${a.italic ? "italic " : ""}${a.bold ? "bold " : ""}${a.size * s}px ${cssFamily(a.font)}`;
const BOX = ["highlight", "rect", "ellipse", "whiteout", "redact", "image"];
const SAMP = 2; // scale of the off-screen canvas used for colour sampling

const norm = (d) => ((d % 360) + 360) % 360;
const totRot = (p) => norm(p.baseRot + p.rotation);
const dispSize = (p) => (totRot(p) % 180 ? [p.h, p.w] : [p.w, p.h]);
const latin = (t) => t.replace(/[^\u0020-\u007E\u00A0-\u00FF\u2018\u2019\u201C\u201D\u2013\u2014\u2022\u2026\u20AC]/g, "?");
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
let AV = 0;
const tick = () => new Promise((r) => setTimeout(r, 0));
const mulM = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];

/* ------------------------------- pdf.js ----------------------------------- */

let pdfjsP;
const getPdfjs = () =>
  (pdfjsP ||= (async () => {
    const m = await import("pdfjs-dist");
    m.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    return m;
  })());

/* ----------------------------- image helpers ------------------------------ */

const imgStore = new Map();
const ensureImg = (src) =>
  imgStore.has(src)
    ? Promise.resolve(imgStore.get(src))
    : new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => { imgStore.set(src, i); res(i); };
        i.onerror = rej;
        i.src = src;
      });

async function fileToPng(file, max = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await ensureImg(url);
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  } finally { URL.revokeObjectURL(url); }
}

async function imageFileToPdfBytes(file) {
  const png = await fileToPng(file, 2400);
  const doc = await PDFDocument.create();
  const img = await doc.embedPng(png);
  const pg = doc.addPage([img.width * 0.75, img.height * 0.75]);
  pg.drawImage(img, { x: 0, y: 0, width: pg.getWidth(), height: pg.getHeight() });
  const u8 = await doc.save();
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

const dataUrlBytes = (u) => Uint8Array.from(atob(u.split(",")[1]), (c) => c.charCodeAt(0));

/* ---------------------------- stamps & marks ------------------------------ */

function makeStamp(label, color) {
  const c = document.createElement("canvas");
  c.width = 1500; c.height = 360;
  const x = c.getContext("2d");
  x.translate(750, 180);
  x.rotate(-0.1);
  x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 14; x.lineJoin = "round";
  x.font = "900 120px Helvetica, Arial, sans-serif";
  x.textAlign = "center"; x.textBaseline = "middle";
  const w = x.measureText(label).width + 100;
  x.beginPath();
  if (x.roundRect) x.roundRect(-w / 2, -100, w, 200, 28); else x.rect(-w / 2, -100, w, 200);
  x.stroke();
  x.globalAlpha = 0.92;
  x.fillText(label, 0, 6);
  return trimCanvas(c);
}

function makeMark(type, color) {
  const c = document.createElement("canvas");
  c.width = c.height = 300;
  const x = c.getContext("2d");
  x.strokeStyle = color; x.lineWidth = 36; x.lineCap = x.lineJoin = "round";
  x.beginPath();
  if (type === "check") { x.moveTo(50, 160); x.lineTo(120, 230); x.lineTo(255, 70); }
  else { x.moveTo(60, 60); x.lineTo(240, 240); x.moveTo(240, 60); x.lineTo(60, 240); }
  x.stroke();
  return trimCanvas(c);
}

/* ------------------------- annotation geometry ---------------------------- */

const mctx = document.createElement("canvas").getContext("2d");
/* split a text annotation into display lines; words wrap onto the next line once `maxW` (PDF points) is reached */
function wrapLines(a) {
  mctx.font = cssFont(a);
  const out = [];
  for (const para of a.text.split("\n")) {
    if (!a.maxW) { out.push(para); continue; }
    let cur = "";
    for (const w of para.split(" ")) {
      const t = cur ? cur + " " + w : w;
      if (cur && mctx.measureText(t).width > a.maxW) { out.push(cur); cur = w; } else cur = t;
    }
    out.push(cur);
  }
  return out;
}

function textSize(a) {
  const lines = wrapLines(a);
  mctx.font = cssFont(a);
  return { w: Math.max(...lines.map((l) => mctx.measureText(l || " ").width)), h: lines.length * a.size * 1.2 };
}

/* the rectangle that hides the original text; with "cover lines below" it grows to hide the whole new block */
function coverRect(a, pg) {
  const c = a.cover;
  if (!c) return null;
  if (!a.coverGrow) return c;
  const b = bboxOf(a, pg);
  const u0 = Math.min(c.u, b.u), v0 = Math.min(c.v, b.v);
  const u1 = Math.max(c.u + c.w, b.u + b.w), v1 = Math.max(c.v + c.h, b.v + b.h + 0.002);
  return { ...c, u: u0, v: v0, w: u1 - u0, h: v1 - v0 };
}

/* characters the standard PDF fonts can't draw (Urdu, Arabic, Hindi, Cyrillic, CJK…) are exported as a sharp image
   of the text, drawn by the browser, so they never turn into "?" */
const NON_LATIN = /[^\u0020-\u007E\u00A0-\u00FF\u2018\u2019\u201C\u201D\u2013\u2014\u2022\u2026\u20AC\n]/;
function textToPng(a, lines) {
  const S = 4, ts = textSize(a);
  const c = document.createElement("canvas");
  c.width = Math.ceil((ts.w + 8) * S);
  c.height = Math.ceil((ts.h + 4) * S);
  const x = c.getContext("2d");
  x.font = cssFont(a, S);
  x.fillStyle = a.color;
  x.strokeStyle = a.color;
  x.lineWidth = Math.max(1, a.size * 0.06 * S);
  x.textBaseline = "alphabetic";
  lines.forEach((l, i) => {
    const by = (a.size * 0.8 + i * a.size * 1.2 + 2) * S, tw = x.measureText(l).width;
    x.fillText(l, 2 * S, by);
    if (a.underline) { x.beginPath(); x.moveTo(2 * S, by + a.size * 0.12 * S); x.lineTo(2 * S + tw, by + a.size * 0.12 * S); x.stroke(); }
    if (a.strike) { x.beginPath(); x.moveTo(2 * S, by - a.size * 0.28 * S); x.lineTo(2 * S + tw, by - a.size * 0.28 * S); x.stroke(); }
  });
  return { url: c.toDataURL("image/png"), w: c.width / S, h: c.height / S };
}

function bboxOf(a, pg) {
  if (a.type === "text") { const t = textSize(a); return { u: a.u, v: a.v, w: t.w / pg.w, h: t.h / pg.h }; }
  if (a.type === "line") return { u: Math.min(a.u1, a.u2), v: Math.min(a.v1, a.v2), w: Math.abs(a.u2 - a.u1), h: Math.abs(a.v2 - a.v1) };
  if (a.type === "draw") {
    const us = a.pts.map((p) => p[0]), vs = a.pts.map((p) => p[1]);
    return { u: Math.min(...us), v: Math.min(...vs), w: Math.max(...us) - Math.min(...us), h: Math.max(...vs) - Math.min(...vs) };
  }
  return { u: a.u, v: a.v, w: a.w, h: a.h };
}

const segD = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l)) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

function hit(a, pg, u, v, tol) {
  const px = u * pg.w, py = v * pg.h;
  if (a.type === "line") return segD(px, py, a.u1 * pg.w, a.v1 * pg.h, a.u2 * pg.w, a.v2 * pg.h) < tol + a.width;
  if (a.type === "draw") {
    for (let i = 1; i < a.pts.length; i++)
      if (segD(px, py, a.pts[i - 1][0] * pg.w, a.pts[i - 1][1] * pg.h, a.pts[i][0] * pg.w, a.pts[i][1] * pg.h) < tol + a.width) return true;
    return a.pts.length === 1 && Math.hypot(px - a.pts[0][0] * pg.w, py - a.pts[0][1] * pg.h) < tol + a.width;
  }
  const b = bboxOf(a, pg);
  return px >= b.u * pg.w - tol && px <= (b.u + b.w) * pg.w + tol && py >= b.v * pg.h - tol && py <= (b.v + b.h) * pg.h + tol;
}

const inCover = (a, pg, u, v) =>
  !!a.cover && u >= a.cover.u && u <= a.cover.u + a.cover.w && v >= a.cover.v && v <= a.cover.v + a.cover.h;

function moveAnnot(a, du, dv) {
  if (a.type === "line") return { ...a, u1: a.u1 + du, u2: a.u2 + du, v1: a.v1 + dv, v2: a.v2 + dv };
  if (a.type === "draw") return { ...a, pts: a.pts.map(([x, y]) => [x + du, y + dv]) };
  return { ...a, u: a.u + du, v: a.v + dv }; // for edited text the cover stays put
}

/* ------------------------------ rendering --------------------------------- */

function applyRot(ctx, tot, Wp, Hp) {
  const m = { 0: [1, 0, 0, 1, 0, 0], 90: [0, 1, -1, 0, Hp, 0], 180: [-1, 0, 0, -1, Wp, Hp], 270: [0, -1, 1, 0, 0, Wp] }[tot];
  ctx.setTransform(...m);
}

function drawAnnots(ctx, pg, s, selId, live) {
  const Wp = pg.w * s, Hp = pg.h * s;
  ctx.save();
  applyRot(ctx, totRot(pg), Wp, Hp);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const a of live ? [...pg.annots, live] : pg.annots) {
    ctx.save();
    const x = (a.u ?? 0) * Wp, y = (a.v ?? 0) * Hp, w = (a.w ?? 0) * Wp, h = (a.h ?? 0) * Hp;
    ctx.strokeStyle = a.color;
    ctx.fillStyle = a.color;
    ctx.lineWidth = (a.width || 1) * s;
    ctx.globalAlpha = a.opacity ?? 1;
    if (a.type === "highlight") { ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 0.5 * (a.opacity ?? 1); ctx.fillRect(x, y, w, h); }
    else if (a.type === "whiteout") { ctx.fillStyle = a.color || "#fff"; ctx.fillRect(x, y, w, h); }
    else if (a.type === "redact") { ctx.fillStyle = "#000"; ctx.fillRect(x, y, w, h); }
    else if (a.type === "rect") ctx.strokeRect(x, y, w, h);
    else if (a.type === "ellipse") { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (a.type === "line") {
      const x1 = a.u1 * Wp, y1 = a.v1 * Hp, x2 = a.u2 * Wp, y2 = a.v2 * Hp;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      if (a.arrow) {
        const ang = Math.atan2(y2 - y1, x2 - x1), L = Math.max(9, a.width * 4) * s;
        for (const d of [-0.5, 0.5]) { ctx.moveTo(x2, y2); ctx.lineTo(x2 - L * Math.cos(ang + d), y2 - L * Math.sin(ang + d)); }
      }
      ctx.stroke();
    } else if (a.type === "draw") {
      ctx.beginPath();
      a.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * Wp, py * Hp) : ctx.moveTo(px * Wp, py * Hp)));
      if (a.pts.length === 1) ctx.lineTo(a.pts[0][0] * Wp + 0.1, a.pts[0][1] * Hp);
      ctx.stroke();
    } else if (a.type === "image") { const im = imgStore.get(a.src); if (im) ctx.drawImage(im, x, y, w, h); }
    else if (a.type === "text") {
      const cr = coverRect(a, pg);
      if (cr) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = cr.color;
        ctx.fillRect(cr.u * Wp, cr.v * Hp, cr.w * Wp, cr.h * Hp);
        ctx.fillStyle = a.color;
        ctx.globalAlpha = a.opacity ?? 1;
      }
      const lines = wrapLines(a);
      ctx.font = cssFont(a, s);
      ctx.textBaseline = "alphabetic";
      lines.forEach((l, i) => ctx.fillText(l, x, y + a.size * s * 0.8 + i * a.size * s * 1.2));
      if (a.underline || a.strike) {
        ctx.lineWidth = Math.max(1, a.size * 0.06 * s);
        lines.forEach((l, i) => {
          const tw = ctx.measureText(l).width, by = y + a.size * s * 0.8 + i * a.size * s * 1.2;
          if (a.underline) { ctx.beginPath(); ctx.moveTo(x, by + a.size * s * 0.12); ctx.lineTo(x + tw, by + a.size * s * 0.12); ctx.stroke(); }
          if (a.strike) { ctx.beginPath(); ctx.moveTo(x, by - a.size * s * 0.28); ctx.lineTo(x + tw, by - a.size * s * 0.28); ctx.stroke(); }
        });
      }
    }
    ctx.restore();
  }
  const sel = selId && pg.annots.find((a) => a.id === selId);
  if (sel) {
    const b = bboxOf(sel, pg), pad = 4 * (window.devicePixelRatio || 1);
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5 * (window.devicePixelRatio || 1);
    ctx.strokeRect(b.u * Wp - pad, b.v * Hp - pad, b.w * Wp + pad * 2, b.h * Hp + pad * 2);
    if (sel.type !== "line" && sel.type !== "draw") {
      const r = 7 * (window.devicePixelRatio || 1);
      ctx.setLineDash([]);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc((b.u + b.w) * Wp + pad, (b.v + b.h) * Hp + pad, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

async function renderBase(pg, srcs, scale) {
  const tot = totRot(pg), [dw, dh] = dispSize(pg);
  let page = null, vp = null;
  if (pg.srcId) { page = await srcs.get(pg.srcId).doc.getPage(pg.srcIndex + 1); vp = page.getViewport({ scale, rotation: tot }); }
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(vp ? vp.width : dw * scale));
  c.height = Math.max(1, Math.round(vp ? vp.height : dh * scale));
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  if (page) await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return c;
}

async function renderPage(pg, srcs, scale, annots = true) {
  const c = await renderBase(pg, srcs, scale);
  if (annots && pg.annots.length) drawAnnots(c.getContext("2d"), pg, c.width / dispSize(pg)[0], null, null);
  return c;
}

/* ------------------- colour sampling (eraser / edit text) ------------------ */

const sampCache = new Map();
/* un-rotated, annotation-free render of the page, so coordinates are plain PDF points * SAMP */
async function sampleCanvas(pg, srcs) {
  const key = pg.srcId ? `${pg.srcId}|${pg.srcIndex}` : null;
  if (key && sampCache.has(key)) return sampCache.get(key);
  const cv = await renderBase({ ...pg, baseRot: 0, rotation: 0 }, srcs, SAMP);
  if (key) {
    if (sampCache.size > 4) sampCache.delete(sampCache.keys().next().value);
    sampCache.set(key, cv);
  }
  return cv;
}

function pixelsOf(cv, rects) {
  const ctx = cv.getContext("2d"), out = [];
  for (const [x, y, w, h] of rects) {
    const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(cv.width, Math.ceil(x + w)), y1 = Math.min(cv.height, Math.ceil(y + h));
    if (x1 - x0 > 0 && y1 - y0 > 0) out.push(ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data);
  }
  return out;
}

function modeColor(chunks) {
  const bins = new Map();
  for (const d of chunks) {
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200) continue;
      const k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
      const e = bins.get(k);
      if (e) { e[0]++; e[1] += d[i]; e[2] += d[i + 1]; e[3] += d[i + 2]; }
      else bins.set(k, [1, d[i], d[i + 1], d[i + 2]]);
    }
  }
  let best = null;
  bins.forEach((e) => { if (!best || e[0] > best[0]) best = e; });
  return best ? [best[1] / best[0], best[2] / best[0], best[3] / best[0]] : null;
}

/* background = most common colour in the box, text colour = average of the pixels furthest from it */
function analyzeBox(cv, b) {
  const chunks = pixelsOf(cv, [[b.x * SAMP, b.y * SAMP, b.w * SAMP, b.h * SAMP]]);
  const bg = modeColor(chunks) || [255, 255, 255];
  const dist = (d, i) => Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]);
  let md = 0;
  for (const d of chunks) for (let i = 0; i < d.length; i += 4) md = Math.max(md, dist(d, i));
  let fg = [0, 0, 0];
  if (md >= 60) {
    let n = 0, r = 0, g = 0, bl = 0;
    for (const d of chunks) for (let i = 0; i < d.length; i += 4) if (dist(d, i) >= md * 0.7) { n++; r += d[i]; g += d[i + 1]; bl += d[i + 2]; }
    if (n) fg = [r / n, g / n, bl / n];
  }
  return { bg: toHex(...bg), fg: toHex(...fg) };
}

/* colour of the page just OUTSIDE a rectangle (what an eraser should paint with) */
function ringColor(cv, b) {
  const S = SAMP, m = 3 * S, x = b.x * S, y = b.y * S, w = b.w * S, h = b.h * S;
  const rects = [[x - m, y - m, w + 2 * m, m], [x - m, y + h, w + 2 * m, m], [x - m, y, m, h], [x + w, y, m, h]];
  const c = modeColor(pixelsOf(cv, rects)) || modeColor(pixelsOf(cv, [[x, y, w, h]]));
  return c ? toHex(...c) : null;
}

/* ------------------------ existing-text extraction ------------------------- */

const textCache = new Map();

async function loadTextLines(pg, srcs) {
  if (!pg.srcId) return [];
  const key = `${pg.srcId}|${pg.srcIndex}`;
  if (textCache.has(key)) return textCache.get(key);
  const page = await srcs.get(pg.srcId).doc.getPage(pg.srcIndex + 1);
  const vp = page.getViewport({ scale: 1, rotation: 0 });
  const tc = await page.getTextContent();
  const fontOf = (fn) => {
    let name = "", b = false, i = false;
    const gen = tc.styles?.[fn]?.fontFamily || "";
    try {
      if (page.commonObjs.has(fn)) { const f = page.commonObjs.get(fn); name = f.name || ""; b = !!(f.bold || f.black); i = !!f.italic; }
    } catch { /* not resolved: fall back to generic family */ }
    if (/bold|black|heavy|semibold|demi/i.test(name)) b = true;
    if (/italic|oblique/i.test(name)) i = true;
    const n = name.replace(/^[A-Z]{6}\+/, "");
    let font = "helvetica";
    if (/courier|mono|consolas|menlo|monaco/i.test(n) || /mono/i.test(gen)) font = "courier";
    else if ((/times|georgia|garamond|palatino|cambria|minion|serif/i.test(n) && !/sans/i.test(n)) || (/serif/i.test(gen) && !/sans/i.test(gen))) font = "times";
    return { b, i, font };
  };
  const items = [];
  for (const it of tc.items) {
    if (typeof it.str !== "string" || !it.str.trim()) continue;
    const t = mulM(vp.transform, it.transform);
    const fs = Math.hypot(t[2], t[3]);
    if (!(fs >= 3) || Math.abs(t[1]) > Math.abs(t[0]) * 0.3) continue; // skip tiny / rotated text
    items.push({ s: it.str, x: t[4], y: t[5], w: Math.abs(it.width), fs, ...fontOf(it.fontName) });
  }
  items.sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const it of items) {
    let L = null;
    for (let k = lines.length - 1; k >= 0 && k >= lines.length - 8; k--) {
      if (Math.abs(lines[k].y - it.y) <= Math.max(lines[k].fs, it.fs) * 0.3) { L = lines[k]; break; }
    }
    if (L) L.items.push(it); else lines.push({ y: it.y, fs: it.fs, items: [it] });
  }
  const segs = [];
  for (const l of lines) {
    l.items.sort((a, b) => a.x - b.x);
    let cur = null;
    for (const it of l.items) {
      const gap = cur ? it.x - (cur.x + cur.w) : 0;
      if (cur && gap < cur.fs * 0.8 && gap > -cur.fs * 0.5) {
        if (gap > cur.fs * 0.12 && !/\s$/.test(cur.s) && !/^\s/.test(it.s)) cur.s += " ";
        cur.s += it.s;
        cur.w = it.x + it.w - cur.x;
      } else {
        if (cur) segs.push(cur);
        cur = { s: it.s, x: it.x, y: it.y, w: it.w, fs: it.fs, b: it.b, i: it.i, font: it.font };
      }
    }
    if (cur) segs.push(cur);
  }
  textCache.set(key, segs);
  return segs;
}

const segBox = (g) => ({ x: g.x - 1, y: g.y - g.fs * 0.95, w: g.w + 2, h: g.fs * 1.25 });
const segAt = (list, pg, u, v) => {
  const px = u * pg.w, py = v * pg.h;
  return list.findIndex((s) => px >= s.x - 2 && px <= s.x + s.w + 2 && py >= s.y - s.fs * 0.95 && py <= s.y + s.fs * 0.3);
};

/* rectangle (PDF points) of a match inside a text segment, measured with the segment's own font */
function matchRect(g, i, len) {
  mctx.font = cssFont({ size: g.fs, font: g.font, bold: g.b, italic: g.i });
  const tot = mctx.measureText(g.s).width || 1;
  const a = mctx.measureText(g.s.slice(0, i)).width / tot, b = mctx.measureText(g.s.slice(0, i + len)).width / tot;
  return { x: g.x + g.w * a, y: g.y - g.fs * 0.95, w: Math.max(2, g.w * (b - a)), h: g.fs * 1.25 };
}

/* -------------------------------- export ---------------------------------- */

const dispToUnrot = (a, b, tot) =>
  tot === 0 ? [a, b] : tot === 90 ? [b, 1 - a] : tot === 180 ? [1 - a, 1 - b] : [1 - b, a];

function drawDisplayText(page, tot, text, a, b, size, font, color, angle = 0, opacity = 1) {
  const cb = page.getCropBox();
  const [u, v] = dispToUnrot(a, b, tot);
  const cx = cb.x + u * cb.width, cy = cb.y + cb.height - v * cb.height;
  const th = ((tot + angle) * Math.PI) / 180, tw = font.widthOfTextAtSize(text, size), cap = size * 0.7;
  page.drawText(text, {
    x: cx - (tw / 2) * Math.cos(th) + (cap / 2) * Math.sin(th),
    y: cy - (tw / 2) * Math.sin(th) - (cap / 2) * Math.cos(th),
    size, font, color, opacity, rotate: degrees(tot + angle),
  });
}

async function drawVector(out, page, pg, getFont, embedCache) {
  const cb = page.getCropBox(), W = cb.width, H = cb.height, ox = cb.x, oy = cb.y;
  const X = (u) => ox + u * W, Y = (v) => oy + H - v * H;
  for (const a of pg.annots) {
    const col = a.color ? hexRgb(a.color) : undefined;
    const op = a.opacity ?? 1;
    if (a.type === "highlight") page.drawRectangle({ x: X(a.u), y: Y(a.v + a.h), width: a.w * W, height: a.h * H, color: col, opacity: 0.5 * op, blendMode: BlendMode.Multiply });
    else if (a.type === "whiteout") page.drawRectangle({ x: X(a.u), y: Y(a.v + a.h), width: a.w * W, height: a.h * H, color: col || rgb(1, 1, 1) });
    else if (a.type === "rect") page.drawRectangle({ x: X(a.u), y: Y(a.v + a.h), width: a.w * W, height: a.h * H, borderColor: col, borderWidth: a.width, borderOpacity: op, opacity: 0 });
    else if (a.type === "ellipse") page.drawEllipse({ x: X(a.u + a.w / 2), y: Y(a.v + a.h / 2), xScale: (a.w * W) / 2, yScale: (a.h * H) / 2, borderColor: col, borderWidth: a.width, borderOpacity: op, opacity: 0 });
    else if (a.type === "line") {
      const x1 = X(a.u1), y1 = Y(a.v1), x2 = X(a.u2), y2 = Y(a.v2);
      const o = { thickness: a.width, color: col, lineCap: LineCapStyle.Round, opacity: op };
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, ...o });
      if (a.arrow) {
        const ang = Math.atan2(y2 - y1, x2 - x1), L = Math.max(9, a.width * 4);
        for (const d of [-0.5, 0.5]) page.drawLine({ start: { x: x2, y: y2 }, end: { x: x2 - L * Math.cos(ang + d), y: y2 - L * Math.sin(ang + d) }, ...o });
      }
    } else if (a.type === "draw") {
      for (let i = 1; i < a.pts.length; i++)
        page.drawLine({ start: { x: X(a.pts[i - 1][0]), y: Y(a.pts[i - 1][1]) }, end: { x: X(a.pts[i][0]), y: Y(a.pts[i][1]) }, thickness: a.width, color: col, lineCap: LineCapStyle.Round, opacity: op });
    } else if (a.type === "image") {
      let img = embedCache.get(a.src);
      if (!img) { img = await out.embedPng(dataUrlBytes(a.src)); embedCache.set(a.src, img); }
      page.drawImage(img, { x: X(a.u), y: Y(a.v + a.h), width: a.w * W, height: a.h * H, opacity: op });
    } else if (a.type === "text") {
      const cr = coverRect(a, pg);
      if (cr) page.drawRectangle({ x: X(cr.u), y: Y(cr.v + cr.h), width: cr.w * W, height: cr.h * H, color: hexRgb(cr.color) });
      const wl = wrapLines(a);
      if (NON_LATIN.test(a.text)) {
        const im = textToPng(a, wl);
        const img = await out.embedPng(dataUrlBytes(im.url));
        page.drawImage(img, { x: X(a.u) - 2, y: Y(a.v) - im.h + 2, width: im.w, height: im.h, opacity: op });
      } else {
        const font = await getFont(a);
        wl.map(latin).forEach((l, i) => {
          const bx = X(a.u), by = Y(a.v) - a.size * 0.8 - i * a.size * 1.2;
          page.drawText(l, { x: bx, y: by, size: a.size, font, color: col, opacity: op });
          if (a.underline || a.strike) {
            const tw = font.widthOfTextAtSize(l, a.size), th = Math.max(0.5, a.size * 0.06);
            if (a.underline) page.drawLine({ start: { x: bx, y: by - a.size * 0.12 }, end: { x: bx + tw, y: by - a.size * 0.12 }, thickness: th, color: col, opacity: op });
            if (a.strike) page.drawLine({ start: { x: bx, y: by + a.size * 0.28 }, end: { x: bx + tw, y: by + a.size * 0.28 }, thickness: th, color: col, opacity: op });
          }
        });
      }
    }
  }
}

async function buildPdf(list, srcs, o = {}, onProgress = () => {}) {
  const out = await PDFDocument.create();
  const docs = new Map(), fonts = {}, embedCache = new Map();
  let fkReg = false;
  const getFont = async (a) => {
    if (WEB[a.font]) {
      const f = WEB[a.font], w = a.bold && f.b ? 700 : 400, st = a.italic && f.i ? "italic" : "normal", key = `${a.font}|${w}|${st}`;
      if (!fonts[key]) {
        try {
          if (!fkReg) { out.registerFontkit((await import("@pdf-lib/fontkit")).default); fkReg = true; }
          fonts[key] = await out.embedFont(await fetchFontBytes(a.font, w, st), { subset: true });
        } catch (e) {
          console.warn("web font could not be embedded, using Helvetica", e);
          o.warnings?.push(f.family);
          fonts[key] = await out.embedFont(StandardFonts.Helvetica);
        }
      }
      return fonts[key];
    }
    const k = fkey(a);
    return (fonts[k] ||= await out.embedFont(PDF_FONT[k] || StandardFonts.Helvetica));
  };
  const getDoc = async (id) => {
    if (!docs.has(id)) docs.set(id, await PDFDocument.load(srcs.get(id).bytes, { ignoreEncryption: true }));
    return docs.get(id);
  };
  const raster = (pg) => o.compress || pg.annots.some((a) => a.type === "redact" || (o.flatten && (a.type === "whiteout" || a.cover)));

  // Copy every vector page of each source in one go (keeps shared resources → smaller files)
  const per = new Map();
  list.forEach((pg) => { if (pg.srcId && !raster(pg)) (per.get(pg.srcId) || per.set(pg.srcId, []).get(pg.srcId)).push(pg.srcIndex); });
  const copies = new Map();
  for (const [id, idxs] of per) copies.set(id, { cp: await out.copyPages(await getDoc(id), idxs), i: 0 });

  const finalRots = [];
  for (let n = 0; n < list.length; n++) {
    const pg = list[n];
    onProgress(`Building page ${n + 1} of ${list.length}…`);
    await tick();
    if (raster(pg)) {
      const sc = o.compress ? o.compress.scale : 2;
      const c = await renderPage(pg, srcs, sc, true);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", o.compress ? o.compress.q : 0.92));
      const [dw, dh] = dispSize(pg);
      const page = out.addPage([dw, dh]);
      page.drawImage(await out.embedJpg(await blob.arrayBuffer()), { x: 0, y: 0, width: dw, height: dh });
      finalRots.push(0);
      continue;
    }
    let page;
    if (!pg.srcId) page = out.addPage([pg.w, pg.h]);
    else { const c = copies.get(pg.srcId); page = c.cp[c.i++]; out.addPage(page); }
    page.setRotation(degrees(totRot(pg)));
    await drawVector(out, page, pg, getFont, embedCache);
    finalRots.push(totRot(pg));
  }

  const pages = out.getPages();
  if (o.wm?.text) {
    const f = await out.embedFont(StandardFonts.HelveticaBold);
    pages.forEach((p, i) => drawDisplayText(p, finalRots[i], latin(o.wm.text), 0.5, 0.5, Math.min(p.getWidth(), p.getHeight()) / 7, f, rgb(0.5, 0.5, 0.5), 45, o.wm.opacity));
  }
  if (o.num) {
    const f = await out.embedFont(StandardFonts.Helvetica);
    const pos = { bc: [0.5, 0.965], br: [0.9, 0.965], bl: [0.1, 0.965], tc: [0.5, 0.035] }[o.num];
    pages.forEach((p, i) => drawDisplayText(p, finalRots[i], `Page ${i + 1} of ${pages.length}`, pos[0], pos[1], 10, f, rgb(0.2, 0.2, 0.2)));
  }
  return out.save();
}

const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

function parseGroups(input, n) {
  return input.split(",").map((s) => s.trim()).filter(Boolean).map((part) => {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`Invalid format: "${part}". Use something like 1,3-6,9`);
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b > n || a > b) throw new Error(`"${part}" is outside 1–${n}`);
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  });
}

/* -------------------------------- UI bits --------------------------------- */

const card = "rounded-2xl border border-border bg-surface/60 backdrop-blur-xl";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/70 px-3.5 py-2 text-sm font-semibold text-text transition hover:border-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-semibold text-text shadow-[0_0_24px_rgba(244,63,94,.3)] transition hover:scale-[1.03] disabled:opacity-40";
const inputCls = "rounded-lg border border-border bg-page/60 px-3 py-2 text-sm outline-none focus:border-danger/50";
const Chip = ({ on, onClick, children }) => (
  <button onClick={onClick} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${on ? "border-danger bg-danger/15 text-text" : "border-border text-text hover:border-muted"}`}>{children}</button>
);
const Swatches = ({ colors, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {colors.map((c) => (
      <button key={c} onClick={() => onChange(c)} aria-label={c} style={{ background: c }}
        className={`h-7 w-7 rounded-full border-2 transition ${value === c ? "scale-110 border-danger" : "border-muted"}`} />
    ))}
  </div>
);

/* swatches + custom colour wheel + eyedropper (picks a colour from the page) */
function ColorPicker({ colors, value, onChange, onLive, onStart, picking, onEyedrop }) {
  const isHex = typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Swatches colors={colors} value={value} onChange={onChange} />
      {isHex && !colors.some((c) => c.toLowerCase() === value.toLowerCase()) && (
        <span title={value} style={{ background: value }} className="h-7 w-7 scale-110 rounded-full border-2 border-danger" />
      )}
      <label title="Custom colour" style={{ background: "conic-gradient(#ef4444,#eab308,#22c55e,#06b6d4,#3b82f6,#d946ef,#ef4444)" }}
        className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2 border-muted">
        <input type="color" value={isHex ? value : "#000000"} onFocus={onStart} onChange={(e) => onLive(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Custom colour" />
      </label>
      <button onClick={onEyedrop} title="Pick a colour from the page (I)" aria-label="Pick a colour from the page"
        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${picking ? "border-danger bg-danger text-text" : "border-muted text-text hover:border-text"}`}>
        <Pipette size={14} />
      </button>
      {picking && <span className="text-xs text-muted">Click anywhere on the page · Esc to cancel</span>}
    </div>
  );
}

function Tb({ icon: Icon, text, onClick, active, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} title={text}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${active ? "bg-danger text-text" : "text-text hover:bg-text/10 hover:text-text"}`}>
      <Icon size={17} /><span className="hidden sm:inline">{text}</span>
    </button>
  );
}

function SortableCard({ pg, thumb, index, selected, onToggle, onOpen, onRotate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pg.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition, zIndex: isDragging ? 20 : undefined, opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={() => onToggle(pg.id)} onDoubleClick={() => onOpen(pg.id)}
      className={`group relative cursor-grab select-none rounded-xl border-2 bg-page/60 p-2 transition active:cursor-grabbing ${selected ? "border-danger shadow-[0_0_24px_rgba(244,63,94,.25)]" : "border-border hover:border-muted"}`}>
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-text">
        {thumb ? <img src={thumb} alt={`Page ${index + 1}`} draggable={false} className="max-h-full max-w-full" /> : <Loader2 size={18} className="animate-spin text-muted" />}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span className="font-semibold text-text">{index + 1}{pg.annots.length > 0 && <span className="ml-1 rounded bg-danger/20 px-1 text-[10px] text-danger">{pg.annots.length}</span>}</span>
        <span className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={(e) => { e.stopPropagation(); onRotate(pg.id); }} aria-label="Rotate page" className="rounded p-1 hover:bg-text/10 hover:text-text"><RotateCw size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(pg.id); }} aria-label="Delete page" className="rounded p-1 hover:bg-text/10 hover:text-danger"><Trash2 size={14} /></button>
        </span>
      </div>
      {selected && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-text"><CheckSquare size={12} /></span>}
    </div>
  );
}

/* ----------------------------- signature modal ---------------------------- */

function trimCanvas(c) {
  const ctx = c.getContext("2d"), { width: w, height: h } = c, d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 <= x0) return null;
  const pad = 6, o = document.createElement("canvas");
  o.width = x1 - x0 + pad * 2;
  o.height = y1 - y0 + pad * 2;
  o.getContext("2d").drawImage(c, x0, y0, x1 - x0, y1 - y0, pad, pad, x1 - x0, y1 - y0);
  return o.toDataURL("image/png");
}

function SignatureModal({ onSave, onClose, last }) {
  const [tab, setTab] = useState("draw"), [typed, setTyped] = useState(""), [color, setColor] = useState("#111827");
  const cv = useRef(null), down = useRef(false);
  const pos = (e) => { const r = cv.current.getBoundingClientRect(); return [(e.clientX - r.left) * (cv.current.width / r.width), (e.clientY - r.top) * (cv.current.height / r.height)]; };
  const start = (e) => { down.current = true; cv.current.setPointerCapture(e.pointerId); const c = cv.current.getContext("2d"); c.strokeStyle = color; c.lineWidth = 4; c.lineCap = c.lineJoin = "round"; c.beginPath(); const [x, y] = pos(e); c.moveTo(x, y); c.lineTo(x + 0.1, y); c.stroke(); };
  const move = (e) => { if (!down.current) return; const c = cv.current.getContext("2d"); const [x, y] = pos(e); c.lineTo(x, y); c.stroke(); };
  const save = () => {
    let c = cv.current;
    if (tab === "type") {
      c = document.createElement("canvas"); c.width = 700; c.height = 200;
      const x = c.getContext("2d"); x.fillStyle = color; x.font = '90px "Brush Script MT","Segoe Script","Snell Roundhand",cursive'; x.textBaseline = "middle"; x.fillText(typed, 20, 100);
    }
    const src = trimCanvas(c);
    if (src) onSave(src);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-page/70 p-4">
      <div className={`${card} w-full max-w-lg space-y-4 bg-surface p-5`}>
        <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Add signature</h3><button onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <div className="flex gap-2"><Chip on={tab === "draw"} onClick={() => setTab("draw")}>Draw</Chip><Chip on={tab === "type"} onClick={() => setTab("type")}>Type</Chip>{last && <Chip on={false} onClick={() => onSave(last)}>Use last</Chip>}</div>
        {tab === "draw" ? (
          <canvas ref={cv} width={700} height={240} onPointerDown={start} onPointerMove={move} onPointerUp={() => (down.current = false)}
            className="w-full touch-none rounded-xl bg-text" />
        ) : (
          <div className="rounded-xl bg-text p-4"><input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your name"
            style={{ fontFamily: '"Brush Script MT","Segoe Script",cursive', color }} className="w-full bg-transparent text-5xl outline-none placeholder:text-text" /></div>
        )}
        <div className="flex items-center justify-between">
          <Swatches colors={["#111827", "#2563eb", "#dc2626"]} value={color} onChange={setColor} />
          <div className="flex gap-2">
            {tab === "draw" && <button className={btn} onClick={() => cv.current.getContext("2d").clearRect(0, 0, 700, 240)}>Clear</button>}
            <button className={btnPrimary} onClick={save}>Place on page</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ help overlay ------------------------------ */

function HelpModal({ onClose }) {
  const rows = [
    ["Double-click", "Edit any text in place"], ["V", "Select / move"], ["E", "Edit existing text (one click)"], ["T", "Add text"], ["H", "Highlight"], ["D", "Draw"],
    ["R / O", "Rectangle / Ellipse"], ["L / A", "Line / Arrow"], ["X", "Eraser"], ["S", "Stamps"], ["I", "Eyedropper"],
    ["Ctrl+Z / Y", "Undo / Redo"], ["Ctrl+D", "Duplicate item"], ["Ctrl+F", "Find in document"],
    ["Arrows", "Nudge item (Shift = 10×)"], ["← →", "Previous / next page"], ["+ / −", "Zoom"],
    ["Del", "Delete item"], ["Esc / Ctrl+Enter", "Finish text editing"], ["?", "This help"],
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-page/70 p-4" onClick={onClose}>
      <div className={`${card} w-full max-w-xl space-y-4 bg-surface p-5`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Keyboard shortcuts</h3><button onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map(([k, d]) => (
            <div key={k} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">{d}</span>
              <kbd className="rounded-md border border-border bg-page/60 px-2 py-0.5 text-xs font-semibold">{k}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- viewer --------------------------------- */

function Viewer({ pg, srcs, c }) {
  const wrap = useRef(null), baseRef = useRef(null), ovRef = useRef(null), live = useRef(null), drag = useRef(null);
  const tlRef = useRef([]), hoverRef = useRef(-1), inRef = useRef(null);
  const [baseW, setBaseW] = useState(700), [ready, setReady] = useState(0), [tl, setTl] = useState([]), [inline, setInline] = useState(null);
  const [dw, dh] = dispSize(pg), tot = totRot(pg), dpr = Math.min(2, window.devicePixelRatio || 1);
  const vw = Math.max(240, Math.round(baseW * (c.zoom || 1)));
  const vh = (vw * dh) / dw, k = vw / dw;
  tlRef.current = tl;
  const ia = inline ? pg.annots.find((a) => a.id === inline && a.type === "text") : null;

  useEffect(() => {
    const el = wrap.current, fit = () => setBaseW(Math.max(240, Math.min(el.clientWidth, 860)));
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let off = false;
    (async () => {
      const px = Math.min(vw * dpr, 4000);
      const cnv = await renderBase(pg, srcs, px / dw);
      if (off) return;
      for (const el of [baseRef.current, ovRef.current]) { el.width = cnv.width; el.height = cnv.height; }
      baseRef.current.getContext("2d").drawImage(cnv, 0, 0);
      setReady((r) => r + 1);
    })();
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pg.id, tot, pg.srcId, pg.srcIndex, vw]);

  /* close the in-place editor when the page changes */
  useEffect(() => { setInline(null); }, [pg.id]);
  useEffect(() => { if (inline && inRef.current) { inRef.current.focus(); inRef.current.select(); } }, [inline]);

  /* load the page's real text when the "Edit text" tool is active */
  useEffect(() => {
    if (c.tool !== "edittext") { hoverRef.current = -1; return; }
    let off = false;
    loadTextLines(pg, srcs).then((l) => {
      if (off) return;
      setTl(l);
      if (!l.length) c.note("No editable text on this page — it looks like a scan or image. Use the Eraser and Text tools instead.");
    }).catch(() => { if (!off) { setTl([]); c.note("Couldn't read the text on this page."); } });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.tool, pg.id, pg.srcId, pg.srcIndex]);

  const paint = () => {
    const o = ovRef.current;
    if (!o || !o.width) return;
    const ctx = o.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, o.width, o.height);
    drawAnnots(ctx, pg, o.width / dw, c.selAnn, live.current);
    const hs = (c.hits || []).filter((h) => h.pageId === pg.id);
    const showSegs = c.tool === "edittext" && !c.picking;
    if (hs.length || showSegs) {
      const s = o.width / dw, Wp = pg.w * s, Hp = pg.h * s;
      ctx.save();
      applyRot(ctx, tot, Wp, Hp);
      ctx.lineWidth = dpr;
      hs.forEach((h) => {
        const act = h === c.activeHit, r = h.rect;
        ctx.fillStyle = act ? "rgba(249,115,22,.5)" : "rgba(250,204,21,.45)";
        ctx.strokeStyle = act ? "#ea580c" : "rgba(202,138,4,.8)";
        ctx.fillRect(r.x * s, r.y * s, r.w * s, r.h * s);
        ctx.strokeRect(r.x * s, r.y * s, r.w * s, r.h * s);
      });
      if (showSegs) {
        tlRef.current.forEach((g, i) => {
          const b = segBox(g), cu = (g.x + g.w / 2) / pg.w, cvv = g.y / pg.h;
          if (pg.annots.some((a) => inCover(a, pg, cu, cvv))) return; // already edited
          const hv = i === hoverRef.current;
          ctx.fillStyle = hv ? "rgba(59,130,246,.28)" : "rgba(59,130,246,.07)";
          ctx.strokeStyle = hv ? "#3b82f6" : "rgba(59,130,246,.45)";
          ctx.fillRect(b.x * s, b.y * s, b.w * s, b.h * s);
          ctx.strokeRect(b.x * s, b.y * s, b.w * s, b.h * s);
        });
      }
      ctx.restore();
    }
  };
  useEffect(paint, [pg.annots, c.selAnn, ready, c.tool, c.picking, tl, c.hits, c.activeHit, c.fontTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const toU = (e) => {
    const r = ovRef.current.getBoundingClientRect(), a = (e.clientX - r.left) / r.width, b = (e.clientY - r.top) / r.height;
    const [u, v] = dispToUnrot(a, b, tot);
    return { u, v };
  };
  const ptsPerPx = dw / vw;
  const mk = (type, extra) => ({
    id: uid(), type, width: c.style.width,
    color: type === "highlight" ? c.style.hl : type === "whiteout" ? (c.style.cover || "#ffffff") : c.style.color,
    opacity: ["whiteout", "redact", "highlight"].includes(type) ? 1 : c.style.opacity,
    ...extra,
  });

  /* start typing directly on the page (unrotated pages); rotated pages use the bar editor */
  const beginInline = (id) => {
    if (tot === 0) { c.snapshot(); setInline(id); }
    else c.setFocusText(true);
  };

  /* replace a piece of real PDF text: cover the original with the sampled background and put editable text on top.
     The original font size, weight, style and colour are kept. */
  const startEdit = async (g) => {
    let bg = "#ffffff", fg = "#000000";
    const box = segBox(g);
    try { const cv = await sampleCanvas(pg, srcs); const r = analyzeBox(cv, box); bg = r.bg; fg = r.fg; } catch { /* keep defaults */ }
    /* wrap at the right edge of the page's text block, so longer text flows onto the next line */
    let maxW = g.w * 1.05 + 6;
    try { const segs = await loadTextLines(pg, srcs); const right = Math.max(...segs.map((s) => s.x + s.w)); maxW = Math.max(maxW, (right - g.x) * 1.05 + 4); } catch { /* keep */ }
    const a = {
      id: uid(), type: "text", u: g.x / pg.w, v: (g.y - g.fs * 0.8) / pg.h, text: g.s, size: g.fs,
      font: g.font, bold: g.b, italic: g.i, color: fg, width: 1, maxW,
      orig: { size: g.fs, font: g.font, bold: g.b, italic: g.i },
      cover: { u: box.x / pg.w, v: box.y / pg.h, w: box.w / pg.w, h: box.h / pg.h, color: bg },
    };
    c.addAnn(pg.id, a);
    c.setSelAnn(a.id);
    c.setTool("select");
    beginInline(a.id);
  };

  /* eraser: paint with the colour just outside the box (unless the user picked a colour) */
  const autoCover = async (L) => {
    try {
      const cv = await sampleCanvas(pg, srcs);
      const col = ringColor(cv, { x: L.u * pg.w, y: L.v * pg.h, w: L.w * pg.w, h: L.h * pg.h });
      if (col) c.updateAnnots(pg.id, (l) => l.map((a) => (a.id === L.id ? { ...a, color: col } : a)), false);
    } catch { /* keep white */ }
  };

  const pickAt = (e) => {
    const cvs = baseRef.current, r = cvs.getBoundingClientRect();
    const sx = Math.min(cvs.width - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * cvs.width)));
    const sy = Math.min(cvs.height - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * cvs.height)));
    const d = cvs.getContext("2d").getImageData(sx, sy, 1, 1).data;
    c.onPick(toHex(d[0], d[1], d[2]));
  };

  /* double-click any text (existing text annotation or real PDF text) to edit it */
  const dbl = async (e) => {
    if (c.picking || !["select", "edittext"].includes(c.tool)) return;
    const { u, v } = toU(e);
    const ex = [...pg.annots].reverse().find((a) => a.type === "text" && (hit(a, pg, u, v, 4 * ptsPerPx) || inCover(a, pg, u, v)));
    if (ex) { c.setSelAnn(ex.id); beginInline(ex.id); return; }
    try {
      const segs = await loadTextLines(pg, srcs);
      const i = segAt(segs, pg, u, v);
      if (i >= 0) startEdit(segs[i]);
      else if (!segs.length) c.note("No editable text on this page — it looks like a scan or image.");
    } catch { c.note("Couldn't read the text on this page."); }
  };

  const down = (e) => {
    if (c.picking) { pickAt(e); return; }
    const { u, v } = toU(e), tool = c.tool;
    ovRef.current.setPointerCapture(e.pointerId);
    if (tool === "select") {
      const sel = pg.annots.find((a) => a.id === c.selAnn);
      if (sel && sel.type !== "line" && sel.type !== "draw") {
        const b = bboxOf(sel, pg);
        if (Math.hypot((u - (b.u + b.w)) * pg.w, (v - (b.v + b.h)) * pg.h) < 16 * ptsPerPx) {
          c.snapshot();
          drag.current = { mode: "resize", id: sel.id, size0: sel.size, w0: Math.max(1, b.w * pg.w) };
          return;
        }
      }
      const found = [...pg.annots].reverse().find((a) => hit(a, pg, u, v, 6 * ptsPerPx));
      c.setSelAnn(found ? found.id : null);
      if (found) { c.snapshot(); drag.current = { mode: "move", id: found.id, last: { u, v } }; }
      return;
    }
    if (tool === "edittext") {
      const ex = [...pg.annots].reverse().find((a) => a.type === "text" && (hit(a, pg, u, v, 4 * ptsPerPx) || inCover(a, pg, u, v)));
      if (ex) { c.setSelAnn(ex.id); c.setTool("select"); beginInline(ex.id); return; }
      const i = segAt(tlRef.current, pg, u, v);
      if (i >= 0) startEdit(tlRef.current[i]);
      return;
    }
    if (tool === "stamp") { c.setSelAnn(null); return; }
    c.setSelAnn(null);
    if (tool === "text") {
      const a = mk("text", { u, v, text: "Text", size: c.style.size, font: c.style.font, bold: c.style.bold, italic: c.style.italic, underline: c.style.underline, strike: c.style.strike, maxW: Math.max(60, pg.w - 24 - u * pg.w) });
      c.addAnn(pg.id, a);
      c.setSelAnn(a.id);
      c.setTool("select");
      beginInline(a.id);
    } else if (tool === "draw") live.current = mk("draw", { pts: [[u, v]] });
    else if (tool === "line" || tool === "arrow") live.current = mk("line", { u1: u, v1: v, u2: u, v2: v, arrow: tool === "arrow" });
    else { live.current = mk(tool, { u, v, w: 0, h: 0 }); drag.current = { mode: "create", u0: u, v0: v }; }
    paint();
  };

  const move = (e) => {
    if (c.tool === "edittext" && !c.picking) {
      const { u, v } = toU(e), i = segAt(tlRef.current, pg, u, v);
      if (i !== hoverRef.current) { hoverRef.current = i; paint(); }
      return;
    }
    const { u, v } = toU(e), d = drag.current, L = live.current;
    if (d?.mode === "move") {
      const du = u - d.last.u, dv = v - d.last.v;
      d.last = { u, v };
      c.updateAnnots(pg.id, (l) => l.map((a) => (a.id === d.id ? moveAnnot(a, du, dv) : a)), false);
    } else if (d?.mode === "resize") {
      c.updateAnnots(pg.id, (l) => l.map((a) => {
        if (a.id !== d.id) return a;
        if (a.type === "text") return { ...a, size: Math.max(4, Math.min(300, d.size0 * (((u - a.u) * pg.w) / d.w0))) };
        const w = Math.max(0.01, u - a.u);
        if (a.type === "image") return { ...a, w, h: (w * pg.w) / a.ar / pg.h };
        return { ...a, w, h: Math.max(0.01, v - a.v) };
      }), false);
    } else if (L) {
      if (L.type === "draw") L.pts.push([u, v]);
      else if (L.type === "line") { L.u2 = u; L.v2 = v; }
      else { L.u = Math.min(d.u0, u); L.v = Math.min(d.v0, v); L.w = Math.abs(u - d.u0); L.h = Math.abs(v - d.v0); }
      paint();
    }
  };

  const up = () => {
    const L = live.current;
    live.current = null;
    drag.current = null;
    if (!L) return;
    const tiny = BOX.includes(L.type) ? L.w < 0.005 || L.h < 0.005 : L.type === "line" && Math.hypot((L.u2 - L.u1) * pg.w, (L.v2 - L.v1) * pg.h) < 3;
    if (tiny) return paint();
    c.addAnn(pg.id, L);
    if (L.type === "whiteout" && !c.style.cover) autoCover(L);
  };

  const cursor = c.picking ? "cursor-crosshair" : c.tool === "select" ? "cursor-default" : c.tool === "text" || c.tool === "edittext" ? "cursor-text" : c.tool === "stamp" ? "cursor-not-allowed" : "cursor-crosshair";

  /* in-place text editor geometry */
  let inStyle = null;
  if (ia && tot === 0) {
    const ts = textSize(ia);
    const w = ia.maxW ? ia.maxW * k + 6 : Math.max(ts.w * k + 18, ia.cover ? ia.cover.w * vw : 0, 40);
    inStyle = {
      position: "absolute", left: ia.u * vw, top: ia.v * vh - 0.145 * ia.size * k, width: w, height: ts.h * k + 4,
      fontFamily: cssFamily(ia.font), fontSize: ia.size * k, fontWeight: ia.bold ? 700 : 400, fontStyle: ia.italic ? "italic" : "normal",
      textDecoration: [ia.underline && "underline", ia.strike && "line-through"].filter(Boolean).join(" ") || "none",
      color: ia.color, background: ia.cover?.color || "#ffffff", lineHeight: `${ia.size * 1.2 * k}px`,
      padding: 0, margin: 0, border: "none", outline: "2px solid #3b82f6", outlineOffset: 2, resize: "none", overflow: "hidden", whiteSpace: ia.maxW ? "pre-wrap" : "pre", overflowWrap: "break-word", zIndex: 5,
    };
  }

  return (
    <div ref={wrap} className="flex w-full">
      <div className="relative mx-auto shrink-0 shadow-2xl" style={{ width: vw, aspectRatio: `${dw} / ${dh}` }}>
        <canvas ref={baseRef} className="absolute inset-0 h-full w-full rounded bg-text" />
        <canvas ref={ovRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onDoubleClick={dbl} className={`absolute inset-0 h-full w-full touch-none ${cursor}`} />
        {inStyle && (
          <textarea ref={inRef} value={ia.text} spellCheck={false} style={inStyle}
            onChange={(e) => c.updateAnnots(pg.id, (l) => l.map((a) => (a.id === ia.id ? { ...a, text: e.target.value } : a)), false)}
            onBlur={() => setInline(null)}
            onKeyDown={(e) => { if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); setInline(null); } }} />
        )}
      </div>
    </div>
  );
}

/* ================================== PAGE ================================== */

export default function PDFEditor() {
  const [pages, setPages] = useState([]);
  const [sel, setSel] = useState(new Set());
  const [mode, setMode] = useState("organize");
  const [editId, setEditId] = useState(null);
  const [tool, setTool] = useState("select");
  const [style, setStyle] = useState({ color: "#dc2626", hl: HL[0], cover: null, width: 3, size: 18, font: "helvetica", bold: false, italic: false, underline: false, strike: false, opacity: 1 });
  const [picking, setPicking] = useState(false);
  const [selAnn, setSelAnn] = useState(null);
  const [focusText, setFocusText] = useState(false);
  const [thumbs, setThumbs] = useState({});
  const [toast, setToast] = useState({ msg: "", busy: false });
  const [sigOpen, setSigOpen] = useState(false);
  const [lastSig, setLastSig] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [rangeIn, setRangeIn] = useState("");
  const [zoom, setZoom] = useState(1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [hits, setHits] = useState([]);
  const [hitIdx, setHitIdx] = useState(0);
  const [fontTick, setFontTick] = useState(0);
  const [opt, setOpt] = useState({
    name: "document", format: "pdf", scope: "all", compress: false, level: "med", flatten: false,
    wm: false, wmText: "CONFIDENTIAL", wmOp: 0.2, num: false, numPos: "bc",
    splitMode: "each", splitN: 2, splitRanges: "",
  });

  const srcs = useRef(new Map()), fileRef = useRef(null), imgRef = useRef(null), busy = useRef(false), textRef = useRef(null);
  const pagesRef = useRef(pages), hist = useRef({ past: [], future: [] }), lastQ = useRef(""), addFilesRef = useRef(null);
  pagesRef.current = pages;

  const note = (msg, b = false) => {
    setToast({ msg, busy: b });
    if (msg && !b) setTimeout(() => setToast((t) => (t.msg === msg ? { msg: "", busy: false } : t)), 4000);
  };

  /* ------------------------------ history -------------------------------- */

  const snapshot = () => { const h = hist.current; h.past.push(pagesRef.current); if (h.past.length > 60) h.past.shift(); h.future = []; };
  const mutate = (fn, record = true) => { if (record) snapshot(); setPages((ps) => fn(ps)); };
  const undo = () => { const h = hist.current; if (!h.past.length) return; h.future.push(pagesRef.current); setPages(h.past.pop()); };
  const redo = () => { const h = hist.current; if (!h.future.length) return; h.past.push(pagesRef.current); setPages(h.future.pop()); };
  const updateAnnots = (pid, fn, record = true) =>
    mutate((ps) => ps.map((p) => (p.id === pid ? { ...p, annots: fn(p.annots), av: ++AV } : p)), record);
  const addAnn = (pid, a) => updateAnnots(pid, (l) => [...l, a]);

  /* make sure a web font is loaded, then repaint everything that uses it */
  const ensureFont = (id) => {
    if (!WEB[id]) return;
    note(`Loading ${WEB[id].family}…`, true);
    loadWebFont(id).then(() => {
      setFontTick((t) => t + 1);
      mutate((ps) => ps.map((p) => (p.annots.some((a) => a.font === id) ? { ...p, av: ++AV } : p)), false);
      note("");
    });
  };

  /* ------------------------------- import -------------------------------- */

  const addFiles = async (files) => {
    note("Opening files…", true);
    try {
      const pdfjs = await getPdfjs(), created = [];
      for (const f of files) {
        let bytes;
        if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) bytes = await f.arrayBuffer();
        else if (/^image\/(jpeg|png|webp|gif)/.test(f.type)) bytes = await imageFileToPdfBytes(f);
        else continue;
        const id = uid();
        let doc;
        try { doc = await pdfjs.getDocument({ data: bytes.slice(0), fontExtraProperties: true }).promise; }
        catch (e) { note(e?.name === "PasswordException" ? `“${f.name}” is password-protected and can't be opened.` : `Couldn't read “${f.name}”.`); continue; }
        srcs.current.set(id, { id, name: f.name, bytes, doc });
        for (let i = 0; i < doc.numPages; i++) {
          const p = await doc.getPage(i + 1), vp = p.getViewport({ scale: 1, rotation: 0 });
          created.push({ id: uid(), srcId: id, srcIndex: i, w: vp.width, h: vp.height, baseRot: norm(p.rotate || 0), rotation: 0, annots: [], av: 0 });
        }
      }
      if (!created.length) return note("Please choose PDF, JPG or PNG files.");
      mutate((ps) => [...ps, ...created]);
      note("");
      setOpt((o) => (!o.name || o.name === "document" ? { ...o, name: (files[0].name || "document").replace(/\.[^.]+$/, "") } : o));
    } catch (e) { console.error(e); note("Something went wrong opening those files."); }
  };
  addFilesRef.current = addFiles;

  /* drop files anywhere on the page */
  useEffect(() => {
    const has = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
    const over = (e) => { if (has(e)) { e.preventDefault(); setDragOver(true); } };
    const leave = (e) => { if (!e.relatedTarget) setDragOver(false); };
    const drop = (e) => { if (!has(e)) return; e.preventDefault(); setDragOver(false); addFilesRef.current([...e.dataTransfer.files]); };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => { window.removeEventListener("dragover", over); window.removeEventListener("dragleave", leave); window.removeEventListener("drop", drop); };
  }, []);

  /* warn before losing unsaved work */
  useEffect(() => {
    const h = (e) => { if (hist.current.past.length) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  /* ------------------------------ organize ------------------------------- */

  const selIds = useMemo(() => pages.filter((p) => sel.has(p.id)).map((p) => p.id), [pages, sel]);
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const rotate = (ids, d) => mutate((ps) => ps.map((p) => (ids.includes(p.id) ? { ...p, rotation: norm(p.rotation + d), av: ++AV } : p)));
  const remove = (ids) => { mutate((ps) => ps.filter((p) => !ids.includes(p.id))); setSel(new Set()); };
  const duplicate = () => mutate((ps) => ps.flatMap((p) => (sel.has(p.id) ? [p, { ...p, id: uid() }] : [p])));
  const selectParity = (odd) => setSel(new Set(pages.filter((_, i) => (i % 2 === 0) === odd).map((p) => p.id)));
  const reversePages = () => mutate((ps) => [...ps].reverse());
  const insertBlank = () => mutate((ps) => {
    const at = ps.map((p) => sel.has(p.id)).lastIndexOf(true), ref = ps[at >= 0 ? at : ps.length - 1];
    const blank = { id: uid(), srcId: null, srcIndex: 0, w: ref ? dispSize(ref)[0] : A4[0], h: ref ? dispSize(ref)[1] : A4[1], baseRot: 0, rotation: 0, annots: [], av: 0 };
    const out = [...ps];
    out.splice(at >= 0 ? at + 1 : ps.length, 0, blank);
    return out;
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    mutate((ps) => arrayMove(ps, ps.findIndex((p) => p.id === active.id), ps.findIndex((p) => p.id === over.id)));
  };
  const selectByRange = (v) => {
    setRangeIn(v);
    try { const ids = new Set(parseGroups(v, pages.length).flat().map((n) => pages[n - 1].id)); setSel(ids); } catch { /* typing */ }
  };

  /* -------------------------------- thumbs ------------------------------- */

  const tKey = (p) => `${totRot(p)}|${p.av}`;
  useEffect(() => {
    if (busy.current) return;
    const next = pages.find((p) => thumbs[p.id]?.key !== tKey(p));
    if (!next) return;
    busy.current = true;
    (async () => {
      let url = "";
      try { url = (await renderPage(next, srcs.current, 200 / Math.max(...dispSize(next)))).toDataURL("image/jpeg", 0.75); }
      catch (e) { console.error(e); }
      setThumbs((t) => ({ ...t, [next.id]: { key: tKey(next), url } }));
      busy.current = false;
    })();
  }, [pages, thumbs]);

  /* ------------------------------- edit mode ----------------------------- */

  const editPage = pages.find((p) => p.id === editId) || pages[0] || null;
  const editIdx = editPage ? pages.indexOf(editPage) : -1;
  const openEdit = (id) => { setEditId(id); setMode("edit"); setSelAnn(null); setTool("select"); setPicking(false); };
  const goto = (i) => { if (pages[i]) { setEditId(pages[i].id); setSelAnn(null); } };

  const addImageAnn = async (src, w = 0.3) => {
    if (!src) return;
    const im = await ensureImg(src), ar = im.naturalWidth / im.naturalHeight;
    const a = { id: uid(), type: "image", src, ar, u: 0.35, v: 0.4, w, h: (w * editPage.w) / ar / editPage.h };
    addAnn(editPage.id, a);
    setSelAnn(a.id);
    setTool("select");
  };
  const addDate = () => {
    const a = { id: uid(), type: "text", u: 0.1, v: 0.1, text: new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }), size: 14, font: "helvetica", color: style.color, width: 1 };
    addAnn(editPage.id, a);
    setSelAnn(a.id);
    setTool("select");
  };
  const pickTool = (t) => {
    setPicking(false);
    if (t === "sig") return setSigOpen(true);
    if (t === "image") return imgRef.current.click();
    setTool(t);
    setSelAnn(null);
  };

  const selA = editPage?.annots.find((a) => a.id === selAnn);
  const kind = selA?.type || tool;
  const setProp = (k, v, rec = true) => {
    setStyle((s) => {
      if (k === "color") return kind === "highlight" ? { ...s, hl: v } : kind === "whiteout" ? { ...s, cover: v } : { ...s, color: v };
      return { ...s, [k]: v };
    });
    if (selA) updateAnnots(editPage.id, (l) => l.map((a) => (a.id === selA.id ? { ...a, [k]: v } : a)), rec);
    if (k === "font") ensureFont(v);
  };
  const onPick = (hex) => { setProp("color", hex); setPicking(false); };

  const duplicateAnn = () => {
    if (!selA) return;
    const copy = { ...moveAnnot(selA, 0.02, 0.02), id: uid(), cover: undefined, orig: undefined };
    updateAnnots(editPage.id, (l) => [...l, copy]);
    setSelAnn(copy.id);
  };
  const reorder = (front) => {
    if (!selA) return;
    updateAnnots(editPage.id, (l) => {
      const a = l.find((x) => x.id === selA.id), rest = l.filter((x) => x.id !== selA.id);
      return front ? [...rest, a] : [a, ...rest];
    });
  };
  const nudge = (dx, dy) => {
    if (!selA || !editPage) return;
    updateAnnots(editPage.id, (l) => l.map((a) => (a.id === selA.id ? moveAnnot(a, dx / editPage.w, dy / editPage.h) : a)));
  };
  const resetOriginal = () => {
    if (!selA?.orig) return;
    updateAnnots(editPage.id, (l) => l.map((a) => (a.id === selA.id ? { ...a, ...a.orig } : a)));
  };
  const zoomBy = (d) => setZoom((z) => Math.min(2.5, Math.max(0.5, Math.round((z + d) * 100) / 100)));

  useEffect(() => { if (focusText && textRef.current) { textRef.current.focus(); textRef.current.select(); setFocusText(false); } }, [focusText, selAnn]);

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey, tag = e.target.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "Escape") { setPicking(false); setHelpOpen(false); if (!typing) setSelAnn(null); return; }
      if (mod && e.key.toLowerCase() === "f" && pages.length) { e.preventDefault(); setFindOpen(true); return; }
      if (typing) return;
      const k = e.key.toLowerCase();
      if (mod && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && k === "y") { e.preventDefault(); redo(); return; }
      if (mod && k === "d" && mode === "edit" && selA) { e.preventDefault(); duplicateAnn(); return; }
      if (mod) return;
      if (e.key === "?") { setHelpOpen((h) => !h); return; }
      if (mode !== "edit" || !editPage) return;
      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (selA && (e.key === "Delete" || e.key === "Backspace")) { updateAnnots(editPage.id, (l) => l.filter((a) => a.id !== selA.id)); setSelAnn(null); }
      else if (arrows[e.key]) {
        e.preventDefault();
        if (selA) { const m = e.shiftKey ? 10 : 1; nudge(arrows[e.key][0] * m, arrows[e.key][1] * m); }
        else if (e.key === "ArrowLeft") goto(editIdx - 1);
        else if (e.key === "ArrowRight") goto(editIdx + 1);
      }
      else if (e.key === "+" || e.key === "=") zoomBy(0.25);
      else if (e.key === "-") zoomBy(-0.25);
      else if (k === "i") { if (COLOR_KINDS.includes(kind)) setPicking((p) => !p); }
      else if (HOTKEYS[k]) pickTool(HOTKEYS[k]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* --------------------------------- find -------------------------------- */

  const runFind = async (q, cs) => {
    const needle = cs ? q : q.toLowerCase();
    if (!needle.trim()) { setHits([]); return; }
    note("Searching…", true);
    try {
      const out = [];
      for (const p of pagesRef.current) {
        if (!p.srcId) continue;
        const segs = await loadTextLines(p, srcs.current);
        for (const g of segs) {
          const hay = cs ? g.s : g.s.toLowerCase();
          let i = hay.indexOf(needle);
          while (i >= 0) { out.push({ pageId: p.id, rect: matchRect(g, i, needle.length) }); i = hay.indexOf(needle, i + needle.length); }
        }
      }
      lastQ.current = q + "|" + cs;
      setHits(out);
      setHitIdx(0);
      if (out.length) { setEditId(out[0].pageId); setMode("edit"); setSelAnn(null); note(`${out.length} match${out.length > 1 ? "es" : ""} found.`); }
      else note("No matches found (scanned pages can't be searched).");
    } catch (e) { console.error(e); note("Search failed."); }
  };
  const goHit = (i) => {
    if (!hits.length) return;
    const n = ((i % hits.length) + hits.length) % hits.length;
    setHitIdx(n);
    setEditId(hits[n].pageId);
    setMode("edit");
    setSelAnn(null);
  };
  const markHits = (type) => {
    if (!hits.length) return;
    const pad = type === "redact" ? 1 : 0;
    mutate((ps) => ps.map((p) => {
      const hs = hits.filter((h) => h.pageId === p.id);
      if (!hs.length) return p;
      const add = hs.map((h) => ({
        id: uid(), type, color: type === "redact" ? "#000000" : style.hl, width: 1,
        u: (h.rect.x - pad) / p.w, v: (h.rect.y - pad) / p.h, w: (h.rect.w + pad * 2) / p.w, h: (h.rect.h + pad * 2) / p.h,
      }));
      return { ...p, annots: [...p.annots, ...add], av: ++AV };
    }));
    note(type === "redact" ? `Redacted ${hits.length} match${hits.length > 1 ? "es" : ""}. Pages are flattened on save.` : `Highlighted ${hits.length} match${hits.length > 1 ? "es" : ""}.`);
    setHits([]);
  };

  /* -------------------------------- export ------------------------------- */

  const exportDoc = async () => {
    try {
      const list = opt.scope === "selected" && selIds.length ? pages.filter((p) => sel.has(p.id)) : pages;
      const name = opt.name.trim() || "document";
      const warnings = [];
      if (opt.format === "images") {
        const JSZip = (await import("jszip")).default, zip = new JSZip();
        for (let i = 0; i < list.length; i++) {
          note(`Rendering page ${i + 1} of ${list.length}…`, true);
          const c = await renderPage(list[i], srcs.current, 2, true);
          zip.file(`${name}-${i + 1}.png`, await new Promise((r) => c.toBlob(r, "image/png")));
        }
        download(await zip.generateAsync({ type: "blob" }), `${name}-images.zip`);
      } else if (opt.format === "split") {
        const JSZip = (await import("jszip")).default, zip = new JSZip();
        let groups;
        if (opt.splitMode === "each") groups = list.map((_, i) => [i + 1]);
        else if (opt.splitMode === "every") { const n = Math.max(1, +opt.splitN || 1); groups = []; for (let i = 0; i < list.length; i += n) groups.push(Array.from({ length: Math.min(n, list.length - i) }, (_, k) => i + k + 1)); }
        else groups = parseGroups(opt.splitRanges, list.length);
        if (!groups.length) return note("Enter at least one page range.");
        for (let g = 0; g < groups.length; g++) {
          const bytes = await buildPdf(groups[g].map((n) => list[n - 1]), srcs.current, { flatten: opt.flatten, warnings }, (m) => note(`Part ${g + 1}/${groups.length}: ${m}`, true));
          zip.file(`${name}-part-${g + 1}.pdf`, bytes);
        }
        download(await zip.generateAsync({ type: "blob" }), `${name}-split.zip`);
      } else {
        const lv = { low: { scale: 1, q: 0.55 }, med: { scale: 1.4, q: 0.75 }, high: { scale: 2, q: 0.9 } }[opt.level];
        const bytes = await buildPdf(list, srcs.current, {
          compress: opt.compress ? lv : null,
          flatten: opt.flatten,
          warnings,
          wm: opt.wm && opt.wmText.trim() ? { text: opt.wmText.trim(), opacity: opt.wmOp } : null,
          num: opt.num ? opt.numPos : null,
        }, (m) => note(m, true));
        download(new Blob([bytes], { type: "application/pdf" }), `${name}.pdf`);
      }
      note(warnings.length ? `Saved — couldn't embed ${[...new Set(warnings)].join(", ")} (offline?), Helvetica was used instead.` : "Saved ✓");
      setSaveOpen(false);
    } catch (e) {
      console.error(e);
      note(e.message?.startsWith("Invalid") || e.message?.includes("outside") ? e.message : "Couldn't save. Check the file isn't encrypted and try again.");
    }
  };

  /* --------------------------------- JSX --------------------------------- */

  const ctrl = { tool, setTool, style, selAnn, setSelAnn, snapshot, addAnn, updateAnnots, setFocusText, picking, onPick, note, zoom, hits, activeHit: hits[hitIdx], fontTick };
  const TOOLS = [["select", MousePointer2, "Select"], ["edittext", TextCursorInput, "Edit text"], ["text", Type, "Text"], ["highlight", Highlighter, "Highlight"], ["draw", Pencil, "Draw"],
    ["rect", Square, "Rectangle"], ["ellipse", Circle, "Ellipse"], ["line", Minus, "Line"], ["arrow", MoveUpRight, "Arrow"], ["whiteout", Eraser, "Eraser"],
    ["redact", EyeOff, "Redact"], ["stamp", Stamp, "Stamp"], ["sig", PenTool, "Sign"], ["image", ImagePlus, "Image"]];
  const COLOR_KINDS = ["text", "highlight", "draw", "rect", "ellipse", "line", "arrow", "whiteout"];
  const OPACITY_KINDS = ["draw", "rect", "ellipse", "line", "arrow", "text", "image"];
  const pickVal = selA?.color || (kind === "highlight" ? style.hl : kind === "whiteout" ? style.cover : style.color);
  const curFont = selA?.font ?? style.font;
  const curSize = Math.round((selA?.size ?? style.size) * 10) / 10;

  const Empty = (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-border bg-surface/60 px-6 py-20 text-center transition hover:border-danger">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger"><FileText size={30} /></div>
      <h2 className="mt-6 text-2xl font-bold">Open a PDF to start editing</h2>
      <p className="mt-2 max-w-md text-muted">Drop one or more PDFs (or JPG/PNG images) anywhere on this page — they’ll be combined so you can reorder, edit, sign and save.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={() => fileRef.current.click()} className={btnPrimary}><Upload size={18} />Choose files</button>
        <button onClick={() => mutate(() => [{ id: uid(), srcId: null, srcIndex: 0, w: A4[0], h: A4[1], baseRot: 0, rotation: 0, annots: [], av: 0 }])} className={btn}><FilePlus2 size={18} />Blank page</button>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-muted">
        {["Double-click to edit text", "20+ fonts", "Find & redact", "Stamps & signatures", "Eraser + eyedropper", "Merge · split · reorder", "100% private"].map((t) => <span key={t} className="rounded-full border border-border px-3 py-1">{t}</span>)}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-danger/15 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-brand/15 blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-brand/10 blur-[150px]" />
      </div>

      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-page via-surface to-page text-text">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="text-center">
            <span className="rounded-full border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-medium text-danger">PDF Editor</span>
            <h1 className="mt-5 text-4xl font-black sm:text-5xl">Edit, Organize &amp; Sign PDFs.</h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted">Merge, split, rotate, edit text, search, stamp, sign, redact and more — all in your browser, nothing uploaded.</p>
          </div>

          <input ref={fileRef} hidden multiple type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => { addFiles([...e.target.files]); e.target.value = ""; }} />
          <input ref={imgRef} hidden type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) addImageAnn(await fileToPng(f, 1200)); }} />

          <div className="mt-8">
            {!pages.length ? Empty : (
              <div className="space-y-4">
                {/* Top bar */}
                <div className={`${card} flex flex-wrap items-center gap-2 p-2`}>
                  <div className="flex rounded-xl bg-page/60 p-1">
                    <Tb icon={LayoutGrid} text="Organize" active={mode === "organize"} onClick={() => setMode("organize")} />
                    <Tb icon={Pencil} text="Edit" active={mode === "edit"} onClick={() => { setMode("edit"); if (!editId) setEditId(pages[0].id); }} />
                  </div>
                  <Tb icon={Undo2} text="Undo" onClick={undo} disabled={!hist.current.past.length} />
                  <Tb icon={Redo2} text="Redo" onClick={redo} disabled={!hist.current.future.length} />
                  <Tb icon={Search} text="Find" active={findOpen} onClick={() => setFindOpen((o) => !o)} />
                  <Tb icon={Keyboard} text="Shortcuts" onClick={() => setHelpOpen(true)} />
                  <span className="ml-auto text-xs text-muted">{pages.length} page{pages.length > 1 ? "s" : ""}</span>
                  <button onClick={() => setSaveOpen((o) => !o)} className={btnPrimary}><Download size={16} />Save</button>
                </div>

                {/* Find panel */}
                {findOpen && (
                  <div className={`${card} flex flex-wrap items-center gap-2 p-3`}>
                    <Search size={16} className="text-muted" />
                    <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find text in all pages…"
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        if (hits.length && lastQ.current === query + "|" + matchCase) goHit(e.shiftKey ? hitIdx - 1 : hitIdx + 1);
                        else runFind(query, matchCase);
                      }}
                      className={`${inputCls} min-w-[180px] flex-1`} />
                    <Chip on={matchCase} onClick={() => setMatchCase((m) => !m)}>Aa</Chip>
                    <button className={btn} onClick={() => runFind(query, matchCase)} disabled={!query.trim()}>Find</button>
                    <button className={btn} onClick={() => goHit(hitIdx - 1)} disabled={!hits.length} aria-label="Previous match"><ChevronLeft size={16} /></button>
                    <span className="min-w-[56px] text-center text-xs text-muted">{hits.length ? `${hitIdx + 1} / ${hits.length}` : "0 / 0"}</span>
                    <button className={btn} onClick={() => goHit(hitIdx + 1)} disabled={!hits.length} aria-label="Next match"><ChevronRight size={16} /></button>
                    <button className={btn} onClick={() => markHits("highlight")} disabled={!hits.length}><Highlighter size={15} />Highlight all</button>
                    <button className={btn + " text-danger"} onClick={() => markHits("redact")} disabled={!hits.length}><EyeOff size={15} />Redact all</button>
                    <button onClick={() => { setFindOpen(false); setHits([]); }} aria-label="Close search" className="rounded-full p-2 text-muted hover:bg-text/10 hover:text-text"><X size={16} /></button>
                  </div>
                )}

                {/* Save panel */}
                {saveOpen && (
                  <div className={`${card} space-y-5 p-4 sm:p-5`}>
                    <div className="flex flex-wrap gap-2">
                      <Chip on={opt.format === "pdf"} onClick={() => setOpt({ ...opt, format: "pdf" })}>PDF</Chip>
                      <Chip on={opt.format === "split"} onClick={() => setOpt({ ...opt, format: "split" })}><Scissors size={13} className="mr-1 inline" />Split into PDFs (ZIP)</Chip>
                      <Chip on={opt.format === "images"} onClick={() => setOpt({ ...opt, format: "images" })}>Images (ZIP)</Chip>
                      {selIds.length > 0 && <>
                        <span className="mx-1 self-center text-muted">|</span>
                        <Chip on={opt.scope === "all"} onClick={() => setOpt({ ...opt, scope: "all" })}>All pages</Chip>
                        <Chip on={opt.scope === "selected"} onClick={() => setOpt({ ...opt, scope: "selected" })}>Selected ({selIds.length})</Chip>
                      </>}
                    </div>
                    <input value={opt.name} onChange={(e) => setOpt({ ...opt, name: e.target.value })} placeholder="File name"
                      className={`${inputCls} w-full !rounded-xl !px-4 !py-2.5`} />

                    {opt.format === "split" && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {[["each", "Every page"], ["every", "Every N pages"], ["ranges", "Custom ranges"]].map(([v, l]) => <Chip key={v} on={opt.splitMode === v} onClick={() => setOpt({ ...opt, splitMode: v })}>{l}</Chip>)}
                        </div>
                        {opt.splitMode === "every" && <input type="number" min={1} value={opt.splitN} onChange={(e) => setOpt({ ...opt, splitN: e.target.value })} className={`${inputCls} w-28`} />}
                        {opt.splitMode === "ranges" && <input value={opt.splitRanges} onChange={(e) => setOpt({ ...opt, splitRanges: e.target.value })} placeholder="e.g. 1-3, 4-6, 7" className={`${inputCls} w-full`} />}
                      </div>
                    )}

                    {opt.format === "pdf" && (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-3 rounded-xl border border-border bg-page/40 p-3">
                          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={opt.wm} onChange={(e) => setOpt({ ...opt, wm: e.target.checked })} className="accent-danger" />Watermark</label>
                          {opt.wm && <>
                            <input value={opt.wmText} onChange={(e) => setOpt({ ...opt, wmText: e.target.value })} className={`${inputCls} w-full`} />
                            <input type="range" min={0.05} max={0.6} step={0.05} value={opt.wmOp} onChange={(e) => setOpt({ ...opt, wmOp: +e.target.value })} className="w-full accent-danger" aria-label="Watermark opacity" />
                          </>}
                        </div>
                        <div className="space-y-3 rounded-xl border border-border bg-page/40 p-3">
                          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={opt.num} onChange={(e) => setOpt({ ...opt, num: e.target.checked })} className="accent-danger" />Page numbers</label>
                          {opt.num && <div className="flex flex-wrap gap-1.5">{[["bc", "Bottom"], ["br", "Right"], ["bl", "Left"], ["tc", "Top"]].map(([v, l]) => <Chip key={v} on={opt.numPos === v} onClick={() => setOpt({ ...opt, numPos: v })}>{l}</Chip>)}</div>}
                        </div>
                        <div className="space-y-3 rounded-xl border border-border bg-page/40 p-3">
                          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={opt.compress} onChange={(e) => setOpt({ ...opt, compress: e.target.checked })} className="accent-danger" />Reduce file size</label>
                          {opt.compress && <>
                            <div className="flex flex-wrap gap-1.5">{[["low", "Smallest"], ["med", "Balanced"], ["high", "Best"]].map(([v, l]) => <Chip key={v} on={opt.level === v} onClick={() => setOpt({ ...opt, level: v })}>{l}</Chip>)}</div>
                            <p className="text-xs text-muted">Flattens pages to images — text won’t be selectable.</p>
                          </>}
                        </div>
                      </div>
                    )}
                    {opt.format !== "images" && (
                      <label className="flex cursor-pointer items-start gap-2 text-sm">
                        <input type="checkbox" checked={opt.flatten} onChange={(e) => setOpt({ ...opt, flatten: e.target.checked })} className="mt-0.5 accent-danger" />
                        <span><span className="font-semibold">Permanently remove erased / replaced text</span>
                          <span className="block text-xs text-muted">Edited-text and Eraser areas are only covered by default, so the original text can still be copied from the file. Turn this on to flatten those pages (their text becomes an image).</span></span>
                      </label>
                    )}
                    <button onClick={exportDoc} disabled={toast.busy} className={btnPrimary + " w-full"}>Download</button>
                  </div>
                )}

                {/* ORGANIZE */}
                {mode === "organize" && (
                  <>
                    <div className={`${card} flex items-center gap-1 overflow-x-auto p-1.5`}>
                      <Tb icon={Plus} text="Add files" onClick={() => fileRef.current.click()} />
                      <Tb icon={FilePlus2} text="Blank page" onClick={insertBlank} />
                      <span className="mx-1 h-6 w-px shrink-0 bg-border" />
                      <Tb icon={RotateCcw} text="Left" onClick={() => rotate(selIds, -90)} disabled={!selIds.length} />
                      <Tb icon={RotateCw} text="Right" onClick={() => rotate(selIds, 90)} disabled={!selIds.length} />
                      <Tb icon={Copy} text="Duplicate" onClick={duplicate} disabled={!selIds.length} />
                      <Tb icon={Trash2} text="Delete" onClick={() => remove(selIds)} disabled={!selIds.length} />
                      <span className="mx-1 h-6 w-px shrink-0 bg-border" />
                      <Tb icon={CheckSquare} text={selIds.length === pages.length ? "Clear" : "Select all"} onClick={() => setSel(selIds.length === pages.length ? new Set() : new Set(pages.map((p) => p.id)))} />
                      <Tb icon={CheckSquare} text="Odd" onClick={() => selectParity(true)} />
                      <Tb icon={CheckSquare} text="Even" onClick={() => selectParity(false)} />
                      <Tb icon={ArrowDownUp} text="Reverse" onClick={reversePages} disabled={pages.length < 2} />
                      <input value={rangeIn} onChange={(e) => selectByRange(e.target.value)} placeholder="Select: 1,3-6"
                        className="ml-auto w-32 shrink-0 rounded-lg border border-border bg-page/60 px-3 py-1.5 text-sm outline-none focus:border-danger/50" />
                    </div>
                    <p className="px-1 text-xs text-muted">Click pages to select · drag to reorder · double-click to edit a page · drop more files anywhere to add them.</p>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                          {pages.map((p, i) => (
                            <SortableCard key={p.id} pg={p} index={i} thumb={thumbs[p.id]?.url} selected={sel.has(p.id)}
                              onToggle={toggle} onOpen={openEdit} onRotate={(id) => rotate([id], 90)} onDelete={(id) => remove([id])} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </>
                )}

                {/* EDIT */}
                {mode === "edit" && editPage && (
                  <>
                    <div className={`${card} flex items-center gap-1 overflow-x-auto p-1.5`}>
                      {TOOLS.map(([id, Icon, text]) => <Tb key={id} icon={Icon} text={text} active={tool === id} onClick={() => pickTool(id)} />)}
                    </div>

                    <div className={`${card} flex flex-wrap items-center gap-x-6 gap-y-3 p-3`}>
                      {COLOR_KINDS.includes(kind) && (
                        <div className="flex flex-wrap items-center gap-2">
                          <ColorPicker
                            colors={kind === "highlight" ? HL : kind === "whiteout" ? COVER : INK}
                            value={pickVal}
                            onChange={(col) => setProp("color", col)}
                            onLive={(col) => setProp("color", col, false)}
                            onStart={() => { if (selA) snapshot(); }}
                            picking={picking}
                            onEyedrop={() => setPicking((p) => !p)} />
                          {kind === "whiteout" && !selA && (
                            <Chip on={!style.cover} onClick={() => setStyle((s) => ({ ...s, cover: null }))}>Auto-match page</Chip>
                          )}
                        </div>
                      )}
                      {["draw", "rect", "ellipse", "line", "arrow"].includes(kind) && (
                        <label className="flex items-center gap-2 text-xs text-muted">Thickness
                          <input type="range" min={1} max={20} value={selA?.width ?? style.width} onPointerDown={snapshot} onChange={(e) => setProp("width", +e.target.value, false)} className="w-28 accent-danger" /></label>
                      )}
                      {OPACITY_KINDS.includes(kind) && (
                        <label className="flex items-center gap-2 text-xs text-muted">Opacity
                          <input type="range" min={10} max={100} value={Math.round((selA?.opacity ?? style.opacity) * 100)} onPointerDown={snapshot} onChange={(e) => setProp("opacity", +e.target.value / 100, false)} className="w-24 accent-danger" /></label>
                      )}
                      {kind === "text" && <>
                        <select value={curFont} onChange={(e) => setProp("font", e.target.value)} className={`${inputCls} max-w-[190px]`} aria-label="Font">
                          <optgroup label="Standard">
                            <option value="helvetica">Helvetica</option>
                            <option value="times">Times</option>
                            <option value="courier">Courier</option>
                          </optgroup>
                          {["Sans", "Serif", "Mono", "Script"].map((g) => (
                            <optgroup key={g} label={`${g} · web fonts`}>
                              {Object.entries(WEB).filter(([, f]) => f.group === g).map(([id, f]) => (
                                <option key={id} value={id}>{f.family}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-xs text-muted">Size
                          <input type="range" min={6} max={120} value={Math.min(120, Math.max(6, Math.round(curSize)))} onPointerDown={snapshot} onChange={(e) => setProp("size", +e.target.value, false)} className="w-24 accent-danger" />
                          <input type="number" min={4} max={300} step={0.5} value={curSize} onFocus={snapshot}
                            onChange={(e) => { const v = parseFloat(e.target.value); if (v > 0) setProp("size", Math.min(300, v), false); }}
                            className={`${inputCls} w-20 !py-1`} aria-label="Font size" /></label>
                        {selA?.orig && (
                          <button className={btn + " !py-1.5"} onClick={resetOriginal} title="Restore the original size, font and weight"><ResetIcon size={14} />Original ({Math.round(selA.orig.size * 10) / 10}pt)</button>
                        )}
                        <div className="flex gap-1.5">
                          <Chip on={!!(selA?.bold ?? style.bold)} onClick={() => setProp("bold", !(selA?.bold ?? style.bold))}><b>B</b></Chip>
                          <Chip on={!!(selA?.italic ?? style.italic)} onClick={() => setProp("italic", !(selA?.italic ?? style.italic))}><i>I</i></Chip>
                          <Chip on={!!(selA?.underline ?? style.underline)} onClick={() => setProp("underline", !(selA?.underline ?? style.underline))}><u>U</u></Chip>
                          <Chip on={!!(selA?.strike ?? style.strike)} onClick={() => setProp("strike", !(selA?.strike ?? style.strike))}><s>S</s></Chip>
                        </div>
                        {selA?.type === "text" && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip on={!!selA.maxW} onClick={() => setProp("maxW", selA.maxW ? 0 : Math.max(60, editPage.w - 24 - selA.u * editPage.w))}>Wrap lines</Chip>
                            {selA.maxW > 0 && (
                              <label className="flex items-center gap-2 text-xs text-muted">Width
                                <input type="range" min={30} max={Math.round(editPage.w)} value={Math.min(Math.round(editPage.w), Math.round(selA.maxW))} onPointerDown={snapshot}
                                  onChange={(e) => setProp("maxW", +e.target.value, false)} className="w-28 accent-danger" /></label>
                            )}
                            {selA.cover && <Chip on={!!selA.coverGrow} onClick={() => setProp("coverGrow", !selA.coverGrow)}>Cover lines below</Chip>}
                          </div>
                        )}
                        {WEB[curFont] && <span className="text-xs text-muted">Web font — downloaded when needed, embedded in the saved PDF.</span>}
                      </>}
                      {selA?.type === "text" && (
                        <textarea ref={textRef} rows={2} value={selA.text} onFocus={snapshot}
                          onChange={(e) => updateAnnots(editPage.id, (l) => l.map((a) => (a.id === selA.id ? { ...a, text: e.target.value } : a)), false)}
                          placeholder="Type text…" className={`${inputCls} min-w-[220px] flex-1`} />
                      )}
                      {kind === "stamp" && (
                        <div className="flex flex-wrap items-center gap-2">
                          {STAMPS.map(([label, col]) => (
                            <button key={label} onClick={() => addImageAnn(makeStamp(label, col), 0.3)} style={{ color: col, borderColor: col }}
                              className="rounded-lg border-2 px-2.5 py-1 text-xs font-black tracking-wide transition hover:scale-105">{label}</button>
                          ))}
                          <button className={btn + " !px-3 !py-1.5"} style={{ color: "#16a34a" }} onClick={() => addImageAnn(makeMark("check", "#16a34a"), 0.06)} aria-label="Check mark">✓</button>
                          <button className={btn + " !px-3 !py-1.5"} style={{ color: "#dc2626" }} onClick={() => addImageAnn(makeMark("cross", "#dc2626"), 0.06)} aria-label="Cross mark">✗</button>
                          <button className={btn + " !px-3 !py-1.5"} onClick={addDate}><CalendarDays size={14} />Today</button>
                        </div>
                      )}
                      {kind === "stamp" && <span className="text-xs text-muted">Click a stamp to drop it on the page, then drag it into place.</span>}
                      {kind === "edittext" && <span className="text-xs text-muted">Click any text on the page to change it (or just double-click it in Select mode). Works on real, selectable text — scanned pages have none. Delete the edit to bring the original back.</span>}
                      {kind === "text" && selA?.cover && <span className="text-xs text-muted">Edited text: the original is covered with the page’s background colour (see “Permanently remove…” when saving).</span>}
                      {kind === "redact" && <span className="text-xs text-warning">Redacted pages are flattened on save so the hidden text is truly removed.</span>}
                      {kind === "whiteout" && <span className="text-xs text-muted">Square eraser: drag a box. It fills with the page’s own background colour automatically — or choose a colour / use the eyedropper. Use Redact to remove text for good.</span>}
                      {kind === "select" && !selA && <span className="text-xs text-muted"><b>Double-click any text to edit it.</b> Click an item to move, resize (corner handle) or restyle it · arrows nudge · Ctrl+D duplicates · ? for shortcuts.</span>}
                      {selA && (
                        <div className="ml-auto flex flex-wrap gap-2">
                          <button className={btn} onClick={duplicateAnn} title="Duplicate (Ctrl+D)"><Copy size={14} />Duplicate</button>
                          <button className={btn} onClick={() => reorder(true)} title="Bring to front"><ChevronsUp size={14} /></button>
                          <button className={btn} onClick={() => reorder(false)} title="Send to back"><ChevronsDown size={14} /></button>
                          <button className={btn + " text-danger"} onClick={() => { updateAnnots(editPage.id, (l) => l.filter((a) => a.id !== selA.id)); setSelAnn(null); }}><Trash2 size={14} />Delete</button>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
                      <div className={`${card} hidden max-h-[75vh] space-y-2 overflow-y-auto p-2 lg:block`}>
                        {pages.map((p, i) => (
                          <button key={p.id} onClick={() => goto(i)} className={`block w-full rounded-lg border-2 bg-text p-0.5 ${p.id === editPage.id ? "border-danger" : "border-transparent"}`}>
                            {thumbs[p.id]?.url ? <img src={thumbs[p.id].url} alt={`Page ${i + 1}`} className="w-full" /> : <div className="aspect-[3/4]" />}
                            <span className="block text-center text-[10px] text-muted">{i + 1}</span>
                          </button>
                        ))}
                      </div>
                      <div className={`${card} overflow-auto p-3 sm:p-5`}>
                        <Viewer pg={editPage} srcs={srcs.current} c={ctrl} />
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
                          <button className={btn} onClick={() => goto(editIdx - 1)} disabled={editIdx <= 0} aria-label="Previous page"><ChevronLeft size={16} /></button>
                          <span className="text-muted">Page {editIdx + 1} of {pages.length}</span>
                          <button className={btn} onClick={() => goto(editIdx + 1)} disabled={editIdx >= pages.length - 1} aria-label="Next page"><ChevronRight size={16} /></button>
                          <span className="mx-1 h-6 w-px bg-border" />
                          <button className={btn} onClick={() => zoomBy(-0.25)} disabled={zoom <= 0.5} aria-label="Zoom out"><ZoomOut size={16} /></button>
                          <button className={btn + " min-w-[64px]"} onClick={() => setZoom(1)} title="Reset zoom">{Math.round(zoom * 100)}%</button>
                          <button className={btn} onClick={() => zoomBy(0.25)} disabled={zoom >= 2.5} aria-label="Zoom in"><ZoomIn size={16} /></button>
                          <span className="mx-1 h-6 w-px bg-border" />
                          <button className={btn} onClick={() => rotate([editPage.id], 90)}><RotateCw size={15} />Rotate</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {dragOver && (
        <div className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center bg-page/70 p-6 backdrop-blur-sm">
          <div className="rounded-3xl border-2 border-dashed border-danger bg-surface/80 px-12 py-16 text-center">
            <Upload size={36} className="mx-auto text-danger" />
            <p className="mt-4 text-xl font-bold">Drop to add pages</p>
            <p className="mt-1 text-sm text-muted">PDF, JPG or PNG</p>
          </div>
        </div>
      )}

      {toast.msg && (
        <div className="fixed bottom-5 left-1/2 z-[90] flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-surface/95 px-5 py-3 text-sm shadow-2xl backdrop-blur">
          {toast.busy && <Loader2 size={16} className="shrink-0 animate-spin text-danger" />}{toast.msg}
        </div>
      )}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {sigOpen && <SignatureModal last={lastSig} onClose={() => setSigOpen(false)} onSave={(src) => { setLastSig(src); setSigOpen(false); addImageAnn(src); }} />}
    </>
  );
}