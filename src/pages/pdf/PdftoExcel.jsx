import { useEffect, useRef, useState } from "react";
import {
  Upload, FileText, Download, Loader2, X, Check, RefreshCw, Eye, EyeOff, Lock, ScanLine,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

/* ========================================================================== */
/*  npm i exceljs pdfjs-dist tesseract.js                                     */
/*  100% in-browser: files never leave the device.                            */
/*                                                                            */
/*   - Text PDFs  : tables are detected from text geometry (column gutters,   */
/*                  row alignment, wrapped cells, merged header cells).       */
/*   - Scanned PDFs: OCR (Tesseract) words -> same table detection.           */
/*   - Output     : .xlsx (real numbers, %, negatives, bold header, borders,  */
/*                  auto column widths, merged cells) or .csv                 */
/*   - Sheets     : one per page / one per table / everything on one sheet    */
/* ========================================================================== */

/* ========================================================================== */
/* ENGINE START  (pure functions: PDF text geometry -> tables)                */
/* ========================================================================== */

const RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pctl = (a, p) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
/* 2D affine multiply (same convention as pdf.js Util.transform) */
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];

/* ---------------------------- items -> lines ------------------------------ */

function extractItems(tc, vt, fontOf) {
  const items = [];
  for (const it of tc.items) {
    if (typeof it.str !== "string" || !it.str.trim()) continue;
    const t = mul(vt, it.transform);
    const fs = Math.hypot(t[2], t[3]);
    if (!(fs >= 2)) continue;
    if (Math.abs(t[1]) > Math.abs(t[0]) * 0.5) continue; // rotated text: skip
    items.push({ s: it.str, x: t[4], y: t[5], fs, w: Math.abs(it.width), b: fontOf(it.fontName).b });
  }
  return items;
}

function groupLines(items) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const it of sorted) {
    let L = null;
    for (let k = lines.length - 1; k >= 0 && k >= lines.length - 6; k--) {
      const l = lines[k];
      if (Math.abs(it.y - l.y) <= Math.max(it.fs, l.fs) * 0.42) { L = l; break; }
    }
    if (L) { L.items.push(it); L.ys += it.y; L.y = L.ys / L.items.length; L.fs = Math.max(L.fs, it.fs); }
    else lines.push({ y: it.y, ys: it.y, fs: it.fs, items: [it] });
  }
  return lines;
}

/* splits a line into "segments" (= candidate cells) wherever there is a wide horizontal gap */
function buildLine(l, gapK) {
  const its = l.items;
  const total = its.reduce((n, it) => n + it.s.length, 0);
  const rtlN = its.reduce((n, it) => n + (RTL_RE.test(it.s) ? it.s.length : 0), 0);
  const rtl = rtlN > total * 0.5;
  its.sort((a, b) => (rtl ? b.x + b.w - (a.x + a.w) : a.x - b.x));
  const segs = [];
  let cur = null, prev = null;
  const addRun = (seg, it, text) => {
    const r = seg.runs[seg.runs.length - 1];
    if (r && r.b === it.b) r.t += text; else seg.runs.push({ t: text, b: it.b });
  };
  for (const it of its) {
    const x0 = it.x, x1 = it.x + it.w;
    if (!cur) { cur = { x: x0, xEnd: x1, runs: [] }; addRun(cur, it, it.s); prev = it; continue; }
    const gap = rtl ? prev.x - x1 : x0 - (prev.x + prev.w);
    const fs = (prev.fs + it.fs) / 2;
    if (gap > Math.max(fs * gapK, gapK * 7.5)) {
      segs.push(cur);
      cur = { x: x0, xEnd: x1, runs: [] };
      addRun(cur, it, it.s);
    } else {
      const lastT = cur.runs[cur.runs.length - 1].t;
      let text = it.s;
      if (gap > fs * 0.17 && !/\s$/.test(lastT) && !/^\s/.test(text)) text = " " + text;
      addRun(cur, it, text);
      cur.x = Math.min(cur.x, x0);
      cur.xEnd = Math.max(cur.xEnd, x1);
    }
    prev = it;
  }
  if (cur) segs.push(cur);
  segs.sort((a, b) => a.x - b.x);
  segs.forEach((s) => { s.text = s.runs.map((r) => r.t).join("").replace(/\s+/g, " ").trim(); });
  return {
    y: l.y, segs, rtl, fs: l.fs,
    x: Math.min(...segs.map((s) => s.x)), xEnd: Math.max(...segs.map((s) => s.xEnd)),
    text: segs.map((s) => s.text).join("  ").trim(),
  };
}

const makeLines = (items, gapK) => groupLines(items).map((l) => buildLine(l, gapK)).filter((l) => l.text).sort((a, b) => a.y - b.y);

/* -------------------------------- tables --------------------------------- */

/* vertical "free" strips between occupied x-ranges = column gutters */
function columnsFrom(rows) {
  let x0 = Infinity, x1 = -Infinity;
  rows.forEach((r) => r.segs.forEach((s) => { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.xEnd); }));
  const N = Math.ceil(x1 - x0) + 2, cover = new Int16Array(N);
  rows.forEach((r) => r.segs.forEach((s) => {
    for (let x = Math.max(0, Math.floor(s.x - x0)); x <= Math.min(N - 1, Math.ceil(s.xEnd - x0)); x++) cover[x]++;
  }));
  const thr = rows.length >= 8 ? 1 : 0; // tolerate one stray overlapping line in bigger tables
  const cols = [];
  let s = -1, lastOcc = -1;
  for (let x = 0; x < N; x++) {
    const occ = cover[x] > thr;
    if (occ) { if (s < 0) s = x; lastOcc = x; }
    else if (s >= 0 && x - lastOcc >= 5) { cols.push({ s: x0 + s, e: x0 + lastOcc }); s = -1; }
  }
  if (s >= 0) cols.push({ s: x0 + s, e: x0 + lastOcc });
  return cols.filter((c) => c.e - c.s >= 3);
}

const segBold = (s) => {
  const rs = s.runs.filter((r) => r.t.trim());
  return rs.length > 0 && rs.every((r) => r.b);
};

/* Try to read a table starting at lines[i]. Returns { end, rows, merges, ncols } or null.
   rows[r] = array of { t: string, b: bool } (one per column) */
function findTable(lines, i, pitch) {
  if (lines[i].segs.length < 2) return null;
  const span = [], rows = [];
  let j = i;
  while (j < lines.length) {
    const l = lines[j], prev = lines[j - 1];
    if (l.segs.length >= 2) {
      if (j > i && l.y - prev.y > Math.max(l.fs, prev.fs) * pitch * 2.6) break;
      span.push({ l, row: true }); rows.push(l); j++; continue;
    }
    /* single-segment line between rows = wrapped text of the cell above */
    if (span.length && prev && l.y - prev.y <= Math.max(l.fs, prev.fs) * pitch * 1.35 && j + 1 < lines.length && lines[j + 1].segs.length >= 2) {
      span.push({ l, row: false }); j++; continue;
    }
    break;
  }
  if (rows.length < 2) return null;
  const cols = columnsFrom(rows);
  if (cols.length < 2) return null;

  const colOf = (x) => {
    let k = cols.findIndex((c) => x >= c.s - 3 && x <= c.e + 3);
    if (k >= 0) return k;
    let bd = Infinity;
    cols.forEach((c, n) => { const d = Math.abs(x - (c.s + c.e) / 2); if (d < bd) { bd = d; k = n; } });
    return k;
  };

  const out = [], merges = [];
  const addLine = (l, asRow) => {
    if (asRow) {
      const cells = cols.map(() => ({ t: "", b: false }));
      let col = 0;
      const r = out.length;
      for (const s of l.segs) {
        let c0 = colOf(s.x + 1), c1 = colOf(s.xEnd - 1);
        if (c1 < c0) [c0, c1] = [c1, c0];
        if (c0 < col) c0 = col;
        if (c1 < c0) c1 = c0;
        if (c0 >= cols.length) break;
        cells[c0] = { t: s.text, b: segBold(s) };
        if (c1 > c0) merges.push({ r, c0, c1 });
        col = c1 + 1;
      }
      out.push(cells);
    } else if (out.length) {
      const row = out[out.length - 1];
      for (const s of l.segs) {
        const c = colOf(s.x + 1);
        row[c] = { t: (row[c].t ? row[c].t + " " : "") + s.text, b: row[c].b };
      }
    }
  };
  span.forEach((e) => addLine(e.l, e.row));

  /* wrapped text right after the last row */
  while (j < lines.length) {
    const l = lines[j], prev = lines[j - 1];
    const inside = l.segs.every((s) => s.x >= cols[0].s - 3 && cols.some((c) => s.x >= c.s - 3 && s.x <= c.e + 3));
    if (l.y - prev.y <= Math.max(l.fs, prev.fs) * pitch * 1.3 && inside && l.segs.length < cols.length && l.fs <= prev.fs + 0.5) { addLine(l, false); j++; }
    else break;
  }
  return { end: j, rows: out, merges, ncols: cols.length };
}

function linePitch(lines) {
  const ratios = [];
  for (let k = 1; k < lines.length; k++) {
    const dy = lines[k].y - lines[k - 1].y, fs = lines[k].fs;
    if (Math.abs(fs - lines[k - 1].fs) < 0.8 && dy > 0.8 * fs && dy < 3.2 * fs) ratios.push(dy / fs);
  }
  return ratios.length ? clampN(pctl(ratios, 0.3), 1.0, 2.6) : 1.2;
}

/* lines -> [{type:"table", rows, merges, ncols} | {type:"text", text}] */
function toBlocks(lines, includeText) {
  const pitch = linePitch(lines);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const t = findTable(lines, i, pitch);
    if (t) { blocks.push({ type: "table", rows: t.rows, merges: t.merges, ncols: t.ncols }); i = t.end; }
    else { if (includeText) blocks.push({ type: "text", text: lines[i].text }); i++; }
  }
  return blocks;
}

/* ------------------------------ OCR -> items ------------------------------ */

function ocrItems(data, scale) {
  const words = [];
  if (data?.blocks?.length) data.blocks.forEach((b) => (b.paragraphs || []).forEach((p) => (p.lines || []).forEach((l) => (l.words || []).forEach((w) => words.push(w)))));
  else if (data?.words?.length) words.push(...data.words);
  return words
    .filter((w) => w.text && w.text.trim() && w.bbox)
    .map((w) => {
      const h = (w.bbox.y1 - w.bbox.y0) / scale;
      return { s: w.text, x: w.bbox.x0 / scale, y: (w.bbox.y1 - (w.bbox.y1 - w.bbox.y0) * 0.2) / scale, fs: clampN(h * 0.85, 4, 60), w: (w.bbox.x1 - w.bbox.x0) / scale, b: false };
    });
}

/* ------------------------------ cell values ------------------------------- */

/* "1,234.50" -> 1234.5 | "(45)" -> -45 | "12%" -> 0.12 (formatted as %) | "007" stays text */
const NUM_RE = /^[(-]?[$€£¥₹]?\s?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\)?%?$/;
function toCell(raw, b, numbers) {
  const t = (raw || "").trim();
  if (!t) return null;
  if (numbers && NUM_RE.test(t) && !/^[(-]?[$€£¥₹]?\s?0\d+$/.test(t)) {
    const neg = /^\(.*\)$/.test(t) || t.startsWith("-");
    const pct = t.endsWith("%");
    let n = parseFloat(t.replace(/[^\d.]/g, ""));
    if (Number.isFinite(n)) {
      if (neg) n = -n;
      if (pct) return { v: n / 100, fmt: "0.##%", b };
      const dec = (t.split(".")[1] || "").replace(/\D/g, "").length;
      return { v: n, fmt: /,/.test(t) ? (dec ? `#,##0.${"0".repeat(dec)}` : "#,##0") : undefined, b };
    }
  }
  return { v: t, b };
}

/* ----------------------------- model assembly ---------------------------- */

const safeSheet = (s, used) => {
  let n = s.replace(/[\[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Sheet";
  let k = 2, base = n;
  while (used.has(n.toLowerCase())) n = `${base.slice(0, 28)} ${k++}`;
  used.add(n.toLowerCase());
  return n;
};

/*
 * pages -> sheets. sheet = { name, rows: [{ cells: [cell|null], table: bool, hdr: bool }], merges: [{r,c0,c1}] }
 * layout: "page" | "single" | "table"
 */
function assemble(pages, opt) {
  const sheets = [], used = new Set();
  const tableRows = (b, sh, first) => {
    const base = sh.rows.length;
    b.rows.forEach((r, k) => sh.rows.push({ cells: r.map((c) => toCell(c.t, c.b, opt.numbers)), table: true, hdr: opt.header && first && k === 0 }));
    b.merges.forEach((m) => sh.merges.push({ r: base + m.r, c0: m.c0, c1: m.c1 }));
  };
  const textRow = (b, sh) => sh.rows.push({ cells: [toCell(b.text, false, false)], table: false, hdr: false });
  const blank = (sh) => { if (sh.rows.length && sh.rows[sh.rows.length - 1].cells.length) sh.rows.push({ cells: [], table: false, hdr: false }); };

  if (opt.layout === "single") {
    const sh = { name: "Data", rows: [], merges: [] };
    let lastTable = null;
    for (const pg of pages) {
      pg.blocks.forEach((b, bi) => {
        if (b.type === "table") {
          /* a table that continues from the previous page: glue it on, skipping a repeated header */
          if (bi === 0 && lastTable && lastTable.ncols === b.ncols) {
            const same = lastTable.first.every((c, k) => (c.t || "") === (b.rows[0][k].t || ""));
            tableRows(same ? { ...b, rows: b.rows.slice(1), merges: b.merges.filter((m) => m.r > 0).map((m) => ({ ...m, r: m.r - 1 })) } : b, sh, false);
          } else { blank(sh); tableRows(b, sh, true); }
          lastTable = { ncols: b.ncols, first: b.rows[0] };
        } else { if (bi === 0) lastTable = null; textRow(b, sh); }
      });
    }
    if (sh.rows.length) { sh.name = safeSheet("Data", used); sheets.push(sh); }
  } else if (opt.layout === "table") {
    pages.forEach((pg) => {
      let k = 1;
      pg.blocks.filter((b) => b.type === "table").forEach((b) => {
        const sh = { name: safeSheet(`P${pg.n}-T${k++}`, used), rows: [], merges: [] };
        tableRows(b, sh, true);
        sheets.push(sh);
      });
    });
  } else {
    pages.forEach((pg) => {
      if (!pg.blocks.length) return;
      const sh = { name: safeSheet(`Page ${pg.n}`, used), rows: [], merges: [] };
      pg.blocks.forEach((b) => {
        if (b.type === "table") { blank(sh); tableRows(b, sh, true); blank(sh); } else textRow(b, sh);
      });
      sheets.push(sh);
    });
  }
  sheets.forEach((sh) => { while (sh.rows.length && !sh.rows[sh.rows.length - 1].cells.length) sh.rows.pop(); });
  const stats = { pages: pages.length, sheets: sheets.length, tables: 0, rows: 0, ocr: pages.filter((p) => p.ocr).length };
  pages.forEach((p) => p.blocks.forEach((b) => { if (b.type === "table") stats.tables++; }));
  sheets.forEach((sh) => { stats.rows += sh.rows.filter((r) => r.table).length; });
  return { sheets, stats };
}

const cellText = (c) => (c == null ? "" : typeof c.v === "number" ? (c.fmt && c.fmt.includes("%") ? `${+(c.v * 100).toFixed(2)}%` : String(c.v)) : c.v);

function modelToCsv(model) {
  const esc = (s) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const out = [];
  model.sheets.forEach((sh, k) => {
    if (k) out.push("");
    sh.rows.forEach((r) => out.push(r.cells.map((c) => esc(cellText(c))).join(",")));
  });
  return "\uFEFF" + out.join("\r\n") + "\r\n";
}

/* ========================================================================== */
/* ENGINE END                                                                 */
/* ========================================================================== */

/* ----------------------------- pdf.js helpers ----------------------------- */

function makeFontOf(page) {
  const cache = new Map();
  return (fontName) => {
    if (cache.has(fontName)) return cache.get(fontName);
    let name = "", b = false;
    try {
      if (page.commonObjs.has(fontName)) {
        const f = page.commonObjs.get(fontName);
        name = f.name || ""; b = !!(f.bold || f.black);
      }
    } catch { /* font not resolved */ }
    if (/bold|black|heavy|semibold|demi/i.test(name)) b = true;
    const r = { b };
    cache.set(fontName, r);
    return r;
  };
}

function parseRange(text, n) {
  const set = new Set();
  for (const part of text.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(part);
    if (!m) return null;
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < a || b > n) return null;
    for (let p = a; p <= b; p++) set.add(p);
  }
  return set.size ? [...set].sort((x, y) => x - y) : null;
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const LANGS = [
  ["eng", "English"], ["urd", "Urdu"], ["ara", "Arabic"], ["hin", "Hindi"], ["spa", "Spanish"], ["fra", "French"],
  ["deu", "German"], ["ita", "Italian"], ["por", "Portuguese"], ["rus", "Russian"], ["tur", "Turkish"],
  ["ind", "Indonesian"], ["chi_sim", "Chinese (Simplified)"], ["jpn", "Japanese"], ["kor", "Korean"],
];

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

/* ------------------------------ XLSX writer ------------------------------- */

async function buildXlsx(model, opts) {
  const mod = await import("exceljs");
  const ExcelJS = mod.default || mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = "PDF to Excel";
  const thin = { style: "thin", color: { argb: "FFBFBFBF" } };
  const edge = { top: thin, bottom: thin, left: thin, right: thin };

  for (const sh of model.sheets) {
    const ws = wb.addWorksheet(sh.name);
    const widths = [];
    sh.rows.forEach((r, ri) => {
      const row = ws.addRow(r.cells.map((c) => (c ? c.v : null)));
      r.cells.forEach((c, ci) => {
        if (!c) { if (r.table && opts.borders) row.getCell(ci + 1).border = edge; return; }
        const cell = row.getCell(ci + 1);
        if (c.fmt) cell.numFmt = c.fmt;
        if (c.b || r.hdr) cell.font = { bold: true };
        if (r.table) {
          cell.alignment = { vertical: "top", wrapText: false, horizontal: typeof c.v === "number" ? "right" : undefined };
          if (opts.borders) cell.border = edge;
          if (r.hdr) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF9" } };
          const len = typeof c.v === "number" ? String(c.v).length + 2 : String(c.v).length;
          widths[ci] = Math.max(widths[ci] || 0, len);
        }
      });
      if (r.hdr && opts.freeze && ri === 0) ws.views = [{ state: "frozen", ySplit: 1 }];
    });
    const ncols = Math.max(1, ...sh.rows.map((r) => r.cells.length));
    for (let c = 0; c < ncols; c++) ws.getColumn(c + 1).width = clampN((widths[c] || 10) + 2, 8, 60);
    sh.merges.forEach((m) => { try { ws.mergeCells(m.r + 1, m.c0 + 1, m.r + 1, m.c1 + 1); } catch { /* overlapping merge */ } });
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/* -------------------------------- UI bits --------------------------------- */

const card = "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl";
const lbl = "text-xs font-semibold uppercase tracking-wide text-slate-500";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-40";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(16,185,129,.3)] transition hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100";
const inputCls = "w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50";

const Chip = ({ on, onClick, children }) => (
  <button onClick={onClick} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${on ? "border-emerald-500 bg-emerald-500/15 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}>{children}</button>
);
const Row = ({ title, children }) => (
  <div className="space-y-2.5"><p className={lbl}>{title}</p>{children}</div>
);
const Check2 = ({ on, onChange, title, hint }) => (
  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
    <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-500" />
    <span>{title}{hint && <span className="block text-xs text-slate-500">{hint}</span>}</span>
  </label>
);

/* ------------------------------ result preview ---------------------------- */

function PrevSheet({ sh }) {
  const MAX = 40;
  const rows = sh.rows.slice(0, MAX);
  return (
    <div className="mb-5">
      <p className="mb-1.5 inline-block rounded-t-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">{sh.name}</p>
      <div className="overflow-x-auto rounded-b-md rounded-tr-md border border-slate-300 bg-white text-black">
        <table className="min-w-full border-collapse text-xs">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={r.hdr ? "bg-blue-50" : ""}>
                <td className="w-8 select-none border border-slate-200 bg-slate-100 px-1.5 text-center text-[10px] text-slate-500">{i + 1}</td>
                {r.cells.length === 0 && <td className="border border-slate-200 px-2 py-1">&nbsp;</td>}
                {r.cells.map((c, j) => (
                  <td key={j} className={`border border-slate-200 px-2 py-1 align-top ${c && typeof c.v === "number" ? "text-right" : ""} ${c && (c.b || r.hdr) ? "font-bold" : ""}`}>
                    {cellText(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sh.rows.length > MAX && <p className="mt-1 text-xs text-slate-500">…and {sh.rows.length - MAX} more rows</p>}
    </div>
  );
}

/* ================================== PAGE ================================== */

export default function PdfToExcel() {
  const [stage, setStage] = useState("idle"); // idle | ready | working | done
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [thumbs, setThumbs] = useState([]);
  const [pw, setPw] = useState("");
  const [needPw, setNeedPw] = useState(false);
  const [rangeMode, setRangeMode] = useState("all");
  const [rangeText, setRangeText] = useState("");
  const [opt, setOpt] = useState({
    format: "xlsx", ocr: "auto", lang: "eng", content: "tables", layout: "page", sens: "normal",
    numbers: true, header: true, borders: true, freeze: true, name: "",
  });
  const [progress, setProgress] = useState({ pct: 0, msg: "" });
  const [result, setResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const fileRef = useRef(null), docRef = useRef(null), pdfjsRef = useRef(null), cancelRef = useRef(false), pendingRef = useRef(null);

  const picked = rangeMode === "all" ? Array.from({ length: numPages }, (_, i) => i + 1) : parseRange(rangeText, numPages);
  const rangeBad = rangeMode === "custom" && !picked;

  const initPdfjs = async () => {
    if (pdfjsRef.current) return pdfjsRef.current;
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjsRef.current = pdfjs;
    return pdfjs;
  };

  const reset = () => {
    docRef.current?.destroy?.();
    docRef.current = null;
    setFile(null); setNumPages(0); setThumbs([]); setResult(null); setShowPreview(false);
    setErr(""); setNeedPw(false); setPw(""); setStage("idle"); setRangeMode("all"); setRangeText("");
  };

  const loadFile = async (f, password) => {
    if (!f) return;
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { setErr("Please choose a PDF file."); return; }
    setErr(""); setBusy(true);
    try {
      const pdfjs = await initPdfjs();
      const buf = await f.arrayBuffer();
      docRef.current?.destroy?.();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), password: password || undefined, fontExtraProperties: true }).promise;
      docRef.current = doc;
      pendingRef.current = null;
      setNeedPw(false);
      setFile(f);
      setNumPages(doc.numPages);
      setOpt((o) => ({ ...o, name: f.name.replace(/\.pdf$/i, "") }));
      setResult(null);
      setStage("ready");
      /* thumbnails of the first pages */
      const t = [];
      for (let n = 1; n <= Math.min(doc.numPages, 24); n++) {
        if (docRef.current !== doc) return;
        const page = await doc.getPage(n);
        const vp0 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 110 / Math.max(vp0.width, vp0.height) });
        const cv = document.createElement("canvas");
        cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
        await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
        t.push(cv.toDataURL("image/jpeg", 0.7));
        setThumbs([...t]);
        page.cleanup();
      }
    } catch (e) {
      if (e && e.name === "PasswordException") { pendingRef.current = f; setNeedPw(true); setErr(e.code === 2 ? "Wrong password — try again." : ""); }
      else { console.error(e); setErr("Couldn’t open this PDF. It may be damaged."); }
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------- conversion ------------------------------ */

  const convert = async () => {
    const doc = docRef.current;
    if (!doc || !picked) return;
    cancelRef.current = false;
    setErr(""); setStage("working"); setProgress({ pct: 1, msg: "Starting…" });
    let worker = null;
    const pages = [];
    const gapK = opt.sens === "high" ? 1.2 : opt.sens === "low" ? 3.2 : 2.0;
    const includeText = opt.content === "all" && opt.layout !== "table";
    try {
      for (let k = 0; k < picked.length; k++) {
        if (cancelRef.current) throw new Error("cancelled");
        const n = picked[k], base = (k / picked.length) * 92;
        setProgress({ pct: base, msg: `Reading page ${n} (${k + 1} of ${picked.length})…` });
        await tick();
        const page = await doc.getPage(n);
        const vp = page.getViewport({ scale: 1 });
        const W = vp.width, H = vp.height;
        const tc = await page.getTextContent();
        const items = extractItems(tc, vp.transform, makeFontOf(page));
        const all = items.map((i) => i.s).join("").replace(/\s/g, "");
        const garbled = all.length > 0 && (all.match(/[\uE000-\uF8FF\uFFFD]/g) || []).length > all.length * 0.3;
        const needOcr = opt.ocr === "always" || (opt.ocr === "auto" && (all.length < 20 || garbled));

        if (needOcr) {
          if (!worker) {
            setProgress({ pct: base, msg: "Loading text recognition (first time only)…" });
            const { createWorker } = await import("tesseract.js");
            const langs = opt.lang === "eng" ? "eng" : `${opt.lang}+eng`;
            worker = await createWorker(langs, 1, {
              logger: (m) => { if (m.status === "recognizing text") setProgress((p) => ({ ...p, msg: `Recognising text on page ${n}… ${Math.round(m.progress * 100)}%` })); },
            });
          }
          const scale = clampN(2600 / Math.max(W, H), 1.5, 3.5);
          const vps = page.getViewport({ scale });
          const cv = document.createElement("canvas");
          cv.width = Math.ceil(vps.width); cv.height = Math.ceil(vps.height);
          const cx = cv.getContext("2d");
          cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height);
          await page.render({ canvasContext: cx, viewport: vps }).promise;
          setProgress({ pct: base + 1, msg: `Recognising text on page ${n}…` });
          const { data } = await worker.recognize(cv, {}, { blocks: true });
          const lines = makeLines(ocrItems(data, scale), gapK);
          pages.push({ n, ocr: true, blocks: toBlocks(lines, includeText) });
          cv.width = cv.height = 0;
        } else {
          pages.push({ n, ocr: false, blocks: toBlocks(makeLines(items, gapK), includeText) });
        }
        page.cleanup();
      }
      if (worker) { await worker.terminate(); worker = null; }
      if (cancelRef.current) throw new Error("cancelled");

      setProgress({ pct: 94, msg: "Building your spreadsheet…" });
      await tick();
      const model = assemble(pages, opt);
      const name = (opt.name.trim() || "spreadsheet").replace(/[\\/:*?"<>|]+/g, "_");
      let blob, fname;
      if (opt.format === "csv") {
        blob = new Blob([modelToCsv(model)], { type: "text/csv;charset=utf-8" });
        fname = `${name}.csv`;
      } else {
        blob = await buildXlsx(model, opt);
        fname = `${name}.xlsx`;
      }
      setResult({ blob, name: fname, model });
      setProgress({ pct: 100, msg: "Done" });
      setStage("done");
      if (model.sheets.length) download(blob, fname);
    } catch (e) {
      if (worker) { try { await worker.terminate(); } catch { /* ignore */ } }
      if (e && e.message === "cancelled") { setStage("ready"); return; }
      console.error(e);
      setErr("Something went wrong during conversion. Try turning off OCR or pick fewer pages.");
      setStage("ready");
    }
  };

  const isCsv = opt.format === "csv";

  /* ---------------------------------- JSX --------------------------------- */

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-600/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-teal-600/15 blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="text-center">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">PDF to Excel</span>
            <h1 className="mt-5 text-4xl font-black sm:text-5xl">Convert PDF tables to Excel.</h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">Finds tables, keeps numbers as real numbers, reads scanned pages with OCR. Everything stays on your device.</p>
          </div>

          <input ref={fileRef} hidden type="file" accept="application/pdf,.pdf"
            onChange={(e) => { loadFile(e.target.files[0]); e.target.value = ""; }} />

          <div className="mt-8 space-y-4">
            {/* 1 — choose file */}
            {stage === "idle" && (
              <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); }}
                className="flex flex-col items-center rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 px-6 py-16 text-center transition hover:border-emerald-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-400"><FileText size={30} /></div>
                <h2 className="mt-6 text-2xl font-bold">Select a PDF file</h2>
                <p className="mt-2 text-slate-400">Drag &amp; drop it here, or choose it from your device.</p>

                {needPw ? (
                  <div className="mt-8 w-full max-w-sm space-y-3">
                    <p className="flex items-center justify-center gap-2 text-sm text-amber-400"><Lock size={15} />This PDF is password protected</p>
                    <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className={inputCls}
                      onKeyDown={(e) => { if (e.key === "Enter") loadFile(pendingRef.current, pw); }} />
                    <div className="flex justify-center gap-3">
                      <button onClick={() => loadFile(pendingRef.current, pw)} className={btnPrimary}>Unlock</button>
                      <button onClick={reset} className={btn}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8">
                    <button onClick={() => fileRef.current.click()} disabled={busy} className={btnPrimary}>
                      {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}Choose PDF
                    </button>
                  </div>
                )}
                <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
                  {["Table detection", "Real numbers & %", "Merged cells", "Sheet per page / table", "Scanned PDFs (OCR)", "XLSX & CSV"].map((t) => (
                    <span key={t} className="rounded-full border border-slate-800 px-3 py-1">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {err && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</p>}

            {/* 2 — options */}
            {stage === "ready" && file && (
              <>
                <div className={`${card} space-y-4 p-4 sm:p-5`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400"><FileText size={22} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{file.name}</p>
                      <p className="text-xs text-slate-500">{numPages} page{numPages > 1 ? "s" : ""} · {fmtSize(file.size)}</p>
                    </div>
                    <button onClick={reset} aria-label="Remove file" className="rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={16} /></button>
                  </div>
                  {thumbs.length > 0 && (
                    <div className="flex gap-2.5 overflow-x-auto py-1">
                      {thumbs.map((t, i) => (
                        <div key={i} className={`relative h-24 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${picked && picked.includes(i + 1) ? "border-emerald-500" : "border-slate-800 opacity-40"}`}>
                          <img src={t} alt={`Page ${i + 1}`} className="h-full w-auto" draggable={false} />
                          <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[10px] font-semibold">{i + 1}</span>
                        </div>
                      ))}
                      {numPages > thumbs.length && <span className="flex shrink-0 items-center px-2 text-xs text-slate-500">+{numPages - thumbs.length} more</span>}
                    </div>
                  )}
                </div>

                <div className={`${card} space-y-5 p-4 sm:p-5`}>
                  <Row title="Convert to">
                    <div className="flex flex-wrap gap-2">
                      <Chip on={opt.format === "xlsx"} onClick={() => setOpt({ ...opt, format: "xlsx" })}>Excel (.xlsx)</Chip>
                      <Chip on={opt.format === "csv"} onClick={() => setOpt({ ...opt, format: "csv" })}>CSV (.csv)</Chip>
                    </div>
                  </Row>

                  <Row title="Pages">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip on={rangeMode === "all"} onClick={() => setRangeMode("all")}>All pages</Chip>
                      <Chip on={rangeMode === "custom"} onClick={() => setRangeMode("custom")}>Custom range</Chip>
                      {rangeMode === "custom" && (
                        <input value={rangeText} onChange={(e) => setRangeText(e.target.value)} placeholder="e.g. 1-3, 5, 8-10"
                          className={`${inputCls} !w-52 ${rangeBad && rangeText ? "!border-red-500/60" : ""}`} />
                      )}
                    </div>
                  </Row>

                  <Row title="What to extract">
                    <div className="flex flex-wrap gap-2">
                      <Chip on={opt.content === "tables"} onClick={() => setOpt({ ...opt, content: "tables" })}>Tables only</Chip>
                      <Chip on={opt.content === "all"} onClick={() => setOpt({ ...opt, content: "all" })}>Tables + other text</Chip>
                    </div>
                  </Row>

                  <Row title="Sheets">
                    <div className="flex flex-wrap gap-2">
                      <Chip on={opt.layout === "page"} onClick={() => setOpt({ ...opt, layout: "page" })}>One per page</Chip>
                      <Chip on={opt.layout === "table"} onClick={() => setOpt({ ...opt, layout: "table" })}>One per table</Chip>
                      <Chip on={opt.layout === "single"} onClick={() => setOpt({ ...opt, layout: "single" })}>Everything on one sheet</Chip>
                    </div>
                    {opt.layout === "single" && <p className="text-xs text-slate-500">Tables that continue across pages are joined into one, and repeated header rows are dropped.</p>}
                  </Row>

                  <Row title="Column detection">
                    <div className="flex flex-wrap gap-2">
                      <Chip on={opt.sens === "low"} onClick={() => setOpt({ ...opt, sens: "low" })}>Wide gaps only</Chip>
                      <Chip on={opt.sens === "normal"} onClick={() => setOpt({ ...opt, sens: "normal" })}>Normal</Chip>
                      <Chip on={opt.sens === "high"} onClick={() => setOpt({ ...opt, sens: "high" })}>Tight columns</Chip>
                    </div>
                    <p className="text-xs text-slate-500">If columns get merged together, try “Tight columns”. If one cell is split into several, try “Wide gaps only”.</p>
                  </Row>

                  <Row title="Scanned pages (OCR)">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip on={opt.ocr === "auto"} onClick={() => setOpt({ ...opt, ocr: "auto" })}>Auto-detect</Chip>
                      <Chip on={opt.ocr === "always"} onClick={() => setOpt({ ...opt, ocr: "always" })}>Always OCR</Chip>
                      <Chip on={opt.ocr === "never"} onClick={() => setOpt({ ...opt, ocr: "never" })}>Off</Chip>
                      {opt.ocr !== "never" && (
                        <select value={opt.lang} onChange={(e) => setOpt({ ...opt, lang: e.target.value })} className={`${inputCls} !w-auto`}>
                          {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Auto-detect only runs OCR on pages without selectable text. The language pack downloads the first time it’s used.</p>
                  </Row>

                  <div className="space-y-3 border-t border-slate-800 pt-5">
                    <p className={lbl}>Cells</p>
                    <Check2 on={opt.numbers} onChange={(v) => setOpt({ ...opt, numbers: v })} title="Convert numbers" hint="“1,234.50”, “(45)” and “12%” become real numbers you can calculate with" />
                    {!isCsv && (
                      <>
                        <Check2 on={opt.header} onChange={(v) => setOpt({ ...opt, header: v })} title="Style first row of each table as header" />
                        {opt.header && <Check2 on={opt.freeze} onChange={(v) => setOpt({ ...opt, freeze: v })} title="Freeze the header row" hint="Only when a sheet starts with a table" />}
                        <Check2 on={opt.borders} onChange={(v) => setOpt({ ...opt, borders: v })} title="Draw table borders" />
                      </>
                    )}
                  </div>

                  <input value={opt.name} onChange={(e) => setOpt({ ...opt, name: e.target.value })} placeholder="File name" className={inputCls} />
                  <button onClick={convert} disabled={rangeBad || !picked} className={btnPrimary + " w-full"}>
                    <ScanLine size={16} />Convert {picked ? picked.length : 0} page{picked && picked.length > 1 ? "s" : ""}
                  </button>
                </div>
              </>
            )}

            {/* 3 — working */}
            {stage === "working" && (
              <div className={`${card} space-y-4 p-6`}>
                <div className="flex items-center gap-3">
                  <Loader2 size={20} className="shrink-0 animate-spin text-emerald-400" />
                  <p className="text-sm text-slate-200">{progress.msg}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-300" style={{ width: `${progress.pct}%` }} />
                </div>
                <button onClick={() => { cancelRef.current = true; }} className={btn}><X size={15} />Cancel</button>
              </div>
            )}

            {/* 4 — done */}
            {stage === "done" && result && (
              <>
                {result.model.sheets.length === 0 ? (
                  <div className={`${card} space-y-4 p-6 text-center`}>
                    <h2 className="text-xl font-bold">No tables found</h2>
                    <p className="text-sm text-amber-400">
                      Nothing table-like was detected. Try “Tight columns”, switch to “Tables + other text”, or set OCR to “Always OCR” if the PDF is scanned.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <button onClick={() => { setStage("ready"); setShowPreview(false); }} className={btnPrimary}><RefreshCw size={15} />Change options</button>
                      <button onClick={reset} className={btn}>Convert another PDF</button>
                    </div>
                  </div>
                ) : (
                  <div className={`${card} space-y-5 p-6 text-center`}>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"><Check size={28} /></div>
                    <div>
                      <h2 className="text-2xl font-bold">Your file is ready</h2>
                      <p className="mt-1 text-sm text-slate-400">{result.name} · {fmtSize(result.blob.size)}</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-300">
                      {[`${result.model.stats.tables} table${result.model.stats.tables === 1 ? "" : "s"}`, `${result.model.stats.rows.toLocaleString()} table rows`,
                        isCsv ? null : `${result.model.stats.sheets} sheet${result.model.stats.sheets === 1 ? "" : "s"}`,
                        result.model.stats.ocr ? `${result.model.stats.ocr} page${result.model.stats.ocr > 1 ? "s" : ""} read with OCR` : null]
                        .filter(Boolean).map((t) => <span key={t} className="rounded-full border border-slate-700 px-3 py-1">{t}</span>)}
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <button onClick={() => download(result.blob, result.name)} className={btnPrimary}><Download size={16} />Download again</button>
                      <button onClick={() => setShowPreview((s) => !s)} className={btn}>{showPreview ? <EyeOff size={16} /> : <Eye size={16} />}{showPreview ? "Hide preview" : "Preview"}</button>
                      <button onClick={() => { setStage("ready"); setShowPreview(false); }} className={btn}><RefreshCw size={15} />Change options</button>
                      <button onClick={reset} className={btn}>Convert another PDF</button>
                    </div>
                    {result.model.stats.tables === 0 && (
                      <p className="text-sm text-amber-400">No real tables were detected, only plain text. Try “Tight columns” if this PDF has a table.</p>
                    )}
                  </div>
                )}

                {showPreview && result.model.sheets.length > 0 && (
                  <div className={`${card} p-3 sm:p-5`}>
                    <p className="mb-3 text-xs text-slate-500">Preview of the first {Math.min(3, result.model.sheets.length)} sheet(s) — check column alignment before using the data.</p>
                    {result.model.sheets.slice(0, 3).map((sh) => <PrevSheet key={sh.name} sh={sh} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}