import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Smartphone, Monitor, ExternalLink, ClipboardPaste } from "lucide-react";

import Footer from "../components/common/Footer";
import ToolArticle from "../components/common/ToolArticle";
import ToolFAQ from "../components/common/ToolFAQ";
import { ScientificCalculatorArticle as Article, ScientificCalculatorFAQ as FAQ } from "../data/seoContent.js";


/* ========================================================================== */
/*  Scientific calculator (Casio fx-991CW style)                              */
/*  • Own expression parser/evaluator – no eval().                            */
/*  • SHIFT (yellow) / ALPHA (red) / Base-N (blue) key layers.                */
/*  • MODE menu (Calculate, Base-N), SETUP, CALC, SOLVE, ENG, DMS, RCL/STO.   */
/*  • Landscape (desktop default) / portrait (mobile default) layouts.        */
/*  • Pop-out window (Document Picture-in-Picture, popup fallback).           */
/*  • Extended range: results beyond 1.8×10³⁰⁸ (171!, 10^400 …) are kept as  */
/*    mantissa × 10^exponent instead of crashing with Math ERROR.             */
/* ========================================================================== */

const PI = Math.PI;
/* Angle unit used at start-up and after every reset ("deg" | "rad" | "gra") */
const DEFAULT_ANGLE = "rad";
const SUPS = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const sup = (n) => String(n).replace(/[-0-9]/g, (c) => SUPS[c]);

const FUNCS = ["sinh⁻¹", "cosh⁻¹", "tanh⁻¹", "sin⁻¹", "cos⁻¹", "tan⁻¹", "sinh", "cosh", "tanh", "sin", "cos", "tan", "logb", "log", "ln", "√", "∛", "Abs", "∫ₐᵇ", "Σₐᵇ", "∫", "d/dx", "Σ"];
const INFIX = ["nPr", "nCr", "ˣ√"];
const byLen = (a, b) => b.length - a.length;
const CONSTS = [
  ["c₀", "Speed of light", 299792458, "m/s"], ["h", "Planck constant", 6.62607015e-34, "J·s"],
  ["ħ", "Reduced Planck constant", 1.054571817e-34, "J·s"], ["G", "Gravitational constant", 6.6743e-11, "m³/kg·s²"],
  ["gₙ", "Standard gravity", 9.80665, "m/s²"], ["qₑ", "Elementary charge", 1.602176634e-19, "C"],
  ["mₑ", "Electron mass", 9.1093837015e-31, "kg"], ["mₚ", "Proton mass", 1.67262192369e-27, "kg"],
  ["mₙ", "Neutron mass", 1.67492749804e-27, "kg"], ["mᵤ", "Atomic mass unit", 1.6605390666e-27, "kg"],
  ["Nₐ", "Avogadro constant", 6.02214076e23, "1/mol"], ["k", "Boltzmann constant", 1.380649e-23, "J/K"],
  ["R", "Gas constant", 8.314462618, "J/mol·K"], ["ε₀", "Vacuum permittivity", 8.8541878128e-12, "F/m"],
  ["μ₀", "Vacuum permeability", 1.25663706212e-6, "N/A²"], ["σ", "Stefan–Boltzmann constant", 5.670374419e-8, "W/m²K⁴"],
  ["Fₐ", "Faraday constant", 96485.33212, "C/mol"], ["a₀", "Bohr radius", 5.29177210903e-11, "m"],
  ["R∞", "Rydberg constant", 10973731.56816, "1/m"], ["atm", "Standard atmosphere", 101325, "Pa"],
];
const CONSTMAP = Object.fromEntries(CONSTS.map((c) => [c[0], c[2]]));
const NAMES = [...FUNCS, "Ans", "Ran#", ...INFIX, ...CONSTS.map((c) => c[0])].sort(byLen);
const BLOCKS = [...FUNCS.map((f) => f + "("), "Ans", "Ran#", ...INFIX, ...CONSTS.map((c) => c[0]), "⁻¹"].sort(byLen);
const AFTER = ["⟅⟆", "+", "-", "×", "÷", "^", "²", "³", "⁻¹", "!", "%", "⁄", "nPr", "nCr", "ˣ√"];
const VARS = "ABCDEFXYM";

/* -------------------------------- parser --------------------------------- */

const Err = (m) => new Error(m);

/* ------------------- extended-range numbers (beyond 1e308) ----------------
   A value is either a normal JS number or an object { m, e } that stands for
   m × 10^e with 1 ≤ |m| < 10. Normal numbers are used whenever they fit, so
   everyday calculations are unaffected.                                      */

const isB = (x) => typeof x === "object" && x !== null;
const N = (v) => { if (isB(v)) throw Err("Math"); return v; }; /* "numbers only" guard */

function norm(m, e) {
  if (m === 0) return 0;
  if (!Number.isFinite(m)) throw Err("Math");
  const k = Math.floor(Math.log10(Math.abs(m)));
  m /= Math.pow(10, k);
  e += k;
  if (Math.abs(m) >= 10) { m /= 10; e++; } else if (Math.abs(m) < 1) { m *= 10; e--; }
  if (e > -290 && e < 290) return Number(m + "e" + e);
  return { m, e };
}

const toB = (x) => {
  if (isB(x)) return x;
  if (x === 0) return { m: 0, e: 0 };
  let k = Math.floor(Math.log10(Math.abs(x)));
  let m = x / Math.pow(10, k);
  if (Math.abs(m) >= 10) { m /= 10; k++; } else if (Math.abs(m) < 1) { m *= 10; k--; }
  return { m, e: k };
};

/* a^b computed through logarithms – works when the result leaves double range */
function powL(a, b) {
  if (isB(b)) throw Err("Math");
  const x = toB(a);
  if (x.m === 0) { if (b <= 0) throw Err("Math"); return 0; }
  let sg = 1;
  if (x.m < 0) {
    if (!Number.isInteger(b)) throw Err("Math");
    sg = Math.abs(b) % 2 === 1 ? -1 : 1;
  }
  const L = b * (Math.log10(Math.abs(x.m)) + x.e);
  const e = Math.floor(L);
  return norm(sg * Math.pow(10, L - e), e);
}

function bigOp(o, a, b) {
  const x = toB(a), y = toB(b);
  switch (o) {
    case "×": return norm(x.m * y.m, x.e + y.e);
    case "÷": if (y.m === 0) throw Err("Math"); return norm(x.m / y.m, x.e - y.e);
    case "+": case "-": {
      const s = o === "+" ? 1 : -1;
      if (x.m === 0) return norm(s * y.m, y.e);
      if (y.m === 0) return norm(x.m, x.e);
      const d = x.e - y.e;
      if (d > 20) return norm(x.m, x.e);
      if (d < -20) return norm(s * y.m, y.e);
      return norm(x.m + s * y.m * Math.pow(10, -d), x.e);
    }
    case "^": return powL(a, b);
    default: throw Err("Math");
  }
}

function bigFn(name, x) {
  const L = Math.log10(Math.abs(x.m)) + x.e;
  switch (name) {
    case "log": if (x.m < 0) throw Err("Math"); return L;
    case "ln": if (x.m < 0) throw Err("Math"); return L * Math.LN10;
    case "Abs": return norm(Math.abs(x.m), x.e);
    case "√": if (x.m < 0) throw Err("Math"); return powL(x, 0.5);
    case "∛": {
      const r = powL({ m: Math.abs(x.m), e: x.e }, 1 / 3);
      return x.m < 0 ? (isB(r) ? norm(-r.m, r.e) : -r) : r;
    }
    default: throw Err("Math");
  }
}

const parseNum = (str) => {
  const v = parseFloat(str);
  const [mm, ee] = str.split("e");
  if (ee !== undefined && (!Number.isFinite(v) || (v === 0 && parseFloat(mm) !== 0))) return norm(parseFloat(mm), parseInt(ee, 10));
  return v;
};

function lex(s, base = 10) {
  const t = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i], rest = s.slice(i);
    const w = NAMES.find((n) => s.startsWith(n, i));
    if (w) { t.push({ k: "w", v: w }); i += w.length; continue; }
    if (base !== 10) {
      const b = /^[0-9A-F]+/.exec(rest);
      if (b) {
        if ([...b[0]].some((d) => parseInt(d, 16) >= base)) throw Err("Syntax");
        t.push({ k: "n", v: parseInt(b[0], base) }); i += b[0].length; continue;
      }
    } else {
      const d = /^(\d+(?:\.\d*)?)°(?:(\d+(?:\.\d*)?)′)?(?:(\d+(?:\.\d*)?)″)?/.exec(rest);
      if (d) { t.push({ k: "n", v: +d[1] + (+d[2] || 0) / 60 + (+d[3] || 0) / 3600 }); i += d[0].length; continue; }
      const m = /^(\d+(?:\.\d*)?|\.\d+)(ᴇ[+-]?\d+)?/.exec(rest);
      if (m) { t.push({ k: "n", v: parseNum(m[0].replace("ᴇ", "e")) }); i += m[0].length; continue; }
    }
    if (s.startsWith("⁻¹", i)) { t.push({ k: "o", v: "⁻¹" }); i += 2; continue; }
    if (base === 10 && "πe".concat(VARS).includes(c)) { t.push({ k: "c", v: c }); i++; continue; }
    const O = (v) => ({ k: "o", v });
    if (c === "⟨" || c === "⟪") { t.push(O("("), O("(")); i++; continue; }
    if (c === "⦙") { t.push(O(")"), O("+"), O("("), O("(")); i++; continue; }
    if (c === "¦") { t.push(O(")"), O("÷"), O("(")); i++; continue; }
    if (c === "⟅") { t.push(O("^"), O("(")); i++; continue; }
    if (c === "⟆") { t.push(O(")")); i++; continue; }
    if (c === "⟩") { t.push(O(")"), O(")")); i++; continue; }
    if (c === "⟫") { t.push(O(")"), O(")"), O(")")); i++; continue; }
    if ("+-×÷^()!,²³%⁄⌟".includes(c)) { t.push({ k: "o", v: c }); i++; continue; }
    throw Err("Syntax");
  }
  return t;
}

function parse(tk) {
  let p = 0;
  const peek = () => tk[p];
  const isO = (v) => peek() && peek().k === "o" && peek().v === v;
  const isInfix = () => peek() && peek().k === "w" && INFIX.includes(peek().v);
  const close = () => { if (isO(")")) p++; else if (p < tk.length) throw Err("Syntax"); };
  const atomStart = () => {
    const k = peek();
    return k && (k.k === "n" || k.k === "c" || (k.k === "w" && !INFIX.includes(k.v)) || (k.k === "o" && k.v === "("));
  };

  const expr = () => {
    let a = term();
    while (isO("+") || isO("-")) { const o = tk[p++].v; a = { t: "b", o, a, b: term() }; }
    return a;
  };
  const term = () => {
    let a = perm();
    for (;;) {
      if (isO("×") || isO("÷")) { const o = tk[p++].v; a = { t: "b", o, a, b: perm() }; }
      else if (atomStart()) a = { t: "b", o: "×", a, b: perm() };
      else break;
    }
    return a;
  };
  const perm = () => {
    let a = unary();
    while (isInfix()) { const o = tk[p++].v; a = { t: "b", o, a, b: unary() }; }
    return a;
  };
  const unary = () => {
    if (isO("-")) { p++; return { t: "neg", a: unary() }; }
    if (isO("+")) { p++; return unary(); }
    return power();
  };
  const power = () => {
    const a = fraction();
    if (isO("^")) { p++; return { t: "b", o: "^", a, b: signedPow() }; }
    return a;
  };
  const signedPow = () => {
    if (isO("-")) { p++; return { t: "neg", a: signedPow() }; }
    if (isO("+")) { p++; return signedPow(); }
    return power();
  };
  /* a⁄b  and mixed number  a⌟b⁄c */
  const fraction = () => {
    let a = post();
    if (isO("⌟")) {
      p++;
      const n = post();
      if (!isO("⁄")) throw Err("Syntax");
      p++;
      return { t: "b", o: "+", a, b: { t: "b", o: "÷", a: n, b: post() } };
    }
    while (isO("⁄")) { p++; a = { t: "b", o: "÷", a, b: post() }; }
    return a;
  };
  const post = () => {
    let a = atom();
    while (peek() && peek().k === "o" && ["!", "²", "³", "⁻¹", "%"].includes(peek().v)) a = { t: "p", o: tk[p++].v, a };
    return a;
  };
  const atom = () => {
    const k = tk[p++];
    if (!k) throw Err("Syntax");
    if (k.k === "n") return { t: "n", v: k.v };
    if (k.k === "c") return { t: "c", v: k.v };
    if (k.k === "w") {
      if (k.v === "Ans" || k.v === "Ran#") return { t: "c", v: k.v };
      if (CONSTMAP[k.v] !== undefined) return { t: "n", v: CONSTMAP[k.v] };
      if (INFIX.includes(k.v) || !isO("(")) throw Err("Syntax");
      p++;
      const a = [expr()];
      while (isO(",")) { p++; a.push(expr()); }
      close();
      return { t: "f", n: k.v, a };
    }
    if (k.k === "o" && k.v === "(") { const e = expr(); close(); return e; }
    throw Err("Syntax");
  };

  const tree = expr();
  if (p < tk.length) throw Err("Syntax");
  return tree;
}

/* ------------------------------- evaluator -------------------------------- */

/* n! – exact doubles up to 170!, extended range (mantissa × 10^exp) beyond */
const fact = (n) => {
  if (!Number.isInteger(n) || n < 0 || n > 100000) throw Err("Math");
  if (n <= 170) {
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }
  let m = 1, e = 0;
  for (let i = 2; i <= n; i++) {
    m *= i;
    if (m > 1e250) { m /= 1e250; e += 250; }
  }
  return norm(m, e);
};
const isInt = (...v) => v.every((x) => Number.isInteger(x) && x >= 0);

function ev(n, E) {
  switch (n.t) {
    case "n": return n.v;
    case "c": {
      const v = n.v;
      if (v === "π") return PI;
      if (v === "e") return Math.E;
      if (v === "Ans") return E.ans;
      if (v === "Ran#") return Math.floor(Math.random() * 1000) / 1000;
      return E.vars[v] || 0;
    }
    case "neg": { const x = ev(n.a, E); return isB(x) ? norm(-x.m, x.e) : -x; }
    case "p": {
      const x = ev(n.a, E);
      if (n.o === "!") return fact(N(x));
      if (isB(x)) {
        if (n.o === "²") return bigOp("×", x, x);
        if (n.o === "³") return bigOp("×", bigOp("×", x, x), x);
        if (n.o === "⁻¹") return norm(1 / x.m, -x.e);
        return norm(x.m, x.e - 2);
      }
      if (n.o === "²") { const r = x * x; return Number.isFinite(r) ? r : bigOp("×", x, x); }
      if (n.o === "³") { const r = x * x * x; return Number.isFinite(r) ? r : bigOp("×", bigOp("×", x, x), x); }
      if (n.o === "⁻¹") { if (x === 0) throw Err("Math"); return 1 / x; }
      return x / 100;
    }
    case "b": {
      const a = ev(n.a, E), b = ev(n.b, E);
      if (isB(a) || isB(b)) return bigOp(n.o, a, b);
      switch (n.o) {
        case "+": return a + b;
        case "-": return a - b;
        case "×": { const r = a * b; return Number.isFinite(r) ? r : bigOp("×", a, b); }
        case "÷": { if (b === 0) throw Err("Math"); const r = a / b; return Number.isFinite(r) ? r : bigOp("÷", a, b); }
        case "^": {
          if (a === 0 && b <= 0) throw Err("Math");
          const r = Math.pow(a, b);
          if (Number.isNaN(r)) throw Err("Math");
          return Number.isFinite(r) && !(r === 0 && a !== 0) ? r : powL(a, b);
        }
        case "nPr": { if (!isInt(a, b) || b > a) throw Err("Math"); let r = 1; for (let i = 0; i < b; i++) r *= a - i; return r; }
        case "nCr": { if (!isInt(a, b) || b > a) throw Err("Math"); const k = Math.min(b, a - b); let r = 1; for (let i = 1; i <= k; i++) r = (r * (a - k + i)) / i; return Math.round(r); }
        case "ˣ√": {
          if (a === 0) throw Err("Math");
          if (b < 0) { if (Number.isInteger(a) && Math.abs(a) % 2 === 1) return -Math.pow(-b, 1 / a); throw Err("Math"); }
          return Math.pow(b, 1 / a);
        }
        default: throw Err("Syntax");
      }
    }
    default: return fn(n, E);
  }
}

function fn(n, E) {
  const A = n.a, name = n.n;
  const need = { "∫": 3, Σ: 3, "∫ₐᵇ": 3, "Σₐᵇ": 3, "d/dx": 2, logb: 2 }[name] || 1;
  if (A.length !== need) throw Err("Syntax");
  if (name === "∫ₐᵇ" || name === "Σₐᵇ") return fn({ n: name[0], a: [A[2], A[0], A[1]] }, E);

  if (name === "∫" || name === "Σ" || name === "d/dx") {
    const E2 = { ...E, vars: { ...E.vars } };
    const g = (t) => { E2.vars.X = t; return N(ev(A[0], E2)); };
    if (name === "∫") {
      const a = N(ev(A[1], E)), b = N(ev(A[2], E)), K = 2000, h = (b - a) / K;
      let sum = g(a) + g(b);
      for (let i = 1; i < K; i++) sum += g(a + i * h) * (i % 2 ? 4 : 2);
      return (sum * h) / 3;
    }
    if (name === "Σ") {
      const a = Math.round(N(ev(A[1], E))), b = Math.round(N(ev(A[2], E)));
      if (b - a > 1e6) throw Err("Math");
      let sum = 0;
      for (let i = a; i <= b; i++) sum += g(i);
      return sum;
    }
    const a = N(ev(A[1], E)), h = 1e-3 * Math.max(1, Math.abs(a));
    return (g(a - 2 * h) - 8 * g(a - h) + 8 * g(a + h) - g(a + 2 * h)) / (12 * h);
  }

  const x = ev(A[0], E);
  if (isB(x)) return bigFn(name, x);
  const D = E.angle;
  const toR = (v) => (D === "deg" ? (v * PI) / 180 : D === "gra" ? (v * PI) / 200 : v);
  const fromR = (v) => (D === "deg" ? (v * 180) / PI : D === "gra" ? (v * 200) / PI : v);
  const tiny = (r) => (Math.abs(r) < 1e-15 ? 0 : r);
  switch (name) {
    case "sin": return tiny(Math.sin(toR(x)));
    case "cos": return tiny(Math.cos(toR(x)));
    case "tan": {
      if (D === "deg" && ((x % 180) + 180) % 180 === 90) throw Err("Math");
      if (Math.abs(Math.cos(toR(x))) < 1e-15) throw Err("Math");
      return tiny(Math.tan(toR(x)));
    }
    case "sin⁻¹": if (Math.abs(x) > 1) throw Err("Math"); return fromR(Math.asin(x));
    case "cos⁻¹": if (Math.abs(x) > 1) throw Err("Math"); return fromR(Math.acos(x));
    case "tan⁻¹": return fromR(Math.atan(x));
    case "sinh": return Math.sinh(x);
    case "cosh": return Math.cosh(x);
    case "tanh": return Math.tanh(x);
    case "sinh⁻¹": return Math.asinh(x);
    case "cosh⁻¹": if (x < 1) throw Err("Math"); return Math.acosh(x);
    case "tanh⁻¹": if (Math.abs(x) >= 1) throw Err("Math"); return Math.atanh(x);
    case "log": if (x <= 0) throw Err("Math"); return Math.log10(x);
    case "ln": if (x <= 0) throw Err("Math"); return Math.log(x);
    case "logb": { const y = N(ev(A[1], E)); if (x <= 0 || x === 1 || y <= 0) throw Err("Math"); return Math.log(y) / Math.log(x); }
    case "√": if (x < 0) throw Err("Math"); return Math.sqrt(x);
    case "∛": return Math.cbrt(x);
    case "Abs": return Math.abs(x);
    default: throw Err("Syntax");
  }
}

/* ------------------------------- formatting ------------------------------- */

function fmtBig(v, f) {
  const d = f.type === "sci" ? Math.max(0, f.n - 1) : 9;
  let m = Number(Math.abs(v.m).toPrecision(d + 1)), e = v.e;
  if (m >= 10) { m /= 10; e++; }
  const t = f.type === "sci" ? m.toFixed(d) : String(m);
  return `${v.m < 0 ? "-" : ""}${t}×10${sup(e)}`;
}

function fmtNum(v, f) {
  if (isB(v)) return fmtBig(v, f);
  if (v === 0) return "0";
  const sci = (d) => {
    const [m, e] = v.toExponential(d).split("e");
    return `${f.type === "sci" ? m : m.replace(/\.?0+$/, "")}×10${sup(+e)}`;
  };
  if (f.type === "fix") { const r = v.toFixed(f.n); return Number(r) === 0 ? r.replace("-", "") : r; }
  if (f.type === "sci") return sci(Math.max(0, f.n - 1));
  const a = Math.abs(v);
  if (a >= 1e10 || a < 1e-2) return sci(9);
  return String(Number(v.toPrecision(10)));
}

const fmtEng = (v, e) => `${Number((isB(v) ? v.m * Math.pow(10, v.e - e) : v / Math.pow(10, e)).toPrecision(10))}×10${sup(e)}`;
const fmtBase = (v, b) => { const t = Math.trunc(v); return (t < 0 ? t >>> 0 : t).toString(b).toUpperCase(); };

/* a number as text that the expression lexer can read back (uses ᴇ, not e) */
const vstr = (v) => (isB(v) ? `${v.m}ᴇ${v.e}` : String(v).replace("e", "ᴇ"));

/* Turns pasted plain text (2*3, sqrt(16), pi, asin(0.5), 1e5 …) into calculator text */
const normalizeInput = (t, hexMode = false) =>
  t.replace(/\s+/g, "").replace(/=+$/, "")
    .replace(/d\/dx/g, "\u0001")
    .replace(/[−–]/g, "-")
    .replace(/\*\*/g, "^")
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/\u0001/g, "d/dx")
    .replace(/(?:arc|a)(sin|cos|tan)h/g, "$1h⁻¹")
    .replace(/(?:arc|a)(sin|cos|tan)/g, "$1⁻¹")
    .replace(/(sin|cos|tan)(h?)\^-1/g, "$1$2⁻¹")
    .replace(/sqrt/g, "√")
    .replace(/cbrt/g, "∛")
    .replace(/abs\(/gi, "Abs(")
    .replace(/log10\(/g, "log(")
    .replace(/exp\(/g, "e^(")
    .replace(/pi/gi, "π")
    .replace(/npr/gi, "nPr")
    .replace(/ncr/gi, "nCr")
    .replace(hexMode ? /$^/ : /(\d)[eE]([+-]?\d)/g, "$1ᴇ$2");
const cleanCmp = (x) => String(x).replace(/[−–]/g, "-").replace(/\s+/g, "");
const SPLIT = /\t|=>|\|/;

function toDMS(v) {
  const sg = v < 0 ? "-" : "", a = Math.abs(v);
  let d = Math.floor(a);
  const r = (a - d) * 60;
  let m = Math.floor(r + 1e-9);
  let s = Math.round((r - m) * 6000) / 100;
  if (s >= 60) { s -= 60; m++; }
  if (m >= 60) { m -= 60; d++; }
  return `${sg}${d}°${m}′${s}″`;
}

function toFrac(v) {
  if (!Number.isFinite(v) || Number.isInteger(v) || Math.abs(v) > 1e9) return null;
  const sg = Math.sign(v), a = Math.abs(v);
  for (let q = 2; q <= 9999; q++) {
    const p = Math.round(a * q);
    if (Math.abs(a - p / q) < 1e-12 * Math.max(1, a)) return { n: sg * p, d: q };
  }
  return null;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/* Exact form of a result: fraction, multiple of π, or k√m / q. Returns null when none fits. */
function toExact(v) {
  if (isB(v) || !Number.isFinite(v) || v === 0 || Number.isInteger(v)) return null;
  const sg = v < 0 ? -1 : 1, a = Math.abs(v);
  const close = (x) => Math.abs(a - x) < 1e-11 * Math.max(1, a);
  const f = toFrac(a);
  if (f) return { sg, kind: "n", a: f.n, d: f.d };
  for (let q = 1; q <= 360; q++) {
    const p = Math.round((a / PI) * q);
    if (p > 0 && p <= 1000 && close((p * PI) / q)) { const g = gcd(p, q); return { sg, kind: "pi", a: p / g, d: q / g }; }
  }
  for (let q = 1; q <= 100; q++) {
    const N = Math.round(a * a * q * q);
    if (N < 2 || N > 1e6) continue;
    let k = 1, m = N;
    for (let i = 2; i * i <= m; i++) while (m % (i * i) === 0) { m /= i * i; k *= i; }
    if (m > 1 && close((k * Math.sqrt(m)) / q)) { const g = gcd(k, q); return { sg, kind: "rad", a: k / g, m, d: q / g }; }
  }
  return null;
}

const exactStr = (x) => {
  const c = x.a === 1 ? "" : x.a;
  const top = x.kind === "n" ? String(x.a) : x.kind === "pi" ? c + "π" : c + "√" + x.m;
  return `${x.sg < 0 ? "-" : ""}${top}${x.d > 1 ? "/" + x.d : ""}`;
};

/* ---------------------------------- keys ---------------------------------- */
/* Layout follows the real calculator: l = main, sl = SHIFT (yellow),
   al = ALPHA (red), bl = Base-N (blue).                                      */

const ROW1 = [
  { id: "shift", l: "SHIFT", act: "shift", c: "mod" },
  { id: "alpha", l: "ALPHA", act: "alpha", c: "mod" },
  { id: "PAD" },
  { id: "mode", l: "MODE", sl: "SETUP", act: "mode", c: "mod" },
  { id: "on", l: "ON", act: "on", c: "mod" },
  { id: "calc", l: "CALC", sl: "SOLVE", al: "=", act: "calc" },
  { id: "int", l: "∫ₐᵇ▫", sl: "d/dx", tpl: "int", sins: "d/dx(" },
  { id: "inv", l: "x⁻¹", sl: "x!", ins: "⁻¹", sins: "!" },
  { id: "lgb", l: "logₐ▫", sl: "Σ", ins: "logb(", tpl: "logb", stpl: "sum" },
];
const DPAD = [
  { id: "up", l: "▲", act: "up", c: "pad", cls: "col-start-2 row-start-1" },
  { id: "left", l: "◀", act: "left", c: "pad", cls: "col-start-1 row-start-2" },
  { id: "right", l: "▶", act: "right", c: "pad", cls: "col-start-3 row-start-2" },
  { id: "down", l: "▼", act: "down", c: "pad", cls: "col-start-2 row-start-3" },
];
const ROWS = [
  [
    { id: "fr", l: "▫⁄▫", sl: "▫▫⁄▫", tpl: "frac", stpl: "mixed" },
    { id: "sqrt", l: "√▫", sl: "∛", ins: "√(", sins: "∛(" },
    { id: "sq", l: "x²", sl: "x³", bl: "DEC", bv: 10, ins: "²", sins: "³" },
    { id: "pow", l: "x▫", sl: "ˣ√", bl: "HEX", bv: 16, ins: "^", tpl: "pow", sins: "ˣ√" },
    { id: "log", l: "log", sl: "10ˣ", bl: "BIN", bv: 2, ins: "log(", sins: "10^(" },
    { id: "ln", l: "ln", sl: "eˣ", bl: "OCT", bv: 8, ins: "ln(", sins: "e^(" },
  ],
  [
    { id: "neg", l: "(−)", al: "A", ins: "-", sins: "-", neg: 1 },
    { id: "dms", l: "°′″", sl: "←DMS", al: "B", act: "dms" },
    { id: "hyp", l: "hyp", sl: "Abs", al: "C", act: "hyp" },
    { id: "sin", l: "sin", sl: "sin⁻¹", al: "D", ins: "sin(", sins: "sin⁻¹(", tr: 1 },
    { id: "cos", l: "cos", sl: "cos⁻¹", al: "E", ins: "cos(", sins: "cos⁻¹(", tr: 1 },
    { id: "tan", l: "tan", sl: "tan⁻¹", al: "F", ins: "tan(", sins: "tan⁻¹(", tr: 1 },
  ],
  [
    { id: "rcl", l: "RCL", sl: "STO", act: "rcl" },
    { id: "eng", l: "ENG", sl: "←", act: "eng" },
    { id: "lp", l: "(", sl: "%", ins: "(", sins: "%" },
    { id: "rp", l: ")", sl: ",", al: "X", ins: ")", sins: "," },
    { id: "ssd", l: "S⇔D", al: "Y", act: "ssd" },
    { id: "mp", l: "M+", sl: "M−", al: "M", act: "mplus" },
  ],
];
const PAD = [
  [
    { id: "7", l: "7", sl: "CONST", sact: "const", ins: "7", c: "num" }, { id: "8", l: "8", sl: "CONV", sact: "conv", ins: "8", c: "num" }, { id: "9", l: "9", sl: "CLR", sact: "clr", ins: "9", c: "num" },
    { id: "del", l: "DEL", sl: "INS", act: "del", c: "ed" }, { id: "ac", l: "AC", sl: "OFF", act: "ac", c: "ed" },
  ],
  [
    { id: "4", l: "4", ins: "4", c: "num" }, { id: "5", l: "5", ins: "5", c: "num" }, { id: "6", l: "6", ins: "6", c: "num" },
    { id: "mul", l: "×", sl: "nPr", ins: "×", sins: "nPr", c: "op" }, { id: "div", l: "÷", sl: "nCr", ins: "÷", sins: "nCr", c: "op" },
  ],
  [
    { id: "1", l: "1", ins: "1", c: "num" }, { id: "2", l: "2", ins: "2", c: "num" }, { id: "3", l: "3", ins: "3", c: "num" },
    { id: "add", l: "+", ins: "+", c: "op" }, { id: "sub", l: "−", ins: "-", c: "op" },
  ],
  [
    { id: "0", l: "0", ins: "0", c: "num" }, { id: "dot", l: ".", sl: "Ran#", ins: ".", sins: "Ran#", c: "num" },
    { id: "exp", l: "×10ˣ", sl: "π", al: "e", ins: "ᴇ", sins: "π", c: "num" },
    { id: "ans", l: "Ans", ins: "Ans", c: "num" },
    { id: "eq", l: "=", act: "eq", c: "eq" },
  ],
];
const BY = Object.fromEntries([...ROW1, ...DPAD, ...ROWS.flat(), ...PAD.flat()].map((k) => [k.id, k]));
const KEYMAP = {
  "+": "add", "-": "sub", "*": "mul", "/": "div", ".": "dot", Enter: "eq", "=": "eq", Backspace: "del", Escape: "ac",
  "(": "lp", ")": "rp", "^": "pow", ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
};
"0123456789".split("").forEach((d) => (KEYMAP[d] = d));
const TEXT = { "%": "%", "!": "!", ",": ",", s: "sin(", c: "cos(", t: "tan(", l: "log(", n: "ln(", r: "√(", p: "π", e: "e" };

const KS = {
  mod: "bg-gradient-to-b from-[#626971] to-[#383d44] text-text",
  fn: "bg-gradient-to-b from-[#f0f2f4] to-[#cbd0d5] text-[#202832]",
  pad: "bg-gradient-to-b from-[#e0e4e8] to-[#b6bdc4] text-[#202832]",
  num: "bg-gradient-to-b from-accent to-[#e2e5e2] text-[#171b20]",
  op: "bg-gradient-to-b from-[#eef0f2] to-[#c7cdd2] text-[#171b20]",
  ed: "bg-gradient-to-b from-[#6b86aa] to-[#405b7c] text-text",
  eq: "bg-gradient-to-b from-[#526d8c] to-[#293e59] text-text ring-1 ring-[#26384d]",
};

const Rad = ({ k, m }) => (
  <span className="inline-flex items-baseline">
    {k !== 1 && k}<span>√</span><span className="border-t-2 border-current">{m}</span>
  </span>
);

const Exact = ({ x }) => {
  const top = x.kind === "n" ? x.a : x.kind === "pi" ? <>{x.a !== 1 && x.a}π</> : <Rad k={x.a} m={x.m} />;
  return (
    <span className="inline-flex items-center gap-1 align-middle text-xl leading-none sm:text-2xl">
      {x.sg < 0 && "−"}
      {x.d === 1 ? top : (
        <span className="inline-flex flex-col items-center leading-tight">
          <span className="border-b-2 border-current px-1">{top}</span>
          <span>{x.d}</span>
        </span>
      )}
    </span>
  );
};

const Overlay = ({ title, onClose, children }) => (
  <div className="absolute inset-0 z-20 overflow-auto rounded-[1.5rem] bg-[#e7ebef] p-3 text-[#202832] sm:rounded-[2rem] sm:p-5">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>
      <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-muted hover:text-page"><X size={18} /></button>
    </div>
    {children}
  </div>
);

/* ------------------------------ extra modes ------------------------------- */

const num = (t) => (String(t).trim() === "" ? 0 : N(ev(parse(lex(String(t))), { vars: {}, ans: 0, angle: "deg" })));
const F = (v) => fmtNum(Number(v.toPrecision(12)), { type: "norm", n: 0 }).replace(/-/g, "−");
const cxs = (re, im) => (Math.abs(im) < 1e-12 ? F(re) : `${F(re)} ${im < 0 ? "−" : "+"} ${F(Math.abs(im))}i`);
const bt = "rounded-md border border-[#4b5a45]/50 bg-[#c6d4b6] px-3 py-1.5 text-sm font-bold hover:bg-[#b8c9a6]";
const field = "w-full min-w-0 rounded-md border border-[#8d9a82] bg-[#f4f8ec] px-2 py-1.5 font-mono text-sm";
const errText = (e) => (e.message === "Syntax" ? "Syntax ERROR" : e.message === "Dim" ? "Dimension ERROR" : "Math ERROR");

const mmul = (a, b) => {
  if (a[0].length !== b.length) throw Err("Dim");
  return a.map((r) => b[0].map((_, j) => r.reduce((s, x, k) => s + x * b[k][j], 0)));
};
const mdet = (m) => {
  if (m.length !== m[0].length) throw Err("Dim");
  const a = m.map((r) => [...r]), n = a.length;
  let d = 1;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[p][i])) p = r;
    if (Math.abs(a[p][i]) < 1e-14) return 0;
    if (p !== i) { [a[i], a[p]] = [a[p], a[i]]; d = -d; }
    d *= a[i][i];
    for (let r = i + 1; r < n; r++) { const f = a[r][i] / a[i][i]; a[r] = a[r].map((x, k) => x - f * a[i][k]); }
  }
  return d;
};
const minv = (m) => {
  const n = m.length;
  if (n !== m[0].length) throw Err("Dim");
  const a = m.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => +(i === j))]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[p][i])) p = r;
    if (Math.abs(a[p][i]) < 1e-12) throw Err("Math");
    [a[i], a[p]] = [a[p], a[i]];
    const d = a[i][i];
    a[i] = a[i].map((x) => x / d);
    for (let r = 0; r < n; r++) if (r !== i) { const f = a[r][i]; a[r] = a[r].map((x, k) => x - f * a[i][k]); }
  }
  return a.map((r) => r.slice(n));
};

const quad = (a, b, c) => {
  if (a === 0) throw Err("Math");
  const d = b * b - 4 * a * c;
  return d >= 0
    ? [[(-b + Math.sqrt(d)) / (2 * a), 0], [(-b - Math.sqrt(d)) / (2 * a), 0]]
    : [[-b / (2 * a), Math.sqrt(-d) / (2 * a)], [-b / (2 * a), -Math.sqrt(-d) / (2 * a)]];
};
const cubic = (a, b, c, d) => {
  if (a === 0) throw Err("Math");
  const B = b / a, C = c / a, D = d / a, R = 1 + Math.max(Math.abs(B), Math.abs(C), Math.abs(D));
  const f = (x) => ((x + B) * x + C) * x + D;
  let lo = -R, hi = R;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
  const r = (lo + hi) / 2;
  return [[r, 0], ...quad(1, B + r, C + (B + r) * r)];
};

const EQS = { p2: ["aX² + bX + c = 0", 3, 1], p3: ["aX³ + bX² + cX + d = 0", 4, 1], l2: ["2 unknowns (X, Y)", 3, 2], l3: ["3 unknowns (X, Y, Z)", 4, 3] };

function Equation() {
  const [t, setT] = useState("p2");
  const [v, setV] = useState({});
  const [out, setOut] = useState([]);
  const [, cols, rows] = EQS[t];
  const run = () => {
    try {
      const g = (i) => num(v[i] ?? "");
      let L;
      if (t === "p2" || t === "p3") {
        const r = t === "p2" ? quad(g(0), g(1), g(2)) : cubic(g(0), g(1), g(2), g(3));
        L = r.map(([re, im], i) => `X${i + 1} = ${cxs(re, im)}`);
      } else {
        const M = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => g(i * cols + j)));
        const x = mmul(minv(M.map((r) => r.slice(0, rows))), M.map((r) => [r[rows]]));
        L = x.map((r, i) => `${"XYZ"[i]} = ${F(r[0])}`);
      }
      setOut(L);
    } catch (e) { setOut([errText(e)]); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(EQS).map(([k, [name]]) => (
          <button key={k} onClick={() => { setT(k); setV({}); setOut([]); }} className={`${bt} ${t === k ? "!bg-[#e0b94f]" : ""}`}>{name}</button>
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` }}>
          {Array.from({ length: cols }, (_, j) => (
            <label key={j} className="text-[10px] font-bold">{"abcd"[j]}{rows > 1 ? i + 1 : ""}
              <input className={field} value={v[i * cols + j] ?? ""} placeholder="0" onChange={(e) => setV({ ...v, [i * cols + j]: e.target.value })} />
            </label>
          ))}
        </div>
      ))}
      <button onClick={run} className={bt}>Solve</button>
      <div className="space-y-1 text-lg font-semibold">{out.map((l) => <p key={l}>{l}</p>)}</div>
    </div>
  );
}

const mk = (r, c) => Array.from({ length: r }, () => Array(c).fill("0"));

function MatrixTool() {
  const [M, setM] = useState({ A: mk(2, 2), B: mk(2, 2) });
  const [out, setOut] = useState(null);
  const resize = (k, r, c) => setM((m) => ({ ...m, [k]: Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => m[k][i]?.[j] ?? "0")) }));
  const val = (k) => M[k].map((r) => r.map(num));
  const tr = (m) => m[0].map((_, j) => m.map((r) => r[j]));
  const OPS = {
    "A+B": () => addm(val("A"), val("B"), 1), "A−B": () => addm(val("A"), val("B"), -1),
    "A×B": () => mmul(val("A"), val("B")), "B×A": () => mmul(val("B"), val("A")),
    "det A": () => mdet(val("A")), "A⁻¹": () => minv(val("A")), "Aᵀ": () => tr(val("A")),
    "det B": () => mdet(val("B")), "B⁻¹": () => minv(val("B")), "Bᵀ": () => tr(val("B")),
  };
  const addm = (a, b, s) => {
    if (a.length !== b.length || a[0].length !== b[0].length) throw Err("Dim");
    return a.map((r, i) => r.map((x, j) => x + s * b[i][j]));
  };
  const run = (op) => { try { setOut({ r: OPS[op]() }); } catch (e) { setOut({ e: errText(e) }); } };
  const sel = (k, i, max = 4) => (
    <select value={i} onChange={(e) => (k.dim === "r" ? resize(k.m, +e.target.value, M[k.m][0].length) : resize(k.m, M[k.m].length, +e.target.value))} className="rounded border border-[#8d9a82] bg-[#f4f8ec] px-1 text-sm">
      {Array.from({ length: max }, (_, n) => <option key={n} value={n + 1}>{n + 1}</option>)}
    </select>
  );
  return (
    <div className="space-y-3">
      {["A", "B"].map((k) => (
        <div key={k}>
          <div className="mb-1 flex items-center gap-1 text-sm font-bold">Mat{k} {sel({ m: k, dim: "r" }, M[k].length)} × {sel({ m: k, dim: "c" }, M[k][0].length)}</div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${M[k][0].length},minmax(0,1fr))` }}>
            {M[k].map((row, i) => row.map((x, j) => (
              <input key={`${i}-${j}`} className={field} value={x} onChange={(e) => setM((m) => ({ ...m, [k]: m[k].map((r, a) => r.map((c, b) => (a === i && b === j ? e.target.value : c))) }))} />
            )))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">{Object.keys(OPS).map((op) => <button key={op} onClick={() => run(op)} className={bt}>{op}</button>)}</div>
      {out?.e && <p className="text-lg font-semibold">{out.e}</p>}
      {out?.r !== undefined && (typeof out.r === "number"
        ? <p className="text-2xl font-semibold">{F(out.r)}</p>
        : (
          <div className="grid gap-1 text-lg font-semibold" style={{ gridTemplateColumns: `repeat(${out.r[0].length},minmax(0,1fr))` }}>
            {out.r.map((r) => r.map((x, j) => <span key={Math.random() + j} className="text-right">{F(x)}</span>))}
          </div>
        ))}
    </div>
  );
}

const med = (a) => { const n = a.length, m = n >> 1; return n % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

function Stats() {
  const [two, setTwo] = useState(false);
  const [xs, setXs] = useState("");
  const [ys, setYs] = useState("");
  const [q, setQ] = useState("");
  const [out, setOut] = useState([]);
  const list = (t) => t.split(/[\s,;]+/).filter(Boolean).map(num);
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const run = () => {
    try {
      const x = list(xs), n = x.length;
      if (!n) throw Err("Syntax");
      const mx = sum(x) / n, sx2 = sum(x.map((v) => v * v)), ssx = sx2 - n * mx * mx;
      const L = [`n = ${n}`, `x̄ = ${F(mx)}`, `Σx = ${F(sum(x))}`, `Σx² = ${F(sx2)}`, `σx = ${F(Math.sqrt(Math.max(0, ssx / n)))}`];
      if (n > 1) L.push(`sx = ${F(Math.sqrt(Math.max(0, ssx / (n - 1))))}`);
      if (!two) {
        const s = [...x].sort((a, b) => a - b), h = n >> 1;
        L.push(`minX = ${F(s[0])}`, `Q1 = ${F(n > 1 ? med(s.slice(0, h)) : s[0])}`, `Med = ${F(med(s))}`, `Q3 = ${F(n > 1 ? med(s.slice(n - h)) : s[0])}`, `maxX = ${F(s[n - 1])}`);
      } else {
        const y = list(ys);
        if (y.length !== n) throw Err("Math");
        const my = sum(y) / n, sxy = sum(x.map((v, i) => v * y[i])) - n * mx * my, syy = sum(y.map((v) => v * v)) - n * my * my;
        if (ssx === 0 || syy === 0) throw Err("Math");
        const b = sxy / ssx, a = my - b * mx;
        L.push(`ȳ = ${F(my)}`, `Σy = ${F(sum(y))}`, `Σxy = ${F(sum(x.map((v, i) => v * y[i])))}`, `a = ${F(a)}`, `b = ${F(b)}`, `r = ${F(sxy / Math.sqrt(ssx * syy))}`);
        if (q.trim() !== "") L.push(`ŷ(${q}) = ${F(a + b * num(q))}`);
      }
      setOut(L);
    } catch (e) { setOut([errText(e)]); }
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <button onClick={() => { setTwo(false); setOut([]); }} className={`${bt} ${!two ? "!bg-[#e0b94f]" : ""}`}>1-Variable</button>
        <button onClick={() => { setTwo(true); setOut([]); }} className={`${bt} ${two ? "!bg-[#e0b94f]" : ""}`}>A+BX regression</button>
      </div>
      <label className="block text-[10px] font-bold">X values (space, comma or new line)
        <textarea rows={3} className={field} value={xs} onChange={(e) => setXs(e.target.value)} />
      </label>
      {two && (
        <>
          <label className="block text-[10px] font-bold">Y values
            <textarea rows={3} className={field} value={ys} onChange={(e) => setYs(e.target.value)} />
          </label>
          <label className="block text-[10px] font-bold">Predict ŷ for x (optional)
            <input className={field} value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </>
      )}
      <button onClick={run} className={bt}>Calculate</button>
      <div className="space-y-0.5 text-lg font-semibold">{out.map((l) => <p key={l}>{l}</p>)}</div>
    </div>
  );
}

function TableTool({ angle }) {
  const [f, setF] = useState("X²");
  const [a, setA] = useState("1");
  const [b, setB] = useState("5");
  const [st, setSt] = useState("1");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const run = () => {
    try {
      const A = num(a), B = num(b), S = num(st);
      if (!(S > 0) || B < A || Math.floor((B - A) / S) + 1 > 45) throw Err("Math");
      const tree = parse(lex(f));
      const out = [];
      for (let i = 0, x = A; x <= B + 1e-9; i++, x = A + i * S) {
        let y;
        try { y = ev(tree, { vars: { X: x }, ans: 0, angle }); y = Number.isFinite(y) ? F(y) : "ERROR"; } catch (e) { y = "ERROR"; }
        out.push([F(x), y]);
      }
      setRows(out); setErr("");
    } catch (e) { setRows([]); setErr(errText(e)); }
  };
  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold">f(X) =
        <input className={field} value={f} onChange={(e) => setF(e.target.value)} />
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {[["Start", a, setA], ["End", b, setB], ["Step", st, setSt]].map(([n, val, set]) => (
          <label key={n} className="text-[10px] font-bold">{n}<input className={field} value={val} onChange={(e) => set(e.target.value)} /></label>
        ))}
      </div>
      <button onClick={run} className={bt}>Make table</button>
      <p className="text-[10px]">Use X as the variable, for example sin(X) or X²−3X. Up to 45 rows.</p>
      {err && <p className="text-lg font-semibold">{err}</p>}
      {rows.length > 0 && (
        <table className="w-full text-right text-base font-semibold">
          <thead><tr className="border-b border-[#202a1c]/40 text-xs"><th>X</th><th>f(X)</th></tr></thead>
          <tbody>{rows.map(([x, y], i) => <tr key={i}><td>{x}</td><td>{y}</td></tr>)}</tbody>
        </table>
      )}
    </div>
  );
}

const TOOLS = { eq: ["Equation", Equation], matrix: ["Matrix", MatrixTool], stat: ["Statistics", Stats], table: ["Table", TableTool] };

function ToolPanel({ mode, angle, onMenu, onSetup }) {
  const [title, Body] = TOOLS[mode];
  return (
    <div>
      <div className="rounded-lg border border-[#7d8790] bg-[#535e68] p-1.5">
        <div className="max-h-[560px] overflow-y-auto rounded-md bg-[#dce8cc] p-3 font-mono text-[#202a1c] shadow-[inset_0_2px_7px_rgba(0,0,0,.28)]">
          <p className="mb-3 text-xs font-bold">{title}</p>
          <Body angle={angle} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={onMenu} className={`h-9 rounded-[7px] text-[11px] font-bold ${KS.mod}`}>MODE</button>
        <button onClick={onSetup} className={`h-9 rounded-[7px] text-[11px] font-bold ${KS.mod}`}>SETUP</button>
      </div>
    </div>
  );
}

/* ------------------- natural-display templates & helpers ------------------ */

const DELIMS = ["⟨", "¦", "⟩", "⟪", "⦙", "⟫", "⟅", "⟆"];

function tplRange(s, idx) {
  const st = [], rs = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "⟨" || c === "⟪" || c === "⟅") st.push(i);
    else if ((c === "⟩" || c === "⟫" || c === "⟆") && st.length) rs.push({ o: st.pop(), c: i });
  }
  return rs.filter((r) => r.o <= idx && idx <= r.c).sort((a, b) => a.c - a.o - (b.c - b.o))[0];
}

function tplSlots(s, pos) {
  const st = [];
  let best = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "⟨" || c === "⟪") st.push({ o: i, seps: [] });
    else if ((c === "¦" || c === "⦙") && st.length) st[st.length - 1].seps.push(i);
    else if ((c === "⟩" || c === "⟫") && st.length) {
      const t = st.pop();
      t.c = i;
      if (t.o < pos && pos <= t.c && (!best || t.c - t.o < best.c - best.o)) best = t;
    }
  }
  return best;
}

/* Draws stacked fractions, mixed numbers and ∫ / Σ templates inside the LCD */
function renderExpr(s, pos, show, ovr) {
  let kk = 0;
  const Cur = () => <span key={`c${kk++}`} className={`inline-block animate-pulse bg-current ${ovr ? "h-[3px] w-3 translate-y-2" : "h-4 w-[2px] translate-y-0.5"}`} />;
  /* empty slots show a dashed box; data-e = cursor position when the box (or its padding) is clicked */
  const box = (r) => (<>{r.empty && <span data-e={r.i} className="mx-px inline-block h-4 w-3 translate-y-0.5 border border-dashed border-current opacity-60" />}{r.nodes}</>);
  const slot = (r, cls = "") => <span data-e={r.i} className={cls}>{box(r)}</span>;
  const fracEl = (n, d) => (
    <span key={`f${kk++}`} className="mx-0.5 inline-flex flex-col items-center align-middle leading-tight">
      {slot(n, "border-b-2 border-current px-1")}
      {slot(d, "px-1")}
    </span>
  );
  const seq = (i, stop) => {
    const nodes = [], start = i;
    let text = "", ts = i, depth = 0, skip = -1;
    const flush = () => {
      if (!text) return;
      const t0 = ts;
      nodes.push(<span key={`t${kk++}`}>{[...text].map((ch, j) => <span key={j} data-p={t0 + j}>{ch === "-" ? "−" : ch}</span>)}</span>);
      text = "";
    };
    while (i < s.length) {
      const c = s[i];
      /* template separators always end a slot, even if a "(" inside it is still open */
      if (stop && stop(c) && (depth === 0 || DELIMS.includes(c))) break;
      if (show && i === pos && i !== skip) { flush(); nodes.push(Cur()); }
      if (c === "⟨") {
        flush();
        const n = seq(i + 1, (x) => x === "¦"), d = seq(n.i + 1, (x) => x === "⟩");
        nodes.push(fracEl(n, d)); i = d.i + 1; continue;
      }
      if (c === "⟪") {
        flush();
        const w = seq(i + 1, (x) => x === "⦙"), n = seq(w.i + 1, (x) => x === "¦"), d = seq(n.i + 1, (x) => x === "⟫");
        nodes.push(<span key={`m${kk++}`} className="inline-flex items-center align-middle">{slot(w)}{fracEl(n, d)}</span>);
        i = d.i + 1; continue;
      }
      if (s.startsWith("logb(", i)) {
        flush();
        const a = seq(i + 5, (x) => x === ","), f = seq(a.i + 1, (x) => x === ")");
        nodes.push(
          <span key={`l${kk++}`} className="inline-flex items-baseline">
            <span>log</span>{slot(a, "translate-y-1 text-[0.65em]")}(<span data-e={f.i}>{box(f)}</span>)
          </span>
        );
        i = f.i + 1; continue;
      }
      if (s.startsWith("√(", i) || s.startsWith("∛(", i)) {
        flush();
        const f = seq(i + 2, (x) => x === ")" || DELIMS.includes(x));
        nodes.push(
          <span key={`r${kk++}`} className="inline-flex items-baseline">
            {c === "∛" && <sup className="text-[0.6em]">3</sup>}<span>√</span>{slot(f, "border-t-2 border-current px-0.5")}
          </span>
        );
        i = s[f.i] === ")" ? f.i + 1 : f.i; continue;
      }
      if (c === "⟅") {
        flush();
        const e = seq(i + 1, (x) => x === "⟆");
        nodes.push(<span key={`w${kk++}`} className="relative -top-2 text-[0.75em]">{slot(e)}</span>);
        i = s[e.i] === "⟆" ? e.i + 1 : e.i; continue;
      }
      if (c === "^") {
        flush();
        let cnt = 0;
        const e = seq(i + 1, (x) => { const first = cnt++ === 0; return !(/[\d.ᴇπ(A-FXYMe]/.test(x) || (first && (x === "-" || x === "+"))); });
        nodes.push(<span key={`p${kk++}`} className="relative -top-2 text-[0.75em]">{slot(e)}</span>);
        i = e.i; skip = e.i; continue;
      }
      if (c === "(" && s[i + 1] === ")") {
        flush();
        nodes.push(<span key={`q${kk++}`} data-p={i}>(</span>);
        if (show && pos === i + 1) nodes.push(Cur());
        nodes.push(<span key={`z${kk++}`} data-e={i + 1} className="mx-px inline-block h-4 w-3 translate-y-0.5 border border-dashed border-current opacity-60" />);
        nodes.push(<span key={`y${kk++}`} data-p={i + 1}>)</span>);
        i += 2; continue;
      }
      if (s.startsWith("∫ₐᵇ(", i) || s.startsWith("Σₐᵇ(", i)) {
        flush();
        const a = seq(i + 4, (x) => x === ","), b = seq(a.i + 1, (x) => x === ","), f = seq(b.i + 1, (x) => x === ")");
        nodes.push(
          <span key={`o${kk++}`} className="inline-flex items-center align-middle">
            <span className="mr-1 inline-flex flex-col items-center text-[9px] leading-none">
              <span>{box(b)}</span><span className="text-xl leading-none">{c}</span><span>{c === "Σ" && "X="}{box(a)}</span>
            </span>
            {c === "Σ" && "("}{box(f)}{c === "Σ" ? ")" : <span className="ml-0.5">dx</span>}
          </span>
        );
        i = f.i + 1; continue;
      }
      if (!text) ts = i;
      text += c;
      if (c === "(") depth++; else if (c === ")" && depth > 0) depth--;
      i++;
    }
    if (show && i === pos && i !== skip) { flush(); nodes.push(Cur()); }
    flush();
    return { nodes, i, empty: i === start, start };
  };
  return seq(0, null).nodes;
}

/* ------------------------------ unit conversion --------------------------- */

const UNITS = {
  Length: { m: 1, km: 1e3, cm: 1e-2, mm: 1e-3, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 },
  Mass: { kg: 1, g: 1e-3, mg: 1e-6, t: 1e3, lb: 0.45359237, oz: 0.028349523125 },
  Time: { s: 1, min: 60, h: 3600, day: 86400, week: 604800 },
  Area: { "m²": 1, "cm²": 1e-4, "km²": 1e6, ha: 1e4, "ft²": 0.09290304, acre: 4046.8564224 },
  Volume: { L: 1e-3, mL: 1e-6, "m³": 1, gal: 0.003785411784, cup: 2.365882365e-4, "fl oz": 2.95735295625e-5 },
  Speed: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, kn: 1852 / 3600 },
  Pressure: { Pa: 1, kPa: 1e3, bar: 1e5, atm: 101325, mmHg: 133.322387415, psi: 6894.757293168 },
  Energy: { J: 1, kJ: 1e3, cal: 4.184, kcal: 4184, eV: 1.602176634e-19, kWh: 3.6e6 },
  Force: { N: 1, kN: 1e3, lbf: 4.4482216152605, kgf: 9.80665 },
  Power: { W: 1, kW: 1e3, hp: 745.69987158227 },
  Angle: { deg: PI / 180, rad: 1, gon: PI / 200 },
};
const TEMPS = ["°C", "°F", "K"];
const toK = (v, u) => (u === "°C" ? v + 273.15 : u === "°F" ? ((v - 32) * 5) / 9 + 273.15 : v);
const fromK = (v, u) => (u === "°C" ? v - 273.15 : u === "°F" ? ((v - 273.15) * 9) / 5 + 32 : v);

function ConvPanel({ value, onUse, onClose }) {
  const [sel, setSel] = useState({ cat: "Length", from: "m", to: "ft" });
  const [val, setVal] = useState(value);
  const units = (c) => (c === "Temperature" ? TEMPS : Object.keys(UNITS[c]));
  const pick = (c) => { const u = units(c); setSel({ cat: c, from: u[0], to: u[1] }); };
  const x = Number(val);
  let out = NaN;
  if (val.trim() !== "" && Number.isFinite(x)) {
    out = sel.cat === "Temperature" ? fromK(toK(x, sel.from), sel.to) : (x * UNITS[sel.cat][sel.from]) / UNITS[sel.cat][sel.to];
    out = Number(out.toPrecision(10));
  }
  const selCls = "rounded-md border border-[#aeb8c2] bg-text px-2 py-1.5 text-sm font-semibold";
  return (
    <Overlay title="Unit conversion (CONV)" onClose={onClose}>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[...Object.keys(UNITS), "Temperature"].map((c) => (
          <button key={c} onClick={() => pick(c)} className={`rounded-md border px-2 py-1 text-xs font-semibold ${sel.cat === c ? "border-[#d3a83d] bg-[#e0b94f]" : "border-[#aeb8c2]"}`}>{c}</button>
        ))}
      </div>
      <input value={val} onChange={(e) => setVal(e.target.value)} className="mt-4 w-full rounded-md border border-[#aeb8c2] bg-text px-3 py-2 font-mono" />
      <div className="mt-3 flex items-center gap-2">
        <select value={sel.from} onChange={(e) => setSel({ ...sel, from: e.target.value })} className={selCls}>{units(sel.cat).map((u) => <option key={u}>{u}</option>)}</select>
        <span className="font-bold">→</span>
        <select value={sel.to} onChange={(e) => setSel({ ...sel, to: e.target.value })} className={selCls}>{units(sel.cat).map((u) => <option key={u}>{u}</option>)}</select>
      </div>
      <p className="mt-4 break-all font-mono text-xl font-bold">{Number.isFinite(out) ? `${fmtNum(out, { type: "norm", n: 0 })} ${sel.to}` : "—"}</p>
      <button disabled={!Number.isFinite(out)} onClick={() => onUse(out)} className="mt-4 rounded-md bg-[#344b68] px-4 py-2 text-sm font-semibold text-text disabled:opacity-40">Use result</button>
    </Overlay>
  );
}

/* ------------------------------ pop-out window ---------------------------- */

const PIP_SIZE = { portrait: [400, 700], landscape: [820, 520] };

function copyStyles(w) {
  [...document.styleSheets].forEach((sheet) => {
    try {
      const st = w.document.createElement("style");
      st.textContent = [...sheet.cssRules].map((r) => r.cssText).join("\n");
      w.document.head.appendChild(st);
    } catch (e) {
      if (sheet.href) {
        const l = w.document.createElement("link");
        l.rel = "stylesheet";
        l.href = sheet.href;
        w.document.head.appendChild(l);
      }
    }
  });
  w.document.documentElement.className = document.documentElement.className;
  w.document.body.style.margin = "0";
  w.document.body.style.background = "#d5dae0";
  w.document.title = "Calculator";
}

const mq = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

/* ================================== PAGE ================================== */

export default function ScientificCalculator() {
  const [s, setS] = useState("");
  const [pos, setPos] = useState(0);
  const [shift, setShift] = useState(false);
  const [alpha, setAlpha] = useState(false);
  const [hyp, setHyp] = useState(false);
  const [sto, setSto] = useState(false);
  const [angle, setAngle] = useState(DEFAULT_ANGLE);
  const [fmt, setFmt] = useState({ type: "norm", n: 0 });
  const [mode, setMode] = useState("calc");
  const [base, setBase] = useState(10);
  const [vars, setVars] = useState({});
  const [ans, setAns] = useState(0);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [fresh, setFresh] = useState(false);
  const [hist, setHist] = useState([]);
  const [hi, setHi] = useState(-1);
  const [frac, setFrac] = useState(false);
  const [dms, setDms] = useState(false);
  const [eng, setEng] = useState(null);
  const [setup, setSetup] = useState(false);
  const [menu, setMenu] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const [constOpen, setConstOpen] = useState(false);
  const [convOpen, setConvOpen] = useState(false);
  const [convVal, setConvVal] = useState("0");
  const [clrOpen, setClrOpen] = useState(false);
  const [ovr, setOvr] = useState(false);
  const [off, setOff] = useState(false);
  const [batch, setBatch] = useState(null); /* pasted multi-line tests */

  /* layout: landscape is the desktop default, portrait the mobile default */
  const [wide, setWide] = useState(mq);
  const [layout, setLayout] = useState(() => (mq() ? "landscape" : "portrait"));
  const [pip, setPip] = useState(null);
  const pipRef = useRef(null);
  const prevLayout = useRef("landscape");

  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const f = () => setWide(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);

  useEffect(() => { pipRef.current = pip; }, [pip]);
  useEffect(() => () => { try { pipRef.current?.close(); } catch (e) { /* already closed */ } }, []);

  const land = (wide || !!pip) && layout === "landscape";
  const canToggle = wide || !!pip;

  const toggleLayout = () => {
    const next = layout === "landscape" ? "portrait" : "landscape";
    setLayout(next);
    if (pip) { try { pip.resizeTo(...PIP_SIZE[next]); } catch (e) { /* not allowed */ } }
  };

  const popOut = async () => {
    if (pip) return;
    let w = null;
    try {
      if (window.documentPictureInPicture) {
        w = await window.documentPictureInPicture.requestWindow({ width: PIP_SIZE.portrait[0], height: PIP_SIZE.portrait[1] });
      } else {
        w = window.open("", "calc-popout", `popup=yes,width=${PIP_SIZE.portrait[0]},height=${PIP_SIZE.portrait[1]}`);
      }
    } catch (e) { w = null; }
    if (!w) return;
    copyStyles(w);
    prevLayout.current = layout;
    setLayout("portrait");
    w.addEventListener("pagehide", () => { setPip(null); setLayout(prevLayout.current); });
    setPip(w);
  };

  const popIn = () => { try { pip.close(); } catch (e) { setPip(null); } };

  const b = mode === "base" ? base : 10;

  const calc = (src, vs = vars) => {
    let v;
    try { v = ev(parse(lex(src, b)), { vars: vs, ans, angle }); }
    catch (e) { throw e.message === "Syntax" ? e : Err("Math"); }
    if (isB(v)) {
      if (b !== 10) throw Err("Math");
      return norm(Number(v.m.toPrecision(15)), v.e);
    }
    if (!Number.isFinite(v)) throw Err("Math");
    return Number(v.toPrecision(15));
  };

  const clearMods = () => { setShift(false); setAlpha(false); setHyp(false); };
  const resetView = () => { setFrac(false); setDms(false); setEng(null); };
  const showErr = (e) => { setErr(e.message === "Syntax" ? "Syntax ERROR" : "Math ERROR"); setRes(null); setFresh(false); };

  const insert = (txt, neg, back = 0) => {
    if (txt === ")" && !fresh && s[pos] === ")") { setPos(pos + 1); return; }
    let bs = s, p = pos;
    if (fresh) {
      if (!neg && AFTER.includes(txt)) { bs = "Ans"; p = 3; } else { bs = ""; p = 0; }
      setFresh(false);
    }
    /* "sin(", "√(", "(" … close themselves when typed at the end of an expression or slot */
    if (txt.endsWith("(") && (p === bs.length || ")⟩¦⦙⟫,".includes(bs[p]))) { txt += ")"; back = 1; }
    if (txt === "ᴇ" && !/[\d.]$/.test(bs.slice(0, p))) txt = "1ᴇ";
    if (ovr && p < bs.length && !DELIMS.includes(bs[p])) {
      const ob = BLOCKS.find((x) => bs.startsWith(x, p));
      bs = bs.slice(0, p) + bs.slice(p + (ob ? ob.length : 1));
    }
    setS(bs.slice(0, p) + txt + bs.slice(p));
    setPos(p + txt.length - back);
    setRes(null); setErr(""); setHi(-1); resetView();
  };

  const insertTpl = (kind) => {
    if (kind === "pow") { insert("⟅⟆", false, 1); return; }
    if (kind === "logb") { insert("logb(,)", false, 2); return; }
    if (kind === "int" || kind === "sum") { insert(kind === "int" ? "∫ₐᵇ(,,)" : "Σₐᵇ(,,)", false, 3); return; }
    let bs = s, p = pos;
    if (fresh) { bs = ""; p = 0; setFresh(false); }
    let pre = bs.slice(0, p);
    const post = bs.slice(p);
    if (kind === "mixed") { setS(pre + "⟪⦙¦⟫" + post); setPos(pre.length + 1); }
    else {
      const m = /(\d+\.?\d*)$/.exec(pre);
      const num = m && !/ᴇ[+-]?\d+\.?\d*$/.test(pre) ? m[1] : "";
      if (num) pre = pre.slice(0, -num.length);
      const t = "⟨" + num + "¦⟩";
      setS(pre + t + post);
      setPos(num ? pre.length + t.length - 1 : pre.length + 1);
    }
    setRes(null); setErr(""); setHi(-1); resetView();
  };

  const currentValue = () => (res ? res.v : s ? calc(s) : ans);

  const loadHist = (i) => { setS(hist[i].s); setPos(hist[i].s.length); setHi(i); setRes(null); setErr(""); setFresh(false); resetView(); };

  const equals = (vs = vars) => {
    if (!s) return;
    try {
      const v = calc(s, vs);
      setRes({ v }); setAns(v); setErr(""); setFresh(true); resetView(); setHi(-1);
      setHist((h) => [...h.slice(-49), { s, v }]);
    } catch (e) { showErr(e); }
  };

  /* CALC: ask for the variable values used in the expression, then evaluate */
  const calcKey = () => {
    if (!s) return;
    let names = [];
    try { names = [...new Set(lex(s, b).filter((t) => t.k === "c" && VARS.includes(t.v)).map((t) => t.v))]; }
    catch (e) { showErr(e); return; }
    if (!names.length) { equals(); return; }
    setPrompt({ names, vals: Object.fromEntries(names.map((n) => [n, vstr(vars[n] ?? 0)])) });
  };
  const runPrompt = () => {
    try {
      const nv = { ...vars };
      prompt.names.forEach((n) => { nv[n] = calc(prompt.vals[n]); });
      setVars(nv); setPrompt(null); equals(nv);
    } catch (e) { setPrompt(null); showErr(e); }
  };

  /* SOLVE: type  left = right  (ALPHA + CALC gives "="), solves for X */
  const solve = () => {
    try {
      const parts = s.split("=");
      if (parts.length !== 2) throw Err("Syntax");
      const L = parse(lex(parts[0])), R = parse(lex(parts[1]));
      const g = (x) => { const E = { vars: { ...vars, X: x }, ans, angle }; return N(ev(L, E)) - N(ev(R, E)); };
      const found = (x) => {
        x = Number(x.toPrecision(12));
        setVars((v) => ({ ...v, X: x })); setRes({ v: x, label: "X=" }); setAns(x); setFresh(true); setErr(""); resetView();
      };
      for (const x0 of [vars.X || 0, 1, -1, 2, -2, 5, -5, 10, -10, 0.5, -0.5, 100, -100]) {
        let x = N(x0);
        try {
          for (let i = 0; i < 60; i++) {
            const f = g(x);
            if (Math.abs(f) < 1e-12) { found(x); return; }
            const h = 1e-6 * Math.max(1, Math.abs(x));
            const d = (g(x + h) - g(x - h)) / (2 * h);
            if (!d || !Number.isFinite(d)) break;
            x -= f / d;
            if (!Number.isFinite(x)) break;
          }
          if (Math.abs(g(x)) < 1e-9) { found(x); return; }
        } catch (e) { /* try next start */ }
      }
      throw Err("Math");
    } catch (e) { showErr(e); }
  };

  const act = (k) => {
    if (!["shift", "alpha", "hyp"].includes(k.act)) clearMods();
    switch (k.act) {
      case "shift": setShift(!shift); setAlpha(false); break;
      case "alpha": setAlpha(!alpha); setShift(false); break;
      case "hyp":
        if (shift) { clearMods(); insert("Abs("); } else setHyp(!hyp);
        break;
      case "mode": if (shift) setSetup(true); else setMenu(true); break;
      case "on": case "ac":
        if (k.act === "ac" && shift) setOff(true);
        setS(""); setPos(0); setRes(null); setErr(""); setFresh(false); setHi(-1); setSto(false); resetView();
        if (k.act === "on") { setSetup(false); setMenu(false); setPrompt(null); }
        break;
      case "del": {
        if (shift) { setOvr((o) => !o); break; }
        const p = fresh ? s.length : pos;
        setFresh(false); setRes(null); setErr(""); resetView();
        if (!p) { setPos(0); break; }
        if (DELIMS.includes(s[p - 1])) {
          const r = tplRange(s, p - 1);
          if (r && s.slice(r.o + 1, r.c).replace(/[⟨⟩¦⟪⟫⦙⟅⟆]/g, "") === "") { setS(s.slice(0, r.o) + s.slice(r.c + 1)); setPos(r.o); }
          else setPos(p - 1);
          break;
        }
        const blk = BLOCKS.find((x) => s.slice(0, p).endsWith(x));
        if (blk === "∫ₐᵇ(" || blk === "Σₐᵇ(" || blk === "logb(") {
          const st = p - blk.length;
          let d = 0, e = -1;
          for (let q = p; q < s.length; q++) { if (s[q] === "(") d++; else if (s[q] === ")") { if (d === 0) { e = q; break; } d--; } }
          const inner = e >= 0 ? s.slice(p, e) : s.slice(p);
          if (inner === ",," || inner === ",") { setS(s.slice(0, st) + s.slice(e >= 0 ? e + 1 : s.length)); setPos(st); } else setPos(st);
          break;
        }
        const n = blk ? blk.length : 1;
        const tail = s.slice(p - n, p).endsWith("(") && s[p] === ")" ? 1 : 0;
        setS(s.slice(0, p - n) + s.slice(p + tail));
        setPos(p - n);
        break;
      }
      case "left": {
        if (fresh) { setFresh(false); setRes(null); setPos(s.length); break; }
        const t = tplSlots(s, pos);
        if (t) {
          const i = t.seps.filter((x) => x < pos).length, start = i === 0 ? t.o + 1 : t.seps[i - 1] + 1;
          if (pos === start) { setPos(s[t.o] === "⟪" && i === 1 ? t.seps[0] : t.o); break; }
        }
        const blk = BLOCKS.find((x) => s.slice(0, pos).endsWith(x));
        setPos(Math.max(0, pos - (blk ? blk.length : 1)));
        break;
      }
      case "right": {
        if (fresh) { setFresh(false); setRes(null); setPos(s.length); break; }
        const t = tplSlots(s, pos);
        if (t) {
          const i = t.seps.filter((x) => x < pos).length, end = i < t.seps.length ? t.seps[i] : t.c;
          if (pos === end) { setPos(s[t.o] === "⟪" && i === 0 ? t.seps[0] + 1 : t.c + 1); break; }
        }
        const blk = BLOCKS.find((x) => s.startsWith(x, pos));
        setPos(Math.min(s.length, pos + (blk ? blk.length : 1)));
        break;
      }
      case "up": case "down": {
        const t = fresh ? null : tplSlots(s, pos);
        if (t) {
          const n = t.seps.length, i = t.seps.filter((x) => x < pos).length, j = i + (k.act === "down" ? 1 : -1);
          if (j >= (s[t.o] === "⟪" ? 1 : 0) && j <= n) {
            const st = (x) => (x === 0 ? t.o + 1 : t.seps[x - 1] + 1), en = (x) => (x < n ? t.seps[x] : t.c);
            setPos(Math.min(en(j), st(j) + Math.max(0, pos - st(i))));
            break;
          }
        }
        if (k.act === "up") { if (hist.length) loadHist(hi === -1 ? hist.length - 1 : Math.max(0, hi - 1)); break; }
        if (hi === -1) break;
        if (hi + 1 >= hist.length) { setS(""); setPos(0); setHi(-1); setRes(null); }
        else loadHist(hi + 1);
        break;
      }
      case "eq": equals(); break;
      case "calc": if (shift) solve(); else calcKey(); break;
      case "ssd": if (res && mode === "calc") { setDms(false); setEng(null); setFrac((f) => !f); } break;
      case "dms":
        if (shift) { if (res && mode === "calc" && !isB(res.v)) { setFrac(false); setEng(null); setDms((d) => !d); } }
        else {
          const before = fresh ? "" : s.slice(0, pos);
          insert(/′[\d.]*$/.test(before) ? "″" : /°[\d.]*$/.test(before) ? "′" : "°");
        }
        break;
      case "eng":
        if (res && mode === "calc" && res.v !== 0) {
          const ex = isB(res.v) ? res.v.e : Math.floor(Math.log10(Math.abs(res.v)));
          const e0 = Math.floor(ex / 3) * 3;
          setFrac(false); setDms(false);
          setEng(eng === null ? e0 : eng + (shift ? -3 : 3));
        }
        break;
      case "rcl": if (shift) setSto(true); else setAlpha(true); break;
      case "mplus":
        try {
          const v = N(currentValue());
          setVars((x) => ({ ...x, M: (x.M || 0) + (shift ? -v : v) }));
        } catch (e) { showErr(e); }
        break;
      default: break;
    }
  };

  const storeTo = (ch) => {
    try { const v = currentValue(); setVars((x) => ({ ...x, [ch]: v })); }
    catch (e) { showErr(e); }
    setSto(false); clearMods();
  };

  const press = (k) => {
    if (off) { if (k.id === "on") setOff(false); return; }
    if (sto && !["shift", "alpha", "ac", "on"].includes(k.act)) {
      if (k.al) storeTo(k.al); else { setSto(false); clearMods(); }
      return;
    }
    if (k.act && alpha && k.al && k.act !== "alpha") { clearMods(); insert(k.al); return; }
    if (k.act) { act(k); return; }
    if (mode === "base" && k.bv && !shift && !alpha) { act({ act: "ac" }); setBase(k.bv); return; }
    if (shift && k.sact) {
      clearMods();
      if (k.sact === "const") setConstOpen(true);
      if (k.sact === "clr") setClrOpen(true);
      if (k.sact === "conv") { let v = "0"; try { const cv = currentValue(); if (!isB(cv)) v = String(cv); } catch (e) { /* keep 0 */ } setConvVal(v); setConvOpen(true); }
      return;
    }
    const tp = alpha ? null : shift ? k.stpl : k.tpl;
    if (tp) { clearMods(); insertTpl(tp); return; }
    let txt;
    if (alpha) { txt = k.al; if (!txt) { clearMods(); return; } }
    else if (shift && k.sins !== undefined) txt = k.sins;
    else txt = k.ins;
    if (k.tr && hyp) txt = txt.replace(/^(sin|cos|tan)/, "$1h");
    const isNeg = k.neg && !shift && !alpha;
    clearMods();
    insert(txt, isNeg);
  };

  /* evaluate one line of pasted text with the current angle / format / base */
  const evalLine = (raw) => {
    try {
      const v = calc(normalizeInput(raw, mode === "base"));
      return mode === "base" ? fmtBase(v, base) : fmtNum(v, fmt);
    } catch (e) { return e.message === "Syntax" ? "Syntax ERROR" : "Math ERROR"; }
  };

  const evalEx = (raw) => {
    if (mode !== "calc" || fmt.type !== "norm") return "";
    try { const x = toExact(calc(normalizeInput(raw))); return x ? exactStr(x) : ""; } catch (e) { return ""; }
  };

  /* paste: one line goes onto the display; several lines (or "expr => expected") become a test table */
  const pasteText = (text) => {
    const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    if (lines.length === 1 && !SPLIT.test(lines[0])) { insert(normalizeInput(lines[0], mode === "base")); return; }
    setBatch(lines.map((l) => { const [src, exp] = l.split(SPLIT); return { src: src.trim(), exp: exp === undefined ? undefined : exp.trim() }; }));
  };

  const pasteBtn = async () => {
    let t = "";
    try { t = await navigator.clipboard.readText(); }
    catch (e) { t = window.prompt('Paste an expression, or several lines like "1÷3 => 1/3"') || ""; }
    pasteText(t);
  };

  const clickExpr = (e) => {
    const el = e.target.closest("[data-p],[data-e]");
    let p = s.length;
    if (el && el.dataset.p !== undefined) {
      const r = el.getBoundingClientRect();
      p = +el.dataset.p + (e.clientX > r.left + r.width / 2 ? 1 : 0);
    } else if (el) p = +el.dataset.e;
    for (const b of BLOCKS) {           /* never land inside "sin(" or "Ans" */
      let j = s.indexOf(b);
      while (j !== -1) { if (p > j && p < j + b.length) { p = p - j < b.length / 2 ? j : j + b.length; break; } j = s.indexOf(b, j + 1); }
    }
    setFresh(false); setRes(null); setErr(""); setPos(Math.min(p, s.length));
  };

  const overlay = setup || menu || prompt || constOpen || convOpen || clrOpen;
  const isTool = !!TOOLS[mode];

  /* physical keyboard (main window and the pop-out window) */
  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || overlay || isTool || off) return;
      const id = KEYMAP[e.key];
      if (id) { e.preventDefault(); press(BY[id]); return; }
      if (TEXT[e.key]) insert(TEXT[e.key]);
    };
    const onPaste = (e) => {
      if (overlay || isTool || off) return;
      const tg = e.target;
      if (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return;
      const t = e.clipboardData && e.clipboardData.getData("text");
      if (!t) return;
      e.preventDefault();
      pasteText(t);
    };
    const targets = [window, pip].filter(Boolean);
    targets.forEach((t) => { t.addEventListener("keydown", h); t.addEventListener("paste", onPaste); });
    return () => targets.forEach((t) => { t.removeEventListener("keydown", h); t.removeEventListener("paste", onPaste); });
  });

  /* display */
  /* "frac" now means "show decimal": S⇔D flips it, every new input resets it to exact */
  const fr = !frac && res && mode === "calc" && !dms && eng === null && fmt.type === "norm" ? toExact(res.v) : null;
  let shown = "";
  if (res) {
    if (mode === "base") shown = fmtBase(res.v, base);
    else if (dms && !isB(res.v)) shown = toDMS(res.v);
    else if (eng !== null) shown = fmtEng(res.v, eng);
    else shown = fmtNum(res.v, fmt);
  }
  const rows = batch ? batch.map((r) => {
    const got = evalLine(r.src), ex = evalEx(r.src);
    return { ...r, got, ex, ok: r.exp === undefined ? null : [got, ex].some((g) => g && cleanCmp(r.exp) === cleanCmp(g)) };
  }) : null;
  const angTag = { deg: "D", rad: "R", gra: "G" }[angle];
  const tags = [
    shift && "S", alpha && "A", sto && "STO", hyp && "hyp", vars.M && "M",
    mode === "base" ? { 10: "Dec", 16: "Hex", 2: "Bin", 8: "Oct" }[base] : angTag,
    mode === "calc" && fmt.type === "fix" && "Fix", mode === "calc" && fmt.type === "sci" && "Sci", ovr && "Ovr",
  ].filter(Boolean);

  /* Every key always gets the same-height label row above it (even when it has
     no SHIFT / ALPHA / BASE label), so all keys in a row line up perfectly. */
  const key = (k) => {
    const on = (k.id === "shift" && shift) || (k.id === "alpha" && alpha) || (k.id === "hyp" && hyp) || (k.id === "rcl" && sto);
    const style = KS[k.c || "fn"];
    return (
      <div key={k.id} className="flex min-w-0 flex-col">
        <div className="flex h-3.5 min-w-0 items-end justify-between gap-0.5 px-0.5 text-[7px] font-bold leading-none sm:text-[8px]">
          <span className="text-[#c08d1b]">{k.sl}</span>
          {k.bl && <span className="text-[#1f7e8c]">{k.bl}</span>}
          <span className="text-[#b83f46]">{k.al}</span>
        </div>
        <button
          onClick={() => press(k)}
          aria-label={k.l}
          className={`h-9 min-w-0 touch-manipulation select-none rounded-md border border-border/10 px-0.5 text-[10px] font-bold shadow-[0_2px_0_rgba(35,45,55,.3),inset_0_1px_0_rgba(255,255,255,.8)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-[2px] active:shadow-none sm:text-[11px] ${style} ${on ? "ring-2 ring-brand" : ""} ${k.id === "alpha" && alpha ? "ring-brand" : ""}`}
        >
          {k.l}
        </button>
      </div>
    );
  };

  const dpad = (
    <div key="PAD" className="col-span-2 row-span-2 flex items-center justify-center">
      <div className="grid h-[76px] w-[76px] grid-cols-3 grid-rows-3 gap-0.5 rounded-full bg-gradient-to-b from-[#cbd0d5] to-[#aab2bb] p-1 shadow-[inset_0_2px_5px_rgba(50,60,70,.2)]">
        {DPAD.map((k) => (
          <button key={k.id} onClick={() => press(k)} aria-label={k.id}
            className={`flex touch-manipulation items-center justify-center rounded-md border border-border/10 text-[9px] font-bold shadow-[0_2px_0_rgba(35,45,55,.28)] active:translate-y-px ${KS.pad} ${k.cls}`}>{k.l}</button>
        ))}
      </div>
    </div>
  );

  const chip = (on, onClick, text) => (
    <button key={text} onClick={onClick} className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${on ? "border-[#d3a83d] bg-[#e0b94f] text-[#202832]" : "border-[#aeb8c2] text-[#263b53]"}`}>{text}</button>
  );

  const tbtn = "inline-flex h-7 items-center gap-1 rounded-md border border-[#9aa4ae] bg-text/60 px-2 text-[11px] font-bold text-[#263b53] hover:bg-text";

  const shell = pip
    ? "relative min-h-screen w-full min-w-0 bg-gradient-to-b from-[#f4f5f6] via-[#e0e4e8] to-[#c8ced4] p-3"
    : `relative mx-auto mt-5 w-full min-w-0 rounded-[1.5rem] border border-[#aeb6bf] bg-gradient-to-b from-[#f4f5f6] via-[#e0e4e8] to-[#c8ced4] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-text/80 sm:mt-6 sm:rounded-[2rem] sm:p-6 ${land ? "max-w-[820px]" : "max-w-[400px]"}`;

  const body = (
    <div className={shell}>
      {/* toolbar */}
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2 px-0.5">
        <span className="text-[11px] font-black tracking-[0.14em] text-[#263b53]">SCIENTIFIC</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {canToggle && (
            <button onClick={toggleLayout} className={tbtn} title={land ? "Switch to portrait" : "Switch to landscape"}>
              {land ? <Smartphone size={13} /> : <Monitor size={13} />}
              {land ? "Portrait" : "Landscape"}
            </button>
          )}
         
          <button onClick={pasteBtn} className={tbtn} title="Paste an expression or a list of tests">
            <ClipboardPaste size={13} />Paste
          </button>
          {wide && !pip && (
            <button onClick={popOut} className={tbtn} title="Open the calculator in its own small window">
              <ExternalLink size={13} />Pop out
            </button>
          )}
        </div>
      </div>

      {isTool ? (
        <ToolPanel mode={mode} angle={angle} onMenu={() => setMenu(true)} onSetup={() => setSetup(true)} />
      ) : (
        <>
          {/* LCD */}
          <div className="rounded-lg border border-[#7d8790] bg-[#535e68] p-1.5 shadow-inner">
            <div className={`relative flex min-w-0 flex-col rounded-md bg-[#dce8cc] px-3 py-1.5 font-mono text-[#202a1c] shadow-[inset_0_2px_7px_rgba(0,0,0,.28)] ${land ? "h-28" : "h-32"}`}>
              {off && <div className="absolute inset-0 z-10 rounded-md bg-[#8f9b86]" />}
              <div className="flex h-4 gap-2 text-[10px] font-bold">{tags.map((t) => <span key={t}>{t}</span>)}</div>
              <div onClick={clickExpr} className="min-h-0 flex-1 cursor-text overflow-y-auto break-all text-sm leading-snug sm:text-base">
                {renderExpr(s, pos, !fresh, ovr)}
              </div>
              <div className="flex min-h-[2rem] items-end justify-end break-all text-right text-xl font-semibold sm:text-2xl">
                {err ? <span className="text-lg">{err}</span> : res ? (
                  <>
                    {res.label}
                    {fr ? <Exact x={fr} /> : shown.replace(/-/g, "−")}
                  </>
                ) : ""}
              </div>
            </div>
          </div>

          {/* keys */}
          <div className={land ? "mt-4 flex items-end gap-5" : "mt-4"}>
            <div className={land ? "min-w-0 flex-[6]" : ""}>
              <div className="grid grid-cols-6 gap-x-1 gap-y-1 sm:gap-x-1.5">
                {ROW1.map((k) => (k.id === "PAD" ? dpad : key(k)))}
              </div>
              <div className="mt-1 space-y-1">
                {ROWS.map((r, i) => <div key={i} className="grid grid-cols-6 gap-x-1 sm:gap-x-1.5">{r.map((k) => key(k))}</div>)}
              </div>
            </div>
            <div className={`space-y-1 ${land ? "min-w-0 flex-[5]" : "mt-1"}`}>
              {PAD.map((r, i) => <div key={i} className="grid grid-cols-5 gap-x-1 sm:gap-x-1.5">{r.map((k) => key(k))}</div>)}
            </div>
          </div>
        </>
      )}

      {/* MODE menu */}
      {menu && (
        <Overlay title="Menu" onClose={() => setMenu(false)}>
          {[["calc", "Calculate"], ["base", "Base-N"], ["eq", "Equation"], ["matrix", "Matrix"], ["stat", "Statistics"], ["table", "Table"]].map(([v, t], i) => (
            <button key={v} onClick={() => { setMode(v); setBase(10); act({ act: "ac" }); setMenu(false); }}
              className={`mt-3 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left font-semibold ${mode === v ? "border-[#d3a83d] bg-[#f6e7b8]" : "border-[#aeb8c2]"}`}>
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[#344b68] text-xs text-text">{i + 1}</span>{t}
            </button>
          ))}
          <p className="mt-4 text-xs text-muted">Equation solves quadratic, cubic and 2–3 unknown linear systems. Matrix has MatA and MatB (up to 4×4). Statistics does 1-variable and A+BX regression. Table builds f(X) tables. In Base-N, the DEC, HEX, BIN and OCT keys (x², x▫, log, ln) pick the number base. Use ALPHA + a key for the digits A–F.</p>
        </Overlay>
      )}

      {/* CALC prompt */}
      {prompt && (
        <Overlay title="Enter values" onClose={() => setPrompt(null)}>
          <div className="mt-4 space-y-3">
            {prompt.names.map((n) => (
              <label key={n} className="flex items-center gap-3 text-sm font-semibold">
                <span className="w-6 text-lg">{n} =</span>
                <input value={prompt.vals[n]} onChange={(e) => setPrompt({ ...prompt, vals: { ...prompt.vals, [n]: e.target.value } })}
                  onKeyDown={(e) => { if (e.key === "Enter") runPrompt(); }}
                  className="w-full rounded-md border border-[#aeb8c2] bg-text px-3 py-2 font-mono" />
              </label>
            ))}
          </div>
          <button onClick={runPrompt} className="mt-5 rounded-md bg-[#344b68] px-4 py-2 text-sm font-semibold text-text">Calculate</button>
        </Overlay>
      )}

      {/* CONST */}
      {constOpen && (
        <Overlay title="Constants (CONST)" onClose={() => setConstOpen(false)}>
          <div className="mt-3 space-y-1.5">
            {CONSTS.map(([sym, name, v, u]) => (
              <button key={sym} onClick={() => { setConstOpen(false); insert(sym); }} className="flex w-full items-center gap-3 rounded-md border border-[#aeb8c2] px-3 py-1.5 text-left hover:bg-text">
                <span className="w-9 text-base font-bold">{sym}</span>
                <span className="min-w-0 flex-1 text-xs"><span className="block font-semibold">{name}</span><span className="block truncate font-mono text-[#4c5b6b]">{fmtNum(v, { type: "norm", n: 0 })} {u}</span></span>
              </button>
            ))}
          </div>
        </Overlay>
      )}

      {/* CONV */}
      {convOpen && (
        <ConvPanel value={convVal} onClose={() => setConvOpen(false)}
          onUse={(v) => { setConvOpen(false); setS(vstr(v)); setPos(vstr(v).length); setRes({ v }); setAns(v); setFresh(true); setErr(""); resetView(); }} />
      )}

      {/* CLR */}
      {clrOpen && (
        <Overlay title="Clear (CLR)" onClose={() => setClrOpen(false)}>
          {[
            ["1: Setup data", () => { setAngle(DEFAULT_ANGLE); setFmt({ type: "norm", n: 0 }); }],
            ["2: Memory", () => { setVars({}); setAns(0); setHist([]); setHi(-1); }],
            ["3: All", () => { setAngle(DEFAULT_ANGLE); setFmt({ type: "norm", n: 0 }); setVars({}); setAns(0); setHist([]); setHi(-1); setMode("calc"); setBase(10); }],
          ].map(([t, fn2]) => (
            <button key={t} onClick={() => { fn2(); act({ act: "ac" }); setClrOpen(false); }} className="mt-3 block w-full rounded-lg border border-[#aeb8c2] px-3 py-2.5 text-left font-semibold hover:bg-text">{t}</button>
          ))}
        </Overlay>
      )}

      {/* SETUP */}
      {setup && (
        <Overlay title="Setup" onClose={() => setSetup(false)}>
          <p className="mt-4 text-xs font-semibold text-muted">Angle unit</p>
          <div className="mt-2 flex gap-2">
            {[["deg", "Degree"], ["rad", "Radian"], ["gra", "Gradian"]].map(([v, t]) => chip(angle === v, () => setAngle(v), t))}
          </div>
          <p className="mt-5 text-xs font-semibold text-muted">Number format</p>
          <div className="mt-2 flex gap-2">
            {[["norm", "Normal"], ["fix", "Fix"], ["sci", "Sci"]].map(([v, t]) => chip(fmt.type === v, () => setFmt({ type: v, n: v === "fix" ? 2 : v === "sci" ? 3 : 0 }), t))}
          </div>
          {fmt.type !== "norm" && (
            <>
              <p className="mt-4 text-xs font-semibold text-muted">{fmt.type === "fix" ? "Decimal places" : "Significant digits"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: fmt.type === "fix" ? 10 : 9 }, (_, i) => (fmt.type === "fix" ? i : i + 1)).map((n) => chip(fmt.n === n, () => setFmt({ ...fmt, n }), String(n)))}
              </div>
            </>
          )}
          <div className="mt-6 flex gap-2">
            <button onClick={() => { setAngle(DEFAULT_ANGLE); setFmt({ type: "norm", n: 0 }); setVars({}); setHist([]); setAns(0); setMode("calc"); setBase(10); }} className="rounded-md border border-muted px-3 py-1.5 text-sm font-semibold text-[#263b53]">Reset all</button>
            <button onClick={() => setSetup(false)} className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-page">Done</button>
          </div>
        </Overlay>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-gradient-to-br from-page via-surface to-page text-text">

      <main className="mx-auto w-full max-w-4xl px-2 py-4 sm:px-6 sm:py-6">
        <div className="px-1 text-center">
          <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">Scientific Calculator</h1>
          <p className="mt-2 text-xs text-muted sm:text-sm">Works like a Casio fx-991CW. Runs fully in your browser.</p>
        </div>

        {pip ? (
          <>
            <div className="mx-auto mt-6 w-full max-w-[400px] rounded-2xl border border-border bg-surface/70 p-6 text-center">
              <p className="text-sm text-text">The calculator is open in its own window.</p>
              <button onClick={popIn} className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-page">Bring it back here</button>
            </div>
            {createPortal(body, pip.document.body)}
          </>
        ) : body}

        {rows && (
          <div className="mx-auto mt-5 max-w-[820px] rounded-2xl border border-border bg-surface/70 p-4 text-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-bold text-text">
                Pasted tests{rows.some((r) => r.ok !== null) ? ` – ${rows.filter((r) => r.ok === true).length}/${rows.filter((r) => r.ok !== null).length} match` : ""}
              </span>
              <button onClick={() => setBatch(null)} className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-page">Clear</button>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-left font-mono text-xs sm:text-sm">
                <thead><tr className="text-muted"><th className="pr-3">Expression</th><th className="pr-3">Result</th><th className="pr-3">Expected</th><th /></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={r.ok === false ? "text-brand" : "text-text"}>
                      <td className="break-all pr-3">{r.src}</td>
                      <td className="break-all pr-3">{r.got.replace(/-/g, "−")}{r.ex && <span className="text-muted"> = {r.ex}</span>}</td>
                      <td className="break-all pr-3">{r.exp ?? ""}</td>
                      <td>{r.ok === true ? "✓" : r.ok === false ? "✗" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-muted">Results use the current angle unit and number format, so change SETUP and they update.</p>
          </div>
        )}

        <div className="mx-auto mt-5 max-w-[820px] space-y-2 px-1 text-xs text-muted sm:mt-6 sm:space-y-1.5">
          <p><span className="font-semibold text-[#c08d1b]">SHIFT</span> then a key uses the yellow function. <span className="font-semibold text-[#b83f46]">ALPHA</span> then a key uses the red letter. <span className="font-semibold text-text">SHIFT + MODE</span> opens SETUP, MODE opens the menu.</p>
          <p>Angle unit: the little letter at the top of the screen shows it (R = radian, D = degree, G = gradian). Change it in SETUP. For sin(π/2) = 1 use Radian.</p>
          <p>Fractions: press ▫⁄▫, type the numerator, press ▼ for the denominator, then ▶ to leave the fraction. ▲ goes back up. Results show exactly (⅓, √2⁄2, π⁄2); S⇔D switches to decimal. Store a value: SHIFT + RCL (STO), then ALPHA and a letter. ▲ ▼ browse history outside a fraction.</p>
          <p>CALC asks for the variables in your expression. SOLVE: type an equation with ALPHA + CALC for "=", e.g. X² − 4 = 0, then SHIFT + CALC. ∫ and Σ use X, e.g. ∫(X², 0, 3).</p>
          <p>Templates: ▫⁄▫ and ∫ₐᵇ▫ draw natural fractions and integrals; fill each box and move between them with ◀ ▶. SHIFT + 7 CONST (constants), SHIFT + 8 CONV (unit conversion), SHIFT + 9 CLR, SHIFT + DEL INS (insert/overwrite), SHIFT + AC OFF (press ON to wake).</p>
          <p>Very large or very small results (for example 171! or 10^400) are shown as mantissa × 10 to a power instead of an error.</p>
          <p>Layout: on desktop use the Portrait / Landscape button on the calculator. Pop out opens a small always-on-top window (Chrome / Edge) or a popup window (other browsers) in portrait, which you can also switch to landscape.</p>
          <p>Paste works: Ctrl+V (or the Paste button) puts text like 2*3, sqrt(16), pi, asin(0.5) on the display. Paste several lines, or lines like "2^10 =&gt; 1024", to get a test table with ✓ / ✗.</p>
          <p>Keyboard works too: digits, + − * / ( ) ^, Enter, Backspace, Esc, arrows, and s c t l n r for sin cos tan log ln √.</p>
        </div>
      
      </main>
      <ToolArticle {...Article} />
                    <ToolFAQ
                      faqs={FAQ}
                     description="Free online scientific calculator for trigonometry, logs, fractions, equations, matrices, statistics, and unit conversion. Works on phone and desktop, with a pop-out window."
                    />
      <Footer />
    </div>
  );
}