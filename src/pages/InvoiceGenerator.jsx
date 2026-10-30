import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Receipt, Plus, Trash2, Copy, ArrowUp, ArrowDown, Download, Printer, Save, FilePlus,
  ImagePlus, Check, Sparkles, Pencil, Loader2, X, Palette, FolderOpen, SlidersHorizontal,
} from "lucide-react";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

/* ========================================================================== */
/*  npm i jspdf                                                               */
/*  100% in-browser: nothing is uploaded. Business details, logo and brand    */
/*  colour are remembered on this device; saved invoices live in localStorage. */
/*                                                                            */
/*  The invoice page IS the editor: click any text and type. Dashed "+"      */
/*  buttons grow the page (discount, tax, deposit, early-payment offer, late  */
/*  fee, payment details, notes). Plus: "fix it" checklist, amount in words,  */
/*  PAID / DRAFT / VOID stamps, brand colour from logo, three layouts,        */
/*  overdue tracking, print / save-as-PDF for any language.                   */
/* ========================================================================== */

/* ----------------------------- constants ---------------------------------- */

const CUR = {
  USD: { sym: "$", major: "dollars", minor: "cents", name: "US dollar" },
  EUR: { sym: "EUR ", major: "euros", minor: "cents", name: "Euro" },
  GBP: { sym: "£", major: "pounds", minor: "pence", name: "British pound" },
  PKR: { sym: "Rs ", major: "rupees", minor: "paisas", name: "Pakistani rupee" },
  INR: { sym: "INR ", major: "rupees", minor: "paise", name: "Indian rupee" },
  AED: { sym: "AED ", major: "dirhams", minor: "fils", name: "UAE dirham" },
  SAR: { sym: "SAR ", major: "riyals", minor: "halalas", name: "Saudi riyal" },
  CAD: { sym: "CA$", major: "dollars", minor: "cents", name: "Canadian dollar" },
  AUD: { sym: "A$", major: "dollars", minor: "cents", name: "Australian dollar" },
  NZD: { sym: "NZ$", major: "dollars", minor: "cents", name: "New Zealand dollar" },
  SGD: { sym: "S$", major: "dollars", minor: "cents", name: "Singapore dollar" },
  CHF: { sym: "CHF ", major: "francs", minor: "rappen", name: "Swiss franc" },
  JPY: { sym: "JPY ", major: "yen", minor: "sen", name: "Japanese yen", dec: 0 },
  TRY: { sym: "TRY ", major: "lira", minor: "kurus", name: "Turkish lira" },
  BDT: { sym: "BDT ", major: "taka", minor: "poisha", name: "Bangladeshi taka" },
  NGN: { sym: "NGN ", major: "naira", minor: "kobo", name: "Nigerian naira" },
  EGP: { sym: "EGP ", major: "pounds", minor: "piastres", name: "Egyptian pound" },
  ZAR: { sym: "R ", major: "rand", minor: "cents", name: "South African rand" },
  MYR: { sym: "RM ", major: "ringgit", minor: "sen", name: "Malaysian ringgit" },
};
const curOf = (code) => ({ dec: 2, ...(CUR[code] || CUR.USD) });

const ACCENTS = ["#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#059669", "#0891b2", "#1f2937"];
const TERMS = [["0", "On receipt"], ["7", "Net 7"], ["14", "Net 14"], ["30", "Net 30"], ["45", "Net 45"], ["60", "Net 60"], ["custom", "Pick a date"]];
const NOTE_CHIPS = [
  "Thank you for your business!",
  "Please use the invoice number as your payment reference.",
  "Work stays the property of the sender until paid in full.",
];
const PAY_CHIPS = [
  ["Bank transfer", "Bank: \nAccount name: \nAccount / IBAN: \nSWIFT / routing: "],
  ["PayPal", "PayPal: "],
  ["Payment link", "Pay online: https://"],
  ["Mobile wallet", "JazzCash / Easypaisa / UPI: "],
];
const TEMPLATES = [["clean", "Clean"], ["band", "Banner"], ["bold", "Bold"]];

const K_DRAFT = "toolited-invoice-draft", K_PROFILE = "toolited-invoice-profile", K_VAULT = "toolited-invoice-vault";
const PROFILE_KEYS = ["from", "logo", "currency", "paper", "template", "accent", "taxName", "taxRate", "taxInclusive", "payment", "notes", "showWords", "showBrand", "earlyPct", "earlyDays", "lateFee", "terms"];

/* ------------------------------- helpers ---------------------------------- */

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoOf(new Date());
const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return isoOf(d); };
const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000);
const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const bump = (n) => (/\d/.test(n || "") ? n.replace(/(\d+)(?!.*\d)/, (m) => String(+m + 1).padStart(m.length, "0")) : `${n || "INV"}-2`);
const fmtMoney = (n, cur) => `${n < 0 ? "-" : ""}${cur.sym}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: cur.dec, maximumFractionDigits: cur.dec })}`;
const fmtQty = (v) => String(+num(v).toFixed(3));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const hexToRgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); const n = parseInt(m ? m[1] : "2563eb", 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixRgb = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
const rgbCss = (a) => `rgb(${a.join(",")})`;
const inkOn = (hex) => { const [r, g, b] = hexToRgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b > 165 ? "#111827" : "#ffffff"; };

const newItem = () => ({ id: uid(), desc: "", detail: "", qty: "1", rate: "", taxable: true });
const blankParty = () => ({ name: "", email: "", phone: "", address: "", taxId: "" });

const blank = (p = {}) => {
  const issue = todayISO();
  const o = {
    id: uid(), title: "Invoice", show: {}, number: "INV-0001", issue, due: addDays(issue, 14), terms: "14", po: "", status: "draft",
    currency: "USD", paper: "a4", template: "clean", accent: "#2563eb", stamp: "auto",
    from: blankParty(), logo: null, to: blankParty(), items: [newItem()],
    discType: "percent", discValue: "", taxName: "Tax", taxRate: "", taxInclusive: false, shipping: "", paid: "",
    earlyPct: "", earlyDays: "10", lateFee: "", notes: "", payment: "", showWords: true, showBrand: true,
    ...p,
  };
  o.due = o.terms === "custom" ? o.due : addDays(o.issue, +o.terms || 0);
  if (!o.items || !o.items.length) o.items = [newItem()];
  return o;
};
const pickProfile = (inv) => Object.fromEntries(PROFILE_KEYS.map((k) => [k, inv[k]]));

/* ------------------------------- the maths -------------------------------- */

function calc(inv) {
  const cur = curOf(inv.currency);
  const p = 10 ** cur.dec;
  const r = (x) => Math.round((x + Number.EPSILON) * p) / p;
  const rows = inv.items.map((it) => ({ ...it, amount: r(num(it.qty) * num(it.rate)) }));
  const subtotal = r(rows.reduce((s, x) => s + x.amount, 0));
  const taxableSub = r(rows.filter((x) => x.taxable).reduce((s, x) => s + x.amount, 0));
  const discount = inv.discType === "percent"
    ? r((subtotal * clamp(num(inv.discValue), 0, 100)) / 100)
    : r(Math.min(Math.max(num(inv.discValue), 0), subtotal));
  const ratio = subtotal > 0 ? (subtotal - discount) / subtotal : 1;
  const taxBase = r(taxableSub * ratio);
  const rate = Math.max(0, num(inv.taxRate)) / 100;
  const tax = inv.taxInclusive ? r(taxBase - taxBase / (1 + rate)) : r(taxBase * rate);
  const shipping = r(Math.max(0, num(inv.shipping)));
  const total = r(subtotal - discount + (inv.taxInclusive ? 0 : tax) + shipping);
  const paid = r(Math.max(0, num(inv.paid)));
  const balance = r(total - paid);
  const early = num(inv.earlyPct) > 0 ? r((Math.max(balance, 0) * clamp(num(inv.earlyPct), 0, 100)) / 100) : 0;
  return { rows, subtotal, discount, tax, shipping, total, paid, balance, early, cur };
}

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function words(n) {
  if (n === 0) return "zero";
  const chunk = (x) => {
    let s = "";
    if (x >= 100) { s += `${ONES[Math.floor(x / 100)]} hundred`; x %= 100; if (x) s += " and "; }
    if (x >= 20) { s += TENS[Math.floor(x / 10)]; if (x % 10) s += `-${ONES[x % 10]}`; } else if (x > 0) s += ONES[x];
    return s;
  };
  const units = ["", "thousand", "million", "billion", "trillion"];
  const out = [];
  let i = 0;
  while (n > 0 && i < units.length) {
    const c = n % 1000;
    if (c) out.unshift(chunk(c) + (units[i] ? ` ${units[i]}` : ""));
    n = Math.floor(n / 1000); i++;
  }
  return out.join(", ");
}
function amountWords(v, cur) {
  const f = 10 ** cur.dec, fixed = Math.round(v * f), major = Math.floor(fixed / f), minor = fixed % f;
  let s = `${words(major)} ${cur.major}`;
  if (cur.dec && minor) s += ` and ${words(minor)} ${cur.minor}`;
  return `${s.charAt(0).toUpperCase()}${s.slice(1)} only`;
}

function statusOf(inv, c) {
  if (c.total > 0 && c.balance <= 0) return "paid";
  if (inv.status === "draft") return "draft";
  if (inv.due && inv.due < todayISO() && c.balance > 0) return "overdue";
  return "open";
}
const STATUS_LABEL = { paid: "Paid", overdue: "Overdue", draft: "Draft", open: "Sent" };
const STATUS_CLS = { paid: "bg-success/15 text-success", overdue: "bg-danger/15 text-danger", draft: "bg-text/10 text-muted", open: "bg-brand/15 text-brand" };

function stampOf(inv, c) {
  const s = inv.stamp;
  if (s === "none") return null;
  if (s === "paid" || (s === "auto" && c.total > 0 && c.balance <= 0)) return { t: "PAID", col: "#16a34a" };
  if (s === "draft") return { t: "DRAFT", col: "#6b7280" };
  if (s === "void") return { t: "VOID", col: "#dc2626" };
  return null;
}

function health(inv, c) {
  const undescribed = c.rows.findIndex((x) => !x.desc.trim() && x.amount !== 0);
  const L = [
    [!!inv.from.name.trim(), "Add your business name", { id: "f-from-name" }],
    [!!(inv.from.email.trim() || inv.from.phone.trim()), "Add an email or phone so clients can reach you", { id: "f-from-email" }],
    [!!inv.to.name.trim(), "Add who you are billing", { id: "f-to-name" }],
    [!!inv.to.email.trim(), "Add your client’s email", { id: "f-to-email" }],
    [c.total > 0, "Add a priced line item", { id: "f-item-rate-0" }],
    [!!inv.due && inv.due >= inv.issue, "Set a due date on or after the issue date", { id: "f-due" }],
    [!!inv.payment.trim(), "Tell clients how to pay you", { id: "f-payment", addon: "payment" }],
    [!!(inv.notes.trim() || num(inv.lateFee) > 0 || num(inv.earlyPct) > 0), "Add a thank-you note or payment terms", { id: "f-notes", addon: "notes" }],
    [undescribed < 0, "Describe every line item", { id: `f-item-desc-${Math.max(0, undescribed)}` }],
  ];
  const ok = L.filter((x) => x[0]).length;
  return { score: Math.round((ok / L.length) * 100), todo: L.filter((x) => !x[0]).map((x) => ({ msg: x[1], ...x[2] })) };
}

const NON_LATIN = /[^\n\r\t\x20-\x7E\u00A0-\u00FF\u2018\u2019\u201C\u201D\u2013\u2014\u2022\u2026]/;
const hasNonLatin = (inv) => NON_LATIN.test([inv.title, inv.from.name, inv.from.address, inv.from.email, inv.to.name, inv.to.address, inv.to.email, inv.notes, inv.payment, inv.po, ...inv.items.flatMap((i) => [i.desc, i.detail])].join(" "));
const pdfSafe = (s) => String(s ?? "")
  .replace(/\t/g, " ").replace(/\r/g, "")
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/\u2022/g, "-").replace(/\u2026/g, "...")
  .replace(/[^\n\x20-\x7E\u00A0-\u00FF]/g, "?");

/* the logo's most characteristic colour (skips whites, blacks and greys) */
const logoColor = (src) => new Promise((res) => {
  const img = new Image();
  img.onload = () => {
    const s = 64, cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const x = cv.getContext("2d");
    x.drawImage(img, 0, 0, s, s);
    const d = x.getImageData(0, 0, s, s).data, buckets = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
      if (a < 200) continue;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn < 40) continue;
      const k = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
      const e = buckets.get(k) || { n: 0, r: 0, g: 0, b: 0 };
      e.n++; e.r += r; e.g += g; e.b += b;
      buckets.set(k, e);
    }
    let best = null;
    buckets.forEach((e) => { if (!best || e.n > best.n) best = e; });
    res(best ? `#${[best.r, best.g, best.b].map((v) => Math.round(v / best.n).toString(16).padStart(2, "0")).join("")}` : null);
  };
  img.onerror = () => res(null);
  img.src = src;
});

/* ------------------------------- PDF export ------------------------------- */

async function exportPdf(inv, c) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: inv.paper === "letter" ? "letter" : "a4", compress: true });
  const PW = doc.internal.pageSize.getWidth(), PH = doc.internal.pageSize.getHeight();
  const M = 42, CW = PW - M * 2;
  const ACC = hexToRgb(inv.accent), INK = hexToRgb(inkOn(inv.accent)), TINT = mixRgb(ACC, [255, 255, 255], 0.9);
  const DARK = [31, 41, 55], MUTED = [107, 114, 128], LINE = [229, 231, 235], WHITE = [255, 255, 255];
  const tpl = inv.template, money = (n) => fmtMoney(n, c.cur), S = pdfSafe, title = inv.title || "Invoice";

  const T = (s, x, y, o = {}) => {
    doc.setFont("helvetica", o.bold ? "bold" : "normal");
    doc.setFontSize(o.size || 10);
    doc.setTextColor(...(o.color || DARK));
    doc.text(S(s), x, y, o.align ? { align: o.align } : undefined);
  };
  const wrap = (s, w, size, bold) => { doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); return doc.splitTextToSize(S(s), w); };
  const rect = (x, y, w, h, col, r = 0) => { doc.setFillColor(...col); if (r) doc.roundedRect(x, y, w, h, r, r, "F"); else doc.rect(x, y, w, h, "F"); };
  const hline = (x1, x2, y, col = LINE, w = 0.7) => { doc.setDrawColor(...col); doc.setLineWidth(w); doc.line(x1, y, x2, y); };
  const fit = (maxH, maxW) => {
    if (!inv.logo) return null;
    let h = maxH, w = (h * inv.logo.w) / inv.logo.h;
    if (w > maxW) { w = maxW; h = (w * inv.logo.h) / inv.logo.w; }
    return { w, h };
  };
  const bizName = inv.from.name || "Your business";
  const lb = fit(44, 170);
  let y;

  /* header */
  if (tpl === "band") {
    rect(0, 0, PW, 98, ACC);
    if (lb) {
      rect(M, (98 - (lb.h + 14)) / 2, lb.w + 14, lb.h + 14, WHITE, 6);
      doc.addImage(inv.logo.src, "PNG", M + 7, (98 - lb.h) / 2, lb.w, lb.h);
    } else T(bizName, M, 56, { size: 18, bold: true, color: INK });
    T(title, PW - M, 54, { size: 28, bold: true, color: INK, align: "right" });
    T(`# ${inv.number}`, PW - M, 74, { size: 11, color: INK, align: "right" });
    y = 98 + 30;
  } else if (tpl === "bold") {
    T(title, M, M + 32, { size: 40, bold: true, color: ACC });
    T(`# ${inv.number}`, M, M + 52, { size: 11, color: MUTED });
    rect(M, M + 62, CW, 5, ACC);
    if (lb) doc.addImage(inv.logo.src, "PNG", PW - M - lb.w, M, lb.w, lb.h);
    else T(bizName, PW - M, M + 16, { size: 15, bold: true, align: "right" });
    y = M + 62 + 5 + 26;
  } else {
    if (lb) doc.addImage(inv.logo.src, "PNG", M, M, lb.w, lb.h);
    else T(bizName, M, M + 20, { size: 18, bold: true, color: ACC });
    T(title, PW - M, M + 24, { size: 26, bold: true, color: ACC, align: "right" });
    T(`# ${inv.number}`, PW - M, M + 42, { size: 11, color: MUTED, align: "right" });
    hline(M, M + CW, M + 60, ACC, 1.5);
    y = M + 60 + 24;
  }

  /* from / bill to / details */
  const c1 = M, c2 = M + 178, c3 = M + 356, w1 = 160, w2 = 160, w3 = CW - 356;
  const party = (title, p, x, w) => {
    let yy = y;
    T(title, x, yy, { size: 9, bold: true, color: ACC });
    yy += 15;
    const lines = [];
    if (p.name) lines.push([p.name, true, 11]);
    (p.address || "").split("\n").filter((l) => l.trim()).forEach((l) => lines.push([l, false, 9.5]));
    if (p.email) lines.push([p.email, false, 9.5]);
    if (p.phone) lines.push([p.phone, false, 9.5]);
    if (p.taxId) lines.push([`Tax ID: ${p.taxId}`, false, 9.5]);
    lines.forEach(([t, b, sz]) => wrap(t, w, sz, b).forEach((l) => { T(l, x, yy, { size: sz, bold: b, color: b ? DARK : [75, 85, 99] }); yy += sz * 1.4; }));
    return yy;
  };
  const e1 = party("From", { ...inv.from, name: inv.logo ? inv.from.name : "" }, c1, w1), e2 = party("Bill to", inv.to, c2, w2);
  let e3 = y;
  T("Details", c3, e3, { size: 9, bold: true, color: ACC });
  e3 += 15;
  const drows = [["Invoice #", inv.number || "-"], ["Issued", fmtDate(inv.issue)], ["Due", fmtDate(inv.due)]];
  if (inv.po) drows.push(["PO / reference", inv.po]);
  drows.push(["Currency", inv.currency]);
  drows.forEach(([k, v]) => { T(k, c3, e3, { size: 9.5, color: MUTED }); T(v, c3 + w3, e3, { size: 9.5, bold: true, align: "right" }); e3 += 15; });
  y = Math.max(e1, e2, e3) + 22;

  /* items table */
  const wA = 92, wR = 82, wQ = 50;
  const xA = M + CW - 8, xR = xA - wA, xQ = xR - wR, descX = M + 8, descW = xQ - wQ - descX - 6;
  const head = () => {
    const h = 24;
    if (tpl === "bold") rect(M, y, CW, h, ACC); else if (tpl === "band") rect(M, y, CW, h, TINT);
    const col = tpl === "bold" ? INK : tpl === "band" ? DARK : ACC;
    T("Description", descX, y + 16, { size: 9, bold: true, color: col });
    T("Qty", xQ, y + 16, { size: 9, bold: true, color: col, align: "right" });
    T("Rate", xR, y + 16, { size: 9, bold: true, color: col, align: "right" });
    T("Amount", xA, y + 16, { size: 9, bold: true, color: col, align: "right" });
    if (tpl === "clean") hline(M, M + CW, y + h, ACC, 1.2);
    y += h;
  };
  head();
  c.rows.forEach((r) => {
    const dl = wrap(r.desc || "Item", descW, 10, true), tl = r.detail ? wrap(r.detail, descW, 8.5, false) : [];
    const rh = 12 + dl.length * 13 + tl.length * 11 + 6;
    if (y + rh > PH - M - 40) { doc.addPage(); y = M; head(); }
    let ty = y + 17;
    dl.forEach((l) => { T(l, descX, ty, { size: 10, bold: true }); ty += 13; });
    tl.forEach((l) => { T(l, descX, ty - 1, { size: 8.5, color: MUTED }); ty += 11; });
    T(fmtQty(r.qty), xQ, y + 17, { align: "right" });
    T(money(num(r.rate)), xR, y + 17, { align: "right" });
    T(money(r.amount), xA, y + 17, { bold: true, align: "right" });
    y += rh;
    hline(M, M + CW, y);
  });

  /* totals */
  y += 14;
  const tx = M + CW - 240, tw = 240;
  if (y + 190 > PH - M - 30) { doc.addPage(); y = M; }
  const trow = (label, val, o = {}) => {
    T(label, tx + 8, y + 12, { size: o.size || 10, color: o.color || MUTED, bold: o.bold });
    T(val, tx + tw - 8, y + 12, { size: o.size || 10, bold: o.bold, align: "right" });
    y += o.h || 20;
  };
  trow("Subtotal", money(c.subtotal));
  if (c.discount > 0) trow(`Discount${inv.discType === "percent" ? ` (${num(inv.discValue)}%)` : ""}`, `-${money(c.discount)}`);
  if (num(inv.taxRate) > 0 || c.tax > 0) trow(`${inv.taxName || "Tax"} (${num(inv.taxRate)}%${inv.taxInclusive ? ", included" : ""})`, money(c.tax));
  if (c.shipping > 0) trow("Shipping / fees", money(c.shipping));
  hline(tx, tx + tw, y - 4);
  trow("Total", money(c.total), { bold: true, color: DARK, size: 11, h: 22 });
  if (c.paid > 0) trow("Paid / deposit", `-${money(c.paid)}`);
  y += 4;
  const bh = 38, bc = tpl === "bold" ? INK : ACC;
  if (tpl === "bold") rect(tx, y, tw, bh, ACC); else if (tpl === "band") rect(tx, y, tw, bh, TINT, 6); else hline(tx, tx + tw, y, ACC, 1.5);
  T("Balance due", tx + 10, y + 23, { size: 10, bold: true, color: bc });
  T(money(c.balance), tx + tw - 10, y + 25, { size: 15, bold: true, color: bc, align: "right" });
  y += bh + 16;

  /* callouts and text blocks */
  const ensure = (h) => { if (y + h > PH - M - 30) { doc.addPage(); y = M; } };
  if (c.early > 0 && c.balance > 0) {
    const days = Math.max(0, Math.round(num(inv.earlyDays)));
    const msg = `Pay within ${days} days (by ${fmtDate(addDays(inv.issue, days))}) and save ${money(c.early)}: pay ${money(c.balance - c.early)} instead of ${money(c.balance)}.`;
    const lines = wrap(msg, CW - 24, 9.5, true), h = lines.length * 13 + 16;
    ensure(h + 8);
    rect(M, y, CW, h, TINT, 6);
    lines.forEach((l, i) => T(l, M + 12, y + 17 + i * 13, { size: 9.5, bold: true, color: ACC }));
    y += h + 14;
  }
  if (inv.showWords && c.balance > 0) {
    const lines = wrap(`Amount due in words: ${amountWords(c.balance, c.cur)}`, CW, 9, false);
    ensure(lines.length * 12 + 10);
    lines.forEach((l) => { doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text(l, M, y + 9); y += 12; });
    y += 10;
  }
  const block = (title, text) => {
    if (!text || !String(text).trim()) return;
    const lines = wrap(text, CW, 9.5, false), h = 16 + lines.length * 12.5 + 12;
    ensure(h);
    T(title, M, y + 9, { size: 9, bold: true, color: ACC });
    lines.forEach((l, i) => T(l, M, y + 24 + i * 12.5, { size: 9.5 }));
    y += h;
  };
  block("How to pay", inv.payment);
  block("Notes", inv.notes);
  block("Terms", num(inv.lateFee) > 0 ? `A late fee of ${num(inv.lateFee)}% per month may be added to overdue balances.` : "");

  /* footer, page numbers, stamp */
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    if (inv.showBrand) T("Created with Toolited Invoice Generator", M, PH - 22, { size: 7.5, color: [156, 163, 175] });
    if (pages > 1) T(`Page ${p} of ${pages}`, PW - M, PH - 22, { size: 7.5, color: [156, 163, 175], align: "right" });
  }
  const st = stampOf(inv, c);
  if (st) {
    doc.setPage(1);
    const ang = 18 * (Math.PI / 180), cx = PW / 2, cy = PH * 0.42;
    doc.setFont("helvetica", "bold"); doc.setFontSize(96);
    const w = doc.getTextWidth(st.t);
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.13 }));
    doc.setTextColor(...hexToRgb(st.col));
    doc.text(st.t, cx - (w / 2) * Math.cos(ang), cy + (w / 2) * Math.sin(ang), { angle: 18 });
    doc.restoreGraphicsState();
  }
  doc.save(`${(inv.number || "invoice").replace(/[\\/:*?"<>|]+/g, "_")}.pdf`);
}

/* prints a read-only render of the invoice in its own window: works for every language and script */
async function printInvoice(inv, c) {
  const w = window.open("", "_blank");
  if (!w) return false;
  try {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const size = inv.paper === "letter" ? "letter" : "A4";
    const html = renderToStaticMarkup(<Paper inv={inv} c={c} />);
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.number || "Invoice")}</title><style>@page{size:${size};margin:0}html,body{margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
    return true;
  } catch (e) {
    console.error(e);
    w.close();
    return false;
  }
}

/* ------------------------------ the paper --------------------------------- */

const COLS = "1fr 64px 104px 116px";

function Party({ title, p, acc }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: acc, marginBottom: 6 }}>{title}</div>
      {p.name && <div dir="auto" style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>{p.name}</div>}
      {p.address && <div dir="auto" style={{ whiteSpace: "pre-line", color: "#4b5563", lineHeight: 1.45 }}>{p.address}</div>}
      {p.email && <div dir="auto" style={{ color: "#4b5563" }}>{p.email}</div>}
      {p.phone && <div style={{ color: "#4b5563" }}>{p.phone}</div>}
      {p.taxId && <div style={{ color: "#4b5563" }}>Tax ID: {p.taxId}</div>}
    </div>
  );
}

function TRow({ l, v, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", fontWeight: bold ? 700 : 400, color: bold ? "#111827" : "#4b5563", fontSize: bold ? 14.5 : 13 }}>
      <span>{l}</span><span style={{ color: "#111827" }}>{v}</span>
    </div>
  );
}

function Block({ title, text, acc }) {
  if (!text || !String(text).trim()) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: acc, marginBottom: 4 }}>{title}</div>
      <div dir="auto" style={{ whiteSpace: "pre-line", fontSize: 12.5, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

/* inline styles only: the same markup is printed in a separate window */
function Paper({ inv, c }) {
  const acc = inv.accent, ink = inkOn(acc), tint = rgbCss(mixRgb(hexToRgb(acc), [255, 255, 255], 0.9));
  const tpl = inv.template, W = inv.paper === "letter" ? 816 : 794, H = inv.paper === "letter" ? 1056 : 1123;
  const money = (n) => fmtMoney(n, c.cur);
  const name = inv.from.name || "Your business";
  const logo = inv.logo ? <img src={inv.logo.src} alt="" style={{ maxHeight: 58, maxWidth: 220, objectFit: "contain", display: "block" }} /> : null;
  const stamp = stampOf(inv, c);
  const days = Math.max(0, Math.round(num(inv.earlyDays)));
  const details = [["Invoice #", inv.number || "-"], ["Issued", fmtDate(inv.issue)], ["Due", fmtDate(inv.due)]];
  if (inv.po) details.push(["PO / reference", inv.po]);
  details.push(["Currency", inv.currency]);

  const titleBox = (size, color, align = "right") => (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: size, fontWeight: 800, color, lineHeight: 1 }}>{inv.title || "Invoice"}</div>
      <div style={{ color: tpl === "band" ? color : "#6b7280", marginTop: 7, opacity: tpl === "band" ? 0.9 : 1 }}># {inv.number}</div>
    </div>
  );

  let header;
  if (tpl === "band") {
    header = (
      <div style={{ background: acc, color: ink, padding: "0 56px", height: 130, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>{logo ? <div style={{ background: "#fff", padding: 8, borderRadius: 8, display: "inline-block" }}>{logo}</div> : <div style={{ fontSize: 24, fontWeight: 700 }}>{name}</div>}</div>
        {titleBox(37, ink)}
      </div>
    );
  } else if (tpl === "bold") {
    header = (
      <div style={{ padding: "56px 56px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {titleBox(53, acc, "left")}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>{logo || <div style={{ fontSize: 20, fontWeight: 700 }}>{name}</div>}</div>
        </div>
        <div style={{ height: 7, background: acc, marginTop: 18 }} />
      </div>
    );
  } else {
    header = (
      <div style={{ padding: "56px 56px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>{logo || <div style={{ fontSize: 24, fontWeight: 700, color: acc }}>{name}</div>}</div>
          {titleBox(35, acc)}
        </div>
        <div style={{ height: 2, background: acc, marginTop: 18 }} />
      </div>
    );
  }

  const th = {
    display: "grid", gridTemplateColumns: COLS, padding: "9px 10px", fontSize: 11.5, fontWeight: 700,
    ...(tpl === "bold" ? { background: acc, color: ink } : tpl === "band" ? { background: tint, color: "#1f2937" } : { color: acc, borderBottom: `2px solid ${acc}` }),
  };
  const balanceStyle = tpl === "bold" ? { background: acc, color: ink } : tpl === "band" ? { background: tint, color: acc, borderRadius: 8 } : { borderTop: `2px solid ${acc}`, color: acc };

  return (
    <div id="invoice-paper" style={{
      width: W, minHeight: H, background: "#fff", color: "#1f2937", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 13, lineHeight: 1.35,
      position: "relative", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {stamp && (
        <div style={{ position: "absolute", top: "34%", left: 0, right: 0, textAlign: "center", pointerEvents: "none", transform: "rotate(-18deg)", zIndex: 2 }}>
          <span style={{ fontSize: 120, fontWeight: 800, letterSpacing: 8, color: stamp.col, opacity: 0.13 }}>{stamp.t}</span>
        </div>
      )}
      {header}
      <div style={{ padding: "30px 56px 0", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          <Party title="From" p={{ ...inv.from, name: inv.logo ? inv.from.name : "" }} acc={acc} />
          <Party title="Bill to" p={inv.to} acc={acc} />
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: acc, marginBottom: 6 }}>Details</div>
            {details.map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                <span style={{ color: "#6b7280" }}>{k}</span><span dir="auto" style={{ fontWeight: 700, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={th}>
            <span>Description</span><span style={{ textAlign: "right" }}>Qty</span><span style={{ textAlign: "right" }}>Rate</span><span style={{ textAlign: "right" }}>Amount</span>
          </div>
          {c.rows.map((r) => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: COLS, padding: "11px 10px", borderBottom: "1px solid #e5e7eb", breakInside: "avoid" }}>
              <div style={{ minWidth: 0, paddingRight: 10 }}>
                <div dir="auto" style={{ fontWeight: 700, whiteSpace: "pre-line" }}>{r.desc || "Item"}</div>
                {r.detail && <div dir="auto" style={{ color: "#6b7280", fontSize: 11.5, whiteSpace: "pre-line", marginTop: 2 }}>{r.detail}</div>}
              </div>
              <span style={{ textAlign: "right" }}>{fmtQty(r.qty)}</span>
              <span style={{ textAlign: "right" }}>{money(num(r.rate))}</span>
              <span style={{ textAlign: "right", fontWeight: 700 }}>{money(r.amount)}</span>
            </div>
          ))}
        </div>

        <div style={{ width: 320, marginLeft: "auto", marginTop: 18, breakInside: "avoid" }}>
          <TRow l="Subtotal" v={money(c.subtotal)} />
          {c.discount > 0 && <TRow l={`Discount${inv.discType === "percent" ? ` (${num(inv.discValue)}%)` : ""}`} v={`-${money(c.discount)}`} />}
          {(num(inv.taxRate) > 0 || c.tax > 0) && <TRow l={`${inv.taxName || "Tax"} (${num(inv.taxRate)}%${inv.taxInclusive ? ", included" : ""})`} v={money(c.tax)} />}
          {c.shipping > 0 && <TRow l="Shipping / fees" v={money(c.shipping)} />}
          <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 4 }}><TRow l="Total" v={money(c.total)} bold /></div>
          {c.paid > 0 && <TRow l="Paid / deposit" v={`-${money(c.paid)}`} />}
          <div style={{ ...balanceStyle, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 10px", marginTop: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Balance due</span>
            <span style={{ fontSize: 21, fontWeight: 700 }}>{money(c.balance)}</span>
          </div>
        </div>

        {c.early > 0 && c.balance > 0 && (
          <div style={{ background: tint, color: acc, borderRadius: 8, padding: "10px 14px", fontWeight: 700, fontSize: 12.5, marginTop: 18 }}>
            Pay within {days} days (by {fmtDate(addDays(inv.issue, days))}) and save {money(c.early)}: pay {money(c.balance - c.early)} instead of {money(c.balance)}.
          </div>
        )}
        {inv.showWords && c.balance > 0 && (
          <div style={{ marginTop: 14, color: "#6b7280", fontStyle: "italic", fontSize: 12 }}>Amount due in words: {amountWords(c.balance, c.cur)}</div>
        )}
        <Block title="How to pay" text={inv.payment} acc={acc} />
        <Block title="Notes" text={inv.notes} acc={acc} />
        <Block title="Terms" text={num(inv.lateFee) > 0 ? `A late fee of ${num(inv.lateFee)}% per month may be added to overdue balances.` : ""} acc={acc} />
      </div>
      <div style={{ padding: "28px 56px 24px", fontSize: 10.5, color: "#9ca3af" }}>
        {inv.showBrand ? "Created with Toolited Invoice Generator" : "\u00A0"}
      </div>
    </div>
  );
}

/* -------------------------------- UI bits --------------------------------- */

const card = "rounded-2xl border border-border bg-surface/60 backdrop-blur-xl";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/70 px-3.5 py-2 text-sm font-semibold text-text transition hover:border-muted disabled:opacity-40";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-2 text-sm font-semibold text-text shadow-[0_0_24px_color-mix(in_srgb,var(--theme-brand)_30%,transparent)] transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100";
const iconBtn = "rounded-lg border border-border p-1.5 text-muted transition hover:text-text disabled:opacity-30";
const selCls = "rounded-xl border border-border bg-surface/70 px-3 py-2 text-sm font-semibold text-text outline-none focus:border-brand/60";

const Chip = ({ on, onClick, children }) => (
  <button type="button" onClick={onClick} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${on ? "border-brand bg-brand/15 text-text" : "border-border text-text hover:border-muted"}`}>{children}</button>
);

/* everything inside the paper is styled here so it looks like a printed page, not a form */
const CSS = `
.inv-ed{display:block;width:100%;min-width:0;background:transparent;border:0;outline:0;border-radius:6px;padding:1px 4px;margin:-1px -4px;font:inherit;color:inherit;resize:none;overflow:hidden;transition:background .15s,box-shadow .15s;color-scheme:light}
.inv-ed::placeholder{color:currentColor;opacity:.32}
.inv-ed:hover{background:color-mix(in srgb,var(--acc) 9%,transparent)}
.inv-ed:focus{background:color-mix(in srgb,var(--acc) 12%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--acc) 55%,transparent)}
.inv-ed.r{text-align:right}
.inv-ed[type=number]{-moz-appearance:textfield;appearance:textfield}
.inv-ed[type=number]::-webkit-inner-spin-button,.inv-ed[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
select.inv-ed{cursor:pointer;-webkit-appearance:none;appearance:none}
select.inv-ed option{color:#111827;background:#fff}
.inv-tools{opacity:0;pointer-events:none;transition:opacity .15s}
.inv-row:hover>.inv-tools,.inv-row:focus-within>.inv-tools{opacity:1;pointer-events:auto}
@media (hover:none){.inv-tools{opacity:1;pointer-events:auto}}
.inv-mini{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:24px;min-width:24px;padding:0 6px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:11px;font-weight:600;cursor:pointer}
.inv-mini:hover{color:#111827;border-color:#9ca3af}
.inv-mini:disabled{opacity:.35;cursor:default}
.inv-add{display:inline-flex;align-items:center;gap:5px;border:1.5px dashed color-mix(in srgb,var(--acc) 55%,transparent);color:var(--acc);border-radius:999px;padding:4px 12px;font-size:12.5px;font-weight:600;background:transparent;cursor:pointer;transition:background .15s}
.inv-add:hover{background:color-mix(in srgb,var(--acc) 10%,transparent)}
.inv-lbl{font-size:10.5px;font-weight:600;color:#9ca3af}
`;

function focusId(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }, 90);
}

/* an input that looks like printed text; multiline ones grow with their content */
function Ed({ value, onChange, multiline = false, right = false, className = "", type = "text", ...rest }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!multiline || !el) return undefined;
    const fit = () => { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value, multiline]);
  const p = { ref, value, dir: "auto", className: `inv-ed${right ? " r" : ""} ${className}`, ...rest, onChange: (e) => onChange(e.target.value) };
  return multiline ? <textarea rows={1} {...p} /> : <input type={type} {...p} />;
}

function PartyEd({ title, p, set, acc, idp, showName }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <div style={{ fontSize: 11.5, fontWeight: 700, color: acc, marginBottom: 6 }}>{title}</div>
      {showName && <Ed id={`${idp}-name`} value={p.name} onChange={(v) => set({ name: v })} placeholder="Name" style={{ fontWeight: 700, fontSize: 14.5 }} />}
      <Ed multiline id={`${idp}-address`} value={p.address} onChange={(v) => set({ address: v })} placeholder="Address" style={{ color: "#4b5563", lineHeight: 1.45 }} />
      <Ed id={`${idp}-email`} value={p.email} onChange={(v) => set({ email: v })} placeholder="Email" style={{ color: "#4b5563" }} />
      <Ed id={`${idp}-phone`} value={p.phone} onChange={(v) => set({ phone: v })} placeholder="Phone" style={{ color: "#4b5563" }} />
      <Ed id={`${idp}-tax`} value={p.taxId} onChange={(v) => set({ taxId: v })} placeholder="Tax ID" style={{ color: "#4b5563" }} />
    </div>
  );
}

function RemoveTool({ onClick, label = "Remove" }) {
  return (
    <div className="inv-tools absolute right-1 z-10" style={{ top: -10 }}>
      <button type="button" className="inv-mini" onClick={onClick} aria-label={label}><X size={12} /></button>
    </div>
  );
}

function TotRow({ label, children, strong }) {
  return (
    <div className="inv-row relative flex items-center justify-between gap-2 px-2.5 py-1.5" style={{ fontWeight: strong ? 700 : 400, color: strong ? "#111827" : "#4b5563", fontSize: strong ? 14.5 : 13 }}>
      <span className="flex min-w-0 items-center gap-1.5">{label}</span>
      <span className="flex shrink-0 items-center gap-1" style={{ color: "#111827" }}>{children}</span>
    </div>
  );
}

const SHOW_LABEL = [
  ["discount", "Discount"], ["tax", "Tax"], ["shipping", "Shipping or fees"], ["paid", "Deposit paid"],
  ["early", "Early-payment offer"], ["late", "Late fee"], ["po", "PO number"], ["payment", "Payment details"], ["notes", "Notes"],
];
const ADDON_FOCUS = { discount: "f-discount", tax: "f-taxrate", shipping: "f-shipping", paid: "f-paid", early: "f-early", late: "f-late", po: "f-po", payment: "f-payment", notes: "f-notes" };

function isShown(inv, k) {
  if (inv.show && inv.show[k]) return true;
  switch (k) {
    case "discount": return num(inv.discValue) > 0;
    case "tax": return num(inv.taxRate) > 0;
    case "shipping": return num(inv.shipping) > 0;
    case "paid": return num(inv.paid) > 0;
    case "early": return num(inv.earlyPct) > 0;
    case "late": return num(inv.lateFee) > 0;
    case "payment": return !!inv.payment.trim();
    case "notes": return !!inv.notes.trim();
    case "po": return !!inv.po.trim();
    default: return false;
  }
}

/* ---------------------- the page you edit directly ------------------------ */

function EditablePaper({ inv, c, api }) {
  const acc = inv.accent, ink = inkOn(acc), tint = rgbCss(mixRgb(hexToRgb(acc), [255, 255, 255], 0.9));
  const tpl = inv.template, W = inv.paper === "letter" ? 816 : 794;
  const money = (n) => fmtMoney(n, c.cur), sym = c.cur.sym.trim();
  const stamp = stampOf(inv, c), sh = (k) => isShown(inv, k);
  const days = Math.max(0, Math.round(num(inv.earlyDays)));
  const { set, setParty, setItem } = api;
  const fileRef = useRef(null);
  const pad = "px-5 sm:px-10 md:px-14";
  const label = { fontSize: 11.5, fontWeight: 700, color: acc, marginBottom: 6 };

  const logoImg = inv.logo && (
    <>
      <img src={inv.logo.src} alt="Your logo" style={{ maxHeight: 58, maxWidth: 220, objectFit: "contain", display: "block" }} />
      <div className="inv-tools absolute z-10 flex gap-1" style={{ right: -8, top: -10 }}>
        <button type="button" className="inv-mini" onClick={() => fileRef.current?.click()} aria-label="Change logo"><ImagePlus size={12} /></button>
        <button type="button" className="inv-mini" onClick={() => set({ logo: null })} aria-label="Remove logo"><X size={12} /></button>
      </div>
    </>
  );
  /* the brand corner: your logo, or your name (typed right here) with an "add logo" button */
  const brand = (color, size, onBand) => (inv.logo
    ? <div className={`inv-row relative inline-block ${onBand ? "rounded-lg bg-white p-2" : ""}`}>{logoImg}</div>
    : (
      <div className="min-w-0" style={{ width: "min(100%, 300px)" }}>
        <Ed id="f-from-name" value={inv.from.name} onChange={(v) => setParty("from", { name: v })} placeholder="Your business name" style={{ fontSize: size, fontWeight: 700, color }} />
        <button type="button" className="inv-add mt-2" onClick={() => fileRef.current?.click()} style={onBand ? { color: ink, borderColor: "rgba(255,255,255,.6)" } : undefined}><ImagePlus size={13} />Add logo</button>
      </div>
    ));
  const titleBlock = (size, color, left) => (
    <div style={{ width: "min(100%, 300px)", textAlign: left ? "left" : "right" }}>
      <Ed id="f-title" right={!left} value={inv.title} onChange={(v) => set({ title: v })} placeholder="Invoice" style={{ fontSize: `clamp(${Math.round(size * 0.62)}px, 7vw, ${size}px)`, fontWeight: 800, color, lineHeight: 1.05 }} />
      <div style={{ color: tpl === "band" ? color : "#6b7280", marginTop: 7, opacity: tpl === "band" ? 0.9 : 1 }}># {inv.number || "-"}</div>
    </div>
  );

  let header;
  if (tpl === "band") {
    header = <div className={`flex flex-wrap items-center justify-between gap-4 py-8 ${pad}`} style={{ background: acc, color: ink }}>{brand(ink, 24, true)}{titleBlock(37, ink, false)}</div>;
  } else if (tpl === "bold") {
    header = (
      <div className={`pt-10 ${pad}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">{titleBlock(53, acc, true)}<div className="flex min-w-0 justify-end">{brand("#1f2937", 20, false)}</div></div>
        <div style={{ height: 7, background: acc, marginTop: 18 }} />
      </div>
    );
  } else {
    header = (
      <div className={`pt-10 ${pad}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">{brand(acc, 24, false)}{titleBlock(35, acc, false)}</div>
        <div style={{ height: 2, background: acc, marginTop: 18 }} />
      </div>
    );
  }

  const th = {
    padding: "9px 10px", fontSize: 11.5, fontWeight: 700,
    ...(tpl === "bold" ? { background: acc, color: ink } : tpl === "band" ? { background: tint, color: "#1f2937" } : { color: acc, borderBottom: `2px solid ${acc}` }),
  };
  const balanceStyle = tpl === "bold" ? { background: acc, color: ink } : tpl === "band" ? { background: tint, color: acc, borderRadius: 8 } : { borderTop: `2px solid ${acc}`, color: acc };
  const cols = "md:grid-cols-[minmax(0,1fr)_64px_104px_116px]";
  const missing = SHOW_LABEL.filter(([k]) => !sh(k));
  const wordsOn = inv.showWords && c.balance > 0;

  return (
    <div className="relative mx-auto w-full overflow-hidden bg-white shadow-2xl md:min-h-[1000px]" style={{ maxWidth: W, color: "#1f2937", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 13, lineHeight: 1.35, "--acc": acc }}>
      <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => { api.onLogo(e.target.files[0]); e.target.value = ""; }} />
      {stamp && (
        <div className="pointer-events-none absolute left-0 right-0 z-[2] text-center" style={{ top: "34%", transform: "rotate(-18deg)" }}>
          <span style={{ fontSize: "clamp(56px, 15vw, 120px)", fontWeight: 800, letterSpacing: 8, color: stamp.col, opacity: 0.13 }}>{stamp.t}</span>
        </div>
      )}
      {header}

      <div className={`pt-7 ${pad}`}>
        {/* from / bill to / details */}
        <div className="grid gap-6 sm:grid-cols-3">
          <PartyEd title="From" p={inv.from} set={(patch) => setParty("from", patch)} acc={acc} idp="f-from" showName={!!inv.logo} />
          <PartyEd title="Bill to" p={inv.to} set={(patch) => setParty("to", patch)} acc={acc} idp="f-to" showName />
          <div className="min-w-0">
            <div style={label}>Details</div>
            {[
              ["Invoice #", <Ed key="n" id="f-number" right value={inv.number} onChange={(v) => set({ number: v })} placeholder="INV-0001" style={{ fontWeight: 700 }} />],
              ["Issued", <Ed key="i" id="f-issue" right type="date" value={inv.issue} onChange={(v) => api.setIssue(v)} style={{ fontWeight: 700 }} />],
              ["Due", (
                <div key="d">
                  <Ed id="f-due" right type="date" value={inv.due} onChange={(v) => set({ due: v, terms: "custom" })} style={{ fontWeight: 700 }} />
                  <select aria-label="Payment terms" className="inv-ed r" value={inv.terms} onChange={(e) => api.pickTerms(e.target.value)} style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>
                    {TERMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              )],
              ...(sh("po") ? [["PO / ref", (
                <div key="p" className="inv-row relative">
                  <Ed id="f-po" right value={inv.po} onChange={(v) => set({ po: v })} placeholder="PO number" style={{ fontWeight: 700 }} />
                  <RemoveTool onClick={() => api.removeAddon("po")} />
                </div>
              )]] : []),
              ["Currency", (
                <select key="c" aria-label="Currency" className="inv-ed r" value={inv.currency} onChange={(e) => set({ currency: e.target.value })} style={{ fontWeight: 700 }}>
                  {Object.entries(CUR).map(([k, v]) => <option key={k} value={k}>{k} ({v.name})</option>)}
                </select>
              )],
            ].map(([k, v]) => (
              <div key={k} className="mb-1.5 flex items-start justify-between gap-3">
                <span className="shrink-0 pt-px" style={{ color: "#6b7280" }}>{k}</span>
                <div className="min-w-0 flex-1" style={{ maxWidth: "62%" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* line items */}
        <div className="mt-7">
          <div className={`hidden gap-x-2 md:grid ${cols}`} style={th}>
            <span>Description</span><span style={{ textAlign: "right" }}>Qty</span><span style={{ textAlign: "right" }}>Rate</span><span style={{ textAlign: "right" }}>Amount</span>
          </div>
          {inv.items.map((it, i) => (
            <div key={it.id} className={`inv-row relative grid grid-cols-3 gap-x-2 gap-y-1 px-2.5 py-2.5 ${cols}`} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <div className="col-span-3 min-w-0 md:col-span-1">
                <Ed multiline id={`f-item-desc-${i}`} value={it.desc} onChange={(v) => setItem(it.id, { desc: v })} placeholder="What you did or sold" style={{ fontWeight: 700 }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); api.enterOnItem(i); } }} />
                <Ed multiline value={it.detail} onChange={(v) => setItem(it.id, { detail: v })} placeholder="More detail (optional)" style={{ color: "#6b7280", fontSize: 11.5 }} />
              </div>
              <div><span className="inv-lbl md:hidden">Qty</span><Ed right type="number" min="0" step="any" inputMode="decimal" value={it.qty} onChange={(v) => setItem(it.id, { qty: v })} placeholder="1" aria-label="Quantity" /></div>
              <div><span className="inv-lbl md:hidden">Rate</span><Ed right id={`f-item-rate-${i}`} type="number" min="0" step="any" inputMode="decimal" value={it.rate} onChange={(v) => setItem(it.id, { rate: v })} placeholder="0.00" aria-label="Rate" /></div>
              <div className="text-right" style={{ fontWeight: 700 }}>
                <span className="inv-lbl block md:hidden">Amount</span>
                {money(c.rows[i].amount)}
                {sh("tax") && !it.taxable && <div style={{ fontSize: 10.5, fontWeight: 500, color: "#9ca3af" }}>no tax</div>}
              </div>
              <div className="inv-tools absolute z-10 flex gap-1 rounded-lg bg-white p-0.5 shadow-md" style={{ right: 8, top: -12 }}>
                {sh("tax") && <button type="button" className="inv-mini" onClick={() => setItem(it.id, { taxable: !it.taxable })} aria-pressed={it.taxable}>{it.taxable ? "Taxed" : "No tax"}</button>}
                <button type="button" className="inv-mini" onClick={() => api.moveItem(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={12} /></button>
                <button type="button" className="inv-mini" onClick={() => api.moveItem(i, 1)} disabled={i === inv.items.length - 1} aria-label="Move down"><ArrowDown size={12} /></button>
                <button type="button" className="inv-mini" onClick={() => api.dupItem(i)} aria-label="Duplicate item"><Copy size={12} /></button>
                <button type="button" className="inv-mini" onClick={() => api.delItem(i)} aria-label="Delete item"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          <button type="button" className="inv-add mt-3" onClick={api.addItem}><Plus size={13} />Add item</button>
        </div>

        {/* add-ons on the left, totals on the right */}
        <div className="mt-7 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            {missing.length > 0 && (
              <div>
                <div className="inv-lbl mb-1.5">Add to this invoice</div>
                <div className="flex flex-wrap gap-2">
                  {missing.map(([k, l]) => <button key={k} type="button" className="inv-add" onClick={() => api.addon(k)}><Plus size={13} />{l}</button>)}
                </div>
              </div>
            )}
            {sh("early") && (
              <div className="inv-row relative rounded-lg px-3.5 py-3" style={{ background: tint, color: acc, fontSize: 12.5, fontWeight: 700 }}>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span>Early-payment offer:</span>
                  <span className="inline-block w-11"><Ed id="f-early" right type="number" min="0" step="any" inputMode="decimal" value={inv.earlyPct} onChange={(v) => set({ earlyPct: v })} placeholder="2" aria-label="Early payment percent" /></span>
                  <span>% off if paid within</span>
                  <span className="inline-block w-10"><Ed right type="number" min="0" step="1" inputMode="numeric" value={inv.earlyDays} onChange={(v) => set({ earlyDays: v })} aria-label="Days" /></span>
                  <span>days</span>
                </div>
                {c.early > 0 && c.balance > 0 && (
                  <div style={{ marginTop: 6 }}>Pay within {days} days (by {fmtDate(addDays(inv.issue, days))}) and save {money(c.early)}: pay {money(c.balance - c.early)} instead of {money(c.balance)}.</div>
                )}
                <RemoveTool onClick={() => api.removeAddon("early")} />
              </div>
            )}
            {wordsOn && <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: 12 }}>Amount due in words: {amountWords(c.balance, c.cur)}</div>}
          </div>

          <div className="w-full md:w-[330px] md:shrink-0">
            <TotRow label="Subtotal">{money(c.subtotal)}</TotRow>
            {sh("discount") && (
              <div className="inv-row relative">
                <TotRow label={(
                  <>
                    <span>Discount</span>
                    <span className="inline-block w-14"><Ed id="f-discount" right type="number" min="0" step="any" inputMode="decimal" value={inv.discValue} onChange={(v) => set({ discValue: v })} placeholder="0" aria-label="Discount value" /></span>
                    <select aria-label="Discount type" className="inv-ed" style={{ width: "auto" }} value={inv.discType} onChange={(e) => set({ discType: e.target.value })}>
                      <option value="percent">%</option><option value="fixed">{sym}</option>
                    </select>
                  </>
                )}>-{money(c.discount)}</TotRow>
                <RemoveTool onClick={() => api.removeAddon("discount")} />
              </div>
            )}
            {sh("tax") && (
              <div className="inv-row relative">
                <TotRow label={(
                  <>
                    <span className="inline-block w-20"><Ed value={inv.taxName} onChange={(v) => set({ taxName: v })} placeholder="Tax" aria-label="Tax name" /></span>
                    <span className="inline-block w-12"><Ed id="f-taxrate" right type="number" min="0" step="any" inputMode="decimal" value={inv.taxRate} onChange={(v) => set({ taxRate: v })} placeholder="0" aria-label="Tax rate" /></span>
                    <span>%</span>
                    <label className="ml-1 flex cursor-pointer items-center gap-1" style={{ fontSize: 11, color: "#6b7280" }}>
                      <input type="checkbox" checked={inv.taxInclusive} onChange={(e) => set({ taxInclusive: e.target.checked })} />incl.
                    </label>
                  </>
                )}>{money(c.tax)}</TotRow>
                <RemoveTool onClick={() => api.removeAddon("tax")} />
              </div>
            )}
            {sh("shipping") && (
              <div className="inv-row relative">
                <TotRow label="Shipping / fees">{sym}<span className="inline-block w-24"><Ed id="f-shipping" right type="number" min="0" step="any" inputMode="decimal" value={inv.shipping} onChange={(v) => set({ shipping: v })} placeholder="0.00" aria-label="Shipping" /></span></TotRow>
                <RemoveTool onClick={() => api.removeAddon("shipping")} />
              </div>
            )}
            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 4 }}><TotRow label="Total" strong>{money(c.total)}</TotRow></div>
            {sh("paid") && (
              <div className="inv-row relative">
                <TotRow label="Paid / deposit">-{sym}<span className="inline-block w-24"><Ed id="f-paid" right type="number" min="0" step="any" inputMode="decimal" value={inv.paid} onChange={(v) => set({ paid: v })} placeholder="0.00" aria-label="Amount paid" /></span></TotRow>
                <RemoveTool onClick={() => api.removeAddon("paid")} />
              </div>
            )}
            <div className="mt-2 flex items-center justify-between px-2.5 py-3" style={balanceStyle}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Balance due</span>
              <span style={{ fontSize: 21, fontWeight: 700 }}>{money(c.balance)}</span>
            </div>
          </div>
        </div>

        {/* text blocks that appear when you add them */}
        {sh("payment") && (
          <div className="inv-row relative mt-6">
            <div style={label}>How to pay</div>
            <Ed multiline id="f-payment" value={inv.payment} onChange={(v) => set({ payment: v })} placeholder="Bank details, PayPal address or a payment link" style={{ lineHeight: 1.5 }} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PAY_CHIPS.map(([l, t]) => <button key={l} type="button" className="inv-add" style={{ padding: "2px 10px", fontSize: 11.5 }} onClick={() => set({ payment: inv.payment ? `${inv.payment}\n${t}` : t })}>+ {l}</button>)}
            </div>
            <RemoveTool onClick={() => api.removeAddon("payment")} />
          </div>
        )}
        {sh("notes") && (
          <div className="inv-row relative mt-6">
            <div style={label}>Notes</div>
            <Ed multiline id="f-notes" value={inv.notes} onChange={(v) => set({ notes: v })} placeholder="A thank-you, or anything the client should know" style={{ lineHeight: 1.5 }} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {NOTE_CHIPS.map((t) => <button key={t} type="button" className="inv-add" style={{ padding: "2px 10px", fontSize: 11.5 }} onClick={() => set({ notes: inv.notes ? `${inv.notes}\n${t}` : t })}>+ {t.length > 30 ? `${t.slice(0, 28)}…` : t}</button>)}
            </div>
            <RemoveTool onClick={() => api.removeAddon("notes")} />
          </div>
        )}
        {sh("late") && (
          <div className="inv-row relative mt-6">
            <div style={label}>Terms</div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1" style={{ fontSize: 12.5 }}>
              <span>A late fee of</span>
              <span className="inline-block w-12"><Ed id="f-late" right type="number" min="0" step="any" inputMode="decimal" value={inv.lateFee} onChange={(v) => set({ lateFee: v })} placeholder="1.5" aria-label="Late fee percent" /></span>
              <span>% per month may be added to overdue balances.</span>
            </div>
            <RemoveTool onClick={() => api.removeAddon("late")} />
          </div>
        )}
      </div>

      <div className={`pb-6 pt-8 ${pad}`} style={{ fontSize: 10.5, color: "#9ca3af" }}>{inv.showBrand ? "Created with Toolited Invoice Generator" : "\u00A0"}</div>
    </div>
  );
}

function Ring({ pct, color }) {
  const r = 22, C = 2 * Math.PI * r;
  return (
    <svg width="40" height="40" viewBox="0 0 56 56" className="shrink-0" aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="6" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} transform="rotate(-90 28 28)" />
      <text x="28" y="33" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">{pct}</text>
    </svg>
  );
}

function TemplateThumb({ id, acc }) {
  const line = (w, o = {}) => <div style={{ height: 3, width: w, background: "#d1d5db", borderRadius: 2, margin: "3px 0 0 6px", ...o }} />;
  return (
    <div style={{ width: 54, height: 70, background: "#fff", borderRadius: 6, border: "1px solid #d1d5db", overflow: "hidden", position: "relative" }}>
      {id === "band" && <div style={{ height: 18, background: acc }} />}
      {id === "bold" && <div style={{ margin: "6px 6px 0", height: 7, width: 30, background: acc, borderRadius: 2 }} />}
      {id === "clean" && <div style={{ margin: "7px 6px 0", height: 3, width: 20, background: acc, borderRadius: 2 }} />}
      {id === "bold" && <div style={{ height: 3, margin: "4px 6px 0", background: acc }} />}
      {id === "clean" && <div style={{ height: 1.5, margin: "4px 6px 0", background: acc }} />}
      {line(34, { marginTop: 8 })}{line(26)}{line(30)}
      <div style={{ position: "absolute", right: 6, bottom: 8, width: 22, height: id === "band" ? 9 : id === "clean" ? 3 : 9, background: id === "band" ? `${acc}33` : acc, borderRadius: id === "band" ? 3 : 0 }} />
    </div>
  );
}

/* ================================== PAGE ================================== */

export default function InvoiceGenerator() {
  const [inv, setInv] = useState(() => {
    const d = LS.get(K_DRAFT, null);
    return d ? { ...blank(), ...d, show: d.show || {}, items: d.items?.length ? d.items : [newItem()] } : blank(LS.get(K_PROFILE, {}));
  });
  const [vault, setVault] = useState(() => LS.get(K_VAULT, []));
  const [tray, setTray] = useState(null); // null | "style" | "check"
  const [vaultOpen, setVaultOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);

  const c = useMemo(() => calc(inv), [inv]);
  const h = useMemo(() => health(inv, c), [inv, c]);
  const status = statusOf(inv, c);
  const nonLatin = hasNonLatin(inv);

  useEffect(() => {
    const t = setTimeout(() => { LS.set(K_DRAFT, inv); LS.set(K_PROFILE, pickProfile(inv)); }, 400);
    return () => clearTimeout(t);
  }, [inv]);
  useEffect(() => {
    if (!vaultOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setVaultOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vaultOpen]);

  const flash = (m) => { setToast(m); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(""), 2600); };

  const set = (patch) => setInv((p) => ({ ...p, ...patch }));
  const setParty = (k, patch) => setInv((p) => ({ ...p, [k]: { ...p[k], ...patch } }));
  const setItem = (id, patch) => setInv((p) => ({ ...p, items: p.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const moveItem = (i, d) => setInv((p) => { const a = [...p.items], j = i + d; if (j < 0 || j >= a.length) return p; [a[i], a[j]] = [a[j], a[i]]; return { ...p, items: a }; });
  const dupItem = (i) => setInv((p) => { const a = [...p.items]; a.splice(i + 1, 0, { ...a[i], id: uid() }); return { ...p, items: a }; });
  const delItem = (i) => setInv((p) => { const a = p.items.filter((_, k) => k !== i); return { ...p, items: a.length ? a : [newItem()] }; });
  const addItem = () => setInv((p) => ({ ...p, items: [...p.items, newItem()] }));
  const enterOnItem = (i) => { if (i === inv.items.length - 1) addItem(); focusId(`f-item-desc-${i + 1}`); };
  const pickTerms = (t) => setInv((p) => ({ ...p, terms: t, due: t === "custom" ? p.due : addDays(p.issue, +t) }));
  const setIssue = (v) => { if (v) setInv((p) => ({ ...p, issue: v, due: p.terms === "custom" ? p.due : addDays(v, +p.terms) })); };
  const setStatus = (s) => setInv((p) => { const cc = calc(p); return { ...p, status: s, show: s === "paid" ? { ...p.show, paid: true } : p.show, paid: s === "paid" ? String(cc.total) : p.status === "paid" ? "" : p.paid }; });

  const addon = (k) => { setInv((p) => ({ ...p, show: { ...p.show, [k]: true } })); focusId(ADDON_FOCUS[k]); };
  const removeAddon = (k) => setInv((p) => {
    const clear = { discount: { discValue: "" }, tax: { taxRate: "" }, shipping: { shipping: "" }, paid: { paid: "", status: p.status === "paid" ? "sent" : p.status }, early: { earlyPct: "" }, late: { lateFee: "" }, payment: { payment: "" }, notes: { notes: "" }, po: { po: "" } }[k] || {};
    return { ...p, ...clear, show: { ...p.show, [k]: false } };
  });

  const onLogo = (file) => {
    if (!file || !/^image\//.test(file.type)) return;
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const iw = img.naturalWidth || img.width || 300, ih = img.naturalHeight || img.height || 100;
      const k = Math.min(1, 420 / Math.max(iw, ih)), cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(iw * k)); cv.height = Math.max(1, Math.round(ih * k));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      set({ logo: { src: cv.toDataURL("image/png"), w: cv.width, h: cv.height } });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); flash("That image couldn’t be read. Try a PNG or JPG."); };
    img.src = url;
  };
  const brandFromLogo = async () => {
    const col = inv.logo ? await logoColor(inv.logo.src) : null;
    if (col) { set({ accent: col }); flash("Brand colour taken from your logo"); } else flash("No strong colour found in the logo");
  };

  const commitVault = (next) => { setVault(next); if (!LS.set(K_VAULT, next)) flash("Browser storage is full. Delete a saved invoice to make room."); };
  const saveToVault = (src, quiet) => {
    commitVault([{ id: src.id, savedAt: Date.now(), inv: { ...src, logo: null } }, ...vault.filter((v) => v.id !== src.id)]);
    if (!quiet) flash("Invoice saved");
  };
  const hasContent = inv.to.name.trim() || c.total > 0;
  const newInvoice = () => {
    if (hasContent) saveToVault(inv, true);
    setInv(blank({ ...pickProfile(inv), number: bump(inv.number) }));
    setTray(null);
    flash(hasContent ? "Saved the last invoice and started a new one" : "Started a new invoice");
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };
  const openEntry = (e) => {
    if (e.id !== inv.id && hasContent) saveToVault(inv, true);
    setInv({ ...blank(), ...e.inv, show: e.inv.show || {}, logo: inv.logo });
    setVaultOpen(false);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };
  const dupEntry = (e) => {
    const n = { ...blank(), ...e.inv, show: { ...(e.inv.show || {}), paid: false }, id: uid(), number: bump(e.inv.number), issue: todayISO(), paid: "", status: "draft", logo: inv.logo };
    n.due = n.terms === "custom" ? addDays(n.issue, 14) : addDays(n.issue, +n.terms);
    setInv(n);
    setVaultOpen(false);
    flash(`Copied as ${n.number}`);
  };
  const markPaid = (e) => {
    const cc = calc(e.inv), upd = { ...e.inv, paid: String(cc.total), status: "paid", show: { ...(e.inv.show || {}), paid: true } };
    commitVault(vault.map((v) => (v.id === e.id ? { ...v, inv: upd } : v)));
    if (inv.id === e.id) setInv((p) => ({ ...p, paid: String(cc.total), status: "paid", show: { ...p.show, paid: true } }));
  };
  const delEntry = (e) => commitVault(vault.filter((v) => v.id !== e.id));

  const doPdf = async () => {
    setBusy(true);
    try { await exportPdf(inv, c); flash("PDF downloaded"); }
    catch (e) { console.error(e); flash("PDF export failed. Make sure jspdf is installed (npm i jspdf)."); }
    finally { setBusy(false); }
  };
  const doPrint = async () => { if (!(await printInvoice(inv, c))) flash("Allow pop-ups for this site to print."); };
  const fix = (t) => { if (t.addon) addon(t.addon); else focusId(t.id); setTray(null); };

  const outstanding = useMemo(() => {
    const m = {};
    vault.forEach((v) => { const cc = calc(v.inv), st = statusOf(v.inv, cc); if (st === "open" || st === "overdue") m[v.inv.currency] = (m[v.inv.currency] || 0) + cc.balance; });
    return Object.entries(m);
  }, [vault]);

  const api = { set, setParty, setItem, moveItem, dupItem, delItem, addItem, enterOnItem, pickTerms, setIssue, addon, removeAddon, onLogo };
  const ringColor = h.score >= 90 ? "#16a34a" : h.score >= 60 ? "#d97706" : "#dc2626";
  const ringLabel = h.score >= 90 ? "Ready to send" : h.score >= 60 ? "Almost there" : "Needs details";

  /* ---------------------------------- JSX --------------------------------- */

  return (
    <>
      <style>{CSS}</style>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[180px]" />
      </div>

      {/* overflow-x: clip (not hidden) so the dock below can stay sticky */}
      <div className="min-h-screen bg-gradient-to-br from-page via-surface to-page text-text" style={{ overflowX: "clip" }}>
        {/* <Navbar /> */}

        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-[794px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-sm font-medium text-brand"><Receipt size={15} />Invoice generator</span>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">Type straight onto your invoice.</h1>
            <p className="mt-3 text-muted">This page is the invoice. Click any text to edit it, and use the dashed buttons to add discounts, tax, deposits, late fees and notes. Nothing leaves your device.</p>
          </div>

          {/* dock (sticky). Change top-20 if your navbar is taller or shorter */}
          <div className="sticky top-20 z-30 mx-auto mt-6 max-w-[794px]">
            <div className={`${card} flex flex-wrap items-center gap-2 p-2 shadow-lg sm:p-2.5`}>
              <button type="button" className={btn} onClick={() => setTray(tray === "style" ? null : "style")} aria-expanded={tray === "style"}><SlidersHorizontal size={16} />Style</button>
              <select aria-label="Invoice status" value={inv.status} onChange={(e) => setStatus(e.target.value)} className={selCls}>
                <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid in full</option>
              </select>
              <button type="button" onClick={() => setTray(tray === "check" ? null : "check")} aria-expanded={tray === "check"} className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-2.5 py-1 text-left transition hover:border-muted">
                <Ring pct={h.score} color={ringColor} />
                <span className="hidden text-xs leading-tight sm:block"><span className="block font-semibold">{ringLabel}</span><span className="text-muted">{h.todo.length ? `${h.todo.length} to check` : "All set"}</span></span>
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button type="button" className={btn} onClick={() => setVaultOpen(true)}><FolderOpen size={16} /><span className="hidden sm:inline">Saved</span>{vault.length > 0 && <span className="rounded-full bg-brand/15 px-1.5 text-xs text-brand">{vault.length}</span>}</button>
                <button type="button" className={btn} onClick={() => saveToVault(inv)}><Save size={16} /><span className="hidden sm:inline">Save</span></button>
                <button type="button" className={btn} onClick={newInvoice}><FilePlus size={16} /><span className="hidden sm:inline">New</span></button>
                <button type="button" className={btn} onClick={doPrint}><Printer size={16} /><span className="hidden sm:inline">Print</span></button>
                <button type="button" className={btnPrimary} onClick={doPdf} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}PDF</button>
              </div>
            </div>

            {tray === "style" && (
              <div className={`${card} mt-2 max-h-[65vh] space-y-5 overflow-y-auto p-4 shadow-lg`}>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted">Layout</p>
                  <div className="flex flex-wrap gap-3">
                    {TEMPLATES.map(([id, l]) => (
                      <button key={id} type="button" onClick={() => set({ template: id })} aria-pressed={inv.template === id}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${inv.template === id ? "border-brand bg-brand/10" : "border-border hover:border-muted"}`}>
                        <TemplateThumb id={id} acc={inv.accent} /><span className="text-xs font-medium">{l}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted">Brand colour</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {ACCENTS.map((a) => (
                      <button key={a} type="button" onClick={() => set({ accent: a })} aria-label={`Use colour ${a}`} aria-pressed={inv.accent === a}
                        className={`h-8 w-8 rounded-full border-2 transition ${inv.accent === a ? "scale-110 border-text" : "border-transparent"}`} style={{ background: a }} />
                    ))}
                    <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted hover:text-text">
                      <Palette size={14} />Custom<input type="color" value={inv.accent} onChange={(e) => set({ accent: e.target.value })} className="sr-only" />
                    </label>
                    {inv.logo && <button type="button" onClick={brandFromLogo} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted hover:text-text"><Sparkles size={14} />Match my logo</button>}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">Stamp</p>
                    <div className="flex flex-wrap gap-2">{[["auto", "Automatic"], ["none", "None"], ["paid", "Paid"], ["draft", "Draft"], ["void", "Void"]].map(([v, l]) => <Chip key={v} on={inv.stamp === v} onClick={() => set({ stamp: v })}>{l}</Chip>)}</div>
                    <p className="mt-1 text-xs text-muted">Automatic adds “Paid” once the balance reaches zero.</p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">Paper</p>
                    <div className="flex gap-2"><Chip on={inv.paper === "a4"} onClick={() => set({ paper: "a4" })}>A4</Chip><Chip on={inv.paper === "letter"} onClick={() => set({ paper: "letter" })}>US Letter</Chip></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={inv.showWords} onChange={(e) => set({ showWords: e.target.checked })} className="h-4 w-4 accent-brand" />Show the amount due in words</label>
                  <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={inv.showBrand} onChange={(e) => set({ showBrand: e.target.checked })} className="h-4 w-4 accent-brand" />Show “Created with Toolited” in the footer</label>
                </div>
              </div>
            )}

            {tray === "check" && (
              <div className={`${card} mt-2 max-h-[65vh] overflow-y-auto p-4 shadow-lg`}>
                <p className="text-sm font-semibold">{h.todo.length ? "Before you send it" : "Everything a client needs to pay is on this invoice."}</p>
                {h.todo.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {h.todo.map((t) => (
                      <li key={t.msg} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-page/40 px-3 py-2 text-sm">
                        <span>{t.msg}</span>
                        <button type="button" onClick={() => fix(t)} className="shrink-0 rounded-lg bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand/25">Take me there</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {nonLatin && (
            <p className="mx-auto mt-3 max-w-[794px] rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Some of your text uses characters the PDF download can’t draw, such as Urdu or Arabic. Press Print and choose Save as PDF in the print window to keep every character.
            </p>
          )}

          <div className="mt-5">
            <EditablePaper inv={inv} c={c} api={api} />
          </div>
          <p className="mx-auto mt-4 max-w-[794px] text-center text-xs text-muted">Tip: press Enter in a description to jump to the next line item. Hover a row to move, copy or delete it.</p>
        </main>

        {/* saved invoices */}
        {vaultOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-page/70 p-4 backdrop-blur-sm" onClick={() => setVaultOpen(false)}>
            <div role="dialog" aria-modal="true" aria-label="Saved invoices" onClick={(e) => e.stopPropagation()} className={`${card} max-h-[85vh] w-full max-w-xl space-y-4 overflow-y-auto bg-surface p-5 shadow-2xl`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Saved invoices</h2>
                  <p className="text-xs text-muted">Stored in this browser only. Clearing site data removes them.</p>
                </div>
                <button type="button" className={iconBtn} onClick={() => setVaultOpen(false)} aria-label="Close"><X size={16} /></button>
              </div>
              {outstanding.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted">Waiting to be paid:</span>
                  {outstanding.map(([code, amt]) => <span key={code} className="rounded-full bg-brand/15 px-3 py-0.5 font-semibold text-brand">{fmtMoney(amt, curOf(code))}</span>)}
                </div>
              )}
              {vault.length === 0 ? (
                <p className="text-sm text-muted">Nothing saved yet. Press Save to keep this invoice, or start a new one and the current one is saved for you.</p>
              ) : (
                <ul className="space-y-2">
                  {vault.map((e) => {
                    const cc = calc(e.inv), st = statusOf(e.inv, cc), late = st === "overdue" ? daysBetween(e.inv.due, todayISO()) : 0;
                    return (
                      <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-page/40 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{e.inv.number || "Untitled"} {e.inv.to.name && <span className="font-normal text-muted">for {e.inv.to.name}</span>}</p>
                          <p className="text-xs text-muted">{fmtMoney(cc.total, cc.cur)}, due {fmtDate(e.inv.due)}{late ? `, ${late} day${late === 1 ? "" : "s"} late` : ""}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[st]}`}>{STATUS_LABEL[st]}</span>
                        <div className="flex gap-1">
                          <button type="button" className={iconBtn} onClick={() => openEntry(e)} aria-label="Open invoice"><Pencil size={15} /></button>
                          <button type="button" className={iconBtn} onClick={() => dupEntry(e)} aria-label="Copy as new invoice"><Copy size={15} /></button>
                          <button type="button" className={iconBtn} onClick={() => markPaid(e)} disabled={st === "paid"} aria-label="Mark as paid"><Check size={15} /></button>
                          <button type="button" className={iconBtn} onClick={() => delEntry(e)} aria-label="Delete invoice"><Trash2 size={15} /></button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium shadow-xl">{toast}</div>}

        <Footer />
      </div>
    </>
  );
}