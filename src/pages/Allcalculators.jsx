import Footer from "../components/common/Footer";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Calculator, HeartPulse, Sigma, Wrench, Wallet, SlidersHorizontal, X, ArrowLeft,
  RotateCcw, Copy, Check, LockKeyhole, CalendarDays, Ruler, Percent, Clock3, Hash, Type,
  ArrowLeftRight, GraduationCap, Activity, ChevronRight, RefreshCw,
} from "lucide-react";
import ToolArticle from "../components/common/ToolArticle";
import ToolFAQ from "../components/common/ToolFAQ";
import { AllcalculatorsArticle as Article, AllcalculatorsFAQ as FAQ } from "../data/seoContent.js";

/* ------------------------------ pure helpers ------------------------------ */

const DAY = 86400000;
const clampN = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const num = (v) => (v == null || String(v).trim() === "" ? NaN : Number(v));
const fmt = (n, max = 2) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: max }) : "—");
const money = (n) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
const plural = (n, word) => `${fmt(n, 0)} ${word}${Math.abs(n) === 1 ? "" : "s"}`;
const smart = (n) => {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const a = Math.abs(n);
  return a >= 1e-4 && a < 1e12 ? n.toLocaleString(undefined, { maximumFractionDigits: 6 }) : n.toExponential(4);
};

/* ---- dates: everything is done in UTC so daylight saving can never shift a result ---- */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const utc = (y, m, d = 1, h = 0, mi = 0, s = 0) => {
  const dt = new Date(0);
  dt.setUTCFullYear(y, m, d);
  dt.setUTCHours(h, mi, s, 0);
  return dt.getTime();
};
const daysInMonth = (y, m) => new Date(utc(y, m + 1, 0)).getUTCDate();

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function parseDT(date, time) {
  if (!/^\d{4,6}-\d{2}-\d{2}$/.test(date || "")) return NaN;
  const [y, m, d] = date.split("-").map(Number);
  let h = 0, mi = 0;
  const t = /^(\d{2}):(\d{2})/.exec(time || "");
  if (t) { h = Number(t[1]); mi = Number(t[2]); }
  return utc(y, m - 1, d, h, mi);
}

function addMonthsMs(ms, n) {
  const dt = new Date(ms);
  const total = dt.getUTCFullYear() * 12 + dt.getUTCMonth() + n;
  const y = Math.floor(total / 12), m = total - y * 12;
  const d = Math.min(dt.getUTCDate(), daysInMonth(y, m));
  return utc(y, m, d, dt.getUTCHours(), dt.getUTCMinutes(), dt.getUTCSeconds());
}

/** Calendar difference between two instants (a <= b): whole months first, then the exact remainder. */
function breakdown(a, b) {
  const A = new Date(a), B = new Date(b);
  let months = (B.getUTCFullYear() - A.getUTCFullYear()) * 12 + (B.getUTCMonth() - A.getUTCMonth());
  if (addMonthsMs(a, months) > b) months--;
  const anchor = addMonthsMs(a, months);
  const rem = b - anchor;
  const totalDaysRem = Math.floor(rem / DAY);
  const r1 = rem - totalDaysRem * DAY;
  const hours = Math.floor(r1 / 3600000);
  const minutes = Math.floor((r1 - hours * 3600000) / 60000);
  const seconds = Math.floor((r1 - hours * 3600000 - minutes * 60000) / 1000);
  const nextAnchor = addMonthsMs(a, months + 1);
  const frac = nextAnchor > anchor ? rem / (nextAnchor - anchor) : 0;
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    totalMonths: months,
    weeks: Math.floor(totalDaysRem / 7),
    days: totalDaysRem % 7,
    totalDaysRem,
    hours,
    minutes,
    seconds,
    monthsDecimal: months + frac,
    yearsDecimal: (months + frac) / 12,
  };
}

function businessDays(a, b) {
  let count = 0;
  for (let d = Math.floor(a / DAY); d < Math.floor(b / DAY); d++) {
    const w = new Date(d * DAY).getUTCDay();
    if (w !== 0 && w !== 6) count++;
  }
  return count;
}

/** Next birthday on/after the target day. Feb 29 birthdays fall on Feb 28 in non-leap years. */
function nextBirthday(dobMs, targetMs) {
  const dob = new Date(dobMs), t = new Date(targetMs);
  const dayStart = utc(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  let y = t.getUTCFullYear();
  const make = (yy) => utc(yy, dob.getUTCMonth(), Math.min(dob.getUTCDate(), daysInMonth(yy, dob.getUTCMonth())));
  let next = make(y);
  if (next < dayStart) next = make(++y);
  return { ms: next, days: Math.round((next - dayStart) / DAY) };
}

const dateLabel = (ms) => {
  const d = new Date(ms);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

function phrase(b, withTime) {
  const parts = [];
  if (b.years) parts.push(plural(b.years, "year"));
  if (b.months) parts.push(plural(b.months, "month"));
  if (b.weeks) parts.push(plural(b.weeks, "week"));
  if (b.days) parts.push(plural(b.days, "day"));
  if (withTime) {
    if (b.hours) parts.push(plural(b.hours, "hour"));
    if (b.minutes) parts.push(plural(b.minutes, "minute"));
  }
  return parts.length ? parts.join(", ") : withTime ? "0 minutes" : "0 days";
}

/* ---- fractions ---- */

const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
const simplifyFrac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return [n / g, d / g];
};
const toImproper = (w, n, d) => (w ? w * d + (w < 0 ? -Math.abs(n) : Math.abs(n)) : n);
function fracOp(op, a, b) {
  if (op === "add") return [a[0] * b[1] + b[0] * a[1], a[1] * b[1]];
  if (op === "subtract") return [a[0] * b[1] - b[0] * a[1], a[1] * b[1]];
  if (op === "multiply") return [a[0] * b[0], a[1] * b[1]];
  if (b[0] === 0) return null;
  return [a[0] * b[1], a[1] * b[0]];
}
const toMixed = (n, d) => {
  const sign = n < 0 ? -1 : 1, an = Math.abs(n);
  return { sign, whole: Math.floor(an / d), rem: an % d, d };
};

/* ---- money ---- */

function amortize(principal, annualRatePct, months, extra = 0) {
  const r = annualRatePct / 100 / 12;
  const pmt = r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
  let bal = principal, totalInterest = 0, m = 0, yi = 0, yp = 0;
  const years = [];
  while (bal > 0.005 && m < months + 600) {
    m++;
    const interest = bal * r;
    let paid = pmt + extra - interest;
    if (paid > bal) paid = bal;
    if (paid <= 0) break;
    bal -= paid; totalInterest += interest; yi += interest; yp += paid;
    if (m % 12 === 0 || bal <= 0.005) {
      years.push({ year: Math.ceil(m / 12), interest: yi, principal: yp, balance: Math.max(0, bal) });
      yi = 0; yp = 0;
    }
  }
  return { pmt, months: m, totalInterest, totalPaid: principal + totalInterest, years };
}

function projectSavings(o) {
  const months = Math.max(0, Math.round(o.years * 12));
  const n = Math.max(1, o.freq);
  const mr = Math.pow(1 + o.ratePct / 100 / n, n / 12) - 1;
  const tax = clampN(o.taxPct || 0, 0, 100) / 100;
  let bal = o.initial, contrib = o.initial, yDep = 0, yInt = 0;
  const rows = [];
  for (let m = 1; m <= months; m++) {
    const yi = Math.floor((m - 1) / 12);
    const dep =
      Math.max(0, o.monthly * Math.pow(1 + (o.monthlyGrowth || 0) / 100, yi)) +
      (m % 12 === 1 ? Math.max(0, o.annual * Math.pow(1 + (o.annualGrowth || 0) / 100, yi)) : 0);
    if (o.depositStart) bal += dep;
    const interest = bal * mr * (1 - tax);
    bal += interest;
    if (!o.depositStart) bal += dep;
    contrib += dep; yDep += dep; yInt += interest;
    if (m % 12 === 0 || m === months) {
      rows.push({ year: Math.ceil(m / 12), deposits: yDep, interest: yInt, balance: bal });
      yDep = 0; yInt = 0;
    }
  }
  return { balance: bal, contributions: contrib, interest: bal - contrib, rows };
}

/* ---- units ---- */

const UNIT_SETS = {
  length: { label: "Length", units: { m: ["Meters", 1], km: ["Kilometers", 1000], cm: ["Centimeters", 0.01], mm: ["Millimeters", 0.001], mi: ["Miles", 1609.344], yd: ["Yards", 0.9144], ft: ["Feet", 0.3048], in: ["Inches", 0.0254] } },
  weight: { label: "Weight", units: { kg: ["Kilograms", 1], g: ["Grams", 0.001], mg: ["Milligrams", 0.000001], t: ["Metric tons", 1000], lb: ["Pounds", 0.45359237], oz: ["Ounces", 0.028349523125], st: ["Stone", 6.35029318] } },
  temperature: { label: "Temperature", units: { C: ["Celsius", 1], F: ["Fahrenheit", 1], K: ["Kelvin", 1] } },
  area: { label: "Area", units: { m2: ["Square meters", 1], km2: ["Square kilometers", 1e6], cm2: ["Square centimeters", 1e-4], ha: ["Hectares", 1e4], ac: ["Acres", 4046.8564224], ft2: ["Square feet", 0.09290304], in2: ["Square inches", 0.00064516], mi2: ["Square miles", 2589988.110336] } },
  volume: { label: "Volume", units: { L: ["Liters", 1], mL: ["Milliliters", 0.001], m3: ["Cubic meters", 1000], gal: ["US gallons", 3.785411784], qt: ["US quarts", 0.946352946], pt: ["US pints", 0.473176473], cup: ["US cups", 0.2365882365], floz: ["US fluid ounces", 0.0295735295625], tbsp: ["Tablespoons (US)", 0.01478676478125], tsp: ["Teaspoons (US)", 0.00492892159375] } },
  speed: { label: "Speed", units: { ms: ["Meters / second", 1], kmh: ["Kilometers / hour", 1 / 3.6], mph: ["Miles / hour", 0.44704], kn: ["Knots", 1852 / 3600], fts: ["Feet / second", 0.3048] } },
  time: { label: "Time", units: { s: ["Seconds", 1], min: ["Minutes", 60], h: ["Hours", 3600], d: ["Days", 86400], wk: ["Weeks", 604800], mo: ["Months (avg)", 2629746], yr: ["Years (avg)", 31556952] } },
  data: { label: "Data", units: { B: ["Bytes", 1], KB: ["Kilobytes (1000)", 1e3], MB: ["Megabytes (1000²)", 1e6], GB: ["Gigabytes (1000³)", 1e9], TB: ["Terabytes (1000⁴)", 1e12], KiB: ["Kibibytes (1024)", 1024], MiB: ["Mebibytes (1024²)", 1048576], GiB: ["Gibibytes (1024³)", 1073741824] } },
};

function convertUnit(kind, from, to, value) {
  if (kind === "temperature") {
    const c = from === "C" ? value : from === "F" ? ((value - 32) * 5) / 9 : value - 273.15;
    return to === "C" ? c : to === "F" ? (c * 9) / 5 + 32 : c + 273.15;
  }
  const u = UNIT_SETS[kind].units;
  return (value * u[from][1]) / u[to][1];
}

/* ---- text, encoding ---- */

function b64encode(text, urlSafe) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  let s = btoa(bin);
  if (urlSafe) s = s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return s;
}
function b64decode(str) {
  let s = str.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function textStats(text) {
  const t = text || "";
  const trimmed = t.trim();
  const words = trimmed ? trimmed.split(/\s+/) : [];
  const freq = new Map();
  for (const w of words) {
    const k = w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (k.length >= 4) freq.set(k, (freq.get(k) || 0) + 1);
  }
  return {
    words: words.length,
    chars: t.length,
    charsNoSpace: t.replace(/\s/g, "").length,
    sentences: trimmed ? (trimmed.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || []).filter((s) => s.trim()).length : 0,
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
    lines: t ? t.split(/\r\n|\r|\n/).length : 0,
    readMin: words.length / 200,
    speakMin: words.length / 130,
    top: [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5),
  };
}

/* ---- statistics, algebra ---- */

function parseNumbers(text) {
  const nums = [], bad = [];
  for (const tok of (text || "").split(/[\s,;]+/).filter(Boolean)) {
    const n = Number(tok);
    Number.isFinite(n) ? nums.push(n) : bad.push(tok);
  }
  return { nums, bad };
}

function stats(nums) {
  const n = nums.length;
  const sum = nums.reduce((s, x) => s + x, 0);
  const mean = sum / n;
  const sorted = [...nums].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const counts = new Map();
  nums.forEach((x) => counts.set(x, (counts.get(x) || 0) + 1));
  const top = Math.max(...counts.values());
  const modes = top > 1 ? [...counts.entries()].filter(([, c]) => c === top).map(([v]) => v).sort((a, b) => a - b) : [];
  const ss = nums.reduce((s, x) => s + (x - mean) ** 2, 0);
  return {
    n, sum, mean, median, modes, min: sorted[0], max: sorted[n - 1], range: sorted[n - 1] - sorted[0],
    sdPop: Math.sqrt(ss / n), sdSample: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN,
  };
}

function solveQuadratic(a, b, c) {
  const d = b * b - 4 * a * c;
  const vx = -b / (2 * a), vy = a * vx * vx + b * vx + c;
  if (d > 0) return { d, kind: "two", x1: (-b + Math.sqrt(d)) / (2 * a), x2: (-b - Math.sqrt(d)) / (2 * a), vx, vy };
  if (d === 0) return { d, kind: "one", x1: vx, vx, vy };
  return { d, kind: "complex", re: vx, im: Math.sqrt(-d) / (2 * Math.abs(a)), vx, vy };
}

/* ---- pace ---- */

const KM_PER_MI = 1.609344;
const fmtClock = (sec) => {
  if (!Number.isFinite(sec) || sec < 0) return "—";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
};

/* ---- grades ---- */

const LETTER_POINTS = { "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, "D+": 1.3, D: 1, "D-": 0.7, F: 0 };
function percentToPoints(p, detailed) {
  if (detailed) return p >= 93 ? 4 : p >= 90 ? 3.7 : p >= 87 ? 3.3 : p >= 83 ? 3 : p >= 80 ? 2.7 : p >= 77 ? 2.3 : p >= 73 ? 2 : p >= 70 ? 1.7 : p >= 67 ? 1.3 : p >= 63 ? 1 : p >= 60 ? 0.7 : 0;
  return p >= 90 ? 4 : p >= 80 ? 3 : p >= 70 ? 2 : p >= 60 ? 1 : 0;
}

/* ---- passwords ---- */

const SETS = { upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", lower: "abcdefghijklmnopqrstuvwxyz", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{}?" };
function secureInt(max) {
  const c = globalThis.crypto;
  if (!c?.getRandomValues) return Math.floor(Math.random() * max);
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do c.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % max;
}
function generatePassword({ length, upper, lower, digits, symbols, noAmbiguous }) {
  const strip = (s) => (noAmbiguous ? s.replace(/[0O1lI|]/g, "") : s);
  const groups = [];
  if (upper) groups.push(strip(SETS.upper));
  if (lower) groups.push(strip(SETS.lower));
  if (digits) groups.push(strip(SETS.digits));
  if (symbols) groups.push(strip(SETS.symbols));
  if (!groups.length) return { password: "", pool: 0 };
  const pool = groups.join("");
  const out = groups.map((g) => g[secureInt(g.length)]);
  while (out.length < length) out.push(pool[secureInt(pool.length)]);
  for (let i = out.length - 1; i > 0; i--) {
    const j = secureInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { password: out.slice(0, length).join(""), pool: pool.length };
}

/* ------------------------------ shared UI bits ----------------------------- */

const inputCls =
  "mt-2 w-full rounded-xl border border-border bg-page px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20";

function Field({ label, value, onChange, type = "number", suffix, hint, min, max, step = "any", placeholder, className = "" }) {
  return (
    <label className={`block text-sm text-text ${className}`}>
      <span className="font-medium">{label}</span>
      <span className="relative block">
        <input
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} ${suffix ? "pr-14" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 mt-1 -translate-y-1/2 text-xs text-muted">{suffix}</span>
        )}
      </span>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, className = "" }) {
  return (
    <label className={`block text-sm text-text ${className}`}>
      <span className="font-medium">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 6, placeholder, readOnly, className = "" }) {
  return (
    <label className={`block text-sm text-text ${className}`}>
      <span className="font-medium">{label}</span>
      <textarea
        value={value}
        readOnly={readOnly}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={`${inputCls} resize-y font-mono`}
      />
    </label>
  );
}

function Segmented({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl border px-3.5 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            value === o.value
              ? "border-brand/40 bg-brand/10 font-medium text-brand"
              : "border-border bg-surface text-muted hover:border-muted hover:text-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Check2({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand" />
      {label}
    </label>
  );
}

const Grid = ({ children, cols = 2 }) => (
  <div className={`grid gap-4 ${cols === 3 ? "sm:grid-cols-3" : cols === 1 ? "" : "sm:grid-cols-2"}`}>{children}</div>
);

const SubHead = ({ children }) => <p className="pt-1 text-xs font-semibold uppercase tracking-wider text-muted">{children}</p>;

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(String(text)).then(
          () => { setCopied(true); setTimeout(() => setCopied(false), 1200); },
          () => {},
        );
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-text transition hover:border-accent/50"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function ResultCard({ value, sub, copy, label = "Result" }) {
  return (
    <div aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand">{label}</p>
      <p className="mt-2 break-words text-3xl font-semibold leading-tight text-text sm:text-4xl">{value}</p>
      {sub && <p className="mt-2 text-sm leading-6 text-muted">{sub}</p>}
      <div className="mt-3">
        <CopyButton text={copy ?? (typeof value === "string" ? value : "")} label="Copy result" />
      </div>
    </div>
  );
}

function Notice({ children, tone = "info" }) {
  const cls =
    tone === "warn" ? "border-amber-500/40 bg-amber-500/10 text-text" : "border-border bg-page/70 text-muted";
  return <div className={`rounded-xl border p-3.5 text-sm leading-6 ${cls}`}>{children}</div>;
}

function StatGrid({ items, cols = 2 }) {
  return (
    <div className={`grid gap-2 ${cols === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-border bg-page/70 p-3">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold text-text">{value}</p>
        </div>
      ))}
    </div>
  );
}

function DataTable({ head, rows, max = "max-h-60", caption }) {
  return (
    <div>
      {caption && <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{caption}</p>}
      <div className={`${max} overflow-auto rounded-xl border border-border`}>
        <table className="w-full min-w-[280px] border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-surface text-muted">
            <tr>
              {head.map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-t border-border text-text">
                {r.map((c, i) => (
                  <td key={i} className={`px-3 py-2 ${i ? "text-right tabular-nums" : ""}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShareBar({ parts }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-page">
        {parts.map((p) => (
          <div key={p.label} className={p.cls} style={{ width: `${(Math.max(0, p.value) / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {parts.map((p) => (
          <span key={p.label} className="flex items-center gap-1.5">
            <i className={`h-2 w-2 rounded-full ${p.cls}`} />
            {p.label}: <b className="font-medium text-text">{p.display}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Output panel: handles the "no result yet" / "invalid input" / normal cases in one place. */
function Output({ out, empty = "Enter your values to see the result." }) {
  if (!out) return <Notice>{empty}</Notice>;
  if (out.error) return <Notice tone="warn">{out.error}</Notice>;
  return (
    <>
      <ResultCard value={out.value} sub={out.sub} copy={out.copy} label={out.label} />
      {out.extra}
    </>
  );
}

/** Inputs on the left, live result on the right (stacked on small screens). */
function Calc({ inputs, output }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4 rounded-2xl border border-border bg-page/50 p-4 sm:p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Your numbers</h3>
        {inputs}
      </div>
      <div className="space-y-4 rounded-2xl border border-brand/20 bg-brand/[0.06] p-4 sm:p-5 lg:sticky lg:top-24">{output}</div>
    </div>
  );
}

/* ============================ FINANCIAL CALCULATORS ======================== */

function PercentageCalc() {
  const [mode, setMode] = useState("of");
  const [a, setA] = useState("20");
  const [b, setB] = useState("150");
  const [dir, setDir] = useState("increase");
  const x = num(a), y = num(b);

  const modes = [
    { value: "of", label: "X% of Y" },
    { value: "is", label: "X is what % of Y" },
    { value: "change", label: "% change" },
    { value: "adjust", label: "Increase / decrease" },
  ];
  const labels = {
    of: ["Percentage (X)", "Of this number (Y)", "%"],
    is: ["Value (X)", "Total (Y)", ""],
    change: ["From (old value)", "To (new value)", ""],
    adjust: ["Percentage", "Starting number", "%"],
  }[mode];

  let out = null;
  if (Number.isFinite(x) && Number.isFinite(y)) {
    if (mode === "of") {
      const r = (x / 100) * y;
      out = { value: fmt(r, 4), sub: `${fmt(x, 4)}% of ${fmt(y, 4)} = ${fmt(x, 4)} ÷ 100 × ${fmt(y, 4)}` };
    } else if (mode === "is") {
      out = y === 0
        ? { error: "The total (Y) can't be zero." }
        : { value: `${fmt((x / y) * 100, 4)}%`, sub: `${fmt(x, 4)} is ${fmt((x / y) * 100, 4)}% of ${fmt(y, 4)}` };
    } else if (mode === "change") {
      if (x === 0) out = { error: "The old value can't be zero when calculating a percentage change." };
      else {
        const pct = ((y - x) / Math.abs(x)) * 100;
        out = {
          value: `${pct >= 0 ? "+" : "−"}${fmt(Math.abs(pct), 4)}%`,
          sub: `${fmt(x, 4)} → ${fmt(y, 4)} is ${pct >= 0 ? "an increase" : "a decrease"} of ${fmt(Math.abs(y - x), 4)}.`,
          copy: `${fmt(pct, 4)}%`,
        };
      }
    } else {
      const r = y * (dir === "increase" ? 1 + x / 100 : 1 - x / 100);
      out = {
        value: fmt(r, 4),
        sub: `${fmt(y, 4)} ${dir === "increase" ? "+" : "−"} ${fmt(x, 4)}% = ${fmt(r, 4)} (${r >= y ? "+" : "−"}${fmt(Math.abs(r - y), 4)})`,
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <Segmented label="Calculation type" value={mode} onChange={setMode} options={modes} />
          {mode === "adjust" && (
            <Segmented label="Direction" value={dir} onChange={setDir} options={[{ value: "increase", label: "Increase" }, { value: "decrease", label: "Decrease" }]} />
          )}
          <Grid>
            <Field label={labels[0]} value={a} onChange={setA} suffix={labels[2]} />
            <Field label={labels[1]} value={b} onChange={setB} />
          </Grid>
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function DiscountCalc() {
  const [price, setPrice] = useState("200");
  const [d1, setD1] = useState("15");
  const [d2, setD2] = useState("0");
  const [tax, setTax] = useState("0");
  const p = num(price), a = num(d1), b = num(d2) || 0, t = num(tax) || 0;

  let out = null;
  if (Number.isFinite(p) && Number.isFinite(a)) {
    if (p < 0 || a < 0 || a > 100 || b < 0 || b > 100 || t < 0) out = { error: "Use a price of 0 or more and discounts between 0% and 100%." };
    else {
      const after = p * (1 - a / 100) * (1 - b / 100);
      const saved = p - after, taxAmt = (after * t) / 100, final = after + taxAmt;
      out = {
        label: t > 0 ? "You pay (with tax)" : "Sale price",
        value: money(final),
        sub: `You save ${money(saved)} (${fmt(p ? (saved / p) * 100 : 0, 2)}% off the original price).`,
        extra: (
          <StatGrid
            items={[
              ["Original price", money(p)],
              ["You save", money(saved)],
              ["Price after discount", money(after)],
              ["Sales tax", money(taxAmt)],
            ]}
          />
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <Field label="Original price" value={price} onChange={setPrice} min="0" />
          <Grid>
            <Field label="Discount" value={d1} onChange={setD1} suffix="%" min="0" max="100" />
            <Field label="Extra discount (optional)" value={d2} onChange={setD2} suffix="%" min="0" max="100" hint="Applied after the first discount" />
          </Grid>
          <Field label="Sales tax (optional)" value={tax} onChange={setTax} suffix="%" min="0" />
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function TipCalc() {
  const [bill, setBill] = useState("1000");
  const [tip, setTip] = useState("15");
  const [people, setPeople] = useState("1");
  const [roundUp, setRoundUp] = useState(false);
  const bl = num(bill), tp = num(tip), n = Math.max(1, Math.floor(num(people) || 1));

  let out = null;
  if (Number.isFinite(bl) && Number.isFinite(tp)) {
    if (bl < 0 || tp < 0) out = { error: "Bill and tip can't be negative." };
    else {
      let total = bl + (bl * tp) / 100, per = total / n;
      if (roundUp) { per = Math.ceil(per); total = per * n; }
      const tipAmt = total - bl;
      out = {
        label: n > 1 ? "Each person pays" : "Total to pay",
        value: money(n > 1 ? per : total),
        sub: `${money(bl)} bill + ${money(tipAmt)} tip (${fmt(bl ? (tipAmt / bl) * 100 : 0, 1)}%).`,
        extra: (
          <StatGrid
            items={[
              ["Tip", money(tipAmt)],
              ["Total", money(total)],
              ["Tip per person", money(tipAmt / n)],
              ["Per person", money(per)],
            ]}
          />
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <Field label="Bill amount" value={bill} onChange={setBill} min="0" />
          <div>
            <p className="text-sm font-medium text-text">Tip</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[10, 15, 18, 20, 25].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTip(String(v))}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${Number(tip) === v ? "border-brand/40 bg-brand/10 text-brand" : "border-border bg-surface text-muted hover:text-text"}`}
                >
                  {v}%
                </button>
              ))}
            </div>
            <Field label="Custom tip" value={tip} onChange={setTip} suffix="%" min="0" className="mt-3" />
          </div>
          <Field label="Number of people" value={people} onChange={setPeople} min="1" step="1" />
          <Check2 label="Round each person's share up to a whole amount" checked={roundUp} onChange={setRoundUp} />
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function CompoundCalc() {
  const [p, setP] = useState("10000");
  const [m, setM] = useState("0");
  const [r, setR] = useState("5");
  const [y, setY] = useState("10");
  const [f, setF] = useState("12");
  const init = num(p), mon = num(m) || 0, rate = num(r), yrs = num(y);

  let out = null;
  if ([init, rate, yrs].every(Number.isFinite)) {
    if (init < 0 || mon < 0 || rate < 0 || yrs < 0 || yrs > 100) out = { error: "Use non-negative amounts, and a period of 0–100 years." };
    else {
      const res = projectSavings({ initial: init, monthly: mon, annual: 0, ratePct: rate, freq: Number(f), years: yrs });
      out = {
        label: "Future value",
        value: money(res.balance),
        sub: `After ${fmt(yrs, 2)} years at ${fmt(rate, 2)}% compounded ${{ 1: "annually", 2: "twice a year", 4: "quarterly", 12: "monthly", 365: "daily" }[f]}.`,
        extra: (
          <>
            <ShareBar
              parts={[
                { label: "Money you put in", value: res.contributions, cls: "bg-brand/50", display: money(res.contributions) },
                { label: "Interest earned", value: res.interest, cls: "bg-brand", display: money(res.interest) },
              ]}
            />
            <StatGrid
              items={[
                ["Total contributions", money(res.contributions)],
                ["Interest earned", money(res.interest)],
                ["Growth", res.contributions > 0 ? `${fmt(res.balance / res.contributions, 2)}×` : "—"],
                ["Final balance", money(res.balance)],
              ]}
            />
            {res.rows.length > 0 && (
              <DataTable
                caption="Year by year"
                head={["Year", "Deposits", "Interest", "Balance"]}
                rows={res.rows.map((x) => [x.year, money(x.deposits), money(x.interest), money(x.balance)])}
              />
            )}
          </>
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <Field label="Starting amount" value={p} onChange={setP} min="0" />
          <Field label="Monthly contribution (optional)" value={m} onChange={setM} min="0" hint="Added at the end of each month" />
          <Grid>
            <Field label="Annual interest rate" value={r} onChange={setR} suffix="%" min="0" />
            <Field label="Years" value={y} onChange={setY} min="0" max="100" />
          </Grid>
          <SelectField label="Compounding" value={f} onChange={setF} options={[{ value: "1", label: "Annually" }, { value: "2", label: "Semi-annually" }, { value: "4", label: "Quarterly" }, { value: "12", label: "Monthly" }, { value: "365", label: "Daily" }]} />
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function SimpleInterestCalc() {
  const [p, setP] = useState("1000");
  const [r, setR] = useState("5");
  const [t, setT] = useState("3");
  const [u, setU] = useState("years");
  const P = num(p), rate = num(r), time = num(t);

  let out = null;
  if ([P, rate, time].every(Number.isFinite)) {
    if (P < 0 || rate < 0 || time < 0) out = { error: "Values can't be negative." };
    else {
      const years = u === "years" ? time : u === "months" ? time / 12 : time / 365;
      const interest = P * (rate / 100) * years;
      out = {
        label: "Total amount",
        value: money(P + interest),
        sub: `Interest earned: ${money(interest)} on ${money(P)} at ${fmt(rate, 2)}% per year for ${fmt(time, 2)} ${u}.`,
        extra: (
          <StatGrid items={[["Principal", money(P)], ["Interest", money(interest)], ["Interest per year", money(P * (rate / 100))], ["Time in years", fmt(years, 4)]]} />
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <Field label="Principal amount" value={p} onChange={setP} min="0" />
          <Field label="Annual interest rate" value={r} onChange={setR} suffix="%" min="0" />
          <Grid>
            <Field label="Time" value={t} onChange={setT} min="0" />
            <SelectField label="Unit" value={u} onChange={setU} options={[{ value: "years", label: "Years" }, { value: "months", label: "Months" }, { value: "days", label: "Days" }]} />
          </Grid>
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function LoanCalc() {
  const [amt, setAmt] = useState("200000");
  const [r, setR] = useState("6");
  const [term, setTerm] = useState("30");
  const [unit, setUnit] = useState("years");
  const [extra, setExtra] = useState("0");
  const A = num(amt), rate = num(r), t = num(term), ex = num(extra) || 0;
  const months = Math.round(unit === "years" ? t * 12 : t);

  let out = null;
  if ([A, rate, t].every(Number.isFinite)) {
    if (!(A > 0) || rate < 0 || !(months >= 1) || months > 1200 || ex < 0) out = { error: "Enter a loan amount above 0, a rate of 0% or more, and a term of 1 month to 100 years." };
    else {
      const base = amortize(A, rate, months, 0);
      const fast = ex > 0 ? amortize(A, rate, months, ex) : null;
      const show = fast || base;
      const dur = (m) => `${Math.floor(m / 12) ? plural(Math.floor(m / 12), "year") + " " : ""}${m % 12 ? plural(m % 12, "month") : ""}`.trim() || "0 months";
      out = {
        label: "Monthly payment",
        value: money(base.pmt + ex),
        sub: ex > 0 ? `${money(base.pmt)} regular payment + ${money(ex)} extra. Loan is paid off in ${dur(fast.months)}.` : `Over ${dur(months)} (${months} payments).`,
        extra: (
          <>
            <StatGrid
              items={[
                ["Total interest", money(show.totalInterest)],
                ["Total paid", money(show.totalPaid)],
                ...(fast ? [["Interest saved", money(base.totalInterest - fast.totalInterest)], ["Time saved", dur(months - fast.months)]] : [["Loan amount", money(A)], ["Interest as % of loan", `${fmt((show.totalInterest / A) * 100, 1)}%`]]),
              ]}
            />
            <ShareBar
              parts={[
                { label: "Principal", value: A, cls: "bg-brand/50", display: money(A) },
                { label: "Interest", value: show.totalInterest, cls: "bg-brand", display: money(show.totalInterest) },
              ]}
            />
            <DataTable caption="Yearly schedule" head={["Year", "Principal", "Interest", "Balance"]} rows={show.years.map((y) => [y.year, money(y.principal), money(y.interest), money(y.balance)])} />
          </>
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <Field label="Loan amount" value={amt} onChange={setAmt} min="0" />
          <Field label="Annual interest rate" value={r} onChange={setR} suffix="%" min="0" />
          <Grid>
            <Field label="Loan term" value={term} onChange={setTerm} min="1" />
            <SelectField label="Unit" value={unit} onChange={setUnit} options={[{ value: "years", label: "Years" }, { value: "months", label: "Months" }]} />
          </Grid>
          <Field label="Extra monthly payment (optional)" value={extra} onChange={setExtra} min="0" hint="See how much interest and time you'd save" />
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function SavingsCalc() {
  const [v, setVals] = useState({ initial: "1000", annual: "0", annualGrowth: "0", monthly: "200", monthlyGrowth: "0", rate: "5", freq: "12", years: "10", tax: "0", inflation: "0", start: false });
  const set = (k) => (x) => setVals((o) => ({ ...o, [k]: x }));
  const n = (k) => num(v[k]);

  let out = null;
  if ([n("initial"), n("rate"), n("years")].every(Number.isFinite)) {
    const bad = n("initial") < 0 || n("rate") < 0 || n("years") < 0 || n("years") > 100 || (n("monthly") || 0) < 0 || (n("annual") || 0) < 0;
    if (bad) out = { error: "Use non-negative amounts, a rate of 0% or more, and a period of 0–100 years." };
    else {
      const res = projectSavings({
        initial: n("initial"), monthly: n("monthly") || 0, monthlyGrowth: n("monthlyGrowth") || 0, annual: n("annual") || 0, annualGrowth: n("annualGrowth") || 0,
        ratePct: n("rate"), freq: Number(v.freq), years: n("years"), taxPct: n("tax") || 0, depositStart: v.start,
      });
      const infl = Math.max(0, n("inflation") || 0) / 100;
      const real = res.balance / Math.pow(1 + infl, n("years"));
      out = {
        label: "Projected balance",
        value: money(res.balance),
        sub: `After ${fmt(n("years"), 2)} years${infl > 0 ? `, worth about ${money(real)} in today's money at ${fmt(infl * 100, 2)}% inflation` : ""}.`,
        extra: (
          <>
            <ShareBar
              parts={[
                { label: "Money you put in", value: res.contributions, cls: "bg-brand/50", display: money(res.contributions) },
                { label: "Interest (after tax)", value: res.interest, cls: "bg-brand", display: money(res.interest) },
              ]}
            />
            <StatGrid items={[["Initial deposit", money(n("initial"))], ["Total contributions", money(res.contributions)], ["Interest earned", money(res.interest)], ["Today's money", money(real)]]} />
            {res.rows.length > 0 && <DataTable caption="Year by year" head={["Year", "Deposits", "Interest", "Balance"]} rows={res.rows.map((x) => [x.year, money(x.deposits), money(x.interest), money(x.balance)])} />}
          </>
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <Field label="Initial deposit" value={v.initial} onChange={set("initial")} min="0" />
          <SubHead>Regular deposits</SubHead>
          <Grid>
            <Field label="Monthly contribution" value={v.monthly} onChange={set("monthly")} min="0" />
            <Field label="Increase per year" value={v.monthlyGrowth} onChange={set("monthlyGrowth")} suffix="%" />
            <Field label="Yearly contribution" value={v.annual} onChange={set("annual")} min="0" hint="Added once a year" />
            <Field label="Increase per year" value={v.annualGrowth} onChange={set("annualGrowth")} suffix="%" />
          </Grid>
          <Check2 label="Deposits are made at the start of each month" checked={v.start} onChange={set("start")} />
          <SubHead>Growth</SubHead>
          <Grid>
            <Field label="Annual interest rate" value={v.rate} onChange={set("rate")} suffix="%" min="0" />
            <Field label="Years to save" value={v.years} onChange={set("years")} min="0" max="100" />
          </Grid>
          <SelectField label="Compounding" value={v.freq} onChange={set("freq")} options={[{ value: "1", label: "Annually" }, { value: "2", label: "Semi-annually" }, { value: "4", label: "Quarterly" }, { value: "12", label: "Monthly" }, { value: "365", label: "Daily" }]} />
          <Grid>
            <Field label="Tax on interest" value={v.tax} onChange={set("tax")} suffix="%" min="0" max="100" />
            <Field label="Inflation" value={v.inflation} onChange={set("inflation")} suffix="%" min="0" />
          </Grid>
        </>
      }
      output={<Output out={out} />}
    />
  );
}

/* ====================== FITNESS & HEALTH CALCULATORS ======================= */

function BmiCalc() {
  const [units, setUnits] = useState("metric");
  const [cm, setCm] = useState("170");
  const [kg, setKg] = useState("70");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("7");
  const [lb, setLb] = useState("154");

  const h = units === "metric" ? num(cm) / 100 : (num(ft) * 12 + (num(inch) || 0)) * 0.0254;
  const w = units === "metric" ? num(kg) : num(lb) * 0.45359237;

  let out = null;
  if (Number.isFinite(h) && Number.isFinite(w)) {
    if (!(h > 0.5 && h < 2.8) || !(w > 1 && w < 700)) out = { error: "Enter a realistic height and weight." };
    else {
      const bmi = w / (h * h);
      const cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy weight" : bmi < 30 ? "Overweight" : "Obesity";
      const pos = clampN(((bmi - 12) / 28) * 100, 0, 100);
      const lo = 18.5 * h * h, hi = 24.9 * h * h;
      const wt = (kgv) => (units === "metric" ? `${fmt(kgv, 1)} kg` : `${fmt(kgv / 0.45359237, 0)} lb`);
      out = {
        label: "Your BMI",
        value: fmt(bmi, 1),
        sub: `${cat} (adult BMI categories).`,
        copy: fmt(bmi, 1),
        extra: (
          <>
            <div>
              <div className="relative">
                <div className="flex h-3 overflow-hidden rounded-full">
                  <div className="bg-sky-400" style={{ width: "23.2%" }} />
                  <div className="bg-emerald-400" style={{ width: "23.2%" }} />
                  <div className="bg-amber-400" style={{ width: "17.9%" }} />
                  <div className="bg-rose-400" style={{ width: "35.7%" }} />
                </div>
                <span className="absolute -top-1 h-5 w-1 -translate-x-1/2 rounded bg-text shadow" style={{ left: `${pos}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted"><span>12</span><span>18.5</span><span>25</span><span>30</span><span>40</span></div>
            </div>
            <StatGrid items={[["Category", cat], ["Healthy range for your height", `${wt(lo)} – ${wt(hi)}`]]} />
            <Notice>BMI is a rough screening tool. It doesn't measure body fat, muscle, age or sex, and it isn't suitable for children. Talk to a clinician about your own health.</Notice>
          </>
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <Segmented label="Units" value={units} onChange={setUnits} options={[{ value: "metric", label: "Metric (cm, kg)" }, { value: "imperial", label: "Imperial (ft, lb)" }]} />
          {units === "metric" ? (
            <Grid>
              <Field label="Height" value={cm} onChange={setCm} suffix="cm" />
              <Field label="Weight" value={kg} onChange={setKg} suffix="kg" />
            </Grid>
          ) : (
            <Grid cols={3}>
              <Field label="Height" value={ft} onChange={setFt} suffix="ft" />
              <Field label="&nbsp;" value={inch} onChange={setInch} suffix="in" />
              <Field label="Weight" value={lb} onChange={setLb} suffix="lb" />
            </Grid>
          )}
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function BmrCalc() {
  const [units, setUnits] = useState("metric");
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("30");
  const [cm, setCm] = useState("175");
  const [kg, setKg] = useState("75");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("9");
  const [lb, setLb] = useState("165");

  const hc = units === "metric" ? num(cm) : (num(ft) * 12 + (num(inch) || 0)) * 2.54;
  const wk = units === "metric" ? num(kg) : num(lb) * 0.45359237;
  const a = num(age);

  let out = null;
  if ([hc, wk, a].every(Number.isFinite)) {
    if (!(a > 0 && a < 120 && hc > 50 && hc < 280 && wk > 1 && wk < 700)) out = { error: "Enter a realistic age, height and weight." };
    else {
      const bmr = 10 * wk + 6.25 * hc - 5 * a + (sex === "male" ? 5 : -161);
      const levels = [["Sedentary (little or no exercise)", 1.2], ["Light (1–3 days/week)", 1.375], ["Moderate (3–5 days/week)", 1.55], ["Very active (6–7 days/week)", 1.725], ["Extra active (physical job + training)", 1.9]];
      out = {
        label: "Basal metabolic rate",
        value: `${fmt(bmr, 0)} kcal/day`,
        sub: "Energy your body uses at complete rest (Mifflin–St Jeor equation).",
        extra: (
          <>
            <DataTable caption="Daily calories to maintain weight" head={["Activity level", "kcal/day"]} rows={levels.map(([l, m]) => [l, fmt(bmr * m, 0)])} max="max-h-72" />
            <Notice>These are estimates. Your needs depend on many individual factors, so treat them as a starting point rather than a prescription.</Notice>
          </>
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <Segmented label="Units" value={units} onChange={setUnits} options={[{ value: "metric", label: "Metric (cm, kg)" }, { value: "imperial", label: "Imperial (ft, lb)" }]} />
          <Grid>
            <SelectField label="Equation" value={sex} onChange={setSex} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
            <Field label="Age" value={age} onChange={setAge} suffix="years" />
          </Grid>
          {units === "metric" ? (
            <Grid>
              <Field label="Height" value={cm} onChange={setCm} suffix="cm" />
              <Field label="Weight" value={kg} onChange={setKg} suffix="kg" />
            </Grid>
          ) : (
            <Grid cols={3}>
              <Field label="Height" value={ft} onChange={setFt} suffix="ft" />
              <Field label="&nbsp;" value={inch} onChange={setInch} suffix="in" />
              <Field label="Weight" value={lb} onChange={setLb} suffix="lb" />
            </Grid>
          )}
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function PaceCalc() {
  const [mode, setMode] = useState("pace");
  const [unit, setUnit] = useState("km");
  const [dist, setDist] = useState("5");
  const [h, setH] = useState("0");
  const [m, setM] = useState("30");
  const [s, setS] = useState("0");
  const [pm, setPm] = useState("6");
  const [ps, setPs] = useState("0");

  const k = unit === "mi" ? KM_PER_MI : 1;
  const d = num(dist);
  const t = (num(h) || 0) * 3600 + (num(m) || 0) * 60 + (num(s) || 0);
  const pace = (num(pm) || 0) * 60 + (num(ps) || 0);

  let secPerKm = NaN, km = NaN, total = NaN;
  if (mode === "pace" && d > 0 && t > 0) { km = d * k; total = t; secPerKm = t / km; }
  if (mode === "time" && d > 0 && pace > 0) { km = d * k; secPerKm = pace / k; total = secPerKm * km; }
  if (mode === "distance" && t > 0 && pace > 0) { secPerKm = pace / k; total = t; km = t / secPerKm; }

  let out = null;
  if (Number.isFinite(secPerKm)) {
    const headline = mode === "pace" ? `${fmtClock(secPerKm * k)} /${unit}` : mode === "time" ? fmtClock(total) : `${fmt(km / k, 2)} ${unit}`;
    out = {
      label: mode === "pace" ? "Average pace" : mode === "time" ? "Finish time" : "Distance covered",
      value: headline,
      sub: `${fmt(km / k, 2)} ${unit} in ${fmtClock(total)}.`,
      extra: (
        <>
          <StatGrid items={[["Pace per km", fmtClock(secPerKm)], ["Pace per mile", fmtClock(secPerKm * KM_PER_MI)], ["Speed", `${fmt(3600 / secPerKm, 2)} km/h`], ["Speed", `${fmt(3600 / secPerKm / KM_PER_MI, 2)} mph`]]} />
          <DataTable caption="At this pace you'd run" head={["Race", "Time"]} rows={[["5K", 5], ["10K", 10], ["Half marathon", 21.0975], ["Marathon", 42.195]].map(([n, dkm]) => [n, fmtClock(secPerKm * dkm)])} max="max-h-48" />
        </>
      ),
    };
  }

  const distField = <Field label="Distance" value={dist} onChange={setDist} suffix={unit} min="0" />;
  const timeFields = (
    <Grid cols={3}>
      <Field label="Hours" value={h} onChange={setH} min="0" step="1" />
      <Field label="Minutes" value={m} onChange={setM} min="0" />
      <Field label="Seconds" value={s} onChange={setS} min="0" />
    </Grid>
  );
  const paceFields = (
    <Grid>
      <Field label={`Pace minutes (per ${unit})`} value={pm} onChange={setPm} min="0" step="1" />
      <Field label="Pace seconds" value={ps} onChange={setPs} min="0" />
    </Grid>
  );

  return (
    <Calc
      inputs={
        <>
          <Segmented label="What to calculate" value={mode} onChange={setMode} options={[{ value: "pace", label: "Pace" }, { value: "time", label: "Finish time" }, { value: "distance", label: "Distance" }]} />
          <Segmented label="Distance unit" value={unit} onChange={setUnit} options={[{ value: "km", label: "Kilometres" }, { value: "mi", label: "Miles" }]} />
          {mode !== "distance" && distField}
          {mode !== "time" && timeFields}
          {mode !== "pace" && paceFields}
        </>
      }
      output={<Output out={out} />}
    />
  );
}

/* ============================== MATH CALCULATORS =========================== */

function AverageCalc() {
  const [text, setText] = useState("12, 15, 18, 20, 20, 31");
  const { nums, bad } = parseNumbers(text);

  let out = null;
  if (nums.length) {
    const s = stats(nums);
    out = {
      label: "Average (mean)",
      value: fmt(s.mean, 6),
      sub: `Sum ${fmt(s.sum, 6)} ÷ ${s.n} number${s.n === 1 ? "" : "s"}.`,
      extra: (
        <>
          {bad.length > 0 && <Notice tone="warn">Ignored {bad.length} entr{bad.length === 1 ? "y" : "ies"} that aren't numbers: {bad.slice(0, 5).join(", ")}{bad.length > 5 ? "…" : ""}</Notice>}
          <StatGrid
            cols={3}
            items={[
              ["Count", fmt(s.n, 0)],
              ["Sum", fmt(s.sum, 6)],
              ["Median", fmt(s.median, 6)],
              ["Mode", s.modes.length ? s.modes.map((x) => fmt(x, 6)).join(", ") : "None"],
              ["Smallest", fmt(s.min, 6)],
              ["Largest", fmt(s.max, 6)],
              ["Range", fmt(s.range, 6)],
              ["Std dev (population)", fmt(s.sdPop, 4)],
              ["Std dev (sample)", Number.isFinite(s.sdSample) ? fmt(s.sdSample, 4) : "—"],
            ]}
          />
        </>
      ),
    };
  } else if (bad.length) out = { error: "None of those entries look like numbers." };

  return (
    <Calc
      inputs={<TextArea label="Numbers" value={text} onChange={setText} rows={8} placeholder="e.g. 12, 15, 18 or one per line" />}
      output={<Output out={out} empty="Type or paste some numbers. Separate them with commas, spaces or new lines." />}
    />
  );
}

function RandomCalc() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("1");
  const [unique, setUnique] = useState(true);
  const [sorted, setSorted] = useState(false);
  const [seed, setSeed] = useState(0);

  const result = useMemo(() => {
    const lo = Math.ceil(num(min)), hi = Math.floor(num(max)), n = Math.floor(num(count) || 1);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) return { error: "The maximum must be a whole number at least as big as the minimum." };
    if (hi - lo > 1e9) return { error: "Please use a range smaller than 1,000,000,000." };
    if (n < 1 || n > 1000) return { error: "Choose between 1 and 1,000 numbers." };
    const range = hi - lo + 1;
    if (unique && n > range) return { error: `You asked for ${n} different numbers but the range only has ${range}.` };
    let list = [];
    if (unique && range <= 1e6) {
      const pool = Array.from({ length: range }, (_, i) => lo + i);
      for (let i = 0; i < n; i++) {
        const j = i + Math.floor(Math.random() * (range - i));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      list = pool.slice(0, n);
    } else if (unique) {
      const seen = new Set();
      while (seen.size < n) seen.add(lo + Math.floor(Math.random() * range));
      list = [...seen];
    } else {
      for (let i = 0; i < n; i++) list.push(lo + Math.floor(Math.random() * range));
    }
    if (sorted) list.sort((a, b) => a - b);
    return { list };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, count, unique, sorted, seed]);

  let out;
  if (result.error) out = { error: result.error };
  else {
    const { list } = result;
    out = {
      label: list.length === 1 ? "Your number" : `${list.length} random numbers`,
      value: list.length === 1 ? String(list[0]) : fmt(list.length, 0),
      copy: list.join(", "),
      extra: list.length > 1 && (
        <div className="flex max-h-56 flex-wrap gap-2 overflow-auto">
          {list.map((x, i) => <span key={i} className="rounded-lg border border-border bg-page/70 px-2.5 py-1 text-sm tabular-nums text-text">{x}</span>)}
        </div>
      ),
    };
    if (list.length > 1) out.value = `${list.length} numbers`;
  }

  return (
    <Calc
      inputs={
        <>
          <Grid>
            <Field label="Minimum" value={min} onChange={setMin} step="1" />
            <Field label="Maximum" value={max} onChange={setMax} step="1" />
          </Grid>
          <Field label="How many numbers?" value={count} onChange={setCount} min="1" max="1000" step="1" />
          <Check2 label="No repeated numbers" checked={unique} onChange={setUnique} />
          <Check2 label="Sort from smallest to largest" checked={sorted} onChange={setSorted} />
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-page transition hover:bg-accent">
            <RefreshCw size={16} /> Generate again
          </button>
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function FractionCalc() {
  const [v, setV] = useState({ w1: "", n1: "1", d1: "2", w2: "", n2: "1", d2: "4", op: "add" });
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const int = (s) => (String(s).trim() === "" ? 0 : Number(s));
  const parts = [v.n1, v.d1, v.n2, v.d2].map((x) => Number(x));
  const wholes = [int(v.w1), int(v.w2)];

  let out = null;
  const filled = [v.n1, v.d1, v.n2, v.d2].every((x) => String(x).trim() !== "");
  if (filled) {
    if (![...parts, ...wholes].every(Number.isInteger)) out = { error: "Use whole numbers only, for example 3/4, or 2 1/3 for a mixed number." };
    else if (parts[1] === 0 || parts[3] === 0) out = { error: "A denominator can't be zero." };
    else {
      const A = [toImproper(wholes[0], parts[0], parts[1]), parts[1]];
      const B = [toImproper(wholes[1], parts[2], parts[3]), parts[3]];
      const R = fracOp(v.op, A, B);
      if (!R) out = { error: "You can't divide by zero." };
      else {
        const [sn, sd] = simplifyFrac(R[0], R[1]);
        const sym = { add: "+", subtract: "−", multiply: "×", divide: "÷" }[v.op];
        const fr = ([n, d]) => (d < 0 ? `${-n}/${-d}` : `${n}/${d}`);
        const mixed = toMixed(sn, sd);
        const mixedStr = sd === 1 ? String(sn) : mixed.whole ? `${mixed.sign < 0 ? "−" : ""}${mixed.whole} ${mixed.rem}/${sd}` : `${sn}/${sd}`;
        const same = R[0] === sn && R[1] === sd;
        out = {
          label: "Simplified result",
          value: sd === 1 ? String(sn) : `${sn}/${sd}`,
          sub: `${fr(A)} ${sym} ${fr(B)} = ${fr(R)}${same ? "" : ` = ${sn}/${sd}`}`,
          extra: <StatGrid cols={3} items={[["Mixed number", mixedStr], ["Decimal", fmt(sn / sd, 8)], ["Percent", `${fmt((sn / sd) * 100, 4)}%`]]} />,
        };
      }
    }
  }

  const FracInputs = ({ k, title }) => (
    <div>
      <p className="text-sm font-medium text-text">{title}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Whole" value={v[`w${k}`]} onChange={set(`w${k}`)} step="1" placeholder="optional" />
        <Field label="Numerator" value={v[`n${k}`]} onChange={set(`n${k}`)} step="1" />
        <Field label="Denominator" value={v[`d${k}`]} onChange={set(`d${k}`)} step="1" />
      </div>
    </div>
  );

  return (
    <Calc
      inputs={
        <>
          {FracInputs({ k: 1, title: "First fraction" })}
          <Segmented label="Operation" value={v.op} onChange={set("op")} options={[{ value: "add", label: "+ Add" }, { value: "subtract", label: "− Subtract" }, { value: "multiply", label: "× Multiply" }, { value: "divide", label: "÷ Divide" }]} />
          {FracInputs({ k: 2, title: "Second fraction" })}
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function QuadraticCalc() {
  const [a, setA] = useState("1");
  const [b, setB] = useState("-3");
  const [c, setC] = useState("2");
  const A = num(a), B = num(b), C = num(c);

  let out = null;
  if ([A, B, C].every(Number.isFinite)) {
    const sgn = (n) => (n < 0 ? `− ${fmt(Math.abs(n), 6)}` : `+ ${fmt(n, 6)}`);
    const eq = `${fmt(A, 6)}x² ${sgn(B)}x ${sgn(C)} = 0`;
    if (A === 0) {
      out = B === 0 ? { error: "With a = 0 and b = 0 there is no x to solve for." } : { label: "Not quadratic (a = 0)", value: `x = ${fmt(-C / B, 6)}`, sub: `With a = 0 this is a straight line: ${fmt(B, 6)}x ${sgn(C)} = 0.` };
    } else {
      const q = solveQuadratic(A, B, C);
      const value = q.kind === "two" ? `x₁ = ${fmt(q.x1, 6)},  x₂ = ${fmt(q.x2, 6)}` : q.kind === "one" ? `x = ${fmt(q.x1, 6)}` : `x = ${fmt(q.re, 6)} ± ${fmt(q.im, 6)}i`;
      out = {
        label: q.kind === "two" ? "Two real roots" : q.kind === "one" ? "One repeated root" : "Two complex roots",
        value,
        sub: eq,
        extra: (
          <StatGrid
            items={[
              ["Discriminant (b² − 4ac)", fmt(q.d, 6)],
              ["Vertex", `(${fmt(q.vx, 4)}, ${fmt(q.vy, 4)})`],
              ["Axis of symmetry", `x = ${fmt(q.vx, 4)}`],
              ["y-intercept", `(0, ${fmt(C, 6)})`],
              ...(q.kind === "two" ? [["Factored form", `${fmt(A, 4)}(x ${q.x1 < 0 ? "+" : "−"} ${fmt(Math.abs(q.x1), 4)})(x ${q.x2 < 0 ? "+" : "−"} ${fmt(Math.abs(q.x2), 4)})`]] : []),
              ["Parabola opens", A > 0 ? "Upward" : "Downward"],
            ]}
          />
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <p className="rounded-xl border border-border bg-page/70 p-3 text-center font-mono text-sm text-text">ax² + bx + c = 0</p>
          <Grid cols={3}>
            <Field label="a" value={a} onChange={setA} />
            <Field label="b" value={b} onChange={setB} />
            <Field label="c" value={c} onChange={setC} />
          </Grid>
        </>
      }
      output={<Output out={out} />}
    />
  );
}

/* ============================== EVERYDAY TOOLS ============================= */

function DateTimeField({ label, date, onDate, time, onTime, showTime }) {
  return (
    <div>
      <div className={`grid gap-3 ${showTime ? "grid-cols-[1fr_8.5rem]" : ""}`}>
        <Field label={label} type="date" value={date} onChange={onDate} />
        {showTime && <Field label="Time" type="time" value={time} onChange={onTime} />}
      </div>
      <button type="button" onClick={() => { onDate(todayISO()); if (showTime) onTime(nowTime()); }} className="mt-1.5 text-xs text-brand underline underline-offset-2 hover:text-accent">
        Use today{showTime ? " / now" : ""}
      </button>
    </div>
  );
}

function DateDiffCalc() {
  const [start, setStart] = useState("2000-01-01");
  const [end, setEnd] = useState(todayISO());
  const [t1, setT1] = useState("00:00");
  const [t2, setT2] = useState("00:00");
  const [useTime, setUseTime] = useState(false);
  const [inclEnd, setInclEnd] = useState(false);
  const [view, setView] = useState("breakdown");

  const a0 = parseDT(start, useTime ? t1 : ""), b0 = parseDT(end, useTime ? t2 : "");
  const views = [["breakdown", "Years · months · weeks · days"], ["years", "Years"], ["months", "Months"], ["weeks", "Weeks"], ["days", "Days"], ["hours", "Hours"], ["minutes", "Minutes"]];

  let out = null;
  if (Number.isFinite(a0) && Number.isFinite(b0)) {
    const reversed = a0 > b0;
    const a = Math.min(a0, b0), b = Math.max(a0, b0) + (inclEnd ? DAY : 0);
    const bd = breakdown(a, b), ms = b - a;
    const tot = { years: bd.yearsDecimal, months: bd.monthsDecimal, weeks: ms / DAY / 7, days: ms / DAY, hours: ms / 3600000, minutes: ms / 60000 };
    const full = phrase(bd, useTime);
    const unitWord = { years: "years", months: "months", weeks: "weeks", days: "days", hours: "hours", minutes: "minutes" };
    const digits = { years: 2, months: 2, weeks: 2, days: useTime || inclEnd ? 2 : 0, hours: 1, minutes: 0 };
    out = {
      label: view === "breakdown" ? "Time between the dates" : `Total ${unitWord[view]}`,
      value: view === "breakdown" ? full : `${fmt(tot[view], digits[view])} ${unitWord[view]}`,
      copy: view === "breakdown" ? full : `${fmt(tot[view], digits[view])} ${unitWord[view]}`,
      sub: view === "breakdown" ? `That's ${fmt(Math.floor(ms / DAY), 0)} days in total.` : `Same span as ${full}.`,
      extra: (
        <>
          {reversed && <Notice tone="warn">The end date is before the start date, so the two dates were swapped for this calculation.</Notice>}
          <StatGrid
            items={[
              ["In years", fmt(tot.years, 2)],
              ["In months", fmt(tot.months, 2)],
              ["In weeks", fmt(tot.weeks, 2)],
              ["In days", fmt(tot.days, useTime || inclEnd ? 2 : 0)],
              ["In hours", fmt(tot.hours, 1)],
              ["In minutes", fmt(tot.minutes, 0)],
              ["Weekdays (Mon–Fri)", fmt(businessDays(a, b), 0)],
              ["Weekend days", fmt(Math.floor(ms / DAY) - businessDays(a, b), 0)],
            ]}
          />
        </>
      ),
    };
  }

  return (
    <Calc
      inputs={
        <>
          <DateTimeField label="Start date" date={start} onDate={setStart} time={t1} onTime={setT1} showTime={useTime} />
          <DateTimeField label="End date" date={end} onDate={setEnd} time={t2} onTime={setT2} showTime={useTime} />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Check2 label="Add time of day" checked={useTime} onChange={setUseTime} />
            <Check2 label="Include the end date (+1 day)" checked={inclEnd} onChange={setInclEnd} />
            <button type="button" onClick={() => { setStart(end); setEnd(start); setT1(t2); setT2(t1); }} className="inline-flex items-center gap-1.5 text-sm text-brand underline underline-offset-2 hover:text-accent">
              <ArrowLeftRight size={14} /> Swap dates
            </button>
          </div>
        </>
      }
      output={
        <>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Show result as</p>
            <Segmented label="Show result as" value={view} onChange={setView} options={views.map(([value, label]) => ({ value, label }))} />
          </div>
          <Output out={out} empty="Pick a start and an end date." />
        </>
      }
    />
  );
}

function AgeCalc() {
  const [dob, setDob] = useState("1995-06-15");
  const [at, setAt] = useState(todayISO());
  const [t1, setT1] = useState("00:00");
  const [t2, setT2] = useState(nowTime());
  const [useTime, setUseTime] = useState(false);

  const a = parseDT(dob, useTime ? t1 : ""), b = parseDT(at, useTime ? t2 : "");
  let out = null;
  if (Number.isFinite(a) && Number.isFinite(b)) {
    if (a > b) out = { error: "The birth date is after the date you're measuring to." };
    else {
      const bd = breakdown(a, b), ms = b - a;
      const days = bd.weeks * 7 + bd.days;
      const parts = [];
      if (bd.years) parts.push(plural(bd.years, "year"));
      if (bd.months) parts.push(plural(bd.months, "month"));
      if (days || (!parts.length && !useTime)) parts.push(plural(days, "day"));
      if (useTime) { if (bd.hours) parts.push(plural(bd.hours, "hour")); if (bd.minutes || !parts.length) parts.push(plural(bd.minutes, "minute")); }
      const nb = nextBirthday(utc(...dob.split("-").map((x, i) => (i === 1 ? Number(x) - 1 : Number(x)))), b);
      const age = bd.years;
      out = {
        label: "Age",
        value: parts.join(", "),
        sub: `Born on a ${WEEKDAYS[new Date(a).getUTCDay()]}.`,
        extra: (
          <StatGrid
            items={[
              ["Next birthday", nb.days === 0 ? "Today!" : `In ${plural(nb.days, "day")}`],
              ["Turning", `${age + (nb.days === 0 ? 0 : 1)} on ${dateLabel(nb.ms)}`],
              ["Total months", fmt(bd.totalMonths, 0)],
              ["Total weeks", fmt(Math.floor(ms / DAY / 7), 0)],
              ["Total days", fmt(Math.floor(ms / DAY), 0)],
              ["Total hours", fmt(Math.floor(ms / 3600000), 0)],
            ]}
          />
        ),
      };
    }
  }

  return (
    <Calc
      inputs={
        <>
          <DateTimeField label="Date of birth" date={dob} onDate={setDob} time={t1} onTime={setT1} showTime={useTime} />
          <DateTimeField label="Age at (date)" date={at} onDate={setAt} time={t2} onTime={setT2} showTime={useTime} />
          <Check2 label="Include time of day" checked={useTime} onChange={setUseTime} />
        </>
      }
      output={<Output out={out} empty="Pick a date of birth." />}
    />
  );
}

function UnitCalc() {
  const [kind, setKind] = useState("length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("km");
  const [val, setVal] = useState("1000");
  const set = UNIT_SETS[kind];
  const keys = Object.keys(set.units);
  const pickKind = (k) => { const ks = Object.keys(UNIT_SETS[k].units); setKind(k); setFrom(ks[0]); setTo(ks[1]); };
  const x = num(val);
  const name = (u) => set.units[u][0];

  let out = null;
  if (Number.isFinite(x)) {
    const r = convertUnit(kind, from, to, x);
    out = {
      label: "Converted value",
      value: `${smart(r)} ${name(to)}`,
      copy: smart(r),
      sub: `${smart(x)} ${name(from)} = ${smart(r)} ${name(to)}`,
      extra: (
        <DataTable caption={`${smart(x)} ${name(from)} in every unit`} head={["Unit", "Value"]} rows={keys.map((u) => [name(u), smart(convertUnit(kind, from, u, x))])} max="max-h-72" />
      ),
    };
  }

  return (
    <Calc
      inputs={
        <>
          <Segmented label="Measurement" value={kind} onChange={pickKind} options={Object.entries(UNIT_SETS).map(([value, s]) => ({ value, label: s.label }))} />
          <Field label="Value" value={val} onChange={setVal} />
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <SelectField label="From" value={from} onChange={setFrom} options={keys.map((u) => ({ value: u, label: name(u) }))} />
            <button type="button" onClick={() => { setFrom(to); setTo(from); }} aria-label="Swap units" className="mb-0.5 grid h-11 w-11 place-items-center justify-self-center rounded-xl border border-border text-brand transition hover:border-brand/50">
              <ArrowLeftRight size={16} />
            </button>
            <SelectField label="To" value={to} onChange={setTo} options={keys.map((u) => ({ value: u, label: name(u) }))} />
          </div>
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function PasswordCalc() {
  const [len, setLen] = useState(16);
  const [o, setO] = useState({ upper: true, lower: true, digits: true, symbols: true, noAmbiguous: false });
  const [seed, setSeed] = useState(0);
  const set = (k) => (x) => setO((p) => ({ ...p, [k]: x }));
  const res = useMemo(() => generatePassword({ length: len, ...o }), [len, o, seed]);

  let out;
  if (!res.password) out = { error: "Choose at least one type of character." };
  else {
    const bits = len * Math.log2(res.pool);
    const [label, cls, pct] = bits < 40 ? ["Weak", "bg-rose-400", 25] : bits < 60 ? ["Fair", "bg-amber-400", 50] : bits < 80 ? ["Good", "bg-lime-400", 75] : ["Strong", "bg-emerald-400", 100];
    out = {
      label: "Your password",
      value: <span className="font-mono text-2xl sm:text-3xl">{res.password}</span>,
      copy: res.password,
      extra: (
        <>
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-page"><div className={`h-full ${cls} transition-all`} style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-sm text-muted">Strength: <b className="text-text">{label}</b> · about {fmt(bits, 0)} bits of randomness</p>
          </div>
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-text transition hover:border-brand/50">
            <RefreshCw size={15} /> Generate another
          </button>
          <p className="text-xs leading-5 text-muted">Made in your browser with secure random numbers. It is never sent anywhere. Use a different password for every account.</p>
        </>
      ),
    };
  }

  return (
    <Calc
      inputs={
        <>
          <label className="block text-sm text-text">
            <span className="flex justify-between font-medium">Length <span className="tabular-nums text-muted">{len} characters</span></span>
            <input type="range" min="4" max="64" value={len} onChange={(e) => setLen(Number(e.target.value))} className="mt-3 w-full accent-brand" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[["upper", "Uppercase (A–Z)"], ["lower", "Lowercase (a–z)"], ["digits", "Numbers (0–9)"], ["symbols", "Symbols (!@#…)"]].map(([k, l]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-page p-3 text-sm text-text">
                <input type="checkbox" checked={o[k]} onChange={(e) => set(k)(e.target.checked)} className="h-4 w-4 accent-brand" /> {l}
              </label>
            ))}
          </div>
          <Check2 label="Avoid look-alike characters (0 O 1 l I |)" checked={o.noAmbiguous} onChange={set("noAmbiguous")} />
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function TextCounterCalc() {
  const [text, setText] = useState("");
  const s = useMemo(() => textStats(text), [text]);
  const mins = (m) => (m < 1 ? `${Math.max(0, Math.round(m * 60))} sec` : `${fmt(m, 1)} min`);

  const out = {
    label: "Words",
    value: fmt(s.words, 0),
    copy: "",
    extra: (
      <>
        <StatGrid
          items={[
            ["Characters", fmt(s.chars, 0)],
            ["Characters (no spaces)", fmt(s.charsNoSpace, 0)],
            ["Sentences", fmt(s.sentences, 0)],
            ["Paragraphs", fmt(s.paragraphs, 0)],
            ["Lines", fmt(s.lines, 0)],
            ["Reading time", s.words ? mins(s.readMin) : "—"],
            ["Speaking time", s.words ? mins(s.speakMin) : "—"],
          ]}
        />
        {s.top.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Most used words (4+ letters)</p>
            <div className="flex flex-wrap gap-2">{s.top.map(([w, c]) => <span key={w} className="rounded-lg border border-border bg-page/70 px-2.5 py-1 text-sm text-text">{w} <b className="text-brand">×{c}</b></span>)}</div>
          </div>
        )}
      </>
    ),
  };

  return (
    <Calc
      inputs={
        <>
          <TextArea label="Your text" value={text} onChange={setText} rows={12} placeholder="Type or paste your text here…" />
          {text && <button type="button" onClick={() => setText("")} className="text-sm text-brand underline underline-offset-2 hover:text-accent">Clear text</button>}
        </>
      }
      output={<Output out={out} />}
    />
  );
}

function CodecCalc({ kind }) {
  const isB64 = kind === "base64";
  const [mode, setMode] = useState("encode");
  const [scope, setScope] = useState("component");
  const [urlSafe, setUrlSafe] = useState(false);
  const [text, setText] = useState("");

  let result = "", error = "";
  if (text) {
    try {
      if (isB64) result = mode === "encode" ? b64encode(text, urlSafe) : b64decode(text);
      else if (scope === "component") result = mode === "encode" ? encodeURIComponent(text) : decodeURIComponent(text);
      else result = mode === "encode" ? encodeURI(text) : decodeURI(text);
    } catch {
      error = isB64 ? "That isn't valid Base64 text, or it doesn't decode to readable text." : "That text has an invalid percent-encoding (for example a stray % sign).";
    }
  }

  const out = (
    <>
      {error ? <Notice tone="warn">{error}</Notice> : <TextArea label={mode === "encode" ? "Encoded result" : "Decoded result"} value={result} readOnly rows={8} placeholder="The result appears here as you type." />}
      {result && !error && (
        <div className="flex flex-wrap gap-2">
          <CopyButton text={result} label="Copy result" />
          <button type="button" onClick={() => { setText(result); setMode(mode === "encode" ? "decode" : "encode"); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-text transition hover:border-accent/50">
            <ArrowLeftRight size={14} /> Use result as input
          </button>
        </div>
      )}
      {isB64 && <Notice>Base64 is an encoding, not encryption. Anyone can decode it, so don't use it to hide passwords or private data.</Notice>}
    </>
  );

  return (
    <Calc
      inputs={
        <>
          <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
          {isB64 ? (
            <Check2 label="URL-safe Base64 (uses - and _, no padding)" checked={urlSafe} onChange={setUrlSafe} />
          ) : (
            <Segmented label="Scope" value={scope} onChange={setScope} options={[{ value: "component", label: "Text or parameter" }, { value: "full", label: "Whole URL" }]} />
          )}
          <TextArea label={mode === "encode" ? "Text to encode" : isB64 ? "Base64 to decode" : "Encoded text to decode"} value={text} onChange={setText} rows={8} placeholder="Type or paste here…" />
          {!isB64 && <p className="text-xs leading-5 text-muted">"Text or parameter" escapes everything special (use it for query values). "Whole URL" keeps characters like : / ? & # so the address still works.</p>}
        </>
      }
      output={out}
    />
  );
}

function GpaCalc() {
  const mk = (id, name = "", credits = "", grade = "", sem = "1") => ({ id, name, credits, grade, sem });
  const [rows, setRows] = useState([mk(1, "Math", "3", "A"), mk(2, "English", "3", "B+"), mk(3, "History", "2", "A-"), mk(4), mk(5)]);
  const [format, setFormat] = useState("letter");
  const [detailed, setDetailed] = useState(false);
  const [prior, setPrior] = useState(false);
  const [priorGpa, setPriorGpa] = useState("0");
  const [priorCredits, setPriorCredits] = useState("0");
  const [group, setGroup] = useState(false);

  const update = (id, k, x) => setRows((old) => old.map((r) => (r.id === id ? { ...r, [k]: x } : r)));
  const letters = Object.keys(LETTER_POINTS);

  const parsed = [];
  const problems = [];
  rows.forEach((r, i) => {
    if (r.credits === "" && r.grade === "") return;
    const credits = num(r.credits);
    let points = NaN;
    if (format === "letter") points = LETTER_POINTS[r.grade] ?? NaN;
    else if (format === "percentage") { const p = num(r.grade); points = p >= 0 && p <= 100 ? percentToPoints(p, detailed) : NaN; }
    else { const p = num(r.grade); points = p >= 0 && p <= 5 ? p : NaN; }
    if (!(credits > 0) || !Number.isFinite(points)) problems.push(`Row ${i + 1}${r.name ? ` (${r.name})` : ""}`);
    else parsed.push({ ...r, credits, points, q: credits * points });
  });

  let out = null;
  const pc = prior ? num(priorCredits) : 0, pg = prior ? num(priorGpa) : 0;
  if (parsed.length) {
    const credits = parsed.reduce((s, r) => s + r.credits, 0), q = parsed.reduce((s, r) => s + r.q, 0);
    if (prior && !(pc >= 0 && pg >= 0 && Number.isFinite(pc) && Number.isFinite(pg))) out = { error: "Enter valid prior GPA and credit hours." };
    else {
      const gpa = (q + pg * pc) / (credits + pc);
      const sems = group ? [...new Set(parsed.map((r) => r.sem))].sort((a, b) => Number(a) - Number(b)).map((s) => {
        const rs = parsed.filter((r) => r.sem === s), c = rs.reduce((t, r) => t + r.credits, 0);
        return [`Semester ${s}`, fmt(c, 2), fmt(rs.reduce((t, r) => t + r.q, 0) / c, 2)];
      }) : [];
      out = {
        label: prior ? "Cumulative GPA" : "GPA",
        value: fmt(gpa, 2),
        copy: fmt(gpa, 2),
        sub: `${fmt(credits + pc, 2)} credits · ${fmt(q + pg * pc, 2)} quality points${prior ? " (including prior semesters)" : ""}.`,
        extra: (
          <>
            {problems.length > 0 && <Notice tone="warn">Skipped incomplete or invalid rows: {problems.join(", ")}.</Notice>}
            {sems.length > 0 && <DataTable caption="By semester" head={["Semester", "Credits", "GPA"]} rows={sems} max="max-h-44" />}
            <DataTable caption="Course breakdown" head={["Course", "Credits", "Points", "Quality"]} rows={parsed.map((r) => [r.name || "Unnamed", fmt(r.credits, 2), fmt(r.points, 2), fmt(r.q, 2)])} max="max-h-56" />
            {format === "percentage" && <p className="text-xs leading-5 text-muted">Percentages are converted using {detailed ? "a detailed +/− scale (93+ = 4.0, 90–92 = 3.7 …)" : "a simple scale (90+ = 4.0, 80+ = 3.0, 70+ = 2.0, 60+ = 1.0)"}.</p>}
          </>
        ),
      };
    }
  } else if (problems.length) out = { error: `Check ${problems.join(", ")}: each row needs credits above 0 and a valid grade.` };

  const cols = group ? "minmax(110px,1fr) 64px 92px 64px 28px" : "minmax(110px,1fr) 64px 92px 28px";
  const inp = "min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text outline-none focus:border-brand";

  return (
    <Calc
      inputs={
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-page/70 p-3">
            <div className="grid min-w-[420px] gap-2 px-1 pb-2 text-xs font-semibold text-text" style={{ gridTemplateColumns: cols }}>
              <span>Course <span className="font-normal text-muted">(optional)</span></span><span>Credits</span><span>Grade</span>{group && <span>Sem.</span>}<span />
            </div>
            {rows.map((r) => (
              <div key={r.id} className="mb-2 grid min-w-[420px] gap-2" style={{ gridTemplateColumns: cols }}>
                <input aria-label="Course name" value={r.name} onChange={(e) => update(r.id, "name", e.target.value)} placeholder="Course" className={inp} />
                <input aria-label="Credit hours" type="number" min="0" step="0.5" value={r.credits} onChange={(e) => update(r.id, "credits", e.target.value)} placeholder="3" className={inp} />
                {format === "letter" ? (
                  <select aria-label="Grade" value={r.grade} onChange={(e) => update(r.id, "grade", e.target.value)} className={inp}>
                    <option value="">–</option>
                    {letters.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                ) : (
                  <input aria-label="Grade" type="number" min="0" max={format === "percentage" ? 100 : 5} step="0.1" value={r.grade} onChange={(e) => update(r.id, "grade", e.target.value)} placeholder={format === "percentage" ? "85" : "4.0"} className={inp} />
                )}
                {group && (
                  <select aria-label="Semester" value={r.sem} onChange={(e) => update(r.id, "sem", e.target.value)} className={inp}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={String(s)}>{s}</option>)}
                  </select>
                )}
                <button type="button" aria-label="Remove course" onClick={() => setRows((old) => (old.length > 1 ? old.filter((x) => x.id !== r.id) : old))} className="rounded-lg text-muted transition hover:bg-surface hover:text-text">×</button>
              </div>
            ))}
            <button type="button" onClick={() => setRows((old) => [...old, mk(Date.now() + Math.random())])} className="mt-1 text-sm text-brand underline underline-offset-2 hover:text-accent">+ Add a course</button>
          </div>

          <SubHead>Settings</SubHead>
          <SelectField label="Grade format" value={format} onChange={(x) => { setFormat(x); setRows((old) => old.map((r) => ({ ...r, grade: "" }))); }} options={[{ value: "letter", label: "Letter grades (A, B+, …)" }, { value: "percentage", label: "Percentage (0–100)" }, { value: "points", label: "Grade points (4.0 scale)" }]} />
          {format === "percentage" && <Check2 label="Use a detailed +/− percentage scale" checked={detailed} onChange={setDetailed} />}
          <Check2 label="Add GPA from prior semesters" checked={prior} onChange={setPrior} />
          {prior && (
            <Grid>
              <Field label="Previous cumulative GPA" value={priorGpa} onChange={setPriorGpa} min="0" />
              <Field label="Previous credit hours" value={priorCredits} onChange={setPriorCredits} min="0" />
            </Grid>
          )}
          <Check2 label="Group courses by semester" checked={group} onChange={setGroup} />
        </>
      }
      output={<Output out={out} empty="Fill in at least one course with credits and a grade." />}
    />
  );
}

/* ================================= REGISTRY ================================ */

const Base64Calc = () => <CodecCalc kind="base64" />;
const UrlCalc = () => <CodecCalc kind="url" />;

const CATEGORIES = [
  {
    name: "Financial Calculators", icon: Wallet,
    description: "Plan payments, savings, discounts, interest, and everyday spending.",
    items: [
      { name: "Percentage Calculator", description: "Percent of a number, percent change, and more.", icon: Percent, component: PercentageCalc },
      { name: "Discount Calculator", description: "Sale price, savings, stacked discounts and tax.", icon: Percent, component: DiscountCalc },
      { name: "Tip Calculator", description: "Split a bill and calculate a tip.", icon: Wallet, component: TipCalc },
      { name: "Compound Interest Calculator", description: "Estimate growth with compounding and deposits.", icon: Activity, component: CompoundCalc },
      { name: "Simple Interest Calculator", description: "Calculate interest without compounding.", icon: Activity, component: SimpleInterestCalc },
      { name: "Loan Payment Calculator", description: "Monthly payment, total interest and payoff schedule.", icon: Calculator, component: LoanCalc },
      { name: "Savings Calculator", description: "Project savings with regular contributions.", icon: Wallet, component: SavingsCalc },
    ],
  },
  {
    name: "Fitness and Health Calculators", icon: HeartPulse,
    description: "Estimate common fitness metrics. Results are informational, not medical advice.",
    items: [
      { name: "BMI Calculator", description: "Body mass index with a healthy weight range.", icon: HeartPulse, component: BmiCalc },
      { name: "BMR Calculator", description: "Resting energy needs and daily calories.", icon: Activity, component: BmrCalc },
      { name: "Pace Calculator", description: "Pace, finish time or distance, plus race predictions.", icon: Clock3, component: PaceCalc },
    ],
  },
  {
    name: "Math Calculators", icon: Sigma,
    description: "Solve common number, percentage, and statistics problems.",
    items: [
      { name: "Average Calculator", description: "Mean, median, mode, range and standard deviation.", icon: Sigma, component: AverageCalc },
      { name: "Random Number Generator", description: "Generate one or many random integers.", icon: Hash, component: RandomCalc },
      { name: "Fraction Calculator", description: "Add, subtract, multiply or divide fractions.", icon: Sigma, component: FractionCalc },
      { name: "Quadratic Formula Calculator", description: "Solve a quadratic equation with full details.", icon: Sigma, component: QuadraticCalc },
      { name: "Scientific Calculator", description: "Open the dedicated scientific calculator.", icon: Sigma, href: "/scientific-calculator" },
    ],
  },
  {
    name: "Everyday Tools", icon: Wrench,
    description: "Handy date, conversion, text, and productivity utilities.",
    items: [
      { name: "Age Calculator", description: "Exact age in years, months, days and more.", icon: CalendarDays, component: AgeCalc },
      { name: "Date Difference Calculator", description: "Time between dates in years, months, weeks and days.", icon: CalendarDays, component: DateDiffCalc },
      { name: "Unit Converter", description: "Length, weight, temperature, area, volume, speed and more.", icon: Ruler, component: UnitCalc },
      { name: "Password Generator", description: "Create a strong random password locally.", icon: LockKeyhole, component: PasswordCalc },
      { name: "Text Counter", description: "Words, characters, sentences and reading time.", icon: Type, component: TextCounterCalc },
      { name: "Base64 Encoder / Decoder", description: "Encode or decode Base64 text.", icon: ArrowLeftRight, component: Base64Calc },
      { name: "URL Encoder / Decoder", description: "Encode or decode URL text.", icon: ArrowLeftRight, component: UrlCalc },
      { name: "GPA Calculator", description: "Weighted GPA by course, with semesters and prior GPA.", icon: GraduationCap, component: GpaCalc },
    ],
  },
];

const ALL_TOOLS = CATEGORIES.flatMap((category) => category.items.map((tool) => ({ ...tool, category: category.name })));

const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const toolFromHash = () => {
  if (typeof window === "undefined") return null;
  const h = window.location.hash.slice(1);
  return h ? ALL_TOOLS.find((t) => !t.href && slugify(t.name) === h) || null : null;
};

/* ================================== GUIDES ================================= */

const TOOL_GUIDES = {
  "Percentage Calculator": { intro: "Four everyday percentage questions in one place: a percentage of a number, what percent one number is of another, the percentage change between two values, and increasing or decreasing a number by a percentage.", formula: "X% of Y = X ÷ 100 × Y · X is what % of Y = X ÷ Y × 100 · Change = (new − old) ÷ |old| × 100", example: "20% of 150 = 30. Going from 80 to 100 is a 25% increase.", tips: ["Pick the type of question first, then fill in the two boxes.", "For '% change', the first box is the old value and the second is the new one.", "Results update instantly as you type."] },
  "Discount Calculator": { intro: "Find the final price after one or two percentage discounts, with optional sales tax. Handy for sales, coupons and 'extra 10% off' offers.", formula: "Price after discounts = Price × (1 − d₁) × (1 − d₂) · Final = that × (1 + tax)", example: "200 with 15% off and a further 10% off = 153, which is 23.5% off overall.", tips: ["A second discount applies to the already-reduced price, so two discounts never add up to their sum.", "Leave the tax box at 0 if the price already includes tax.", "Shipping and other fees are not included."] },
  "Tip Calculator": { intro: "Work out a tip, the total bill, and what each person pays when splitting evenly.", formula: "Tip = Bill × Tip % ÷ 100 · Total = Bill + Tip · Per person = Total ÷ People", example: "A 1,000 bill with a 15% tip is 1,150 in total, or 287.50 each for four people.", tips: ["Use the quick buttons or type your own tip percentage.", "Turn on rounding to make each share a whole amount.", "The tip is calculated on the bill before the tip."] },
  "Compound Interest Calculator": { intro: "See how money grows when interest is added to the balance and then earns interest itself. Add regular monthly deposits to see the effect of saving steadily. Real returns vary and may include fees or taxes.", formula: "A = P(1 + r/n)^(nt), with deposits added at the end of each month", example: "10,000 at 5% compounded monthly for 10 years grows to about 16,470.", tips: ["Enter the annual rate, not a monthly rate.", "More frequent compounding gives a slightly higher result.", "The year-by-year table shows how much of the growth is interest."] },
  "Simple Interest Calculator": { intro: "Calculate interest charged or earned on the original amount only, with no compounding.", formula: "Interest = Principal × Rate × Time (in years)", example: "1,000 at 5% per year for 3 years earns 150, giving a total of 1,150.", tips: ["Choose years, months or days for the time.", "Days are converted using a 365-day year.", "Fees and taxes aren't included."] },
  "Loan Payment Calculator": { intro: "Estimate the fixed monthly payment on a standard amortizing loan, see the total interest, and view a yearly payoff schedule. Add an extra monthly payment to see how much interest and time it saves.", formula: "Payment = P × r ÷ (1 − (1 + r)^−n), where r is the monthly rate and n the number of payments", example: "200,000 at 6% over 30 years is about 1,199.10 per month, with about 231,676 in interest.", tips: ["Enter the term in years or months.", "The estimate assumes a fixed rate for the whole loan.", "Lender fees, insurance and taxes may add to the real payment."] },
  "Savings Calculator": { intro: "Project a savings balance from an initial deposit, monthly and yearly contributions (which can grow each year), an interest rate, tax on interest and inflation.", formula: "Each month: balance grows by the monthly rate, deposits are added, and tax is taken from the interest earned.", example: "1,000 plus 200 a month for 10 years at 5% grows to about 32,700.", tips: ["Use 'Increase per year' to model contributions that rise with your income.", "Set inflation to see what the balance would be worth in today's money.", "This is an estimate. Real accounts may differ."] },
  "BMI Calculator": { intro: "Body mass index compares your weight with your height. It is a broad screening measure, not a diagnosis, and it doesn't account for muscle, body fat, age or sex.", formula: "BMI = weight (kg) ÷ height (m)²", example: "70 kg at 170 cm gives a BMI of about 24.2.", tips: ["Switch between metric and imperial units.", "The healthy range shown is the weight range for a BMI of 18.5 to 24.9 at your height.", "BMI isn't suitable for children. Ask a clinician about your own health."] },
  "BMR Calculator": { intro: "Estimate the energy your body uses at rest with the Mifflin–St Jeor equation, then see approximate daily calories for common activity levels.", formula: "Male: 10W + 6.25H − 5A + 5 · Female: 10W + 6.25H − 5A − 161 (W kg, H cm, A years)", example: "A 30-year-old, 175 cm, 75 kg male has a BMR of about 1,699 kcal per day.", tips: ["The equation is an estimate and can differ from measured metabolism.", "Pick the activity level that honestly matches your week.", "Needs vary with health, growth and goals."] },
  "Pace Calculator": { intro: "Work out your pace, your finish time or the distance you can cover, in kilometres or miles, and see what your pace means for common race distances.", formula: "Pace = Time ÷ Distance · Time = Pace × Distance · Distance = Time ÷ Pace", example: "5 km in 27:30 is a pace of 5:30 per km, which would finish a 10K in 55:00.", tips: ["Choose what you want to calculate, then fill in the other two values.", "Pace is entered as minutes and seconds per kilometre or mile.", "Race predictions assume you could hold the same pace the whole way."] },
  "Average Calculator": { intro: "Enter a list of numbers to get the mean (average), median, mode, range and standard deviation in one go.", formula: "Mean = sum ÷ count · Median = middle value of the sorted list · Mode = most frequent value", example: "For 2, 4, 4, 4, 5, 5, 7, 9 the mean is 5, the median 4.5 and the mode 4.", tips: ["Separate numbers with commas, spaces or new lines.", "Anything that isn't a number is ignored and listed for you.", "Population standard deviation treats your numbers as the whole group; sample treats them as a sample of a larger one."] },
  "Random Number Generator": { intro: "Generate one or many random whole numbers between a minimum and a maximum, with or without repeats.", formula: "Each integer from the minimum through the maximum is equally likely.", example: "Range 1 to 6 with 1 number acts like rolling a die.", tips: ["Turn on 'No repeated numbers' for lottery-style draws.", "Press 'Generate again' for a fresh set.", "This is fine for games and picks, but not for security. Use the Password Generator for that."] },
  "Fraction Calculator": { intro: "Add, subtract, multiply or divide two fractions, including mixed numbers. You'll get the simplified fraction, the mixed number, the decimal and the percentage.", formula: "a/b + c/d = (ad + cb) ÷ bd · a/b × c/d = ac ÷ bd · a/b ÷ c/d = ad ÷ bc", example: "1/2 + 1/4 = 3/4 = 0.75. And 2 1/3 × 3/4 = 7/4 = 1 3/4.", tips: ["Use the optional 'Whole' box for mixed numbers like 2 1/3.", "Use whole numbers only in each box.", "Denominators can't be zero."] },
  "Quadratic Formula Calculator": { intro: "Solve ax² + bx + c = 0 and see the discriminant, vertex, axis of symmetry and factored form too.", formula: "x = (−b ± √(b² − 4ac)) ÷ 2a", example: "x² − 3x + 2 = 0 gives x = 2 and x = 1, with the vertex at (1.5, −0.25).", tips: ["Coefficient a can't be zero for a quadratic.", "Enter coefficients with their signs, for example −3.", "A negative discriminant gives two complex roots."] },
  "Age Calculator": { intro: "Find an exact age in years, months and days, optionally down to the hour and minute, plus totals in months, weeks, days and hours and a countdown to the next birthday.", formula: "Whole years and months are counted from the birth date, then the remaining days are added.", example: "Born 15 June 1995, on 29 October 2026 is 31 years, 4 months, 14 days.", tips: ["Change 'Age at' to see how old someone was (or will be) on any date.", "Tick 'Include time of day' to add birth time and current time.", "People born on 29 February celebrate on 28 February in non-leap years here."] },
  "Date Difference Calculator": { intro: "Find the time between two dates as years, months, weeks and days. Switch the result to show only years, months, weeks, days, hours or minutes, and optionally include the time of day.", formula: "Whole calendar months are counted first, then the remaining days, hours and minutes.", example: "1 January 2020 to 10 May 2025 is 5 years, 4 months, 1 week, 2 days, or 1,956 days.", tips: ["Use the buttons above the result to see only the unit you want.", "Tick 'Include the end date' to count both the first and last day.", "Weekdays counts Monday to Friday only and doesn't know about public holidays."] },
  "Unit Converter": { intro: "Convert between common units of length, weight, temperature, area, volume, speed, time and digital storage, and see the value in every unit at once.", formula: "Convert to a base unit, then to the target unit. Temperature uses its own formulas, for example °F = °C × 9/5 + 32.", example: "1 mile = 1.609344 kilometres. 100 °C = 212 °F.", tips: ["Pick the type of measurement first.", "Use the swap button to reverse the conversion.", "For data, KB, MB and GB use 1,000; KiB, MiB and GiB use 1,024."] },
  "Password Generator": { intro: "Create a random password in your browser using secure random numbers. Nothing is sent or stored anywhere.", formula: "Strength (bits) = length × log₂(number of possible characters)", example: "A 16-character password using all four character types has about 101 bits of randomness.", tips: ["Longer is stronger than clever. Aim for 14 or more characters.", "Turn on 'Avoid look-alike characters' if you'll type it by hand.", "Store passwords in a trusted password manager and never reuse them."] },
  "Text Counter": { intro: "Count words, characters, sentences, paragraphs and lines as you type, and see how long your text takes to read or speak.", formula: "Reading time = words ÷ 200 per minute · Speaking time = words ÷ 130 per minute", example: "A 400-word article takes about 2 minutes to read.", tips: ["Everything updates live as you type or paste.", "Sentence counting is approximate and relies on punctuation.", "Most-used words only include words of four or more letters."] },
  "Base64 Encoder / Decoder": { intro: "Convert text to or from Base64. Works with any language and emoji, and supports the URL-safe variant. Base64 is an encoding, not encryption.", formula: "Text is converted to UTF-8 bytes, then to Base64 characters. Decoding reverses it.", example: "'hello' encodes to 'aGVsbG8='.", tips: ["Decoding needs valid Base64 input.", "Use 'Use result as input' to flip the result straight back.", "Never rely on Base64 to protect private data."] },
  "URL Encoder / Decoder": { intro: "Encode text so it's safe inside a web address, or decode percent-encoded text back to normal. Choose whether to treat the input as a single value or a whole URL.", formula: "Unsafe characters become a % followed by their hex code, for example a space becomes %20.", example: "'a b&c' encodes to 'a%20b%26c' as a parameter.", tips: ["Use 'Text or parameter' for query values, and 'Whole URL' to keep :, /, ? and & intact.", "A stray % sign makes decoding fail.", "Encoding doesn't make a URL private or secure."] },
  "GPA Calculator": { intro: "Calculate a credit-weighted GPA from your courses. Use letter grades, percentages or grade points, add prior semesters for a cumulative GPA, and group courses by semester.", formula: "GPA = Σ(grade points × credits) ÷ Σ(credits)", example: "A (4.0) in a 3-credit course and B (3.0) in a 3-credit course gives a GPA of 3.5.", tips: ["Credits are weighted, so a 4-credit course counts more than a 1-credit one.", "Empty rows are ignored; incomplete rows are listed so you can fix them.", "Your school may use a different scale or rounding rule. Check with them for official results."] },
};

/* ================================ WORKSPACE ================================ */

function GuideBlock({ guide }) {
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="text-lg font-semibold text-text">About this calculator</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-page/70 p-4 lg:col-span-3">
          <p className="text-sm leading-6 text-muted">{guide.intro}</p>
        </div>
        <div className="rounded-xl border border-border bg-page/70 p-4">
          <h4 className="text-sm font-semibold text-brand">Formula / method</h4>
          <p className="mt-2 text-sm leading-6 text-text">{guide.formula}</p>
        </div>
        <div className="rounded-xl border border-border bg-page/70 p-4">
          <h4 className="text-sm font-semibold text-brand">Example</h4>
          <p className="mt-2 text-sm leading-6 text-text">{guide.example}</p>
        </div>
        <div className="rounded-xl border border-border bg-page/70 p-4">
          <h4 className="text-sm font-semibold text-brand">How to use</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6 text-muted">
            {guide.tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ToolWorkspace({ tool, onBack, onOpen }) {
  const [resetKey, setResetKey] = useState(0);
  const Tool = tool.component;
  const guide = TOOL_GUIDES[tool.name];
  const related = ALL_TOOLS.filter((t) => t.category === tool.category && t.name !== tool.name).slice(0, 3);

  return (
    <section className="rounded-2xl border border-border bg-surface/70 p-5 sm:p-7">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent">
        <ArrowLeft size={16} /> Back to all tools
      </button>

      <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand/20 bg-brand/10 text-brand"><tool.icon size={22} /></span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand">{tool.category}</p>
            <h2 className="mt-1 text-2xl font-semibold text-text">{tool.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{tool.description}</p>
          </div>
        </div>
        <button onClick={() => setResetKey((k) => k + 1)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm text-text transition hover:border-muted">
          <RotateCcw size={15} /> Reset
        </button>
      </div>

      <Tool key={resetKey} />

      {guide && <GuideBlock guide={guide} />}

      {related.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-text">More tools like this</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((t) => <ToolCard key={t.name} tool={t} onClick={() => onOpen(t)} />)}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs leading-5 text-muted">Everything is calculated in your browser and nothing is uploaded. Double-check important financial, academic or health results independently.</p>
    </section>
  );
}

function ToolCard({ tool, onClick }) {
  const Icon = tool.icon || Calculator;
  const classes = "group flex min-h-[82px] w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface/70 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand";
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-brand"><Icon size={18} aria-hidden="true" /></span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-text group-hover:text-accent">{tool.name}</span>
          <span className="mt-1 block text-xs leading-5 text-muted">{tool.description}</span>
        </span>
      </span>
      <ChevronRight size={17} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
    </>
  );
  return tool.href ? <a href={tool.href} className={classes}>{content}</a> : <button type="button" onClick={onClick} className={classes}>{content}</button>;
}

/* ================================== PAGE =================================== */

export default function ToolsDirectory() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All tools");
  const [selectedTool, setSelectedTool] = useState(toolFromHash);
  const totalTools = ALL_TOOLS.length;

  // Keep the open tool in the URL (#date-difference-calculator) so it can be shared and the Back button works.
  useEffect(() => {
    const sync = () => setSelectedTool(toolFromHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const openTool = (tool) => {
    window.location.hash = slugify(tool.name);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };
  const closeTool = () => {
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    setSelectedTool(null);
  };

  const filteredCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return CATEGORIES
      .filter((category) => activeCategory === "All tools" || category.name === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items
          .map((tool) => ({ ...tool, category: category.name }))
          .filter((tool) => !normalized || tool.name.toLowerCase().includes(normalized) || tool.description.toLowerCase().includes(normalized) || category.name.toLowerCase().includes(normalized)),
      }))
      .filter((category) => category.items.length > 0);
  }, [query, activeCategory]);
  const visibleCount = filteredCategories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <>
      <main className="min-h-screen bg-page text-text">
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-80 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--theme-brand)_13%,transparent),transparent_65%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand"><SlidersHorizontal size={14} /> TOOLBOX</div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-text sm:text-5xl">Useful tools, <span className="text-brand">all in one place.</span></h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">Choose a tool to open it right here. Results update as you type, and everything runs in your browser.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-48">
              <div className="rounded-2xl border border-border bg-surface/80 p-4"><p className="text-2xl font-semibold text-text">{totalTools}</p><p className="mt-1 text-xs text-muted">Working tools</p></div>
              <div className="rounded-2xl border border-border bg-surface/80 p-4"><p className="text-2xl font-semibold text-text">{CATEGORIES.length}</p><p className="mt-1 text-xs text-muted">Categories</p></div>
            </div>
          </header>

          {selectedTool ? (
            <ToolWorkspace key={selectedTool.name} tool={selectedTool} onBack={closeTool} onOpen={openTool} />
          ) : (
            <>
              <section aria-label="Find a tool" className="mb-8">
                <label htmlFor="tool-search" className="mb-2 block text-sm font-medium text-text">Search tools</label>
                <div className="flex flex-col gap-3 lg:flex-row">
                  <div className="relative flex-1">
                    <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input id="tool-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try percentage, BMI, password…" className="w-full rounded-xl border border-border bg-surface py-3.5 pl-11 pr-11 text-sm text-text outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20" />
                    {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-surface hover:text-text"><X size={16} /></button>}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {["All tools", ...CATEGORIES.map((c) => c.name)].map((name) => (
                      <button key={name} type="button" onClick={() => setActiveCategory(name)} className={`shrink-0 rounded-xl border px-4 py-3 text-sm transition ${activeCategory === name ? "border-brand/40 bg-brand/10 text-brand" : "border-border bg-surface text-muted hover:border-border hover:text-text"}`}>{name}</button>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted" aria-live="polite">Showing {visibleCount} of {totalTools} tools</p>
              </section>

              <div className="space-y-10">
                {filteredCategories.map((category) => {
                  const Icon = category.icon || Calculator;
                  const id = `category-${category.name.replace(/\W+/g, "-")}`;
                  return (
                    <section key={category.name} aria-labelledby={id}>
                      <div className="mb-5 flex items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-brand"><Icon size={20} /></span>
                        <div>
                          <h2 id={id} className="text-xl font-semibold tracking-tight text-text">{category.name}</h2>
                          <p className="mt-1 text-sm text-muted">{category.description}</p>
                          <p className="mt-1 text-xs text-muted">{category.items.length} tools</p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {category.items.map((tool) => <ToolCard key={tool.name} tool={tool} onClick={() => openTool(tool)} />)}
                      </div>
                    </section>
                  );
                })}
                {filteredCategories.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                    <Search size={28} className="mx-auto text-muted" />
                    <h2 className="mt-4 text-lg font-semibold text-text">No tools found</h2>
                    <p className="mt-2 text-sm text-muted">Try another search term or clear the category filter.</p>
                    <button type="button" onClick={() => { setQuery(""); setActiveCategory("All tools"); }} className="mt-5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-page hover:bg-accent">Reset filters</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <ToolArticle {...Article} />
      <ToolFAQ faqs={FAQ} />
      <Footer />
    </>
  );
}