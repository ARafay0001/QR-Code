import { useEffect, useRef, useState } from "react";
import {
  Upload, FileText, Download, Loader2, X, Check, RefreshCw, Eye, EyeOff, Lock, ScanLine,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

/* ========================================================================== */
/*  npm i docx pdfjs-dist tesseract.js                                        */
/*  100% in-browser: files never leave the device.                            */
/*                                                                            */
/*   - Text PDFs  : real text, fonts, bold/italic/underline/strike, sizes,    */
/*                  superscripts / subscripts (A², xₙ), alignment, indents,   */
/*                  bullet/number lists, headings, tab-aligned lines, tables  */
/*                  (borders only where the PDF has ruling lines), 2-column   */
/*                  pages, images at their exact position, horizontal rules,  */
/*                  running headers / page numbers.                           */
/*   - Scanned PDFs: OCR (Tesseract) with paragraph + heading detection.      */
/*   - Urdu / Arabic / Hebrew text is written right-to-left.                  */
/*   - Fail-safe  : a page that can't be analysed falls back to plain text,   */
/*                  and a failed build is retried in "safe mode" instead of   */
/*                  aborting the whole conversion.                            */
/* ========================================================================== */

/* ========================================================================== */
/* ENGINE START  (pure functions: PDF text/geometry -> document model)        */
/* ========================================================================== */

const RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LIST_RE = /^\s*(?:[•●▪■◦○·‣⁃▫–—\-*»›]|(?:\d{1,3}|[a-z]|[ivx]{1,4})[.)]|[A-Z]\))\s+/;
const BULLET_RE = /^\s*[•●▪■◦○·‣⁃▫–—\-*»›]\s+/;
const NUMTOK = /^[-−–+]?\(?\d+(?:[.,/]\d+)?\)?%?$/;
const NUM_RE = /^\s*((?:\d{1,3}|[a-z]|[ivx]{1,4})[.)]|[A-Z]\))\s+/;

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
const hex6 = (c) => (/^[0-9A-F]{6}$/i.test(c || "") ? c.toUpperCase() : "000000");
/* 2D affine multiply (same convention as pdf.js Util.transform) */
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];

const FONT_RULES = [
  [/arial|helvet|arimo|liberationsans|nimbussan/i, "Arial"],
  [/times|tinos|liberationserif|nimbusrom/i, "Times New Roman"],
  [/courier|cousine|consolas|lucidaconsole|menlo|monaco|monospace/i, "Courier New"],
  [/calibri|carlito/i, "Calibri"], [/cambria|caladea/i, "Cambria"], [/georgia/i, "Georgia"],
  [/verdana/i, "Verdana"], [/tahoma/i, "Tahoma"], [/trebuc/i, "Trebuchet MS"], [/segoe/i, "Segoe UI"],
  [/garamond/i, "Garamond"], [/palatino|bookantiqua/i, "Palatino Linotype"],
  [/comicsans/i, "Comic Sans MS"], [/impact/i, "Impact"], [/centurygothic/i, "Century Gothic"],
];
function wordFont(name, generic) {
  const n = (name || "").replace(/^[A-Z]{6}\+/, "").replace(/[\s_]/g, "");
  for (const [re, f] of FONT_RULES) if (re.test(n)) return f;
  if (/serif/i.test(generic || "") && !/sans/i.test(generic || "")) return "Times New Roman";
  if (/mono/i.test(generic || "")) return "Courier New";
  return "Arial";
}

/* ---------------------------- items -> lines ------------------------------ */

/*
 * Small items that sit right after a bigger one, raised or lowered (A², xₙ, A^(k+1)), are marked
 * sup / sub and pulled onto the base line. Without this they land on their own "line" and tear
 * paragraphs and tables apart.
 */
function attachScripts(items) {
  if (items.length < 3) return;
  const med = median(items.map((i) => i.fs));
  for (const s of items) {
    if (s.s.trim().length > 6) continue;
    let best = null, bd = Infinity;
    for (const L of items) {
      if (L === s || L.va || L.fs < s.fs * 1.18 || L.fs < med * 0.9) continue;
      const gap = s.x - (L.x + L.w), dy = s.y - L.y;
      if (gap < -L.fs * 0.5 || gap > L.fs * 1.6) continue;
      const up = dy < -0.15 * L.fs && dy > -0.85 * L.fs, down = dy > 0.1 * L.fs && dy < 0.55 * L.fs;
      if (!up && !down) continue;
      const d = Math.abs(gap) + Math.abs(dy);
      if (d < bd) { bd = d; best = { L, up }; }
    }
    if (best) { s.va = best.up ? "sup" : "sub"; s.y = best.L.y; }
  }
}

function extractItems(tc, vt, fontOf) {
  const items = [], rot = [];
  for (const it of tc.items) {
    if (typeof it.str !== "string" || !it.str.trim()) continue;
    const t = mul(vt, it.transform);
    const fs = Math.hypot(t[2], t[3]);
    if (!(fs >= 2)) continue;
    const f = fontOf(it.fontName);
    const o = { s: it.str, x: t[4], y: t[5], fs, w: Math.abs(it.width), b: f.b, i: f.i, f: f.f };
    (Math.abs(t[1]) > Math.abs(t[0]) * 0.5 ? rot : items).push(o);
  }
  attachScripts(items);
  return { items, rot };
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

function domSize(runs) {
  const m = new Map();
  for (const r of runs) {
    if (r.tab || r.br) continue;
    const k = Math.round(r.sz * 2) / 2;
    m.set(k, (m.get(k) || 0) + r.t.length);
  }
  let best = 0, bk = 11;
  m.forEach((v, k) => { if (v > best) { best = v; bk = k; } });
  return bk;
}

function buildLine(l) {
  const its = l.items;
  const total = its.reduce((n, it) => n + it.s.length, 0);
  const rtlN = its.reduce((n, it) => n + (RTL_RE.test(it.s) ? it.s.length : 0), 0);
  const rtl = rtlN > total * 0.5;
  its.sort((a, b) => (rtl ? b.x + b.w - (a.x + a.w) : a.x - b.x));
  const segs = [];
  let cur = null, prev = null;
  const addRun = (seg, it, text) => {
    const r = seg.runs[seg.runs.length - 1];
    if (r && r.b === it.b && r.i === it.i && r.f === it.f && r.va === it.va && !r.u === !it.u && !r.s === !it.k && Math.abs(r.sz - it.fs) < 0.7) r.t += text;
    else seg.runs.push({ t: text, b: it.b, i: it.i, sz: it.fs, f: it.f, va: it.va, u: !!it.u, s: !!it.k });
  };
  for (const it of its) {
    const x0 = it.x, x1 = it.x + it.w;
    if (!cur) { cur = { x: x0, xEnd: x1, runs: [] }; addRun(cur, it, it.s); prev = it; continue; }
    const gap = rtl ? prev.x - x1 : x0 - (prev.x + prev.w);
    const fs = (prev.fs + it.fs) / 2;
    /* matrix / numeric grids: neighbouring numbers drawn as separate items are separate cells even with a narrow gap */
    const numGrid = NUMTOK.test(prev.s.trim()) && NUMTOK.test(it.s.trim());
    if (gap > (numGrid ? Math.max(fs * 1.05, 6) : Math.max(fs * 1.25, 9))) {
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
  const runs = segs.flatMap((s) => s.runs);
  return {
    y: l.y, items: its, segs, rtl,
    x: Math.min(...segs.map((s) => s.x)), xEnd: Math.max(...segs.map((s) => s.xEnd)),
    fs: domSize(runs),
    text: segs.map((s) => s.runs.map((r) => r.t).join("")).join("  ").trim(),
  };
}

function makeLines(items) {
  return groupLines(items).map(buildLine).filter((l) => l.text).sort((a, b) => a.y - b.y);
}

function bodySize(lines) {
  const m = new Map();
  for (const l of lines) for (const s of l.segs) for (const r of s.runs) {
    const k = Math.round(r.sz * 2) / 2;
    m.set(k, (m.get(k) || 0) + r.t.length);
  }
  let best = 0, bk = 11;
  m.forEach((v, k) => { if (v > best) { best = v; bk = k; } });
  return bk;
}

/* ------------------------------ geometry --------------------------------- */

function computeGeo(lines, box) {
  if (!lines.length) return { left: box.x0, right: box.x1 };
  const maxW = Math.max(...lines.map((l) => l.xEnd - l.x), 1);
  const wide = lines.filter((l) => l.xEnd - l.x > maxW * 0.6);
  const base = wide.length >= 2 ? wide : lines;
  return { left: Math.min(...base.map((l) => l.x)), right: Math.max(...base.map((l) => l.xEnd)) };
}

function alignOf(l, geo) {
  const w = l.xEnd - l.x, cw = Math.max(1, geo.right - geo.left);
  if (l.segs.length > 1) return "l";
  if (Math.abs((l.x + l.xEnd) / 2 - (geo.left + geo.right) / 2) < 0.025 * cw + 2 && w < cw * 0.86 && l.x - geo.left > 0.04 * cw) return "c";
  if (Math.abs(l.xEnd - geo.right) < 4 && l.x - geo.left > 0.25 * cw && w < cw * 0.75) return "r";
  return "l";
}

/* two-column detection: a vertical gutter that (almost) no line crosses */
function findGutter(lines, pageW) {
  if (lines.length < 8) return null;
  const segs = lines.flatMap((l) => l.segs);
  const x0 = Math.min(...segs.map((s) => s.x)), x1 = Math.max(...segs.map((s) => s.xEnd));
  const W = x1 - x0;
  if (W < pageW * 0.5) return null;
  const N = Math.ceil(W) + 2, cover = new Int16Array(N);
  for (const s of segs) for (let x = Math.max(0, Math.floor(s.x - x0)); x <= Math.min(N - 1, Math.ceil(s.xEnd - x0)); x++) cover[x]++;
  const thr = Math.max(1, Math.floor(lines.length * 0.06));
  let best = null, runStart = -1;
  const lo = Math.floor(W * 0.3), hi = Math.ceil(W * 0.7);
  for (let x = lo; x <= hi + 1; x++) {
    const free = x <= hi && cover[x] <= thr;
    if (free && runStart < 0) runStart = x;
    if (!free && runStart >= 0) {
      const w = x - runStart;
      if (w >= 10 && (!best || w > best.w)) best = { s: runStart, w };
      runStart = -1;
    }
  }
  if (!best) return null;
  const gx = x0 + best.s + best.w / 2;
  const L = segs.filter((s) => s.xEnd <= gx + 2), R = segs.filter((s) => s.x >= gx - 2);
  if (L.length < 6 || R.length < 6) return null;
  if (median(L.map((s) => s.xEnd - s.x)) < 0.45 * (gx - x0)) return null;
  if (median(R.map((s) => s.xEnd - s.x)) < 0.45 * (x1 - gx)) return null;
  return { gx, gw: best.w, x0, x1 };
}

/* -------------------------------- tables --------------------------------- */

function columnsFrom(rows) {
  let x0 = Infinity, x1 = -Infinity;
  rows.forEach((r) => r.segs.forEach((s) => { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.xEnd); }));
  const N = Math.ceil(x1 - x0) + 2, cover = new Int16Array(N);
  rows.forEach((r) => r.segs.forEach((s) => {
    for (let x = Math.max(0, Math.floor(s.x - x0)); x <= Math.min(N - 1, Math.ceil(s.xEnd - x0)); x++) cover[x]++;
  }));
  const thr = rows.length >= 8 ? 1 : 0;
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

function cellPara(seg, align) {
  const runs = seg.runs.map((r) => ({ ...r }));
  if (runs.length) { runs[0].t = runs[0].t.replace(/^\s+/, ""); runs[runs.length - 1].t = runs[runs.length - 1].t.replace(/\s+$/, ""); }
  return { t: "p", runs, align, left: 0, first: 0, before: 0, line: null, rtl: RTL_RE.test(runs.map((r) => r.t).join("")), level: 0, bullet: false, tabs: null };
}

function tableAt(lines, i, geo, pitch) {
  if (lines[i].segs.length < 2) return null;
  let span = [], rows = [];
  let j = i;
  while (j < lines.length) {
    const l = lines[j], prev = lines[j - 1];
    if (l.segs.length >= 2) {
      if (j > i && l.y - prev.y > Math.max(l.fs, prev.fs) * pitch * 2.6) break;
      span.push({ l, row: true, idx: j }); rows.push(l); j++; continue;
    }
    /* a single piece of text between rows = wrapped / vertically-centred cell text. Rows with padding are
       spaced wider than text lines, so allow up to the typical row step */
    const steps = [];
    for (let k = 1; k < rows.length; k++) steps.push(rows[k].y - rows[k - 1].y);
    const lim = Math.max(Math.max(l.fs, prev.fs) * pitch * 1.35, steps.length ? median(steps) * 1.12 : 0);
    if (span.length && prev && l.y - prev.y <= lim && j + 1 < lines.length && lines[j + 1].segs.length >= 2) {
      span.push({ l, row: false, idx: j }); j++; continue;
    }
    break;
  }
  /* wrapped cell text that follows the last row */
  while (j < lines.length && rows.length) {
    const l = lines[j], prev = lines[j - 1];
    if (l.y - prev.y <= Math.max(l.fs, prev.fs) * pitch * 1.3 && l.segs.length < 2 && !LIST_RE.test(l.text) && l.fs <= prev.fs + 0.5) { span.push({ l, row: false, idx: j }); j++; }
    else break;
  }

  /* a single line only belongs to the table if it fits inside one column; a caption or label wider than
     the column ("R2 + 3R1, R3 - 2R1") ends the table. Re-check after every cut because columns change. */
  const fits = (l, cols) => l.segs.every((s) => {
    const c = cols.find((q) => s.x >= q.s - 3 && s.x <= q.e + 3);
    return c && s.xEnd <= c.e + Math.max(4, 0.3 * (c.e - c.s));
  });
  let cols = null;
  for (let guard = 0; guard < 6; guard++) {
    if (rows.length < 2) return null;
    cols = columnsFrom(rows);
    if (cols.length < 2) return null;
    const bad = span.findIndex((e) => !e.row && !fits(e.l, cols));
    if (bad < 0) break;
    j = span[bad].idx;
    span = span.slice(0, bad);
    while (span.length && !span[span.length - 1].row) j = span.pop().idx;
    rows = span.filter((e) => e.row).map((e) => e.l);
  }
  if (rows.length < 2 || !cols || cols.length < 2) return null;
  /* table of contents (title ...... page) is better as tab-stop paragraphs */
  if (cols.length === 2 && rows.every((r) => r.segs.length === 2 && /^[\divxlcIVXLC]{1,5}$/.test(r.segs[1].runs.map((x) => x.t).join("").trim()))) return null;

  const colOf = (x) => {
    let k = cols.findIndex((c) => x >= c.s - 3 && x <= c.e + 3);
    if (k >= 0) return k;
    let bd = Infinity;
    cols.forEach((c, n) => { const d = Math.abs(x - (c.s + c.e) / 2); if (d < bd) { bd = d; k = n; } });
    return k;
  };
  const endCol = (s, c0) => { let c1 = c0; while (c1 + 1 < cols.length && cols[c1 + 1].s + 2 < s.xEnd - 1) c1++; return c1; };
  /* alignment per column from how its entries line up (same left edge / right edge / centre) */
  const spread = (a) => Math.max(...a) - Math.min(...a);
  const colAlign = cols.map((_, k) => {
    const xs = [], xe = [];
    rows.forEach((r) => r.segs.forEach((s) => { if (colOf(s.x + 1) === k && endCol(s, k) === k) { xs.push(s.x); xe.push(s.xEnd); } }));
    if (xs.length < 2) return "l";
    if (spread(xs) <= 2.5) return "l";
    if (spread(xe) <= 2.5) return "r";
    if (spread(xs.map((x, i) => (x + xe[i]) / 2)) <= 3) return "c";
    return "l";
  });
  const alignFor = (c0, c1, s) => {
    if (c1 > c0) {
      const lg = s.x - cols[c0].s, rg = cols[c1].e - s.xEnd;
      if (Math.abs(lg - rg) < 4 && lg > 8) return "c";
      if (rg < 3 && lg > 8) return "r";
    }
    return colAlign[c0];
  };
  const trows = [], rowLines = [];
  const addRow = (l) => {
    const cells = [];
    let col = 0;
    for (const s of l.segs) {
      let c0 = colOf(s.x + 1), c1 = endCol(s, c0);
      if (c0 < col) c0 = col;
      if (c1 < c0) c1 = c0;
      /* more pieces than columns: glue the extra piece onto the previous cell instead of crashing */
      if (c0 >= cols.length) {
        const last = cells[cells.length - 1], lp = last && last.paras[last.paras.length - 1];
        if (lp) s.runs.forEach((r, k) => lp.runs.push({ ...r, t: (k ? "" : " ") + r.t }));
        continue;
      }
      if (c1 >= cols.length) c1 = cols.length - 1;
      while (col < c0) { cells.push({ c0: col, c1: col, paras: [] }); col++; }
      cells.push({ c0, c1, paras: [cellPara(s, alignFor(c0, c1, s))] });
      col = c1 + 1;
    }
    while (col < cols.length) { cells.push({ c0: col, c1: col, paras: [] }); col++; }
    trows.push({ cells }); rowLines.push(l);
  };
  span.forEach((e) => { if (e.row) addRow(e.l); });
  /* continuation lines go to the NEAREST row (text above a vertically-centred row belongs to it, not to the row above) */
  span.forEach((e) => {
    if (e.row) return;
    let r = 0, bd = Infinity;
    rowLines.forEach((rl, k) => { const d = Math.abs(rl.y - e.l.y); if (d < bd - 0.01) { bd = d; r = k; } });
    const above = e.l.y < rowLines[r].y - 1;
    for (const s of e.l.segs) {
      const c = colOf(s.x + 1);
      const cell = trows[r].cells.find((q) => c >= q.c0 && c <= q.c1);
      if (!cell) continue;
      const p = cellPara(s, alignFor(cell.c0, cell.c1, s));
      if (above) cell.paras.splice(cell.above = (cell.above || 0), 0, p), cell.above++;
      else cell.paras.push(p);
    }
  });
  /* cell boxes: left-aligned columns keep the spare gutter on their right, right-aligned ones on their left,
     centred ones stay symmetric, so text lands where it was in the PDF (cells have 4pt side margins) */
  const nc = cols.length, bl = [], br = [];
  for (let k = 0; k < nc; k++) {
    const c = cols[k], cx = (c.s + c.e) / 2;
    bl[k] = k === 0 ? c.s - 4 : br[k - 1];
    let r;
    if (k === nc - 1) r = c.e + 4;
    else {
      const nx = cols[k + 1].s - 4, mid = (c.e + cols[k + 1].s) / 2, A = colAlign[k], nA = colAlign[k + 1];
      if (A === "l") r = nx;
      else if (A === "r") r = nA === "l" ? mid : c.e + 4;
      else r = clampN(2 * cx - bl[k], c.e + 4, nA === "l" ? nx : Math.max(c.e + 4, mid));
    }
    br[k] = Math.max(r, c.e + 4, bl[k] + 8);
  }
  const widths = bl.map((l, k) => br[k] - l);
  const first = rows[0];
  return {
    end: j,
    block: {
      t: "table", cols: widths, x: Math.max(0, bl[0] - geo.left), rows: trows, ruled: false,
      y: first.y - first.fs, yEnd: lines[j - 1].y,
    },
  };
}

/* ------------------------------ paragraphs ------------------------------- */

const pushRun = (runs, r) => {
  const last = runs[runs.length - 1];
  if (last && !last.tab && !last.br && !r.tab && !r.br && last.b === r.b && last.i === r.i && last.f === r.f && last.va === r.va && !last.u === !r.u && !last.s === !r.s && Math.abs(last.sz - r.sz) < 0.7) last.t += r.t;
  else runs.push({ ...r });
};

function joinLines(runs, lr) {
  const last = runs[runs.length - 1], nextT = lr[0] ? lr[0].t : "";
  if (last && last.t !== undefined) {
    if (/[A-Za-zÀ-ÿ]-$/.test(last.t) && /^[a-zà-ÿ]/.test(nextT)) last.t = last.t.slice(0, -1);
    else if (!/\s$/.test(last.t) && !/^\s/.test(nextT)) last.t += " ";
  }
  lr.forEach((r) => pushRun(runs, r));
}

function stripLead(runs, n) {
  while (n > 0 && runs.length) {
    const r = runs[0];
    if (r.tab || r.br) { runs.shift(); continue; }
    if (r.t.length <= n) { n -= r.t.length; runs.shift(); }
    else { r.t = r.t.slice(n); n = 0; }
  }
}

/* shared by text + OCR paths. Mutates runs. returns {bullet, numbered} */
function applyList(runs) {
  const text = runs.filter((r) => !r.tab && !r.br).map((r) => r.t).join("");
  let m = BULLET_RE.exec(text);
  if (m) { stripLead(runs, m[0].length); return { bullet: true, numbered: false }; }
  m = NUM_RE.exec(text);
  if (m && runs.length) {
    const st = runs[0], marker = m[1];
    stripLead(runs, m[0].length);
    runs.unshift({ ...st, t: marker }, { tab: true, sz: st.sz });
    return { bullet: false, numbered: true };
  }
  return { bullet: false, numbered: false };
}

function headingLevel(ratio, nLines, chars, text, allBold) {
  if (!/[\p{L}]/u.test(text)) return 0;
  if (nLines <= 3 && chars <= 180) {
    if (ratio >= 1.9) return 1;
    if (ratio >= 1.45) return 2;
    if (ratio >= 1.2) return 3;
  }
  if (allBold && ratio >= 1.05 && nLines === 1 && chars <= 90 && !/[.,;:]$/.test(text)) return 3;
  return 0;
}

function finishPara(g, geo, body, pitch, prevY) {
  const first = g[0], last = g[g.length - 1];
  const runs = [], tabs = [];
  if (g.length === 1 && first.segs.length > 1) {
    const segs = first.rtl ? [...first.segs].reverse() : first.segs;
    segs.forEach((s, k) => {
      if (k) {
        runs.push({ tab: true, sz: first.fs });
        const right = Math.abs(s.xEnd - geo.right) < 8 && k === segs.length - 1;
        tabs.push({ pos: Math.max(0, (right ? geo.right : s.x) - geo.left), right });
      }
      s.runs.forEach((r) => pushRun(runs, r));
    });
  } else {
    g.forEach((l, idx) => {
      const lr = l.segs.flatMap((s) => s.runs);
      if (idx) joinLines(runs, lr); else lr.forEach((r) => pushRun(runs, r));
    });
  }
  const textRuns = runs.filter((r) => !r.tab && !r.br);
  if (!textRuns.length) return null;
  textRuns[0].t = textRuns[0].t.replace(/^\s+/, "");
  textRuns[textRuns.length - 1].t = textRuns[textRuns.length - 1].t.replace(/\s+$/, "");
  const fullText = textRuns.map((r) => r.t).join("");
  if (!fullText.trim()) return null;

  const rtl = g.filter((l) => l.rtl).length > g.length / 2;
  let align = g.length === 1 ? alignOf(first, geo) : "l";
  if (g.length >= 3) {
    const restL = Math.min(...g.slice(1).map((l) => l.x));
    if (g.slice(0, -1).every((l) => Math.abs(l.x - restL) < 2.5 || l === first) && g.slice(0, -1).every((l) => Math.abs(l.xEnd - geo.right) < 4)) align = "j";
  }
  /* a big / bold numbered line ("1. Echelon form") is a heading, not a list item: keep its number as text */
  const heading0 = headingLevel(domSize(runs) / body, g.length, fullText.length, fullText, textRuns.every((r) => r.b));
  const list = (g.length === 1 && first.segs.length > 1) || heading0 ? { bullet: false, numbered: false } : applyList(runs);
  const isList = list.bullet || list.numbered;

  const restLeft = g.length > 1 ? Math.min(...g.slice(1).map((l) => l.x)) : first.x;
  let left = Math.max(0, restLeft - geo.left), firstInd = first.x - restLeft;
  if (align === "c" || align === "r") { left = 0; firstInd = 0; }
  if (isList && g.length === 1) { left = Math.max(0, first.x - geo.left) + 18; firstInd = -18; }
  if (isList && g.length > 1 && firstInd >= -2) { firstInd = -18; left = Math.max(left, 18); }
  if (Math.abs(firstInd) < 3) firstInd = 0;
  if (left < 3) left = 0;
  if (rtl) { left = 0; firstInd = 0; }

  const fs = domSize(runs);
  const level = isList ? 0 : heading0;
  const diffs = [];
  for (let k = 1; k < g.length; k++) diffs.push(g[k].y - g[k - 1].y);
  const step = g.length > 1 ? median(diffs) : pitch * fs;
  let before = prevY == null ? 0 : Math.max(0, first.y - prevY - step);
  before = before < 1.5 ? 0 : Math.round(clampN(before, 0, 60) * 2) / 2;
  if (level) runs.forEach((r) => { if (!r.tab && !r.br && fs / body >= 1.2) r.b = r.b || level < 3; });

  return {
    t: "p", runs, align, left, first: firstInd, before, line: g.length > 1 ? Math.round(step * 2) / 2 : null,
    rtl, level, bullet: list.bullet, tabs: tabs.length ? tabs : null,
    y: first.y - first.fs, yEnd: last.y, fs,
  };
}

function splitParas(lines, geo, pitch) {
  const groups = [];
  let cur = null;
  const cw = Math.max(1, geo.right - geo.left);
  for (const l of lines) {
    const p = cur ? cur[cur.length - 1] : null;
    let brk = !cur;
    if (!brk) {
      const dy = l.y - p.y, fsM = Math.max(l.fs, p.fs);
      const al = alignOf(l, geo), ap = alignOf(p, geo);
      const curList = LIST_RE.test(cur[0].text);
      if (dy > pitch * fsM * 1.32 + 1) brk = true;
      else if (Math.abs(l.fs - p.fs) > 1.2) brk = true;
      else if (LIST_RE.test(l.text) || l.segs.length > 1 || p.segs.length > 1) brk = true;
      else if (al !== ap) brk = true;
      else if (ap === "l" && p.xEnd < geo.right - 0.22 * cw) brk = true;
      else if (al === "l" && !curList && l.x - p.x > 0.9 * l.fs && p.xEnd > geo.right - 0.2 * cw) brk = true;
    }
    if (brk) { cur = [l]; groups.push(cur); } else cur.push(l);
  }
  return groups;
}

/*
 * Lines -> blocks. `extras` are pre-built rule / image blocks (with y positions) that get
 * interleaved with the text by vertical position. Rules and inline images take real space in
 * the flow, so the gap before them is computed from the previous block and the next text's
 * gap is measured from their bottom edge. Floating images take no space.
 */
function toBlocks(lines, geo, body, opts, extras = []) {
  const ratios = [];
  for (let k = 1; k < lines.length; k++) {
    const dy = lines[k].y - lines[k - 1].y, fs = lines[k].fs;
    if (Math.abs(fs - lines[k - 1].fs) < 0.8 && dy > 0.8 * fs && dy < 3.2 * fs) ratios.push(dy / fs);
  }
  const pitch = ratios.length ? clampN(pctl(ratios, 0.3), 1.0, 2.6) : 1.2;
  let ex = [...extras].sort((a, b) => a.y - b.y);
  const blocks = [];
  let run = [], prevY = null, prevFs = body, ei = 0;

  const flush = () => {
    if (!run.length) return;
    for (const g of splitParas(run, geo, pitch)) {
      const b = finishPara(g, geo, body, pitch, prevY);
      if (b) { blocks.push(b); prevY = b.yEnd; prevFs = b.fs; }
    }
    run = [];
  };
  const place = (e) => {
    if (e.t === "rule") {
      const hR = 1 + e.th;
      e.left = e.x - geo.left; e.right = geo.right - (e.x + e.w);
      if (prevY == null) { e.before = 0; e.yEnd = e.y - body * 0.25; }
      else { e.before = Math.round(Math.max(0, e.y - prevY - prevFs * 0.25 - hR) * 2) / 2; e.yEnd = prevY + e.before + hR; }
      prevY = e.yEnd; prevFs = body;
    } else if (!e.float) {
      e.before = prevY == null ? 0 : Math.round(Math.max(0, e.y - prevY - prevFs * 0.25) * 2) / 2;
      e.yEnd = e.y + e.h - body * 0.25; prevY = e.yEnd; prevFs = body;
    }
    blocks.push(e);
  };
  const upTo = (limit) => { while (ei < ex.length && ex[ei].y <= limit) { flush(); place(ex[ei]); ei++; } };

  let i = 0;
  while (i < lines.length) {
    const t = opts.tables ? tableAt(lines, i, geo, pitch) : null;
    if (t) {
      const b = t.block;
      /* the table draws its own borders: drop rules that lie inside it. If the PDF had ruling lines
         there, remember it so borders are only drawn for tables that really had them */
      const inside = (e, k) => k >= ei && e.t === "rule" && e.y >= b.y - 6 && e.y <= b.yEnd + 8;
      b.ruled = ex.filter(inside).length >= 2;
      ex = ex.filter((e, k) => !inside(e, k));
      upTo(b.y); flush();
      blocks.push(b); prevY = b.yEnd; prevFs = 10; i = t.end;
    } else {
      upTo(lines[i].y - lines[i].fs * 0.9);
      run.push(lines[i]); i++;
    }
  }
  flush();
  upTo(Infinity);
  return blocks;
}

function ruleBlocks(rules) {
  return rules.map((r) => ({ t: "rule", x: r.x, w: r.w, th: r.th, color: hex6(r.color), dash: r.dash, y: r.y, yEnd: r.y, before: 0, left: 0, right: 0 }));
}

function imgBlocks(imgs, geo, float) {
  const cw = Math.max(1, geo.right - geo.left);
  return imgs.map((im) => {
    const cx = im.x + im.w / 2;
    const al = Math.abs(cx - (geo.left + geo.right) / 2) < 0.06 * cw ? "c" : im.x + im.w > geo.right - 0.05 * cw && im.x > geo.left + 0.3 * cw ? "r" : "l";
    let w = im.w, h = im.h;
    if (!float && w > cw) { h *= cw / w; w = cw; }
    return { t: "img", data: im.data, w, h, x: im.x, align: al, left: al === "l" ? Math.max(0, im.x - geo.left) : 0, float: !!float, y: im.y, yEnd: im.y + im.h, before: 0 };
  });
}

/* ------------------------- running headers / footers ---------------------- */

function detectHeaderFooter(raw) {
  const tp = raw.filter((p) => p.kind === "text" && p.lines.length);
  if (tp.length < 3) return;
  const norm = (t) => t.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
  const top = new Map(), bot = new Map();
  for (const p of tp) {
    const st = new Set(), sb = new Set();
    for (const l of p.lines) {
      if (l.y < p.H * 0.1) st.add(norm(l.text));
      else if (l.y > p.H * 0.9) sb.add(norm(l.text));
    }
    st.forEach((k) => top.set(k, (top.get(k) || 0) + 1));
    sb.forEach((k) => bot.set(k, (bot.get(k) || 0) + 1));
  }
  const need = Math.max(3, Math.ceil(tp.length * 0.5));
  for (const p of tp) {
    const keep = [];
    for (const l of p.lines) {
      const k = norm(l.text);
      if (l.y < p.H * 0.1 && k && top.get(k) >= need) (p.header = p.header || []).push(l);
      else if (l.y > p.H * 0.9 && k && bot.get(k) >= need) (p.footer = p.footer || []).push(l);
      else keep.push(l);
    }
    p.lines = keep;
  }
}

function hfPara(l, W) {
  /* "left text ........ Page 4" : keep both parts, joined by a right-aligned tab */
  if (l.segs.length > 1) {
    const last = l.segs[l.segs.length - 1];
    const m = /^\s*(page\s*)?(\d+)(\s*(?:of|\/)\s*\d+)?\s*$/i.exec(last.runs.map((r) => r.t).join(""));
    return {
      runs: l.segs.slice(0, -1).flatMap((s, k) => (k ? [{ t: "  ", b: false, i: false, sz: l.fs, f: "Arial" }] : []).concat(s.runs.map((r) => ({ ...r })))),
      right: { runs: last.runs.map((r) => ({ ...r })), num: m ? (m[1] || "") : null },
      align: "l", pageNum: false, sz: l.fs, rtl: l.rtl,
    };
  }
  const c = (l.x + l.xEnd) / 2;
  const align = c < W * 0.38 ? "l" : c > W * 0.62 ? "r" : "c";
  const runs = l.segs.flatMap((s) => s.runs).map((r) => ({ ...r }));
  const isNum = /^\s*\d+\s*$/.test(l.text) || /^\s*(page\s*)?\d+\s*(of|\/)\s*\d+\s*$/i.test(l.text);
  return { runs, align, pageNum: isNum, sz: l.fs, rtl: l.rtl };
}

/* ------------------------------- OCR -> model ----------------------------- */

function ocrParagraphs(data) {
  const out = [];
  const take = (p) => {
    const lines = (p.lines || [])
      .map((l) => ({ text: (l.text || (l.words || []).map((w) => w.text).join(" ")).replace(/\s+/g, " ").trim(), bbox: l.bbox }))
      .filter((l) => l.text && l.bbox);
    if (lines.length) {
      const bb = p.bbox || {
        x0: Math.min(...lines.map((l) => l.bbox.x0)), y0: Math.min(...lines.map((l) => l.bbox.y0)),
        x1: Math.max(...lines.map((l) => l.bbox.x1)), y1: Math.max(...lines.map((l) => l.bbox.y1)),
      };
      out.push({ lines, bb });
    }
  };
  if (data?.blocks?.length) data.blocks.forEach((b) => (b.paragraphs || []).forEach(take));
  else if (data?.paragraphs?.length) data.paragraphs.forEach(take);
  if (!out.length && data?.text) {
    data.text.split(/\n\s*\n/).forEach((t) => {
      const x = t.replace(/\s+/g, " ").trim();
      if (x) out.push({ lines: [{ text: x, bbox: null }], bb: null });
    });
  }
  return out;
}

function ocrToBlocks(data, scale, W, H) {
  const ps = ocrParagraphs(data).map((p) => {
    const lh = p.lines.filter((l) => l.bbox).map((l) => (l.bbox.y1 - l.bbox.y0) / scale);
    const bb = p.bb && { x0: p.bb.x0 / scale, y0: p.bb.y0 / scale, x1: p.bb.x1 / scale, y1: p.bb.y1 / scale };
    return { lines: p.lines, bb, fs: lh.length ? clampN(median(lh) * 0.9, 6, 60) : 11 };
  });
  if (!ps.length) return { blocks: [], m: null };
  /* body size = most common size, weighted by text length; sizes close to it snap to it */
  const wm = new Map();
  ps.forEach((p) => { const k = Math.round(p.fs); wm.set(k, (wm.get(k) || 0) + p.lines.reduce((n, l) => n + l.text.length, 0)); });
  let body = 11, best = 0;
  wm.forEach((v, k) => { if (v > best) { best = v; body = k; } });
  ps.forEach((p) => { if (Math.abs(p.fs - body) / body < 0.14) p.fs = body; else p.fs = Math.round(p.fs * 2) / 2; });

  const boxed = ps.filter((p) => p.bb);
  const geo = boxed.length
    ? { left: Math.min(...boxed.map((p) => p.bb.x0)), right: Math.max(...boxed.map((p) => p.bb.x1)) }
    : { left: 54, right: W - 54 };
  const blocks = [];
  let prevBottom = null;
  for (const p of ps) {
    const joined = p.lines.map((l) => l.text).join(" ");
    const rtl = (joined.match(new RegExp(RTL_RE.source, "g")) || []).length > joined.length * 0.3;
    const font = rtl ? "Arial" : "Calibri";
    const runs = [];
    p.lines.forEach((l, k) => {
      const piece = { t: l.text, b: false, i: false, sz: p.fs, f: font };
      if (!k) { runs.push(piece); return; }
      const pl = p.lines[k - 1];
      const soft = p.bb && pl.bbox && p.bb.x1 - pl.bbox.x1 / scale > 0.2 * (p.bb.x1 - p.bb.x0);
      if (soft) { runs.push({ br: true, sz: p.fs }); runs.push(piece); } else joinLines(runs, [piece]);
    });
    const list = applyList(runs);
    const isList = list.bullet || list.numbered;
    const text = runs.filter((r) => !r.tab && !r.br).map((r) => r.t).join("");
    if (!text.trim()) continue;
    const pseudo = p.bb ? { x: p.bb.x0, xEnd: p.bb.x1, segs: [1] } : null;
    let align = pseudo ? alignOf(pseudo, geo) : "l";
    let left = p.bb && align === "l" ? Math.max(0, p.bb.x0 - geo.left) : 0;
    let first = 0;
    if (isList) { left = left + 18; first = -18; }
    if (left < 3) left = 0;
    if (rtl) { left = 0; first = 0; }
    const level = isList ? 0 : headingLevel(p.fs / body, p.lines.length, text.length, text, false);
    if (level && p.fs / body >= 1.2) runs.forEach((r) => { if (!r.tab && !r.br) r.b = true; });
    let before = 0;
    if (p.bb && prevBottom != null) before = clampN(p.bb.y0 - prevBottom - p.fs * 0.3, 0, 48);
    if (before < 1.5) before = 0;
    let line = null;
    if (p.lines.length > 1 && p.lines.every((l) => l.bbox)) {
      const ds = [];
      for (let k = 1; k < p.lines.length; k++) ds.push((p.lines[k].bbox.y0 - p.lines[k - 1].bbox.y0) / scale);
      const st = median(ds);
      if (st > p.fs * 0.9 && st < p.fs * 3) line = Math.round(st * 2) / 2;
    }
    blocks.push({
      t: "p", runs, align, left, first, before: Math.round(before * 2) / 2, line, rtl, level, bullet: list.bullet,
      tabs: null, y: p.bb ? p.bb.y0 : 0, yEnd: p.bb ? p.bb.y1 : 0, fs: p.fs,
    });
    if (p.bb) prevBottom = p.bb.y1;
  }
  let m = null;
  if (boxed.length) {
    m = {
      l: clampN(geo.left, 18, 200), r: clampN(W - geo.right, 18, 200),
      t: clampN(Math.min(...boxed.map((p) => p.bb.y0)) - 2, 18, 200), b: clampN(H - Math.max(...boxed.map((p) => p.bb.y1)) - 2, 18, 200),
    };
  }
  return { blocks, m };
}

/* ----------------------------- model assembly ---------------------------- */

function buildTextPage(raw, body, opts) {
  const { W, H } = raw;
  const page = { n: raw.n, w: W, h: H, kind: "text", head: null, blocks: [], cols: null, gutter: 0, m: null, header: null, footer: null };
  const lines = raw.lines, imgs = raw.images || [];
  let rules = raw.rules || [];
  if (raw.header) page.header = raw.header.map((l) => hfPara(l, W));
  if (raw.footer) page.footer = raw.footer.map((l) => hfPara(l, W));

  /* rules that belong to the running header / footer become borders on those Word paragraphs
     (leaving them in the body forces huge gaps and pushes content onto the next page) */
  if (page.header || page.footer) {
    const bd = (r) => ({ th: r.th, color: hex6(r.color), dash: r.dash });
    rules = rules.filter((r) => {
      if (page.header && r.y < H * 0.12) {
        const h0 = raw.header[0];
        if (r.y < h0.y - h0.fs * 0.5) page.header[0].bTop = bd(r); else page.header[page.header.length - 1].bBottom = bd(r);
        return false;
      }
      if (page.footer && r.y > H * 0.88) {
        const f0 = raw.footer[0];
        if (r.y < f0.y - f0.fs * 0.5) page.footer[0].bTop = bd(r); else page.footer[page.footer.length - 1].bBottom = bd(r);
        return false;
      }
      return true;
    });
  }

  const clampM = (v) => clampN(v, 18, 200);
  /* things that take space in the flow (rules, and images when not floating) widen the margins */
  const flowTop = [...rules.map((r) => r.y), ...(opts.float ? [] : imgs.map((i) => i.y))];
  const flowBot = [...rules.map((r) => r.y + 2), ...(opts.float ? [] : imgs.map((i) => i.y + i.h))];

  if (!lines.length) {
    const geo = { left: 54, right: W - 54 };
    page.blocks = toBlocks([], geo, body, opts, [...imgBlocks(imgs, geo, opts.float), ...ruleBlocks(rules)]);
  } else {
    const x0 = Math.min(...lines.map((l) => l.x)), x1 = Math.max(...lines.map((l) => l.xEnd));
    const g = opts.columns === false ? null : findGutter(lines, W);
    const firstY = Math.min(lines[0].y - lines[0].fs * 0.9, ...flowTop);
    const lastY = Math.max(lines[lines.length - 1].y, ...flowBot);
    if (g) {
      const L = [], R = [], S = [];
      for (const it of lines.flatMap((l) => l.items)) {
        if (it.x + it.w <= g.gx + 2) L.push(it); else if (it.x >= g.gx - 2) R.push(it); else S.push(it);
      }
      let lL = makeLines(L); const lR = makeLines(R); const lS = makeLines(S);
      const topY = Math.min(lL.length ? lL[0].y : Infinity, lR.length ? lR[0].y : Infinity);
      const head = lS.filter((l) => l.y < topY - 1);
      lL = [...lL, ...lS.filter((l) => l.y >= topY - 1)].sort((a, b) => a.y - b.y);
      const gH = computeGeo(head, { x0: g.x0, x1: g.x1 }), gL = computeGeo(lL, { x0: g.x0, x1: g.gx }), gR = computeGeo(lR, { x0: g.gx, x1: g.x1 });

      /* zone 0 = full-width header, 1 = left column, 2 = right column */
      const topBound = head.length ? topY : -Infinity;
      const zone = (cx, bottom) => (bottom <= topBound + 2 ? 0 : cx < g.gx ? 1 : 2);
      const I = [[], [], []], Rl = [[], [], []];
      imgs.forEach((im) => I[zone(im.x + im.w / 2, im.y + im.h)].push(im));
      rules.forEach((r) => {
        if (r.x < g.gx - 6 && r.x + r.w > g.gx + 6) { if (r.y < topBound) Rl[0].push(r); }
        else Rl[zone(r.x + r.w / 2, r.y)].push(r);
      });
      const hb = toBlocks(head, gH, body, opts, [...imgBlocks(I[0], gH, opts.float), ...ruleBlocks(Rl[0])]);
      const lb = toBlocks(lL, gL, body, opts, [...imgBlocks(I[1], gL, opts.float), ...ruleBlocks(Rl[1])]);
      const rb = toBlocks(lR, gR, body, opts, [...imgBlocks(I[2], gR, opts.float), ...ruleBlocks(Rl[2])]);
      page.head = hb.length ? hb : null;
      page.cols = [lb, rb];
      page.gutter = g.gw;
      page.m = { l: clampM(g.x0), r: clampM(W - g.x1), t: clampM(firstY), b: clampM(H - lastY - 4) };
    } else {
      const geo = computeGeo(lines, { x0, x1 });
      page.blocks = toBlocks(lines, geo, body, opts, [...imgBlocks(imgs, geo, opts.float), ...ruleBlocks(rules)]);
      page.m = { l: clampM(geo.left), r: clampM(W - Math.max(geo.right, x1 > geo.right ? geo.right : x1)), t: clampM(firstY), b: clampM(H - lastY - 4) };
    }
  }
  if (!page.m) page.m = { l: 54, r: 54, t: 54, b: 54 };
  /* Breathing room at the bottom: Word's lines/rules are a hair taller than the PDF's, and each PDF page is its own
     section, so without slack a few lines spill onto an extra page and push everything after it down a page.
     (never go below what the Word footer itself needs) */
  const footNeed = page.footer ? 18 + page.footer.reduce((n, h) => n + h.sz * 1.3, 0) + 4 : 18;
  page.m.b = clampM(Math.max(page.m.b - 40, Math.min(page.m.b, footNeed)));
  (raw.rot || []).forEach((it) => {
    page.blocks.push({
      t: "p", runs: [{ t: it.s, b: it.b, i: it.i, sz: it.fs, f: it.f }], align: "l", left: 0, first: 0, before: 0, line: null,
      rtl: RTL_RE.test(it.s), level: 0, bullet: false, tabs: null, y: 1e9, yEnd: 1e9, fs: it.fs,
    });
  });
  return page;
}

/* last-resort page: every line becomes a plain paragraph (no tables, columns, rules or pictures) */
function fallbackPage(raw) {
  const blocks = (raw.lines || []).map((l) => {
    const runs = [];
    l.segs.forEach((s, k) => {
      if (k) runs.push({ t: "  ", b: false, i: false, sz: l.fs, f: "Arial" });
      s.runs.forEach((r) => runs.push({ ...r }));
    });
    return { t: "p", runs, align: "l", left: 0, first: 0, before: 0, line: null, rtl: !!l.rtl, level: 0, bullet: false, tabs: null, y: l.y, yEnd: l.y, fs: l.fs };
  });
  return { n: raw.n, w: raw.W, h: raw.H, kind: "text", head: null, blocks, cols: null, gutter: 0, m: { l: 54, r: 54, t: 54, b: 54 }, header: null, footer: null, simplified: true };
}

function assembleModel(rawIn, opts) {
  /* work on copies: detectHeaderFooter rewrites p.lines, and a retry (safe mode) must see the original data */
  const raw = rawIn.map((p) => (opts.safe && p.kind === "text" ? { ...p, images: [], rules: [], rot: p.rot || [] } : { ...p }));
  detectHeaderFooter(raw);
  const allLines = raw.filter((p) => p.kind === "text").flatMap((p) => p.lines);
  const body = allLines.length ? bodySize(allLines) : 11;
  const pages = raw.map((p) => {
    if (p.kind === "ocr") {
      return { n: p.n, w: p.W, h: p.H, kind: "ocr", head: null, blocks: p.blocks, cols: null, gutter: 0, m: p.m || { l: 54, r: 54, t: 54, b: 54 }, header: null, footer: null };
    }
    try { return buildTextPage(p, body, opts); }
    catch (e) { console.warn(`page ${p.n}: layout analysis failed, using plain text`, e); return fallbackPage(p); }
  });
  const stats = { pages: pages.length, words: 0, tables: 0, images: 0, ocr: pages.filter((p) => p.kind === "ocr").length, simplified: pages.filter((p) => p.simplified).length };
  pages.forEach((p) => allBlocks(p).forEach((b) => {
    if (b.t === "table") { stats.tables++; b.rows.forEach((r) => r.cells.forEach((c) => c.paras.forEach((q) => { stats.words += wordCount(q); }))); }
    else if (b.t === "img") stats.images++;
    else if (b.t === "p") stats.words += wordCount(b);
  }));
  return { pages, stats };
}

const allBlocks = (p) => [...(p.head || []), ...(p.cols ? [...p.cols[0], ...p.cols[1]] : []), ...p.blocks];
const paraText = (p) => p.runs.filter((r) => !r.br).map((r) => (r.tab ? "\t" : r.t)).join("").replace(/\t$/, "");
const wordCount = (p) => (paraText(p).match(/\S+/g) || []).length;

function modelToText(model) {
  const out = [];
  for (const pg of model.pages) {
    for (const b of allBlocks(pg)) {
      if (b.t === "p") out.push((b.bullet ? "• " : "") + paraText(b).replace(/\n/g, " "));
      else if (b.t === "table") b.rows.forEach((r) => out.push(r.cells.map((c) => c.paras.map(paraText).join(" ")).join("\t")));
      else if (b.t === "rule") out.push("––––––––––––––––");
      out.push("");
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/* ========================================================================== */
/* ENGINE END                                                                 */
/* ========================================================================== */

/* ----------------------------- pdf.js helpers ----------------------------- */

function makeFontOf(page, styles) {
  const cache = new Map();
  return (fontName) => {
    if (cache.has(fontName)) return cache.get(fontName);
    let name = "", generic = styles?.[fontName]?.fontFamily || "", b = false, i = false;
    try {
      if (page.commonObjs.has(fontName)) {
        const f = page.commonObjs.get(fontName);
        name = f.name || ""; generic = f.fallbackName || generic; b = !!(f.bold || f.black); i = !!f.italic;
      }
    } catch { /* font not resolved: fall back to generic family */ }
    if (/bold|black|heavy|semibold|demi/i.test(name)) b = true;
    if (/italic|oblique/i.test(name)) i = true;
    const r = { b, i, f: wordFont(name, generic) };
    cache.set(fontName, r);
    return r;
  };
}

/*
 * Scans the page's operator list once and returns:
 *   rects : image rectangles (viewport coordinates, y down)
 *   rules : horizontal lines (stroked segments or thin filled bars) with thickness/colour/dash
 * Works with both the older constructPath format ([ops, coords]) and the newer one
 * ([paintOp, [pathData], minMax]).
 */
function collectGraphics(op, vt, OPS, W, H) {
  const { fnArray: fn, argsArray: ar } = op;
  const rects = [], rules = [], stack = [];
  let st = { ctm: [1, 0, 0, 1, 0, 0], lw: 1, fill: "000000", stroke: "000000", dash: null };
  let pending = [];
  const P = (...n) => new Set(n.filter((v) => v !== undefined));
  const STROKE = P(OPS.stroke, OPS.closeStroke, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke);
  const FILL = P(OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke);
  const PAINT = new Set([...STROKE, ...FILL]);

  const hexOf = (a, d) => {
    if (a == null) return d;
    if (typeof a === "string") return /^#?[0-9a-f]{6}$/i.test(a) ? a.replace("#", "").toUpperCase() : d;
    if (typeof a[0] === "string") return hexOf(a[0], d);
    const v = a.length === 3 && typeof a[0] === "number" ? a : a[0] && a[0].length === 3 ? a[0] : null;
    return v ? [...v].map((n) => clampN(Math.round(n), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase() : d;
  };
  const add = (x, w, y, th, color) => {
    if (y < 0 || y > H || /^F.F.F.$/.test(color)) return;            // off-page or (almost) white
    const x0 = Math.max(0, x), x1 = Math.min(W, x + w);
    if (x1 - x0 >= 18) rules.push({ x: x0, w: x1 - x0, y, th, color: hex6(color), dash: st.dash });
  };
  const parseOld = (ops, c) => {
    const out = []; let cur = null, p = 0;
    for (const o of ops) {
      if (o === OPS.moveTo) { cur = [[c[p], c[p + 1]]]; out.push(cur); p += 2; }
      else if (o === OPS.lineTo) { if (!cur) { cur = [[c[p], c[p + 1]]]; out.push(cur); } else cur.push([c[p], c[p + 1]]); p += 2; }
      else if (o === OPS.curveTo) { if (cur) cur.curved = true; p += 6; }
      else if (o === OPS.curveTo2 || o === OPS.curveTo3) { if (cur) cur.curved = true; p += 4; }
      else if (o === OPS.rectangle) {
        const x = c[p], y = c[p + 1], w = c[p + 2], h = c[p + 3];
        cur = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; cur.rect = true; out.push(cur); p += 4; cur = null;
      } else if (o === OPS.closePath) { if (cur) cur.closed = true; }
    }
    return out;
  };
  const parseNew = (d) => {
    const out = []; let cur = null;
    if (!d || !d.length) return out;
    for (let p = 0; p < d.length;) {
      const o = d[p++];
      if (o === 0) { cur = [[d[p], d[p + 1]]]; out.push(cur); p += 2; }
      else if (o === 1) { if (!cur) { cur = [[d[p], d[p + 1]]]; out.push(cur); } else cur.push([d[p], d[p + 1]]); p += 2; }
      else if (o === 2) { if (cur) cur.curved = true; p += 6; }
      else if (o === 3) { if (cur) cur.curved = true; p += 4; }
      else if (o === 4) { if (cur) cur.closed = true; }
      else break;
    }
    return out;
  };
  const handle = (subs, paintOp) => {
    const m = mul(vt, st.ctm);
    if (Math.abs(m[1]) > 0.01 || Math.abs(m[2]) > 0.01) return;      // rotated / skewed: skip
    const tx = (q) => [m[0] * q[0] + m[2] * q[1] + m[4], m[1] * q[0] + m[3] * q[1] + m[5]];
    for (const s of subs) {
      if (s.curved) continue;
      const pts = s.map(tx);
      const boxy = s.rect || (s.closed && pts.length >= 4);
      if (STROKE.has(paintOp) && !boxy) {
        const th = Math.max(0.5, st.lw * Math.abs(m[3]));
        for (let k = 1; k < pts.length; k++) {
          const a = pts[k - 1], b = pts[k];
          if (Math.abs(a[1] - b[1]) < 0.8 && Math.abs(a[0] - b[0]) >= 20) add(Math.min(a[0], b[0]), Math.abs(a[0] - b[0]), (a[1] + b[1]) / 2, th, st.stroke);
        }
      }
      if (FILL.has(paintOp) && pts.length >= 4) {
        const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
        const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
        if (h >= 0.15 && h <= 3.2 && w >= 24) add(x0, w, y0 + h / 2, Math.max(0.5, h), st.fill);
      }
    }
  };

  try {
    for (let k = 0; k < fn.length; k++) {
      const f = fn[k], a = ar[k];
      if (f === OPS.save) stack.push({ ...st });
      else if (f === OPS.restore) st = stack.pop() || st;
      else if (f === OPS.transform) st.ctm = mul(st.ctm, a);
      else if (f === OPS.paintFormXObjectBegin) { stack.push({ ...st }); if (a && a[0]) st.ctm = mul(st.ctm, a[0]); }
      else if (f === OPS.paintFormXObjectEnd) st = stack.pop() || st;
      else if (f === OPS.setLineWidth) st.lw = a[0];
      else if (f === OPS.setDash) { const d = a[0]; st.dash = d && d.length ? (d[0] < Math.max(1.2 * st.lw, 1.6) ? "dot" : "dash") : null; }
      else if (f === OPS.setGState) { for (const [key, v] of a[0] || []) if (key === "LW") st.lw = v; }
      else if (f === OPS.setFillRGBColor) st.fill = hexOf(a, st.fill);
      else if (f === OPS.setStrokeRGBColor) st.stroke = hexOf(a, st.stroke);
      else if (f === OPS.constructPath) {
        if (typeof a[0] === "number") {
          /* newer pdf.js: [paintOp, [pathData], minMax]; pathData is null for a bare "n" (endPath) */
          const d = Array.isArray(a[1]) && a[1].length && typeof a[1][0] !== "number" ? a[1][0] : a[1];
          if (d && d.length) handle(parseNew(d), a[0]);
        }
        else pending = pending.concat(parseOld(a[0], a[1]));
      } else if (PAINT.has(f)) { if (pending.length) handle(pending, f); pending = []; }
      else if (f === OPS.endPath) pending = [];
      else if (f === OPS.paintImageXObject || f === OPS.paintInlineImageXObject) {
        const m = mul(vt, st.ctm);
        const xs = [], ys = [];
        for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { xs.push(m[0] * u + m[2] * v + m[4]); ys.push(m[1] * u + m[3] * v + m[5]); }
        const x0 = Math.max(0, Math.min(...xs)), x1 = Math.min(W, Math.max(...xs));
        const y0 = Math.max(0, Math.min(...ys)), y1 = Math.min(H, Math.max(...ys));
        const w = x1 - x0, h = y1 - y0;
        if (w < 16 || h < 16 || (w * h) / (W * H) > 0.75) continue;
        if (rects.some((r) => Math.abs(r.x - x0) < 3 && Math.abs(r.y - y0) < 3 && Math.abs(r.w - w) < 4)) continue;
        rects.push({ x: x0, y: y0, w, h });
      }
    }
  } catch (e) { console.warn("graphics scan", e); }

  const uniq = rules.filter((r, i) => !rules.some((q, j) => j < i && Math.abs(q.y - r.y) < 0.8 && Math.abs(q.x - r.x) < 3 && Math.abs(q.w - r.w) < 4));
  return { rects: rects.length > 20 ? [] : rects, rules: uniq.length > 120 ? [] : uniq };
}

/*
 * Rules that sit under / through text become underline / strikethrough on those items
 * (mutates items). Everything else is returned and becomes a real horizontal rule.
 */
function markDecorations(items, rules) {
  const keep = [];
  for (const r of rules) {
    const near = items.filter((it) => {
      const d = r.y - it.y;
      const ox = Math.min(it.x + it.w, r.x + r.w) - Math.max(it.x, r.x);
      return it.w > 0 && ox > 0 && d > -0.5 * it.fs && d < 0.32 * it.fs + r.th;
    });
    if (!near.length) { keep.push(r); continue; }
    const a = Math.min(...near.map((i) => i.x)), b = Math.max(...near.map((i) => i.x + i.w));
    if (r.w > (b - a) * 1.25 + 8) { keep.push(r); continue; }        // much longer than the text => a real rule
    for (const it of near) {
      const d = r.y - it.y, ox = Math.min(it.x + it.w, r.x + r.w) - Math.max(it.x, r.x);
      if (ox < it.w * 0.5) continue;
      if (d >= -0.03 * it.fs) it.u = true; else if (d <= -0.12 * it.fs) it.k = true;
    }
  }
  return keep;
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

/* ------------------------------ DOCX writer ------------------------------- */

async function buildDocx(model, opts) {
  const D = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, WidthType, HeadingLevel,
    BorderStyle, LineRuleType, SectionType, Header, Footer, PageNumber, TabStopType, Tab, ColumnBreak, TableLayoutType,
    UnderlineType, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType } = D;
  const tw = (pt) => Math.round(pt * 20);
  const HEAD = [undefined, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];

  const runsOf = (runs, rtl) => runs.map((r) => {
    if (r.br) return new TextRun({ break: 1 });
    if (r.tab) return typeof Tab === "function" ? new TextRun({ children: [new Tab()] }) : new TextRun({ text: "\t" });
    const size = Math.max(2, Math.round(r.sz * 2));
    return new TextRun({
      text: r.t, bold: !!r.b, italics: !!r.i, size, font: rtl ? "Arial" : r.f, color: "000000",
      underline: r.u ? { type: UnderlineType.SINGLE } : undefined, strike: r.s || undefined,
      superScript: r.va === "sup" || undefined, subScript: r.va === "sub" || undefined,
      rightToLeft: rtl || undefined, boldComplexScript: !!r.b, sizeComplexScript: size,
    });
  });

  const para = (p, inCell, pre = []) => new Paragraph({
    children: [...pre, ...runsOf(p.runs, p.rtl)],
    alignment: p.align === "c" ? AlignmentType.CENTER : p.align === "r" && !p.rtl ? AlignmentType.RIGHT : p.align === "j" ? AlignmentType.JUSTIFIED : undefined,
    bidirectional: p.rtl || undefined,
    heading: p.level ? HEAD[p.level] : undefined,
    bullet: p.bullet ? { level: 0 } : undefined,
    spacing: { before: tw(p.before || 0), after: 0, line: p.line ? tw(p.line) : undefined, lineRule: p.line ? LineRuleType.AT_LEAST : undefined },
    indent: !inCell && (p.left || p.first) ? { left: tw(p.left), ...(p.first < 0 ? { hanging: tw(-p.first) } : p.first > 0 ? { firstLine: tw(p.first) } : {}) } : undefined,
    tabStops: p.tabs ? p.tabs.map((t) => ({ type: t.right ? TabStopType.RIGHT : TabStopType.LEFT, position: tw(t.pos) })) : undefined,
  });

  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const line = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
  const bset = (b) => ({ top: b, bottom: b, left: b, right: b });

  /* borders: "auto" = only tables that had ruling lines in the PDF, "on" = all, "off" = none */
  const table = (t) => {
    const total = t.cols.reduce((a, b) => a + b, 0);
    const edge = opts.borders === "on" || (opts.borders === "auto" && t.ruled) ? line : none;
    return new Table({
      width: { size: tw(total), type: WidthType.DXA },
      columnWidths: t.cols.map(tw),
      layout: TableLayoutType.FIXED,
      indent: t.x > 4 ? { size: tw(t.x), type: WidthType.DXA } : undefined,
      borders: { ...bset(edge), insideHorizontal: edge, insideVertical: edge },
      rows: t.rows.map((r) => new TableRow({
        cantSplit: true,
        children: r.cells.map((c) => {
          let w = 0;
          for (let k = c.c0; k <= c.c1; k++) w += t.cols[k] || 0;
          return new TableCell({
            width: { size: tw(w), type: WidthType.DXA },
            columnSpan: c.c1 > c.c0 ? c.c1 - c.c0 + 1 : undefined,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: c.paras.length ? c.paras.map((p) => para(p, true)) : [new Paragraph({ children: [] })],
          });
        }),
      })),
    });
  };

  const px = (pt) => Math.max(8, Math.round((pt * 96) / 72));
  const imgRun = (b, floating) => new ImageRun({ type: "jpg", data: b.data, transformation: { width: px(b.w), height: px(b.h) }, floating });
  /* floating picture: pinned to the exact page position, behind the text */
  const anchor = (b) => imgRun(b, {
    horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: Math.round(b.x * 12700) },
    verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: Math.round(b.y * 12700) },
    behindDocument: true, allowOverlap: true, wrap: { type: TextWrappingType.NONE },
  });

  const blockToDocx = (b) => {
    if (b.t === "p") return [para(b)];
    if (b.t === "table") return [table(b), new Paragraph({ children: [], spacing: { before: 0, after: 0, line: 120, lineRule: LineRuleType.EXACT } })];
    if (b.t === "rule") {
      return [new Paragraph({
        children: [new TextRun({ text: "", size: 2 })],
        indent: { left: tw(b.left), right: tw(b.right) },
        spacing: { before: tw(b.before || 0), after: 0, line: 20, lineRule: LineRuleType.EXACT },
        border: { bottom: { style: b.dash === "dot" ? BorderStyle.DOTTED : b.dash === "dash" ? BorderStyle.DASHED : BorderStyle.SINGLE, size: clampN(Math.round(b.th * 8), 2, 96), color: hex6(b.color), space: 0 } },
      })];
    }
    return [new Paragraph({
      alignment: b.align === "c" ? AlignmentType.CENTER : b.align === "r" ? AlignmentType.RIGHT : undefined,
      indent: b.left > 3 ? { left: tw(b.left) } : undefined,
      spacing: { before: tw(b.before || 0), after: 0 },
      children: [imgRun(b)],
    })];
  };

  /* floating pictures ride on the next paragraph (zero flow height) */
  const blocksToDocx = (blocks) => {
    const out = []; let pend = [];
    const dump = () => {
      if (pend.length) { out.push(new Paragraph({ children: pend, spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT } })); pend = []; }
    };
    for (const b of blocks) {
      if (b.t === "img" && b.float) pend.push(anchor(b));
      else if (b.t === "p") { out.push(para(b, false, pend)); pend = []; }
      else { dump(); out.push(...blockToDocx(b)); }
    }
    dump();
    return out.length ? out : [new Paragraph({ children: [] })];
  };

  const hfParas = (list, kind, cw) => list.map((h) => {
    const jc = h.align === "c" ? AlignmentType.CENTER : h.align === "r" ? AlignmentType.RIGHT : AlignmentType.LEFT;
    const size = Math.max(2, Math.round(h.sz * 2));
    const bd = (b) => ({ style: b.dash === "dot" ? BorderStyle.DOTTED : b.dash === "dash" ? BorderStyle.DASHED : BorderStyle.SINGLE, size: clampN(Math.round(b.th * 8), 2, 96), color: hex6(b.color), space: 2 });
    const border = h.bTop || h.bBottom ? { ...(h.bTop ? { top: bd(h.bTop) } : {}), ...(h.bBottom ? { bottom: bd(h.bBottom) } : {}) } : undefined;
    if (h.right) {
      const rr = h.right;
      return new Paragraph({
        border, tabStops: [{ type: TabStopType.RIGHT, position: tw(Math.max(40, cw)) }],
        children: [
          ...runsOf(h.runs, h.rtl), new TextRun({ children: [new Tab()] }),
          ...(rr.num !== null ? [new TextRun({ children: [...(rr.num ? [rr.num] : []), PageNumber.CURRENT], size: Math.max(2, Math.round(rr.runs[0].sz * 2)), font: "Arial", color: "000000" })] : runsOf(rr.runs, h.rtl)),
        ],
      });
    }
    if (h.pageNum && kind === "footer") {
      return new Paragraph({ alignment: jc, border, children: [new TextRun({ children: [PageNumber.CURRENT], size, font: "Arial", color: "000000" })] });
    }
    return new Paragraph({ alignment: jc, border, children: runsOf(h.runs, h.rtl) });
  });
  const hf = (pg) => ({
    headers: pg.header ? { default: new Header({ children: hfParas(pg.header, "header", pg.w - pg.m.l - pg.m.r) }) } : undefined,
    footers: pg.footer ? { default: new Footer({ children: hfParas(pg.footer, "footer", pg.w - pg.m.l - pg.m.r) }) } : undefined,
  });

  const pageProps = (pg, type, extra = {}) => ({
    type,
    page: {
      size: { width: tw(pg.w), height: tw(pg.h) },
      margin: { top: tw(pg.m.t), right: tw(pg.m.r), bottom: tw(pg.m.b), left: tw(pg.m.l), header: 360, footer: 360 },
    },
    ...extra,
  });
  const flat = blocksToDocx;

  const sections = [];
  if (opts.keepBreaks) {
    model.pages.forEach((pg) => {
      if (pg.cols) {
        if (pg.head) sections.push({ properties: pageProps(pg, SectionType.NEXT_PAGE), ...hf(pg), children: flat(pg.head) });
        const kids = [...blocksToDocx(pg.cols[0]), new Paragraph({ children: [new ColumnBreak()] }), ...blocksToDocx(pg.cols[1])];
        sections.push({
          properties: pageProps(pg, pg.head ? SectionType.CONTINUOUS : SectionType.NEXT_PAGE, { column: { count: 2, space: tw(Math.max(14, pg.gutter)), equalWidth: true } }),
          ...(pg.head ? {} : hf(pg)),
          children: kids,
        });
      } else {
        sections.push({ properties: pageProps(pg, SectionType.NEXT_PAGE), ...hf(pg), children: flat(pg.blocks) });
      }
    });
  } else {
    const first = model.pages[0];
    sections.push({
      properties: pageProps(first, SectionType.NEXT_PAGE), ...hf(first),
      children: flat(model.pages.flatMap((pg) => (pg.cols ? [...(pg.head || []), ...pg.cols[0], ...pg.cols[1], ...pg.blocks] : pg.blocks))),
    });
  }
  const doc = new Document({ creator: "PDF to Word", title: opts.title || "Converted document", sections });
  return Packer.toBlob(doc);
}

/* -------------------------------- UI bits --------------------------------- */

const card = "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl";
const lbl = "text-xs font-semibold uppercase tracking-wide text-slate-500";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-40";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,.3)] transition hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100";
const inputCls = "w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-blue-500/50";

const Chip = ({ on, onClick, children }) => (
  <button onClick={onClick} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${on ? "border-blue-500 bg-blue-500/15 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}>{children}</button>
);
const Row = ({ title, children }) => (
  <div className="space-y-2.5"><p className={lbl}>{title}</p>{children}</div>
);
const Check2 = ({ on, onChange, title, hint }) => (
  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
    <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-500" />
    <span>{title}{hint && <span className="block text-xs text-slate-500">{hint}</span>}</span>
  </label>
);

/* ------------------------------ result preview ---------------------------- */

function PrevImg({ b, k }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(new Blob([b.data], { type: "image/jpeg" }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [b]);
  if (b.float) {
    return url ? <img src={url} alt="" style={{ position: "absolute", left: b.x * k, top: b.y * k, width: b.w * k, height: b.h * k, zIndex: -1 }} /> : null;
  }
  return (
    <div style={{ marginTop: (b.before || 0) * k, textAlign: b.align === "c" ? "center" : b.align === "r" ? "right" : "left", marginLeft: b.align === "l" ? b.left * k : 0 }}>
      {url && <img src={url} alt="" style={{ width: b.w * k, height: b.h * k, display: "inline-block" }} />}
    </div>
  );
}

function PrevPara({ p, k }) {
  return (
    <p dir={p.rtl ? "rtl" : "ltr"} style={{
      margin: 0, marginTop: (p.before || 0) * k, marginLeft: p.rtl ? 0 : p.left * k, textIndent: p.first * k,
      textAlign: p.align === "c" ? "center" : p.align === "r" ? "right" : p.align === "j" ? "justify" : "left",
      lineHeight: p.line ? `${p.line * k}px` : 1.25, wordBreak: "break-word",
    }}>
      {p.bullet && <span style={{ marginRight: 6 * k }}>•</span>}
      {p.runs.map((r, i) => (r.br ? <br key={i} /> : r.tab
        ? <span key={i} style={{ display: "inline-block", width: 18 * k }} />
        : <span key={i} style={{
          fontWeight: r.b ? 700 : 400, fontStyle: r.i ? "italic" : "normal", fontSize: r.sz * k, fontFamily: `${r.f}, sans-serif`,
          verticalAlign: r.va === "sup" ? "super" : r.va === "sub" ? "sub" : "baseline", lineHeight: 1,
          textDecoration: [r.u && "underline", r.s && "line-through"].filter(Boolean).join(" ") || "none",
        }}>{r.t}</span>))}
    </p>
  );
}

function PrevBlock({ b, k, borders }) {
  if (b.t === "img") return <PrevImg b={b} k={k} />;
  if (b.t === "p") return <PrevPara p={b} k={k} />;
  if (b.t === "rule") {
    return <div style={{
      height: 0, marginTop: (b.before || 0) * k, marginLeft: b.left * k, marginRight: b.right * k,
      borderBottom: `${Math.max(1, b.th * k)}px ${b.dash === "dot" ? "dotted" : b.dash === "dash" ? "dashed" : "solid"} #${b.color}`,
    }} />;
  }
  const showB = borders === "on" || (borders === "auto" && b.ruled);
  return (
    <table style={{ borderCollapse: "collapse", tableLayout: "fixed", marginLeft: b.x * k, width: b.cols.reduce((a, c) => a + c, 0) * k, marginTop: 4 * k }}>
      <colgroup>{b.cols.map((w, i) => <col key={i} style={{ width: w * k }} />)}</colgroup>
      <tbody>
        {b.rows.map((r, i) => (
          <tr key={i}>
            {r.cells.map((c, j) => (
              <td key={j} colSpan={c.c1 - c.c0 + 1} style={{ border: showB ? "1px solid #cbd5e1" : "none", padding: `${2 * k}px ${4 * k}px`, verticalAlign: "top" }}>
                {c.paras.map((p, q) => <PrevPara key={q} p={p} k={k} />)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PrevPage({ pg, borders }) {
  const k = Math.min(1, 640 / pg.w);
  const wrap = {
    width: pg.w * k, maxWidth: "100%", boxSizing: "border-box", position: "relative", isolation: "isolate",
    padding: `${Math.min(pg.m.t, 60) * k}px ${pg.m.r * k}px ${Math.min(pg.m.b, 60) * k}px ${pg.m.l * k}px`,
  };
  return (
    <div className="mx-auto mb-4 overflow-x-auto bg-white text-black shadow-xl" style={wrap}>
      {(pg.head || []).map((b, i) => <PrevBlock key={`h${i}`} b={b} k={k} borders={borders} />)}
      {pg.cols && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: Math.max(14, pg.gutter) * k }}>
          {pg.cols.map((col, c) => <div key={c}>{col.map((b, i) => <PrevBlock key={i} b={b} k={k} borders={borders} />)}</div>)}
        </div>
      )}
      {pg.blocks.map((b, i) => <PrevBlock key={i} b={b} k={k} borders={borders} />)}
      {!allBlocks(pg).length && <p className="py-6 text-center text-xs text-slate-400">No text found on this page</p>}
    </div>
  );
}

/* ================================== PAGE ================================== */

export default function PdfToWord() {
  const [stage, setStage] = useState("idle"); // idle | ready | working | done
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [thumbs, setThumbs] = useState([]);
  const [pw, setPw] = useState("");
  const [needPw, setNeedPw] = useState(false);
  const [rangeMode, setRangeMode] = useState("all");
  const [rangeText, setRangeText] = useState("");
  const [opt, setOpt] = useState({ format: "docx", ocr: "auto", lang: "eng", keepBreaks: true, tables: true, images: true, rules: true, borders: "auto", name: "" });
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
    const doc = docRef.current, pdfjs = pdfjsRef.current;
    if (!doc || !picked) return;
    cancelRef.current = false;
    setErr(""); setStage("working"); setProgress({ pct: 1, msg: "Starting…" });
    let worker = null;
    const raw = [], notes = [];
    try {
      for (let k = 0; k < picked.length; k++) {
        if (cancelRef.current) throw new Error("cancelled");
        const n = picked[k], base = (k / picked.length) * 92;
        setProgress({ pct: base, msg: `Reading page ${n} (${k + 1} of ${picked.length})…` });
        await tick();
        let W = 595, H = 842;
        try {
          const page = await doc.getPage(n);
          const vp = page.getViewport({ scale: 1 });
          W = vp.width; H = vp.height;
          let op = null;
          try { op = await page.getOperatorList(); } catch (e) { console.warn(e); }
          const tc = await page.getTextContent();
          const { items, rot } = extractItems(tc, vp.transform, makeFontOf(page, tc.styles));
          const all = items.concat(rot).map((i) => i.s).join("").replace(/\s/g, "");
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
            const { blocks, m } = ocrToBlocks(data, scale, W, H);
            raw.push({ kind: "ocr", n, W, H, blocks, m });
            cv.width = cv.height = 0;
          } else {
            /* one scan of the operator list gives us image boxes AND horizontal lines */
            const gfx = op ? collectGraphics(op, vp.transform, pdfjs.OPS, W, H) : { rects: [], rules: [] };
            /* lines under / through text -> underline / strikethrough (must run BEFORE makeLines);
               whatever is left becomes a real horizontal rule */
            const rules = opt.rules ? markDecorations(items, gfx.rules) : [];
            const rp = { kind: "text", n, W, H, lines: makeLines(items), rot, images: [], rules };
            if (opt.images && op) {
              try {
                const rects = gfx.rects;
                if (rects.length) {
                  const R = Math.min(2.2, 4200 / Math.max(W, H));
                  const vps = page.getViewport({ scale: R });
                  const cv = document.createElement("canvas");
                  cv.width = Math.ceil(vps.width); cv.height = Math.ceil(vps.height);
                  const cx = cv.getContext("2d");
                  cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height);
                  await page.render({ canvasContext: cx, viewport: vps }).promise;
                  for (const r of rects) {
                    const sx = Math.max(0, Math.floor(r.x * R)), sy = Math.max(0, Math.floor(r.y * R));
                    const sw = Math.min(cv.width - sx, Math.ceil(r.w * R)), sh = Math.min(cv.height - sy, Math.ceil(r.h * R));
                    if (sw < 4 || sh < 4) continue;
                    const c2 = document.createElement("canvas");
                    c2.width = sw; c2.height = sh;
                    c2.getContext("2d").drawImage(cv, sx, sy, sw, sh, 0, 0, sw, sh);
                    const blob = await new Promise((res) => c2.toBlob(res, "image/jpeg", 0.9));
                    rp.images.push({ ...r, data: new Uint8Array(await blob.arrayBuffer()) });
                    c2.width = c2.height = 0;
                  }
                  cv.width = cv.height = 0;
                }
              } catch (ie) { console.warn(`page ${n}: pictures skipped`, ie); notes.push(`Pictures on page ${n} could not be extracted.`); }
            }
            raw.push(rp);
          }
          page.cleanup();
        } catch (pe) {
          if (pe && pe.message === "cancelled") throw pe;
          /* one unreadable page must not sink the whole document */
          console.warn(`page ${n}: could not be read`, pe);
          notes.push(`Page ${n} could not be read and was left blank.`);
          raw.push({ kind: "text", n, W, H, lines: [], rot: [], images: [], rules: [] });
        }
      }
      if (worker) { await worker.terminate(); worker = null; }
      if (cancelRef.current) throw new Error("cancelled");

      setProgress({ pct: 94, msg: "Building your document…" });
      await tick();
      const name = (opt.name.trim() || "document").replace(/[\\/:*?"<>|]+/g, "_");
      /* float = pictures pinned at their exact page position (only when page breaks are kept) */
      const mopts = { tables: opt.tables, columns: true, float: opt.keepBreaks && opt.format === "docx" };
      const make = async (o) => {
        const model = assembleModel(raw, o);
        if (opt.format === "txt") return { model, blob: new Blob([modelToText(model)], { type: "text/plain;charset=utf-8" }), fname: `${name}.txt` };
        const blob = await buildDocx(model, { keepBreaks: opt.keepBreaks, borders: opt.borders, title: name });
        return { model, blob, fname: `${name}.docx` };
      };
      let out;
      try { out = await make(mopts); }
      catch (e1) {
        /* safe mode: plain text-only layout, no pictures / lines / columns / tables */
        console.error("Full build failed, retrying in safe mode:", e1);
        out = await make({ tables: false, columns: false, float: false, safe: true });
        notes.push("The full layout couldn’t be built, so a simpler version (text only, no tables or pictures) was created.");
      }
      if (out.model.stats.simplified) notes.push(`${out.model.stats.simplified} page${out.model.stats.simplified > 1 ? "s were" : " was"} simplified to plain text because the layout couldn’t be analysed.`);
      setResult({ blob: out.blob, name: out.fname, model: out.model, notes });
      setProgress({ pct: 100, msg: "Done" });
      setStage("done");
      download(out.blob, out.fname);
    } catch (e) {
      if (worker) { try { await worker.terminate(); } catch { /* ignore */ } }
      if (e && e.message === "cancelled") { setStage("ready"); return; }
      console.error(e);
      setErr(`Conversion failed: ${(e && e.message) || "unknown error"}. Try turning off OCR or ‘Keep pictures’, or pick fewer pages.`);
      setStage("ready");
    }
  };

  const textOnly = opt.format === "txt";

  /* ---------------------------------- JSX --------------------------------- */

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
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">PDF to Word</span>
            <h1 className="mt-5 text-4xl font-black sm:text-5xl">Convert PDF to editable Word.</h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">Keeps fonts, tables, lists, lines, images and math notation (A², xₙ). Reads scanned pages with OCR. Everything stays on your device.</p>
          </div>

          <input ref={fileRef} hidden type="file" accept="application/pdf,.pdf"
            onChange={(e) => { loadFile(e.target.files[0]); e.target.value = ""; }} />

          <div className="mt-8 space-y-4">
            {/* 1 — choose file */}
            {stage === "idle" && (
              <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); }}
                className="flex flex-col items-center rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 px-6 py-16 text-center transition hover:border-blue-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400"><FileText size={30} /></div>
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
                  {["Fonts & formatting", "Tables", "Bullet lists", "Superscripts", "Lines & images", "Scanned PDFs (OCR)", "Urdu · Arabic · more"].map((t) => (
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
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400"><FileText size={22} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{file.name}</p>
                      <p className="text-xs text-slate-500">{numPages} page{numPages > 1 ? "s" : ""} · {fmtSize(file.size)}</p>
                    </div>
                    <button onClick={reset} aria-label="Remove file" className="rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={16} /></button>
                  </div>
                  {thumbs.length > 0 && (
                    <div className="flex gap-2.5 overflow-x-auto py-1">
                      {thumbs.map((t, i) => (
                        <div key={i} className={`relative h-24 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${picked && picked.includes(i + 1) ? "border-blue-500" : "border-slate-800 opacity-40"}`}>
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
                      <Chip on={opt.format === "docx"} onClick={() => setOpt({ ...opt, format: "docx" })}>Word (.docx)</Chip>
                      <Chip on={opt.format === "txt"} onClick={() => setOpt({ ...opt, format: "txt" })}>Plain text (.txt)</Chip>
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

                  {!textOnly && (
                    <div className="space-y-3 border-t border-slate-800 pt-5">
                      <p className={lbl}>Layout</p>
                      <Check2 on={opt.keepBreaks} onChange={(v) => setOpt({ ...opt, keepBreaks: v })} title="Keep original page size & page breaks" hint="Also places pictures at their exact position. Off = one flowing document that is easier to edit" />
                      <Check2 on={opt.tables} onChange={(v) => setOpt({ ...opt, tables: v })} title="Detect tables" hint="Matrices written as rows of numbers become borderless tables" />
                      <Check2 on={opt.rules} onChange={(v) => setOpt({ ...opt, rules: v })} title="Keep lines & underlines" hint="Horizontal rules, underlined and struck-through text" />
                      <Check2 on={opt.images} onChange={(v) => setOpt({ ...opt, images: v })} title="Keep pictures" hint="Slower on picture-heavy PDFs" />
                      {opt.tables && (
                        <div className="space-y-2 pt-1">
                          <p className="text-sm text-slate-300">Table borders</p>
                          <div className="flex flex-wrap gap-2">
                            <Chip on={opt.borders === "auto"} onClick={() => setOpt({ ...opt, borders: "auto" })}>Like the PDF</Chip>
                            <Chip on={opt.borders === "on"} onClick={() => setOpt({ ...opt, borders: "on" })}>Always</Chip>
                            <Chip on={opt.borders === "off"} onClick={() => setOpt({ ...opt, borders: "off" })}>Never</Chip>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                  <Loader2 size={20} className="shrink-0 animate-spin text-blue-400" />
                  <p className="text-sm text-slate-200">{progress.msg}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-300" style={{ width: `${progress.pct}%` }} />
                </div>
                <button onClick={() => { cancelRef.current = true; }} className={btn}><X size={15} />Cancel</button>
              </div>
            )}

            {/* 4 — done */}
            {stage === "done" && result && (
              <>
                <div className={`${card} space-y-5 p-6 text-center`}>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"><Check size={28} /></div>
                  <div>
                    <h2 className="text-2xl font-bold">Your file is ready</h2>
                    <p className="mt-1 text-sm text-slate-400">{result.name} · {fmtSize(result.blob.size)}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-300">
                    {[`${result.model.stats.pages} page${result.model.stats.pages > 1 ? "s" : ""}`, `${result.model.stats.words.toLocaleString()} words`,
                      result.model.stats.tables ? `${result.model.stats.tables} table${result.model.stats.tables > 1 ? "s" : ""}` : null,
                      result.model.stats.images ? `${result.model.stats.images} picture${result.model.stats.images > 1 ? "s" : ""}` : null,
                      result.model.stats.ocr ? `${result.model.stats.ocr} page${result.model.stats.ocr > 1 ? "s" : ""} read with OCR` : null]
                      .filter(Boolean).map((t) => <span key={t} className="rounded-full border border-slate-700 px-3 py-1">{t}</span>)}
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button onClick={() => download(result.blob, result.name)} className={btnPrimary}><Download size={16} />Download again</button>
                    {!textOnly && <button onClick={() => setShowPreview((s) => !s)} className={btn}>{showPreview ? <EyeOff size={16} /> : <Eye size={16} />}{showPreview ? "Hide preview" : "Preview"}</button>}
                    <button onClick={() => { setStage("ready"); setShowPreview(false); }} className={btn}><RefreshCw size={15} />Change options</button>
                    <button onClick={reset} className={btn}>Convert another PDF</button>
                  </div>
                  {result.notes.length > 0 && (
                    <div className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-300">
                      {result.notes.map((t, i) => <p key={i}>{t}</p>)}
                    </div>
                  )}
                  {result.model.stats.words < 5 && (
                    <p className="text-sm text-amber-400">Very little text was found. If this PDF is scanned, set OCR to “Always OCR” and pick the right language.</p>
                  )}
                </div>

                {showPreview && (
                  <div className={`${card} p-3 sm:p-5`}>
                    <p className="mb-3 text-xs text-slate-500">Preview of the first {Math.min(4, result.model.pages.length)} page(s) — Word may wrap lines slightly differently.</p>
                    {result.model.pages.slice(0, 4).map((pg) => <PrevPage key={pg.n} pg={pg} borders={opt.borders} />)}
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
