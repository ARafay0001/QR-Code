import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Check, Copy, RotateCcw, Search, Trash2, Type, X } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const pl = (f) => (s) => s.split("\n").map(f).join("\n"); // apply to every line
const byLine = (f) => (s) => f(s.split("\n")).join("\n"); // apply to the list of lines
const unesc = (s) => s.replace(/\\n/g, "\n").replace(/\\t/g, "\t"); // "\n" and "\t" typed as text
const noAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const words = (s) =>
  s.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const bytes = (s) => Array.from(new TextEncoder().encode(s));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MORSE = Object.fromEntries(
  "A .-,B -...,C -.-.,D -..,E .,F ..-.,G --.,H ....,I ..,J .---,K -.-,L .-..,M --,N -.,O ---,P .--.,Q --.-,R .-.,S ...,T -,U ..-,V ...-,W .--,X -..-,Y -.--,Z --..,0 -----,1 .----,2 ..---,3 ...--,4 ....-,5 .....,6 -....,7 --...,8 ---..,9 ----."
    .split(",")
    .map((p) => p.split(" ")),
);
const FROM_MORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
const LOREM = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat".split(" ");

function stats(s) {
  const w = s.match(/\S+/g) || [];
  const sentences = (s.match(/[^.!?]+[.!?]+/g) || (s.trim() ? [s] : [])).length;
  const longest = w.reduce((a, b) => (b.length > a.length ? b : a), "");
  const avg = w.length ? (w.join("").length / w.length).toFixed(1) : 0;
  return [
    `Characters: ${s.length}`,
    `Characters without spaces: ${s.replace(/\s/g, "").length}`,
    `Words: ${w.length}`,
    `Sentences: ${sentences}`,
    `Lines: ${s ? s.split("\n").length : 0}`,
    `Paragraphs: ${s.split(/\n\s*\n/).filter((p) => p.trim()).length}`,
    `Average word length: ${avg}`,
    `Longest word: ${longest}`,
    `Reading time: ${Math.max(1, Math.round(w.length / 200))} min (200 words per minute)`,
    `Speaking time: ${Math.max(1, Math.round(w.length / 130))} min (130 words per minute)`,
  ].join("\n");
}

function charFrequency(s) {
  const counts = {};
  for (const c of s.replace(/\s/g, "")) counts[c] = (counts[c] || 0) + 1;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([c, n]) => `${c}  ${n}  (${((n / total) * 100).toFixed(1)}%)`)
    .join("\n");
}

/* -------------------------------------------------------------------------- */
/*  The tools. To add one: a single line in this list.                         */
/*  T(id, category, name, description, run(text, params), params, keywords)    */
/* -------------------------------------------------------------------------- */

const T = (id, cat, name, desc, run, params = [], keys = "", flags = {}) => ({ id, cat, name, desc, run, params, keys, ...flags });

const TOOLS = [
  // Case
  T("upper", "Case", "UPPERCASE", "Make every letter a capital.", (s) => s.toUpperCase(), [], "capital caps"),
  T("lower", "Case", "lowercase", "Make every letter small.", (s) => s.toLowerCase(), [], "small"),
  T("title", "Case", "Title Case", "Capitalize The First Letter Of Each Word.", (s) => s.toLowerCase().replace(/(^|[\s\-_(["'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()), [], "capitalize words"),
  T("sentence", "Case", "Sentence case", "Capitalize only the start of each sentence.", (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (m, a, b) => a + b.toUpperCase())),
  T("camel", "Case", "camelCase", "Join words, lower first letter, capitalize the rest.", pl((l) => words(l).map((w, i) => (i ? cap(w) : w.toLowerCase())).join("")), [], "variable programming"),
  T("pascal", "Case", "PascalCase", "Join words and capitalize each one.", pl((l) => words(l).map(cap).join("")), [], "class programming"),
  T("snake", "Case", "snake_case", "Lowercase words joined by underscores.", pl((l) => words(l).join("_").toLowerCase()), [], "underscore programming"),
  T("kebab", "Case", "kebab-case", "Lowercase words joined by hyphens.", pl((l) => words(l).join("-").toLowerCase()), [], "dash hyphen css"),
  T("constant", "Case", "CONSTANT_CASE", "Uppercase words joined by underscores.", pl((l) => words(l).join("_").toUpperCase()), [], "screaming snake"),
  T("alternating", "Case", "aLtErNaTiNg case", "Alternate small and capital letters.", (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join(""), [], "mocking spongebob"),
  T("inverse", "Case", "iNVERSE cASE", "Swap capitals and small letters.", (s) => [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join(""), [], "toggle swap flip"),

  // Clean
  T("trim", "Clean", "Trim whitespace", "Remove spaces at the start and end of every line.", (s) => s.split("\n").map((l) => l.trim()).join("\n").trim()),
  T("spaces", "Clean", "Remove extra spaces", "Collapse repeated spaces into one.", (s) => s.replace(/[ \t]+/g, " ").replace(/^ +| +$/gm, ""), [], "double spaces whitespace"),
  T("breaks", "Clean", "Remove line breaks", "Turn many lines into one paragraph.", (s) => s.replace(/\s*\n+\s*/g, " ").trim(), [], "newline join"),
  T("empty", "Clean", "Remove empty lines", "Delete blank lines.", byLine((l) => l.filter((x) => x.trim())), [], "blank"),
  T("dedupe", "Clean", "Remove duplicate lines", "Keep only the first copy of each line.", byLine((l) => [...new Set(l)]), [], "unique"),
  T("punct", "Clean", "Remove punctuation", "Keep only letters, numbers and spaces.", (s) => s.replace(/[^\p{L}\p{N}\s]/gu, "")),
  T("accents", "Clean", "Remove accents", "Turn é into e, ñ into n and so on.", noAccents, [], "diacritics"),
  T("html", "Clean", "Strip HTML tags", "Remove <tags> and keep the text.", (s) => s.replace(/<[^>]*>/g, "")),

  // Lines
  T("sortaz", "Lines", "Sort lines A to Z", "Alphabetical order.", byLine((l) => [...l].sort((a, b) => a.localeCompare(b))), [], "alphabetize"),
  T("sortza", "Lines", "Sort lines Z to A", "Reverse alphabetical order.", byLine((l) => [...l].sort((a, b) => b.localeCompare(a)))),
  T("sortlen", "Lines", "Sort lines by length", "Shortest line first.", byLine((l) => [...l].sort((a, b) => a.length - b.length))),
  T("revlines", "Lines", "Reverse line order", "Last line becomes first.", byLine((l) => [...l].reverse())),
  T("shuffle", "Lines", "Shuffle lines", "Put the lines in random order.", byLine((l) => {
    const a = [...l];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }), [], "random", { random: true }),
  T("number", "Lines", "Number lines", "Add 1. 2. 3. in front of each line.", byLine((l) => l.map((x, i) => `${i + 1}. ${x}`))),
  T("join", "Lines", "Join lines", "Combine all lines into one.", (s, p) => s.split("\n").join(unesc(p.sep)), [{ id: "sep", label: "Separator", def: ", " }], "merge comma"),
  T("split", "Lines", "Split into lines", "Break text into one item per line.", (s, p) => s.split(unesc(p.sep)).map((x) => x.trim()).join("\n"), [{ id: "sep", label: "Split at", def: "," }], "comma separate"),

  // Transform
  T("reverse", "Transform", "Reverse text", "Flip the whole text backwards.", (s) => [...s].reverse().join("")),
  T("revwords", "Transform", "Reverse word order", "Last word first, line by line.", pl((l) => l.split(" ").reverse().join(" "))),
  T("replace", "Transform", "Find and replace", "Replace text, with optional regular expressions.", (s, p) => {
    if (!p.find) return s;
    const src = p.regex ? p.find : escapeRe(unesc(p.find));
    return s.replace(new RegExp(src, p.match ? "g" : "gi"), unesc(p.with));
  }, [
    { id: "find", label: "Find", def: "" },
    { id: "with", label: "Replace with", def: "" },
    { id: "regex", label: "Regular expression", def: false, type: "check" },
    { id: "match", label: "Match case", def: false, type: "check" },
  ], "substitute regex"),
  T("affix", "Transform", "Add prefix and suffix", "Wrap every line with text.", (s, p) => s.split("\n").map((l) => unesc(p.pre) + l + unesc(p.post)).join("\n"), [
    { id: "pre", label: "Prefix", def: "- " },
    { id: "post", label: "Suffix", def: "" },
  ], "bullet quote"),
  T("repeat", "Transform", "Repeat text", "Copy the text several times.", (s, p) => Array(Math.min(1000, Math.max(1, +p.n || 1))).fill(s).join(unesc(p.sep)), [
    { id: "n", label: "Times", def: 3, type: "number" },
    { id: "sep", label: "Separator", def: "\\n" },
  ], "duplicate"),
  T("slug", "Transform", "URL slug", "Make text safe for a web address.", pl((l) => noAccents(l).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")), [], "permalink seo"),

  // Encode
  T("b64e", "Encode", "Base64 encode", "Text to Base64.", (s) => btoa(bytes(s).map((b) => String.fromCharCode(b)).join(""))),
  T("b64d", "Encode", "Base64 decode", "Base64 back to text.", (s) => new TextDecoder().decode(Uint8Array.from(atob(s.trim()), (c) => c.charCodeAt(0)))),
  T("urle", "Encode", "URL encode", "Make text safe inside a link.", encodeURIComponent, [], "percent"),
  T("urld", "Encode", "URL decode", "Turn %20 style text back.", (s) => decodeURIComponent(s.trim())),
  T("hte", "Encode", "HTML escape", "Turn < > & into safe entities.", (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")),
  T("htd", "Encode", "HTML unescape", "Turn &lt; &amp; back into characters.", (s) => new DOMParser().parseFromString(s, "text/html").documentElement.textContent),
  T("bine", "Encode", "Text to binary", "Each character as 8 bits.", (s) => bytes(s).map((b) => b.toString(2).padStart(8, "0")).join(" ")),
  T("bind", "Encode", "Binary to text", "Bits back to characters.", (s) => new TextDecoder().decode(Uint8Array.from(s.trim().split(/\s+/).map((b) => parseInt(b, 2))))),
  T("hexe", "Encode", "Text to hex", "Each byte as two hex digits.", (s) => bytes(s).map((b) => b.toString(16).padStart(2, "0")).join(" ")),
  T("hexd", "Encode", "Hex to text", "Hex digits back to characters.", (s) => new TextDecoder().decode(Uint8Array.from(s.trim().split(/\s+/).map((h) => parseInt(h, 16))))),
  T("morsee", "Encode", "Text to Morse code", "Letters and numbers to dots and dashes.", (s) => s.toUpperCase().split(/\s+/).map((w) => [...w].map((c) => MORSE[c] || "").filter(Boolean).join(" ")).join(" / ")),
  T("morsed", "Encode", "Morse code to text", "Dots and dashes back to letters.", (s) => s.trim().split(/\s*\/\s*/).map((w) => w.split(/\s+/).map((c) => FROM_MORSE[c] || "?").join("")).join(" ")),
  T("rot13", "Encode", "ROT13", "Shift each letter by 13. Run it twice to undo.", (s) => s.replace(/[a-z]/gi, (c) => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)), [], "cipher"),
  T("jsonf", "Encode", "JSON format", "Pretty-print JSON with indentation.", (s) => JSON.stringify(JSON.parse(s), null, 2), [], "beautify"),
  T("jsonm", "Encode", "JSON minify", "Remove all spaces from JSON.", (s) => JSON.stringify(JSON.parse(s)), [], "compress"),

  // Extract
  T("emails", "Extract", "Extract emails", "List every email address found.", (s) => (s.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []).join("\n")),
  T("urls", "Extract", "Extract links", "List every http and https link found.", (s) => (s.match(/https?:\/\/[^\s<>"']+/g) || []).join("\n"), [], "urls"),
  T("numbers", "Extract", "Extract numbers", "List every number found.", (s) => (s.match(/-?\d+(?:\.\d+)?/g) || []).join("\n")),

  // Analyze
  T("stats", "Analyze", "Word and character counter", "Words, characters, sentences and reading time.", stats, [], "count length"),
  T("freq", "Analyze", "Character frequency", "How often each character appears.", charFrequency, [], "count letters"),

  // Generate
  T("lorem", "Generate", "Lorem ipsum", "Placeholder text. Needs no input.", (s, p) => {
    const n = Math.min(2000, Math.max(1, +p.n || 1));
    const w = Array.from({ length: n }, (_, i) => LOREM[i % LOREM.length]);
    return cap(w.join(" ")) + ".";
  }, [{ id: "n", label: "Words", def: 50, type: "number" }], "dummy placeholder", { noInput: true }),
];

const CATS = ["All", ...new Set(TOOLS.map((t) => t.cat))];
const STORAGE_KEY = "texttools:v1";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return { tool: TOOLS.some((t) => t.id === raw?.tool) ? raw.tool : "upper", input: String(raw?.input ?? "") };
  } catch {
    return { tool: "upper", input: "" };
  }
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TextTools() {
  const saved = useMemo(loadSaved, []);
  const [toolId, setToolId] = useState(saved.tool);
  const [input, setInput] = useState(saved.input);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [pv, setPv] = useState({});
  const [nonce, setNonce] = useState(0);
  const [copied, setCopied] = useState(false);
  const searchRef = useRef(null);

  const tool = TOOLS.find((t) => t.id === toolId);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tool: toolId, input: input.slice(0, 100000) }));
    } catch {
      /* storage can be unavailable (private mode) */
    }
  }, [toolId, input]);

  // Press "/" anywhere to jump to the search box.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const matches = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    return TOOLS.filter((t) => {
      if (cat !== "All" && t.cat !== cat) return false;
      const hay = `${t.name} ${t.cat} ${t.desc} ${t.keys}`.toLowerCase();
      return tokens.every((k) => hay.includes(k));
    });
  }, [query, cat]);

  const params = Object.fromEntries(tool.params.map((x) => [x.id, pv[x.id] ?? x.def]));

  const result = useMemo(() => {
    if (!input && !tool.noInput) return { ok: true, text: "" };
    try {
      return { ok: true, text: String(tool.run(input, params)) };
    } catch (e) {
      return { ok: false, text: `Can't convert this text: ${e.message}` };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, input, pv, nonce]);

  const pick = (id) => {
    setToolId(id);
    setPv({});
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard can be blocked */
    }
  };

  const words = input.match(/\S+/g)?.length || 0;
  const btn = `flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-gradient-to-br from-page via-surface to-page text-text">
      <header className="sticky top-0 z-50 border-b border-text/5 bg-page/70 backdrop-blur-xl supports-[backdrop-filter]:bg-page/60">
        <Navbar />
      </header>

      <main className="flex-1 px-4 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/20 text-brand">
              <Type size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Text Tools</h1>
              <p className="text-sm text-muted">{TOOLS.length} free tools for changing, cleaning, encoding and counting text. Nothing leaves your browser.</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <label htmlFor="tool-search" className="sr-only">Search text tools</label>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="tool-search"
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches[0]) pick(matches[0].id);
                if (e.key === "Escape") setQuery("");
              }}
              placeholder='Search tools: "uppercase", "remove duplicates", "base64", "count words"   (press / to focus)'
              className="w-full rounded-2xl border border-muted bg-surface py-3.5 pl-11 pr-11 text-base text-text outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-muted hover:text-text ${focusRing}`}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Categories">
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
                className={`cursor-pointer rounded-xl border px-3.5 py-1.5 text-sm font-medium transition ${focusRing} ${
                  cat === c ? "border-brand bg-brand/20 text-text" : "border-muted bg-border text-text hover:bg-surface/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Tool list */}
            <nav aria-label="Tools" className="max-h-72 overflow-auto rounded-3xl bg-surface p-2 shadow-2xl lg:max-h-[720px]">
              {matches.length ? (
                matches.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pick(t.id)}
                    aria-current={t.id === toolId}
                    className={`block w-full cursor-pointer rounded-xl px-3 py-2.5 text-left transition ${focusRing} ${
                      t.id === toolId ? "bg-brand/20 ring-1 ring-brand/60" : "hover:bg-border/70"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-text">{t.name}</span>
                      <span className="shrink-0 text-xs text-muted">{t.cat}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{t.desc}</span>
                  </button>
                ))
              ) : (
                <p className="p-4 text-sm text-muted">No tool matches "{query}". Try a shorter word, like "case" or "line".</p>
              )}
            </nav>

            {/* Workspace */}
            <section className="min-w-0 rounded-3xl bg-surface p-4 shadow-2xl sm:p-5" aria-labelledby="tool-title">
              <h2 id="tool-title" className="text-xl font-bold">{tool.name}</h2>
              <p className="text-sm text-muted">{tool.desc}</p>

              {tool.params.length > 0 && (
                <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface/70 p-3">
                  {tool.params.map((x) =>
                    x.type === "check" ? (
                      <label key={x.id} className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-text">
                        <input type="checkbox" checked={params[x.id]} onChange={(e) => setPv({ ...pv, [x.id]: e.target.checked })} className="h-4 w-4 accent-brand" />
                        {x.label}
                      </label>
                    ) : (
                      <label key={x.id} className="text-xs font-medium text-text">
                        {x.label}
                        <input
                          type={x.type === "number" ? "number" : "text"}
                          value={params[x.id]}
                          onChange={(e) => setPv({ ...pv, [x.id]: e.target.value })}
                          className="mt-1 block w-44 rounded-xl border border-muted bg-border px-3 py-2 font-mono text-sm text-text outline-none focus:border-brand"
                        />
                      </label>
                    ),
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="tt-input" className="text-sm font-medium text-text">Your text</label>
                    <span className="text-xs text-muted">{input.length} characters · {words} words</span>
                  </div>
                  <textarea
                    id="tt-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={tool.noInput ? "Nothing to type here. Choose the settings above." : "Type or paste your text here…"}
                    className="h-72 w-full resize-y rounded-2xl border border-border bg-surface p-4 text-base text-text outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="tt-output" className="text-sm font-medium text-text">Result</label>
                    <span className="text-xs text-muted">{result.text.length} characters</span>
                  </div>
                  <textarea
                    id="tt-output"
                    readOnly
                    value={result.text}
                    aria-live="polite"
                    className={`h-72 w-full resize-y rounded-2xl border bg-surface p-4 text-base outline-none ${
                      result.ok ? "border-border text-text" : "border-danger/50 text-danger"
                    }`}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={copy} disabled={!result.ok || !result.text} className={`${btn} border-brand bg-brand text-text hover:bg-accent`}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy result"}
                </button>
                <button type="button" onClick={() => setInput(result.text)} disabled={!result.ok || !result.text} className={`${btn} border-muted bg-border text-text hover:bg-surface`}>
                  <ArrowUp size={16} /> Use result as input
                </button>
                {tool.random && (
                  <button type="button" onClick={() => setNonce((n) => n + 1)} className={`${btn} border-muted bg-border text-text hover:bg-surface`}>
                    <RotateCcw size={16} /> Shuffle again
                  </button>
                )}
                <button type="button" onClick={() => setInput("")} disabled={!input} className={`${btn} border-muted bg-border text-text hover:bg-surface`}>
                  <Trash2 size={16} /> Clear
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}