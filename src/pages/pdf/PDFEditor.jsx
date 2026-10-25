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
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

/* ========================================================================== */
/*  npm i pdf-lib pdfjs-dist jszip @dnd-kit/core @dnd-kit/sortable           */
/*  Runs fully in the browser — files never leave the device.                */
/*                                                                            */
/*  Data model: every page = { id, srcId, srcIndex, w, h, baseRot, rotation, */
/*  annots[] }. Annotation coordinates are normalised (0..1) against the     */
/*  UNROTATED page, so they rotate together with the page automatically.     */
/* ========================================================================== */

const A4 = [595.28, 841.89];
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const INK = ["#dc2626", "#2563eb", "#16a34a", "#111827", "#f59e0b", "#ffffff"];
const HL = ["#fde047", "#86efac", "#f9a8d4", "#93c5fd"];
const FONT_CSS = { helvetica: "Helvetica, Arial, sans-serif", times: "'Times New Roman', Times, serif", courier: "'Courier New', monospace" };
const PDF_FONT = { helvetica: StandardFonts.Helvetica, times: StandardFonts.TimesRoman, courier: StandardFonts.Courier };
const BOX = ["highlight", "rect", "ellipse", "whiteout", "redact", "image"];

const norm = (d) => ((d % 360) + 360) % 360;
const totRot = (p) => norm(p.baseRot + p.rotation);
const dispSize = (p) => (totRot(p) % 180 ? [p.h, p.w] : [p.w, p.h]);
const latin = (t) => t.replace(/[^\u0020-\u00FF]/g, "?");
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
let AV = 0;
const tick = () => new Promise((r) => setTimeout(r, 0));

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

/* ------------------------- annotation geometry ---------------------------- */

const mctx = document.createElement("canvas").getContext("2d");
function textSize(a) {
  mctx.font = `${a.size}px ${FONT_CSS[a.font]}`;
  const lines = a.text.split("\n");
  return { w: Math.max(...lines.map((l) => mctx.measureText(l || " ").width)), h: lines.length * a.size * 1.2 };
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

function moveAnnot(a, du, dv) {
  if (a.type === "line") return { ...a, u1: a.u1 + du, u2: a.u2 + du, v1: a.v1 + dv, v2: a.v2 + dv };
  if (a.type === "draw") return { ...a, pts: a.pts.map(([x, y]) => [x + du, y + dv]) };
  return { ...a, u: a.u + du, v: a.v + dv };
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
    if (a.type === "highlight") { ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 0.5; ctx.fillRect(x, y, w, h); }
    else if (a.type === "whiteout") { ctx.fillStyle = "#fff"; ctx.fillRect(x, y, w, h); }
    else if (a.type === "redact") { ctx.fillStyle = "#000"; ctx.fillRect(x, y, w, h); }
    else if (a.type === "rect") ctx.strokeRect(x, y, w, h);
    else if (a.type === "ellipse") { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (a.type === "line") { ctx.beginPath(); ctx.moveTo(a.u1 * Wp, a.v1 * Hp); ctx.lineTo(a.u2 * Wp, a.v2 * Hp); ctx.stroke(); }
    else if (a.type === "draw") {
      ctx.beginPath();
      a.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * Wp, py * Hp) : ctx.moveTo(px * Wp, py * Hp)));
      if (a.pts.length === 1) ctx.lineTo(a.pts[0][0] * Wp + 0.1, a.pts[0][1] * Hp);
      ctx.stroke();
    } else if (a.type === "image") { const im = imgStore.get(a.src); if (im) ctx.drawImage(im, x, y, w, h); }
    else if (a.type === "text") {
      ctx.font = `${a.size * s}px ${FONT_CSS[a.font]}`;
      ctx.textBaseline = "alphabetic";
      a.text.split("\n").forEach((l, i) => ctx.fillText(l, x, y + a.size * s * 0.8 + i * a.size * s * 1.2));
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
    if (a.type === "highlight") page.drawRectangle({ x: X(a.u), y: Y(a.v + a.h), width: a.w * W, height: a.h * H, color: col, opacity: 0.5, blendMode: BlendMode.Multiply });
    else if (a.type === "whiteout") page.drawRectangle({ x: X(a.u), y: Y(a.v + a.h), width: a.w * W, height: a.h * H, color: rgb(1, 1, 1) });
    else if (a.type === "rect") page.drawRectangle({ x: X(a.u), y: Y(a.v + a.h), width: a.w * W, height: a.h * H, borderColor: col, borderWidth: a.width });
    else if (a.type === "ellipse") page.drawEllipse({ x: X(a.u + a.w / 2), y: Y(a.v + a.h / 2), xScale: (a.w * W) / 2, yScale: (a.h * H) / 2, borderColor: col, borderWidth: a.width });
    else if (a.type === "line") page.drawLine({ start: { x: X(a.u1), y: Y(a.v1) }, end: { x: X(a.u2), y: Y(a.v2) }, thickness: a.width, color: col, lineCap: LineCapStyle.Round });
    else if (a.type === "draw") {
      for (let i = 1; i < a.pts.length; i++)
        page.drawLine({ start: { x: X(a.pts[i - 1][0]), y: Y(a.pts[i - 1][1]) }, end: { x: X(a.pts[i][0]), y: Y(a.pts[i][1]) }, thickness: a.width, color: col, lineCap: LineCapStyle.Round });
    } else if (a.type === "image") {
      let img = embedCache.get(a.src);
      if (!img) { img = await out.embedPng(dataUrlBytes(a.src)); embedCache.set(a.src, img); }
      page.drawImage(img, { x: X(a.u), y: Y(a.v + a.h), width: a.w * W, height: a.h * H });
    } else if (a.type === "text") {
      const font = await getFont(a.font);
      latin(a.text).split("\n").forEach((l, i) =>
        page.drawText(l, { x: X(a.u), y: Y(a.v) - a.size * 0.8 - i * a.size * 1.2, size: a.size, font, color: col }));
    }
  }
}

async function buildPdf(list, srcs, o = {}, onProgress = () => {}) {
  const out = await PDFDocument.create();
  const docs = new Map(), fonts = {}, embedCache = new Map();
  const getFont = async (k) => (fonts[k] ||= await out.embedFont(PDF_FONT[k]));
  const getDoc = async (id) => {
    if (!docs.has(id)) docs.set(id, await PDFDocument.load(srcs.get(id).bytes, { ignoreEncryption: true }));
    return docs.get(id);
  };
  const raster = (pg) => o.compress || pg.annots.some((a) => a.type === "redact");

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
const lbl = "text-xs font-semibold uppercase tracking-wide text-muted";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/70 px-3.5 py-2 text-sm font-semibold text-text transition hover:border-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-semibold text-text shadow-[0_0_24px_rgba(244,63,94,.3)] transition hover:scale-[1.03] disabled:opacity-40";
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
        <span className="font-semibold text-text">{index + 1}</span>
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

/* --------------------------------- viewer --------------------------------- */

function Viewer({ pg, srcs, c }) {
  const wrap = useRef(null), baseRef = useRef(null), ovRef = useRef(null), live = useRef(null), drag = useRef(null);
  const [vw, setVw] = useState(700), [ready, setReady] = useState(0);
  const [dw, dh] = dispSize(pg), tot = totRot(pg), dpr = Math.min(2, window.devicePixelRatio || 1);

  useEffect(() => {
    const el = wrap.current, fit = () => setVw(Math.max(240, Math.min(el.clientWidth, 860)));
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let off = false;
    (async () => {
      const cnv = await renderBase(pg, srcs, (vw * dpr) / dw);
      if (off) return;
      for (const el of [baseRef.current, ovRef.current]) { el.width = cnv.width; el.height = cnv.height; }
      baseRef.current.getContext("2d").drawImage(cnv, 0, 0);
      setReady((r) => r + 1);
    })();
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pg.id, tot, pg.srcId, pg.srcIndex, vw]);

  const paint = () => {
    const o = ovRef.current;
    if (!o || !o.width) return;
    const ctx = o.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, o.width, o.height);
    drawAnnots(ctx, pg, o.width / dw, c.selAnn, live.current);
  };
  useEffect(paint, [pg.annots, c.selAnn, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const toU = (e) => {
    const r = ovRef.current.getBoundingClientRect(), a = (e.clientX - r.left) / r.width, b = (e.clientY - r.top) / r.height;
    const [u, v] = dispToUnrot(a, b, tot);
    return { u, v };
  };
  const ptsPerPx = dw / vw;
  const mk = (type, extra) => ({ id: uid(), type, color: type === "highlight" ? c.style.hl : c.style.color, width: c.style.width, ...extra });

  const down = (e) => {
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
    c.setSelAnn(null);
    if (tool === "text") {
      const a = mk("text", { u, v, text: "Text", size: c.style.size, font: c.style.font });
      c.addAnn(pg.id, a);
      c.setSelAnn(a.id);
      c.setTool("select");
      c.setFocusText(true);
    } else if (tool === "draw") live.current = mk("draw", { pts: [[u, v]] });
    else if (tool === "line") live.current = mk("line", { u1: u, v1: v, u2: u, v2: v });
    else { live.current = mk(tool, { u, v, w: 0, h: 0 }); drag.current = { mode: "create", u0: u, v0: v }; }
    paint();
  };

  const move = (e) => {
    const { u, v } = toU(e), d = drag.current, L = live.current;
    if (d?.mode === "move") {
      const du = u - d.last.u, dv = v - d.last.v;
      d.last = { u, v };
      c.updateAnnots(pg.id, (l) => l.map((a) => (a.id === d.id ? moveAnnot(a, du, dv) : a)), false);
    } else if (d?.mode === "resize") {
      c.updateAnnots(pg.id, (l) => l.map((a) => {
        if (a.id !== d.id) return a;
        if (a.type === "text") return { ...a, size: Math.max(6, Math.min(200, d.size0 * (((u - a.u) * pg.w) / d.w0))) };
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
  };

  const cursor = c.tool === "select" ? "cursor-default" : c.tool === "text" ? "cursor-text" : "cursor-crosshair";
  return (
    <div ref={wrap} className="flex w-full justify-center">
      <div className="relative shadow-2xl" style={{ width: vw, aspectRatio: `${dw} / ${dh}` }}>
        <canvas ref={baseRef} className="absolute inset-0 h-full w-full rounded bg-text" />
        <canvas ref={ovRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} className={`absolute inset-0 h-full w-full touch-none ${cursor}`} />
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
  const [style, setStyle] = useState({ color: "#dc2626", hl: HL[0], width: 3, size: 18, font: "helvetica" });
  const [selAnn, setSelAnn] = useState(null);
  const [focusText, setFocusText] = useState(false);
  const [thumbs, setThumbs] = useState({});
  const [toast, setToast] = useState({ msg: "", busy: false });
  const [sigOpen, setSigOpen] = useState(false);
  const [lastSig, setLastSig] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [rangeIn, setRangeIn] = useState("");
  const [opt, setOpt] = useState({
    name: "document", format: "pdf", scope: "all", compress: false, level: "med",
    wm: false, wmText: "CONFIDENTIAL", wmOp: 0.2, num: false, numPos: "bc",
    splitMode: "each", splitN: 2, splitRanges: "",
  });

  const srcs = useRef(new Map()), fileRef = useRef(null), imgRef = useRef(null), busy = useRef(false), textRef = useRef(null);
  const pagesRef = useRef(pages), hist = useRef({ past: [], future: [] });
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
        try { doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise; }
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
      if (!opt.name || opt.name === "document") setOpt((o) => ({ ...o, name: (files[0].name || "document").replace(/\.[^.]+$/, "") }));
    } catch (e) { console.error(e); note("Something went wrong opening those files."); }
  };

  /* ------------------------------ organize ------------------------------- */

  const selIds = useMemo(() => pages.filter((p) => sel.has(p.id)).map((p) => p.id), [pages, sel]);
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const rotate = (ids, d) => mutate((ps) => ps.map((p) => (ids.includes(p.id) ? { ...p, rotation: norm(p.rotation + d), av: ++AV } : p)));
  const remove = (ids) => { mutate((ps) => ps.filter((p) => !ids.includes(p.id))); setSel(new Set()); };
  const duplicate = () => mutate((ps) => ps.flatMap((p) => (sel.has(p.id) ? [p, { ...p, id: uid() }] : [p])));
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
  const openEdit = (id) => { setEditId(id); setMode("edit"); setSelAnn(null); setTool("select"); };
  const goto = (i) => { if (pages[i]) { setEditId(pages[i].id); setSelAnn(null); } };

  const addImageAnn = async (src) => {
    const im = await ensureImg(src), ar = im.naturalWidth / im.naturalHeight, w = 0.3;
    const a = { id: uid(), type: "image", src, ar, u: 0.35, v: 0.4, w, h: (w * editPage.w) / ar / editPage.h };
    addAnn(editPage.id, a);
    setSelAnn(a.id);
    setTool("select");
  };
  const pickTool = (t) => {
    if (t === "sig") return setSigOpen(true);
    if (t === "image") return imgRef.current.click();
    setTool(t);
    setSelAnn(null);
  };

  const selA = editPage?.annots.find((a) => a.id === selAnn);
  const kind = selA?.type || tool;
  const setProp = (k, v, rec = true) => {
    setStyle((s) => ({ ...s, [k]: v, ...(k === "color" && kind === "highlight" ? { hl: v } : {}) }));
    if (selA) updateAnnots(editPage.id, (l) => l.map((a) => (a.id === selA.id ? { ...a, [k]: v } : a)), rec);
  };

  useEffect(() => { if (focusText && textRef.current) { textRef.current.focus(); textRef.current.select(); setFocusText(false); } }, [focusText, selAnn]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
      else if (mode === "edit" && selAnn && (e.key === "Delete" || e.key === "Backspace")) { updateAnnots(editPage.id, (l) => l.filter((a) => a.id !== selAnn)); setSelAnn(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* -------------------------------- export ------------------------------- */

  const exportDoc = async () => {
    try {
      const list = opt.scope === "selected" && selIds.length ? pages.filter((p) => sel.has(p.id)) : pages;
      const name = opt.name.trim() || "document";
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
          const bytes = await buildPdf(groups[g].map((n) => list[n - 1]), srcs.current, {}, (m) => note(`Part ${g + 1}/${groups.length}: ${m}`, true));
          zip.file(`${name}-part-${g + 1}.pdf`, bytes);
        }
        download(await zip.generateAsync({ type: "blob" }), `${name}-split.zip`);
      } else {
        const lv = { low: { scale: 1, q: 0.55 }, med: { scale: 1.4, q: 0.75 }, high: { scale: 2, q: 0.9 } }[opt.level];
        const bytes = await buildPdf(list, srcs.current, {
          compress: opt.compress ? lv : null,
          wm: opt.wm && opt.wmText.trim() ? { text: opt.wmText.trim(), opacity: opt.wmOp } : null,
          num: opt.num ? opt.numPos : null,
        }, (m) => note(m, true));
        download(new Blob([bytes], { type: "application/pdf" }), `${name}.pdf`);
      }
      note("Saved ✓");
      setSaveOpen(false);
    } catch (e) {
      console.error(e);
      note(e.message?.startsWith("Invalid") || e.message?.includes("outside") ? e.message : "Couldn't save. Check the file isn't encrypted and try again.");
    }
  };

  /* --------------------------------- JSX --------------------------------- */

  const ctrl = { tool, setTool, style, selAnn, setSelAnn, snapshot, addAnn, updateAnnots, setFocusText };
  const TOOLS = [["select", MousePointer2, "Select"], ["text", Type, "Text"], ["highlight", Highlighter, "Highlight"], ["draw", Pencil, "Draw"],
    ["rect", Square, "Rectangle"], ["ellipse", Circle, "Ellipse"], ["line", Minus, "Line"], ["whiteout", Eraser, "Whiteout"],
    ["redact", EyeOff, "Redact"], ["sig", PenTool, "Sign"], ["image", ImagePlus, "Image"]];

  const Empty = (
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles([...e.dataTransfer.files]); }}
      className="flex flex-col items-center rounded-3xl border-2 border-dashed border-border bg-surface/60 px-6 py-20 text-center transition hover:border-danger">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger"><FileText size={30} /></div>
      <h2 className="mt-6 text-2xl font-bold">Open a PDF to start editing</h2>
      <p className="mt-2 max-w-md text-muted">Drop one or more PDFs (or JPG/PNG images) — they’ll be combined so you can reorder, edit, sign and save.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={() => fileRef.current.click()} className={btnPrimary}><Upload size={18} />Choose files</button>
        <button onClick={() => mutate(() => [{ id: uid(), srcId: null, srcIndex: 0, w: A4[0], h: A4[1], baseRot: 0, rotation: 0, annots: [], av: 0 }])} className={btn}><FilePlus2 size={18} />Blank page</button>
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
            <p className="mx-auto mt-3 max-w-2xl text-muted">Merge, split, rotate, delete, annotate, sign, redact and more — all in your browser, nothing uploaded.</p>
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
                  <span className="ml-auto text-xs text-muted">{pages.length} page{pages.length > 1 ? "s" : ""}</span>
                  <button onClick={() => setSaveOpen((o) => !o)} className={btnPrimary}><Download size={16} />Save</button>
                </div>

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
                      className="w-full rounded-xl border border-border bg-page/60 px-4 py-2.5 text-sm outline-none focus:border-danger/50" />

                    {opt.format === "split" && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {[["each", "Every page"], ["every", "Every N pages"], ["ranges", "Custom ranges"]].map(([v, l]) => <Chip key={v} on={opt.splitMode === v} onClick={() => setOpt({ ...opt, splitMode: v })}>{l}</Chip>)}
                        </div>
                        {opt.splitMode === "every" && <input type="number" min={1} value={opt.splitN} onChange={(e) => setOpt({ ...opt, splitN: e.target.value })} className="w-28 rounded-xl border border-border bg-page/60 px-3 py-2 text-sm outline-none" />}
                        {opt.splitMode === "ranges" && <input value={opt.splitRanges} onChange={(e) => setOpt({ ...opt, splitRanges: e.target.value })} placeholder="e.g. 1-3, 4-6, 7" className="w-full rounded-xl border border-border bg-page/60 px-4 py-2.5 text-sm outline-none focus:border-danger/50" />}
                      </div>
                    )}

                    {opt.format === "pdf" && (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-3 rounded-xl border border-border bg-page/40 p-3">
                          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={opt.wm} onChange={(e) => setOpt({ ...opt, wm: e.target.checked })} className="accent-danger" />Watermark</label>
                          {opt.wm && <>
                            <input value={opt.wmText} onChange={(e) => setOpt({ ...opt, wmText: e.target.value })} className="w-full rounded-lg border border-border bg-page/60 px-3 py-2 text-sm outline-none" />
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
                      <input value={rangeIn} onChange={(e) => selectByRange(e.target.value)} placeholder="Select: 1,3-6"
                        className="ml-auto w-32 shrink-0 rounded-lg border border-border bg-page/60 px-3 py-1.5 text-sm outline-none focus:border-danger/50" />
                    </div>
                    <p className="px-1 text-xs text-muted">Click pages to select · drag to reorder · double-click to edit a page.</p>
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
                      {["text", "highlight", "draw", "rect", "ellipse", "line"].includes(kind) && (
                        <Swatches colors={kind === "highlight" ? HL : INK} value={selA?.color || (kind === "highlight" ? style.hl : style.color)} onChange={(c) => setProp("color", c)} />
                      )}
                      {["draw", "rect", "ellipse", "line"].includes(kind) && (
                        <label className="flex items-center gap-2 text-xs text-muted">Thickness
                          <input type="range" min={1} max={20} value={selA?.width ?? style.width} onPointerDown={snapshot} onChange={(e) => setProp("width", +e.target.value, false)} className="w-28 accent-danger" /></label>
                      )}
                      {kind === "text" && <>
                        <label className="flex items-center gap-2 text-xs text-muted">Size
                          <input type="range" min={8} max={96} value={Math.round(selA?.size ?? style.size)} onPointerDown={snapshot} onChange={(e) => setProp("size", +e.target.value, false)} className="w-28 accent-danger" /></label>
                        <div className="flex gap-1.5">{[["helvetica", "Sans"], ["times", "Serif"], ["courier", "Mono"]].map(([v, l]) => <Chip key={v} on={(selA?.font ?? style.font) === v} onClick={() => setProp("font", v)}>{l}</Chip>)}</div>
                      </>}
                      {selA?.type === "text" && (
                        <textarea ref={textRef} rows={2} value={selA.text} onFocus={snapshot}
                          onChange={(e) => updateAnnots(editPage.id, (l) => l.map((a) => (a.id === selA.id ? { ...a, text: e.target.value } : a)), false)}
                          placeholder="Type text…" className="min-w-[220px] flex-1 rounded-lg border border-border bg-page/60 px-3 py-2 text-sm outline-none focus:border-danger/50" />
                      )}
                      {kind === "redact" && <span className="text-xs text-warning">Redacted pages are flattened on save so the hidden text is truly removed.</span>}
                      {kind === "whiteout" && <span className="text-xs text-muted">Covers content visually (text underneath stays in the file). Use Redact to remove it.</span>}
                      {kind === "select" && !selA && <span className="text-xs text-muted">Click an item to move, resize (corner handle) or edit it.</span>}
                      {selA && <button className={btn + " ml-auto text-danger"} onClick={() => { updateAnnots(editPage.id, (l) => l.filter((a) => a.id !== selA.id)); setSelAnn(null); }}><Trash2 size={14} />Delete</button>}
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
                        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                          <button className={btn} onClick={() => goto(editIdx - 1)} disabled={editIdx <= 0} aria-label="Previous page"><ChevronLeft size={16} /></button>
                          <span className="text-muted">Page {editIdx + 1} of {pages.length}</span>
                          <button className={btn} onClick={() => goto(editIdx + 1)} disabled={editIdx >= pages.length - 1} aria-label="Next page"><ChevronRight size={16} /></button>
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

      {toast.msg && (
        <div className="fixed bottom-5 left-1/2 z-[90] flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-surface/95 px-5 py-3 text-sm shadow-2xl backdrop-blur">
          {toast.busy && <Loader2 size={16} className="shrink-0 animate-spin text-danger" />}{toast.msg}
        </div>
      )}
      {sigOpen && <SignatureModal last={lastSig} onClose={() => setSigOpen(false)} onSave={(src) => { setLastSig(src); setSigOpen(false); addImageAnn(src); }} />}
    </>
  );
}