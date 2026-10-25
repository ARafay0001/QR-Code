import { memo, useEffect, useRef, useState } from "react";
import {
  Activity,
  Check,
  Gamepad2,
  Gauge,
  Info,
  Keyboard,
  Mouse,
  MousePointerClick,
  RotateCcw,
  Vibrate,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

function Pill({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition ${focusRing} ${
        active
          ? "border-brand bg-brand/20 text-text shadow-[0_0_15px_color-mix(in_srgb,var(--theme-brand)_35%,transparent)]"
          : "border-muted bg-border text-text hover:border-muted hover:bg-surface/70"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function SmallButton({ onClick, children, icon: Icon, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex cursor-pointer items-center gap-2 rounded-lg border border-muted bg-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function Panel({ title, right, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface/70 p-4 ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function Stat({ label, value, sub, accent = "text-text" }) {
  return (
    <div className="rounded-xl border border-border bg-surface/70 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${accent}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

function Hint({ children }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3 py-2 text-sm text-brand">
      <Info size={16} className="mt-0.5 shrink-0 text-brand" />
      <span>{children}</span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Keyboard                                  */
/* -------------------------------------------------------------------------- */

const k = (code, label, w = 1) => ({ code, label, w });
const sp = (w) => ({ spacer: true, w });
const letters = (s) => [...s].map((c) => k(`Key${c.toUpperCase()}`, c.toUpperCase()));
const fn = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => k(`F${a + i}`, `F${a + i}`));

const MAIN_ROWS = [
  [k("Escape", "Esc"), sp(1), ...fn(1, 4), sp(0.5), ...fn(5, 8), sp(0.5), ...fn(9, 12)],
  "gap",
  [
    k("Backquote", "`"),
    ...[..."1234567890"].map((d) => k(`Digit${d}`, d)),
    k("Minus", "-"),
    k("Equal", "="),
    k("Backspace", "⌫", 2),
  ],
  [k("Tab", "Tab", 1.5), ...letters("qwertyuiop"), k("BracketLeft", "["), k("BracketRight", "]"), k("Backslash", "\\", 1.5)],
  [k("CapsLock", "Caps", 1.75), ...letters("asdfghjkl"), k("Semicolon", ";"), k("Quote", "'"), k("Enter", "Enter", 2.25)],
  [
    k("ShiftLeft", "Shift", 2.25),
    ...letters("zxcvbnm"),
    k("Comma", ","),
    k("Period", "."),
    k("Slash", "/"),
    k("ShiftRight", "Shift", 2.75),
  ],
  [
    k("ControlLeft", "Ctrl", 1.25),
    k("MetaLeft", "Win", 1.25),
    k("AltLeft", "Alt", 1.25),
    k("Space", "", 6.25),
    k("AltRight", "Alt", 1.25),
    k("MetaRight", "Win", 1.25),
    k("ContextMenu", "Menu", 1.25),
    k("ControlRight", "Ctrl", 1.25),
  ],
];

const NAV_ROWS = [
  [k("PrintScreen", "PrtSc"), k("ScrollLock", "ScrLk"), k("Pause", "Pause")],
  "gap",
  [k("Insert", "Ins"), k("Home", "Home"), k("PageUp", "PgUp")],
  [k("Delete", "Del"), k("End", "End"), k("PageDown", "PgDn")],
  [sp(3)],
  [sp(1), k("ArrowUp", "↑"), sp(1)],
  [k("ArrowLeft", "←"), k("ArrowDown", "↓"), k("ArrowRight", "→")],
];

// Numpad is a CSS grid so the tall "+" and "Enter" keys can span two rows.
const NUMPAD = [
  ["NumLock", "Num", 1, 1],
  ["NumpadDivide", "/", 2, 1],
  ["NumpadMultiply", "*", 3, 1],
  ["NumpadSubtract", "-", 4, 1],
  ["Numpad7", "7", 1, 2],
  ["Numpad8", "8", 2, 2],
  ["Numpad9", "9", 3, 2],
  ["NumpadAdd", "+", 4, 2, 1, 2],
  ["Numpad4", "4", 1, 3],
  ["Numpad5", "5", 2, 3],
  ["Numpad6", "6", 3, 3],
  ["Numpad1", "1", 1, 4],
  ["Numpad2", "2", 2, 4],
  ["Numpad3", "3", 3, 4],
  ["NumpadEnter", "Ent", 4, 4, 1, 2],
  ["Numpad0", "0", 1, 5, 2, 1],
  ["NumpadDecimal", ".", 3, 5],
];

const LAYOUT_CODES = new Set([
  ...[...MAIN_ROWS, ...NAV_ROWS].flat().filter((c) => c.code).map((c) => c.code),
  ...NUMPAD.map((n) => n[0]),
]);

const LOCATIONS = ["Standard", "Left", "Right", "Numpad"];

const KeyCap = memo(function KeyCap({ label, w, down, tested, grid }) {
  const box = grid ? grid : { width: `calc(var(--u) * ${w})`, height: "var(--u)" };
  return (
    <div style={box} className="shrink-0 p-[2px]">
      <div
        className={`flex h-full w-full select-none items-center justify-center rounded-md border text-[10px] font-semibold transition-colors duration-75 sm:text-xs ${
          down
            ? "border-brand bg-brand text-text shadow-[0_0_14px_color-mix(in_srgb,var(--theme-brand)_80%,transparent)]"
            : tested
              ? "border-success/50 bg-success/20 text-success"
              : "border-border bg-surface text-muted"
        }`}
      >
        {label}
      </div>
    </div>
  );
});

function Cluster({ rows, down, tested }) {
  return (
    <div>
      {rows.map((row, ri) =>
        row === "gap" ? (
          <div key={ri} style={{ height: "calc(var(--u) * 0.5)" }} />
        ) : (
          <div key={ri} className="flex">
            {row.map((c, ci) =>
              c.spacer ? (
                <div key={ci} className="shrink-0" style={{ width: `calc(var(--u) * ${c.w})` }} />
              ) : (
                <KeyCap key={c.code} label={c.label} w={c.w} down={down.has(c.code)} tested={tested.has(c.code)} />
              ),
            )}
          </div>
        ),
      )}
    </div>
  );
}

function KeyboardTester({ active }) {
  const [down, setDown] = useState(() => new Set());
  const [tested, setTested] = useState(() => new Set());
  const [last, setLast] = useState(null);
  const [maxRollover, setMaxRollover] = useState(0);
  const [presses, setPresses] = useState(0);
  const [log, setLog] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    setMaxRollover((m) => Math.max(m, down.size));
  }, [down]);

  useEffect(() => {
    if (!active) return;
    const inField = (t) => t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);

    const onDown = (e) => {
      if (inField(e.target)) return;
      e.preventDefault();
      const code = e.code || `Key${e.keyCode}`;
      setDown((p) => (p.has(code) ? p : new Set(p).add(code)));
      setTested((p) => (p.has(code) ? p : new Set(p).add(code)));
      setLast({
        key: e.key === " " ? "Space" : e.key,
        code,
        keyCode: e.keyCode,
        location: LOCATIONS[e.location] || "Standard",
        repeat: e.repeat,
        mods: [e.shiftKey && "Shift", e.ctrlKey && "Ctrl", e.altKey && "Alt", e.metaKey && "Meta"].filter(Boolean),
      });
      if (!e.repeat) {
        setPresses((n) => n + 1);
        setLog((l) => [{ id: ++idRef.current, key: e.key === " " ? "Space" : e.key, code }, ...l].slice(0, 8));
      }
    };
    const onUp = (e) => {
      if (inField(e.target)) return;
      e.preventDefault();
      const code = e.code || `Key${e.keyCode}`;
      setDown((p) => {
        if (!p.has(code)) return p;
        const n = new Set(p);
        n.delete(code);
        return n;
      });
    };
    const onBlur = () => setDown(new Set());

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [active]);

  const reset = () => {
    setDown(new Set());
    setTested(new Set());
    setLast(null);
    setMaxRollover(0);
    setPresses(0);
    setLog([]);
  };

  const testedInLayout = [...tested].filter((c) => LAYOUT_CODES.has(c)).length;
  const extras = [...tested].filter((c) => !LAYOUT_CODES.has(c));

  return (
    <div className="space-y-4">
      <Hint>
        Press any key. It lights up <b className="text-text">blue</b> while held and turns{" "}
        <b className="text-success">green</b> once it works. Hold many keys at once to check ghosting. System
        shortcuts such as Ctrl+W, Alt+F4 or the Windows key can't always be captured by a browser.
      </Hint>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Keys tested" value={`${testedInLayout}/${LAYOUT_CODES.size}`} accent="text-success" />
        <Stat label="Held now" value={down.size} accent="text-brand" />
        <Stat label="Max at once" value={maxRollover} sub="rollover" accent="text-brand" />
        <Stat label="Total presses" value={presses} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-4">
        <div className="flex w-max" style={{ "--u": "2.6rem", gap: "calc(var(--u) * 0.5)" }}>
          <Cluster rows={MAIN_ROWS} down={down} tested={tested} />
          <Cluster rows={NAV_ROWS} down={down} tested={tested} />
          <div
            className="grid"
            style={{
              marginTop: "calc(var(--u) * 1.5)",
              gridTemplateColumns: "repeat(4, var(--u))",
              gridAutoRows: "var(--u)",
            }}
          >
            {NUMPAD.map(([code, label, c, r, cs = 1, rs = 1]) => (
              <KeyCap
                key={code}
                label={label}
                down={down.has(code)}
                tested={tested.has(code)}
                grid={{ gridColumn: `${c} / span ${cs}`, gridRow: `${r} / span ${rs}` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Last key"
          right={<SmallButton icon={RotateCcw} onClick={reset}>Reset</SmallButton>}
        >
          {last ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              {[
                ["key", last.key],
                ["code", last.code],
                ["keyCode", last.keyCode],
                ["location", last.location],
                ["modifiers", last.mods.join(" + ") || "none"],
                ["repeat", last.repeat ? "yes" : "no"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-wide text-muted">{label}</dt>
                  <dd className="truncate font-mono font-semibold text-text">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted">Press a key to see its details.</p>
          )}
          {extras.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">Extra keys detected (media, macro, etc.)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {extras.map((c) => (
                  <span key={c} className="rounded-lg border border-success/30 bg-success/10 px-2 py-1 font-mono text-xs text-success">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Recent presses">
          {log.length ? (
            <ul className="space-y-1.5">
              {log.map((l) => (
                <li key={l.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 text-sm">
                  <span className="font-mono font-bold text-text">{l.key}</span>
                  <span className="font-mono text-xs text-muted">{l.code}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nothing yet.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Mouse                                   */
/* -------------------------------------------------------------------------- */

const BUTTON_NAMES = ["Left", "Middle", "Right", "Back", "Forward", "Button 6", "Button 7", "Button 8"];

function MouseDiagram({ held, counts, flash }) {
  const f = (i) => (held.has(i) ? "#38bdf8" : counts[i] > 0 ? "#22c55e55" : "#1e293b");
  return (
    <svg viewBox="0 0 200 290" className="mx-auto h-64 w-auto" role="img" aria-label="Mouse diagram">
      <path
        d="M100 8 C55 8 28 40 28 95 L28 190 C28 245 58 272 100 272 C142 272 172 245 172 190 L172 95 C172 40 145 8 100 8 Z"
        fill="#0f172a"
        stroke="#475569"
        strokeWidth="3"
      />
      <path d="M97 10 C57 12 32 42 30 98 L97 98 Z" fill={f(0)} stroke="#475569" strokeWidth="2" />
      <path d="M103 10 C143 12 168 42 170 98 L103 98 Z" fill={f(2)} stroke="#475569" strokeWidth="2" />
      <rect x="90" y="32" width="20" height="40" rx="10" fill={f(1)} stroke="#475569" strokeWidth="2" />
      <text x="100" y="26" textAnchor="middle" fontSize="13" fill={flash === "up" ? "#38bdf8" : "#475569"}>▲</text>
      <text x="100" y="88" textAnchor="middle" fontSize="13" fill={flash === "down" ? "#38bdf8" : "#475569"}>▼</text>
      <rect x="16" y="118" width="14" height="26" rx="5" fill={f(3)} stroke="#475569" strokeWidth="2" />
      <rect x="16" y="150" width="14" height="26" rx="5" fill={f(4)} stroke="#475569" strokeWidth="2" />
      <text x="100" y="180" textAnchor="middle" fontSize="11" fill="#64748b">side buttons on the left</text>
    </svg>
  );
}

function MouseTester({ active }) {
  const padRef = useRef(null);
  const S = useRef({
    x: 0, y: 0, px: 0, py: 0, lastT: 0, lastWall: 0, speed: 0, maxSpeed: 0,
    deltas: [], maxHz: 0, trail: [], inside: false, type: "–", clicks: [], maxCps: 0,
  });
  const flashTimer = useRef();
  const [counts, setCounts] = useState(() => Array(8).fill(0));
  const [held, setHeld] = useState(() => new Set());
  const [wheel, setWheel] = useState({ up: 0, down: 0, left: 0, right: 0, flash: null, dy: 0 });
  const [dbl, setDbl] = useState(0);
  const [live, setLive] = useState({ x: 0, y: 0, speed: 0, maxSpeed: 0, hz: 0, maxHz: 0, cps: 0, maxCps: 0, trail: [], inside: false, type: "–" });

  useEffect(() => {
    const pad = padRef.current;
    if (!pad || !active) return;
    const s = S.current;
    const moveEvent = "onpointerrawupdate" in window ? "pointerrawupdate" : "pointermove";

    const move = (e) => {
      const rect = pad.getBoundingClientRect();
      const coalesced = moveEvent === "pointermove" ? e.getCoalescedEvents?.() : null;
      const list = coalesced && coalesced.length ? coalesced : [e];
      for (const ev of list) {
        const dt = ev.timeStamp - s.lastT;
        if (s.lastT && dt > 0.2 && dt < 200) {
          s.deltas.push(dt);
          if (s.deltas.length > 80) s.deltas.shift();
          const inst = (Math.hypot(ev.clientX - s.px, ev.clientY - s.py) / dt) * 1000;
          s.speed = s.speed * 0.85 + inst * 0.15;
          s.maxSpeed = Math.max(s.maxSpeed, s.speed);
        }
        s.lastT = ev.timeStamp;
        s.px = ev.clientX;
        s.py = ev.clientY;
      }
      s.x = e.clientX - rect.left;
      s.y = e.clientY - rect.top;
      s.inside = true;
      s.type = e.pointerType || "mouse";
      s.lastWall = performance.now();
      s.trail.push([s.x, s.y]);
      if (s.trail.length > 40) s.trail.shift();
    };
    const leave = () => {
      s.inside = false;
      s.lastT = 0;
      s.speed = 0;
    };
    const downFn = (e) => {
      e.preventDefault();
      try {
        pad.setPointerCapture(e.pointerId);
      } catch {
        /* capture is optional */
      }
      const b = e.button;
      setCounts((c) => {
        const n = [...c];
        while (n.length <= b) n.push(0);
        n[b]++;
        return n;
      });
      setHeld((h) => new Set(h).add(b));
      s.clicks.push(performance.now());
    };
    const upFn = (e) => {
      e.preventDefault();
      setHeld((h) => {
        const n = new Set(h);
        n.delete(e.button);
        return n;
      });
    };
    const cancel = () => setHeld(new Set());
    const wheelFn = (e) => {
      e.preventDefault();
      setWheel((w) => {
        const n = { ...w, dy: Math.round(e.deltaY) };
        if (e.deltaY < 0) { n.up++; n.flash = "up"; }
        else if (e.deltaY > 0) { n.down++; n.flash = "down"; }
        if (e.deltaX < 0) n.left++;
        else if (e.deltaX > 0) n.right++;
        return n;
      });
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setWheel((w) => ({ ...w, flash: null })), 180);
    };
    const block = (e) => e.preventDefault();
    const dblFn = () => setDbl((n) => n + 1);

    const handlers = [
      [moveEvent, move], ["pointerleave", leave], ["pointerdown", downFn], ["pointerup", upFn],
      ["pointercancel", cancel], ["wheel", wheelFn, { passive: false }], ["contextmenu", block],
      ["auxclick", block], ["mousedown", block], ["mouseup", block], ["dblclick", dblFn],
    ];
    handlers.forEach(([n, h, o]) => pad.addEventListener(n, h, o));
    window.addEventListener("blur", cancel);
    return () => {
      handlers.forEach(([n, h, o]) => pad.removeEventListener(n, h, o));
      window.removeEventListener("blur", cancel);
      clearTimeout(flashTimer.current);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const s = S.current;
      const now = performance.now();
      if (now - s.lastWall > 150) s.speed = 0;
      s.clicks = s.clicks.filter((t) => now - t < 1000);
      s.maxCps = Math.max(s.maxCps, s.clicks.length);
      let hz = 0;
      if (s.deltas.length >= 5) {
        const sorted = [...s.deltas].sort((a, b) => a - b);
        const med = sorted[Math.floor(sorted.length / 2)];
        hz = Math.min(8000, Math.round(1000 / med));
      }
      s.maxHz = Math.max(s.maxHz, hz);
      setLive({
        x: Math.round(s.x), y: Math.round(s.y), speed: Math.round(s.speed), maxSpeed: Math.round(s.maxSpeed),
        hz, maxHz: s.maxHz, cps: s.clicks.length, maxCps: s.maxCps, trail: [...s.trail], inside: s.inside, type: s.type,
      });
    }, 100);
    return () => clearInterval(id);
  }, [active]);

  const reset = () => {
    const s = S.current;
    s.maxSpeed = 0; s.maxHz = 0; s.maxCps = 0; s.clicks = []; s.deltas = []; s.trail = [];
    setCounts(Array(8).fill(0));
    setHeld(new Set());
    setWheel({ up: 0, down: 0, left: 0, right: 0, flash: null, dy: 0 });
    setDbl(0);
  };

  const testedCount = counts.filter((c) => c > 0).length;
  const last = live.trail[live.trail.length - 1];

  return (
    <div className="space-y-4">
      <Hint>
        Move, click and scroll inside the test pad. Browsers only report buttons 1 to 5 (left, middle, right, back,
        forward). Extra buttons on gaming mice usually act as <b className="text-text">keyboard keys</b> through the
        mouse software, so test them in the Keyboard tab. Polling rate is an estimate and works best in Chrome or Edge.
      </Hint>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel title="Mouse" right={<SmallButton icon={RotateCcw} onClick={reset}>Reset</SmallButton>}>
            <MouseDiagram held={held} counts={counts} flash={wheel.flash} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {counts.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 ${
                    held.has(i)
                      ? "border-brand bg-brand/30"
                      : c > 0
                        ? "border-success/40 bg-success/10"
                        : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-text">
                    <span>{BUTTON_NAMES[i] || `Button ${i + 1}`}</span>
                    {c > 0 && <Check size={12} className="text-success" />}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-text">{c}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{testedCount} buttons tested</p>
          </Panel>
        </div>

        <div className="space-y-4">
          <div
            ref={padRef}
            className="relative h-72 cursor-crosshair select-none overflow-hidden rounded-2xl border-2 border-dashed border-muted bg-surface sm:h-80"
            style={{ touchAction: "none" }}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              {live.trail.length > 1 && (
                <polyline
                  points={live.trail.map(([x, y]) => `${x},${y}`).join(" ")}
                  fill="none"
                  stroke="#38bdf8"
                  strokeOpacity="0.5"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {live.inside && last && <circle cx={last[0]} cy={last[1]} r="7" fill="#38bdf8" />}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <MousePointerClick size={32} className="text-muted" />
              <p className="mt-2 text-sm font-medium text-muted">Test pad: move, click, double-click and scroll here</p>
            </div>
            <div className="pointer-events-none absolute bottom-2 right-3 font-mono text-xs text-muted">
              {live.inside ? `x ${live.x}  y ${live.y}` : "pointer outside"} · {live.type}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Polling rate" value={live.hz ? `${live.hz} Hz` : "–"} sub={`max ${live.maxHz || 0} Hz`} accent="text-brand" />
            <Stat label="Speed" value={`${live.speed}`} sub={`px/s · max ${live.maxSpeed}`} accent="text-brand" />
            <Stat label="Clicks / sec" value={live.cps} sub={`max ${live.maxCps}`} accent="text-success" />
            <Stat label="Double clicks" value={dbl} />
          </div>

          <Panel title="Scroll wheel">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Up" value={wheel.up} />
              <Stat label="Down" value={wheel.down} />
              <Stat label="Tilt left" value={wheel.left} />
              <Stat label="Tilt right" value={wheel.right} />
              <Stat label="Last delta" value={wheel.dy} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Gamepad / joystick / wheel                         */
/* -------------------------------------------------------------------------- */

const STD_LABELS = {
  0: "A", 1: "B", 2: "X", 3: "Y", 4: "LB", 5: "RB", 6: "LT", 7: "RT", 8: "Back", 9: "Start",
  10: "L3", 11: "R3", 12: "↑", 13: "↓", 14: "←", 15: "→", 16: "Home",
};

const MODES = [
  { id: "gamepad", label: "Gamepad" },
  { id: "joystick", label: "Joystick" },
  { id: "wheel", label: "Steering wheel" },
  { id: "raw", label: "Raw" },
];

const DEFAULT_CFG = {
  steer: { axis: 0, rest: 0 },
  range: 900,
  throttle: null,
  brake: null,
  clutch: null,
  jx: { axis: 0, rest: 0 },
  jy: { axis: 1, rest: 0 },
  jtwist: null,
  jthrottle: null,
};

const guessMode = (pad) => {
  if (pad.mapping === "standard") return "gamepad";
  if (/wheel|racing|driving|g25|g27|g29|g920|g923|t150|t300|t248|momo|dfgt|fanatec|simucube/i.test(pad.id)) return "wheel";
  if (/joystick|flight|hotas|extreme|stick|saitek|t\.?16000|warthog/i.test(pad.id)) return "joystick";
  return "raw";
};

const cleanName = (id) => id.split("(")[0].trim() || id;

const pedalPct = (v, rest) => {
  const far = Math.max(Math.abs(1 - rest), Math.abs(-1 - rest));
  return clamp(Math.abs(v - rest) / far, 0, 1);
};

function StickPad({ x, y, dz, label, size = 150 }) {
  const [trail, setTrail] = useState([]);
  useEffect(() => {
    setTrail((t) => (x === 0 && y === 0 && t.length === 0 ? t : [...t.slice(-80), [x, y]]));
  }, [x, y]);

  const c = size / 2;
  const r = c - 8;
  const mag = Math.hypot(x, y);
  const outside = mag > dz;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} role="img" aria-label={`${label} position`}>
        <circle cx={c} cy={c} r={r} fill="#0f172a" stroke="#475569" strokeWidth="2" />
        <line x1={c - r} x2={c + r} y1={c} y2={c} stroke="#1e293b" />
        <line y1={c - r} y2={c + r} x1={c} x2={c} stroke="#1e293b" />
        <circle cx={c} cy={c} r={r * dz} fill="none" stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity="0.7" />
        {trail.length > 1 && (
          <polyline
            points={trail.map(([a, b]) => `${c + a * r},${c + b * r}`).join(" ")}
            fill="none"
            stroke="#38bdf8"
            strokeOpacity="0.5"
            strokeWidth="2"
          />
        )}
        <circle cx={c + x * r} cy={c + y * r} r="8" fill={outside ? "#38bdf8" : "#64748b"} />
      </svg>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-text">{label}</p>
        <p className="font-mono text-xs text-muted">
          {x.toFixed(3)}, {y.toFixed(3)}
        </p>
        {!outside && mag > 0.001 && <p className="text-[10px] text-warning">inside deadzone</p>}
      </div>
      <button
        type="button"
        onClick={() => setTrail([])}
        className="cursor-pointer text-[11px] text-muted hover:text-text"
      >
        clear trail
      </button>
    </div>
  );
}

function AxisBar({ index, value, min, max, label }) {
  const pct = Math.abs(value) * 50;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-16 shrink-0 text-text">{label || `Axis ${index}`}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface">
        <div className="absolute inset-y-0 left-1/2 w-px bg-surface" />
        <div
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-brand to-accent"
          style={value >= 0 ? { left: "50%", width: `${pct}%` } : { right: "50%", width: `${pct}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right font-mono text-text">{value.toFixed(2)}</span>
      <span className="hidden w-28 shrink-0 text-right font-mono text-muted sm:block">
        {min?.toFixed(2)} … {max?.toFixed(2)}
      </span>
    </div>
  );
}

function ButtonGrid({ buttons, tested, labelFor }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {buttons.map((b, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-lg border px-2 py-2 text-center ${
            b.p
              ? "border-brand bg-brand/30 text-text"
              : tested.includes(i)
                ? "border-success/40 bg-success/10 text-success"
                : "border-border bg-surface text-muted"
          }`}
        >
          <div className="absolute inset-x-0 bottom-0 bg-brand/30" style={{ height: `${b.v * 100}%` }} />
          <div className="relative text-sm font-bold">{labelFor?.(i) ?? i}</div>
          <div className="relative text-[10px] opacity-70">#{i}</div>
        </div>
      ))}
    </div>
  );
}

function AxisPicker({ label, value, count, onSelect, onDetect, learning, onCancel }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="w-20 shrink-0 text-text">{label}</span>
      <select
        value={value ? value.axis : ""}
        onChange={(e) => onSelect(e.target.value === "" ? null : Number(e.target.value))}
        aria-label={`${label} axis`}
        className="rounded-lg border border-muted bg-border px-2 py-1 text-xs text-text outline-none focus:border-brand"
      >
        <option value="">Not set</option>
        {Array.from({ length: count }, (_, i) => (
          <option key={i} value={i}>
            Axis {i}
          </option>
        ))}
      </select>
      {learning ? (
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-lg bg-warning/20 px-2 py-1 text-xs text-warning">
          Move it now… (cancel)
        </button>
      ) : (
        <SmallButton onClick={onDetect}>Detect</SmallButton>
      )}
    </div>
  );
}

function ControllerSVG({ pad, dz }) {
  const B = (i) => pad.buttons[i] || { p: false, v: 0 };
  const ax = (i) => pad.axes[i] || 0;
  const on = (i, base = "#1e293b") => (B(i).p ? "#38bdf8" : base);
  const face = [
    [0, 380, 152, "A", "#22c55e"],
    [1, 412, 120, "B", "#ef4444"],
    [2, 348, 120, "X", "#3b82f6"],
    [3, 380, 88, "Y", "#eab308"],
  ];
  const stroke = "#475569";

  return (
    <svg viewBox="0 0 520 300" className="mx-auto w-full max-w-xl" role="img" aria-label="Gamepad diagram">
      <path
        d="M120 72 C70 66 36 110 26 190 C18 250 40 285 74 268 C104 252 120 222 156 222 L364 222 C400 222 416 252 446 268 C480 285 502 250 494 190 C484 110 450 66 400 72 Z"
        fill="#0f172a"
        stroke={stroke}
        strokeWidth="3"
      />
      {[[6, 90], [7, 374]].map(([i, x]) => (
        <g key={i}>
          <rect x={x} y="6" width="56" height="30" rx="8" fill="#1e293b" stroke={stroke} />
          <rect x={x} y={6 + 30 * (1 - B(i).v)} width="56" height={30 * B(i).v} rx="8" fill="#38bdf8" />
          <text x={x + 28} y="26" textAnchor="middle" fontSize="11" fill="#e2e8f0">{STD_LABELS[i]}</text>
        </g>
      ))}
      {[[4, 80], [5, 360]].map(([i, x]) => (
        <g key={i}>
          <rect x={x} y="44" width="84" height="16" rx="8" fill={on(i)} stroke={stroke} />
          <text x={x + 42} y="56" textAnchor="middle" fontSize="10" fill="#e2e8f0">{STD_LABELS[i]}</text>
        </g>
      ))}

      {/* left stick */}
      <circle cx="150" cy="125" r="36" fill="#1e293b" stroke={stroke} />
      <circle cx="150" cy="125" r={36 * dz} fill="none" stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity="0.6" />
      <circle cx={150 + ax(0) * 20} cy={125 + ax(1) * 20} r="18" fill={on(10, "#64748b")} stroke="#cbd5e1" />
      {/* right stick */}
      <circle cx="330" cy="200" r="36" fill="#1e293b" stroke={stroke} />
      <circle cx="330" cy="200" r={36 * dz} fill="none" stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity="0.6" />
      <circle cx={330 + ax(2) * 20} cy={200 + ax(3) * 20} r="18" fill={on(11, "#64748b")} stroke="#cbd5e1" />

      {/* d-pad */}
      <rect x="200" y="172" width="20" height="24" rx="3" fill={on(12)} stroke={stroke} />
      <rect x="200" y="204" width="20" height="24" rx="3" fill={on(13)} stroke={stroke} />
      <rect x="178" y="190" width="24" height="20" rx="3" fill={on(14)} stroke={stroke} />
      <rect x="218" y="190" width="24" height="20" rx="3" fill={on(15)} stroke={stroke} />

      {/* face buttons */}
      {face.map(([i, x, y, t, color]) => (
        <g key={i}>
          <circle cx={x} cy={y} r="16" fill={B(i).p ? color : "#1e293b"} stroke={color} strokeWidth="2" />
          <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill={B(i).p ? "#0f172a" : color}>{t}</text>
        </g>
      ))}

      {/* centre */}
      <circle cx="232" cy="125" r="9" fill={on(8)} stroke={stroke} />
      <circle cx="288" cy="125" r="9" fill={on(9)} stroke={stroke} />
      <circle cx="260" cy="95" r="13" fill={on(16)} stroke={stroke} />
    </svg>
  );
}

function WheelSVG({ deg }) {
  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-48 w-48" role="img" aria-label="Steering wheel">
      <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: "100px 100px", transition: "transform 60ms linear" }}>
        <circle cx="100" cy="100" r="82" fill="none" stroke="#334155" strokeWidth="16" />
        <path d="M100 100 L26 112 M100 100 L174 112 M100 100 L100 178" stroke="#475569" strokeWidth="12" strokeLinecap="round" />
        <circle cx="100" cy="100" r="22" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
        <rect x="93" y="10" width="14" height="22" rx="4" fill="#38bdf8" />
      </g>
    </svg>
  );
}

function PedalBar({ label, pct, color }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-36 w-10 overflow-hidden rounded-lg border border-border bg-surface">
        <div className="absolute inset-x-0 bottom-0 transition-[height] duration-75" style={{ height: `${pct * 100}%`, background: color }} />
      </div>
      <span className="text-xs text-text">{label}</span>
      <span className="font-mono text-xs text-muted">{Math.round(pct * 100)}%</span>
    </div>
  );
}

function GamepadTester({ active }) {
  const [pads, setPads] = useState([]);
  const [sel, setSel] = useState(0);
  const [modes, setModes] = useState({});
  const [cfgs, setCfgs] = useState({});
  const [dz, setDz] = useState(0.1);
  const [learn, setLearn] = useState(null);
  const [notice, setNotice] = useState("");
  const resetRef = useRef(false);
  const statsRef = useRef({});
  const supported = typeof navigator !== "undefined" && "getGamepads" in navigator;

  // Poll the Gamepad API every frame, and only re-render when something changed.
  useEffect(() => {
    if (!active || !supported) return;
    let raf;
    let prev = "";
    const poll = () => {
      if (resetRef.current) {
        statsRef.current = {};
        resetRef.current = false;
        prev = "";
      }
      const list = [...navigator.getGamepads()].filter(Boolean);
      const snap = list.map((p) => {
        const axes = [...p.axes].map((a) => Math.round(a * 1000) / 1000);
        const buttons = p.buttons.map((b) => ({ p: b.pressed, v: Math.round(b.value * 100) / 100 }));
        const st = (statsRef.current[p.index] ||= { tested: new Set(), min: [], max: [] });
        buttons.forEach((b, i) => b.p && st.tested.add(i));
        axes.forEach((a, i) => {
          st.min[i] = Math.min(st.min[i] ?? a, a);
          st.max[i] = Math.max(st.max[i] ?? a, a);
        });
        return {
          index: p.index, id: p.id, mapping: p.mapping, axes, buttons,
          haptics: !!p.vibrationActuator,
          tested: [...st.tested], min: [...st.min], max: [...st.max],
        };
      });
      const key = JSON.stringify(snap);
      if (key !== prev) {
        prev = key;
        setPads(snap);
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [active, supported]);

  useEffect(() => {
    if (!active || !supported) return;
    const on = (e) => setNotice(`Connected: ${cleanName(e.gamepad.id)}`);
    const off = (e) => setNotice(`Disconnected: ${cleanName(e.gamepad.id)}`);
    window.addEventListener("gamepadconnected", on);
    window.addEventListener("gamepaddisconnected", off);
    return () => {
      window.removeEventListener("gamepadconnected", on);
      window.removeEventListener("gamepaddisconnected", off);
    };
  }, [active, supported]);

  const pad = pads.find((p) => p.index === sel) || pads[0];
  const mode = pad ? modes[pad.id] || guessMode(pad) : "raw";
  const cfg = pad ? { ...DEFAULT_CFG, ...cfgs[pad.id] } : DEFAULT_CFG;

  const patchCfg = (patch) => {
    if (!pad) return;
    setCfgs((p) => ({ ...p, [pad.id]: { ...DEFAULT_CFG, ...p[pad.id], ...patch } }));
  };
  const selectAxis = (key, idx) => patchCfg({ [key]: idx === null ? null : { axis: idx, rest: pad.axes[idx] ?? 0 } });
  const startLearn = (key) => pad && setLearn({ key, base: [...pad.axes] });

  // "Detect" mode: the first axis that moves a lot becomes the assignment.
  useEffect(() => {
    if (!learn || !pad) return;
    let best = -1;
    let bestDelta = 0.5;
    pad.axes.forEach((v, i) => {
      const d = Math.abs(v - (learn.base[i] ?? 0));
      if (d > bestDelta) {
        bestDelta = d;
        best = i;
      }
    });
    if (best >= 0) {
      patchCfg({ [learn.key]: { axis: best, rest: learn.base[best] ?? 0 } });
      setLearn(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pad, learn]);

  const rumble = () => {
    const gp = [...navigator.getGamepads()].find((g) => g && g.index === pad.index);
    gp?.vibrationActuator?.playEffect?.("dual-rumble", {
      startDelay: 0, duration: 600, weakMagnitude: 1, strongMagnitude: 1,
    });
  };

  const val = (a) => (a && pad ? pad.axes[a.axis] ?? 0 : 0);
  const picker = (label, key) => (
    <AxisPicker
      label={label}
      value={cfg[key]}
      count={pad.axes.length}
      onSelect={(i) => selectAxis(key, i)}
      onDetect={() => startLearn(key)}
      learning={learn?.key === key}
      onCancel={() => setLearn(null)}
    />
  );

  if (!supported) {
    return <Hint>Your browser doesn't support the Gamepad API. Try a recent Chrome, Edge or Firefox.</Hint>;
  }

  if (!pad) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Gamepad2 size={40} className="mx-auto text-muted" />
          <p className="mt-4 font-semibold text-text">No controller detected yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Plug in or connect your gamepad, joystick or racing wheel, then <b className="text-text">press any button</b>.
            Browsers hide controllers until you press something.
          </p>
          {notice && <p className="mt-3 text-sm text-brand">{notice}</p>}
        </div>
        <Hint>Works with Xbox, PlayStation and Switch controllers, flight sticks, and wheels such as Logitech and Thrustmaster. Gamepad support needs HTTPS or localhost.</Hint>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && <p className="text-sm text-brand">{notice}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {pads.map((p) => (
          <Pill key={p.index} active={p.index === pad.index} onClick={() => setSel(p.index)}>
            #{p.index} {cleanName(p.id).slice(0, 28)}
          </Pill>
        ))}
      </div>

      <Panel
        title="Device"
        right={
          <div className="flex gap-2">
            {pad.haptics && <SmallButton icon={Vibrate} onClick={rumble}>Test vibration</SmallButton>}
            <SmallButton
              icon={RotateCcw}
              onClick={() => {
                resetRef.current = true;
              }}
            >
              Reset stats
            </SmallButton>
          </div>
        }
      >
        <p className="font-semibold text-text">{cleanName(pad.id)}</p>
        <p className="mt-1 break-all font-mono text-[11px] text-muted">{pad.id}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Mapping" value={pad.mapping || "custom"} />
          <Stat label="Buttons" value={pad.buttons.length} sub={`${pad.tested.length} tested`} accent="text-success" />
          <Stat label="Axes" value={pad.axes.length} />
          <Stat label="Vibration" value={pad.haptics ? "yes" : "no"} />
        </div>
      </Panel>

      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="View mode">
        {MODES.map((m) => (
          <Pill key={m.id} active={mode === m.id} onClick={() => setModes((p) => ({ ...p, [pad.id]: m.id }))}>
            {m.label}
          </Pill>
        ))}
      </div>

      {mode === "gamepad" && (
        <Panel title="Gamepad">
          {pad.mapping !== "standard" && (
            <p className="mb-3 text-sm text-warning">
              This device doesn't report a standard layout, so buttons may not match the picture. Try Joystick, Steering wheel or Raw.
            </p>
          )}
          <ControllerSVG pad={pad} dz={dz} />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["Left X", "Left Y", "Right X", "Right Y"].map((l, i) => (
              <Stat key={l} label={l} value={(pad.axes[i] ?? 0).toFixed(2)} accent="text-brand" />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-8">
            <StickPad label="Left stick" x={pad.axes[0] ?? 0} y={pad.axes[1] ?? 0} dz={dz} />
            <StickPad label="Right stick" x={pad.axes[2] ?? 0} y={pad.axes[3] ?? 0} dz={dz} />
          </div>
        </Panel>
      )}

      {mode === "joystick" && (
        <Panel title="Joystick">
          <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
            <div className="flex justify-center">
              <StickPad label="Stick" size={200} x={val(cfg.jx)} y={val(cfg.jy)} dz={dz} />
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted">Pick which axes are your stick, twist and throttle, or press Detect and move the control.</p>
              {picker("Stick X", "jx")}
              {picker("Stick Y", "jy")}
              {picker("Twist", "jtwist")}
              {picker("Throttle", "jthrottle")}
              {cfg.jtwist && <AxisBar index={cfg.jtwist.axis} label="Twist" value={val(cfg.jtwist)} />}
              {cfg.jthrottle && <AxisBar index={cfg.jthrottle.axis} label="Throttle" value={val(cfg.jthrottle)} />}
            </div>
          </div>
        </Panel>
      )}

      {mode === "wheel" && (
        <Panel title="Steering wheel">
          <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
            <div>
              <WheelSVG deg={(val(cfg.steer) * cfg.range) / 2} />
              <p className="text-center font-mono text-sm text-text">
                {Math.round((val(cfg.steer) * cfg.range) / 2)}° · {Math.round(val(cfg.steer) * 100)}%
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-6">
                <PedalBar label="Throttle" color="#22c55e" pct={cfg.throttle ? pedalPct(val(cfg.throttle), cfg.throttle.rest) : 0} />
                <PedalBar label="Brake" color="#ef4444" pct={cfg.brake ? pedalPct(val(cfg.brake), cfg.brake.rest) : 0} />
                <PedalBar label="Clutch" color="#3b82f6" pct={cfg.clutch ? pedalPct(val(cfg.clutch), cfg.clutch.rest) : 0} />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Wheels report pedals as axes, and the order differs between brands. Press <b className="text-text">Detect</b>, then
                press that pedal (or turn the wheel) to assign it.
              </p>
              {picker("Steering", "steer")}
              {picker("Throttle", "throttle")}
              {picker("Brake", "brake")}
              {picker("Clutch", "clutch")}
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-sm text-text">Rotation</span>
                {[180, 270, 540, 900, 1080].map((r) => (
                  <Pill key={r} active={cfg.range === r} onClick={() => patchCfg({ range: r })} className="!px-3 !py-1 text-xs">
                    {r}°
                  </Pill>
                ))}
              </div>
              <p className="text-xs text-muted">Set Rotation to your wheel's lock-to-lock angle (set in its driver) so the degrees shown are accurate.</p>
            </div>
          </div>
        </Panel>
      )}

      {(mode === "gamepad" || mode === "joystick") && (
        <Panel title="Deadzone">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.01"
              value={dz}
              onChange={(e) => setDz(Number(e.target.value))}
              aria-label="Deadzone"
              className="h-2 flex-1 cursor-pointer accent-brand"
            />
            <span className="w-12 text-right font-mono text-sm text-text">{Math.round(dz * 100)}%</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            The dashed circle is the deadzone. If your stick reads values inside it while untouched, that's drift.
          </p>
        </Panel>
      )}

      <Panel
        title="All axes"
        right={<span className="hidden text-[10px] text-muted sm:block">live · seen min … max</span>}
      >
        {pad.axes.length ? (
          <div className="space-y-2">
            {pad.axes.map((v, i) => (
              <AxisBar key={i} index={i} value={v} min={pad.min[i]} max={pad.max[i]} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">This device has no axes.</p>
        )}
      </Panel>

      <Panel title="All buttons">
        <ButtonGrid
          buttons={pad.buttons}
          tested={pad.tested}
          labelFor={pad.mapping === "standard" ? (i) => STD_LABELS[i] : undefined}
        />
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

const TABS = [
  { id: "keyboard", label: "Keyboard", icon: Keyboard },
  { id: "mouse", label: "Mouse", icon: Mouse },
  { id: "gamepad", label: "Controllers", icon: Gamepad2 },
];

const FEATURES = [
  ["Keyboard", "Every key, rollover and ghosting"],
  ["Mouse", "Buttons, wheel, polling rate, CPS"],
  ["Gamepad", "Buttons, sticks, triggers, vibration"],
  ["Joystick & wheel", "Axes, pedals, rotation angle"],
];

export default function InputTester() {
  const [tab, setTab] = useState("keyboard");

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-gradient-to-br from-page via-surface to-page text-text">
      <header className="sticky top-0 z-50 border-b border-text/5 bg-page/70 backdrop-blur-xl supports-[backdrop-filter]:bg-page/60">
        <Navbar />
      </header>

      <main className="flex-1 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <header className="text-center">
            {/* <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-sm text-brand">
              <Activity size={16} />
              Free Input Tester
            </div> */}
            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
              Test Every{" "}
              <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">Input</span>
              , Instantly
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Check your keyboard, mouse, gamepad, joystick and steering wheel right in the browser. No install and no
              signup. Nothing leaves your device.
            </p>
          </header>

          <ul className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([title, text]) => (
              <li key={title} className="rounded-2xl border border-border bg-surface/70 p-4">
                <p className="flex items-center gap-2 font-semibold text-text">
                  <Gauge size={14} className="text-brand" />
                  {title}
                </p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-3xl bg-surface p-4 shadow-2xl sm:p-8">
            <div
              role="tablist"
              aria-label="Input tester sections"
              className="mx-auto mb-8 grid max-w-md grid-cols-3 gap-1 rounded-2xl border border-border bg-surface p-1"
            >
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${focusRing} ${
                    tab === id ? "bg-brand text-text shadow-lg" : "text-muted hover:text-text"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* All three stay mounted so results survive tab switches; only the active one listens for input. */}
            <div role="tabpanel" hidden={tab !== "keyboard"}>
              <KeyboardTester active={tab === "keyboard"} />
            </div>
            <div role="tabpanel" hidden={tab !== "mouse"}>
              <MouseTester active={tab === "mouse"} />
            </div>
            <div role="tabpanel" hidden={tab !== "gamepad"}>
              <GamepadTester active={tab === "gamepad"} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}