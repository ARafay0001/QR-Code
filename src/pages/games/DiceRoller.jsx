import { useEffect, useRef, useState } from "react";
import { Dices, Minus, Plus, Trash2, Volume2, VolumeX } from "lucide-react";
import Footer from "../../components/common/Footer";
import ToolArticle from "../../components/common/ToolArticle";
import ToolFAQ from "../../components/common/ToolFAQ";
import { DiceRollerArticle as Article, DiceRollerFAQ as FAQ } from "../../data/seoContent.js";



 
const MODES = [
  { value: "d6", label: "Classic d6" },
  { value: "d20", label: "D20", sides: 20 },
  { value: "coin", label: "Coin flip" },
  { value: "custom", label: "Custom die" },
];

const THEMES = {
  ivory: { name: "Ivory", c1: "#ffffff", c2: "#cfd5e1", pip: "#111827", swatch: "#f1f5f9", text: "#111827" },
  crimson: { name: "Crimson", c1: "#f87171", c2: "#991b1b", pip: "#ffffff", swatch: "#dc2626", text: "#ffffff" },
  ocean: { name: "Ocean", c1: "#60a5fa", c2: "#1e3a8a", pip: "#ffffff", swatch: "#2563eb", text: "#ffffff" },
  jade: { name: "Jade", c1: "#6ee7b7", c2: "#065f46", pip: "#ffffff", swatch: "#059669", text: "#ffffff" },
  violet: { name: "Violet", c1: "#c4b5fd", c2: "#5b21b6", pip: "#ffffff", swatch: "#7c3aed", text: "#ffffff" },
};

// Cube rotation [rotateX, rotateY] that brings each value to the front face.
const FACE_ROT = {
  1: [0, 0],
  2: [-90, 0],
  3: [0, -90],
  4: [0, 90],
  5: [90, 0],
  6: [0, 180],
};

// Opposite faces add up to 7.
const CUBE_FACES = [
  [1, "rotateY(0deg)"],
  [6, "rotateY(180deg)"],
  [3, "rotateY(90deg)"],
  [4, "rotateY(-90deg)"],
  [2, "rotateX(90deg)"],
  [5, "rotateX(-90deg)"],
];

const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const throwFrames = (name) => `
@keyframes ${name} {
  0%   { transform: translate3d(var(--dx), 150px, 0) scale(2.2); opacity: 0; }
  8%   { opacity: 1; }
  38%  { transform: translate3d(calc(var(--dx) * .3), calc(var(--dy) * .3), 0) scale(1); }
  52%  { transform: translate3d(calc(var(--dx) * .15), calc(var(--dy) * .15), 0) scale(1.32); }
  66%  { transform: translate3d(calc(var(--dx) * .05), calc(var(--dy) * .05), 0) scale(1); }
  78%  { transform: translate3d(0, 0, 0) scale(1.1); }
  90%, 100% { transform: translate3d(0, 0, 0) scale(1); }
}`;
const shadowFrames = (name) => `
@keyframes ${name} {
  0%   { transform: translate(14px, 18px) scale(1.7); opacity: .05; }
  38%  { transform: translate(5px, 7px) scale(1); opacity: .6; }
  52%  { transform: translate(12px, 16px) scale(1.35); opacity: .25; }
  66%  { transform: translate(5px, 7px) scale(1); opacity: .6; }
  78%  { transform: translate(8px, 10px) scale(1.1); opacity: .4; }
  90%, 100% { transform: translate(5px, 7px) scale(1); opacity: .6; }
}`;
const tumbleFrames = (name) => `
@keyframes ${name} {
  from { transform: perspective(500px) rotate3d(1, 1, 0, 0deg); }
  to   { transform: perspective(500px) rotate3d(1, 1, 0, 1080deg); }
}`;

const CSS = `
${throwFrames("dice-throw-a")}
${throwFrames("dice-throw-b")}
${shadowFrames("dice-shadow-a")}
${shadowFrames("dice-shadow-b")}
${tumbleFrames("poly-tumble-a")}
${tumbleFrames("poly-tumble-b")}
.die-cube { position: relative; width: var(--s); height: var(--s); transform-style: preserve-3d; }
.die-face {
  position: absolute; inset: 0; display: grid;
  grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);
  padding: 11px; border-radius: 14px;
  box-shadow: inset 0 0 14px rgba(0,0,0,.28), inset 0 2px 3px rgba(255,255,255,.35);
  backface-visibility: hidden;
}
.die-pip {
  width: 78%; aspect-ratio: 1; border-radius: 9999px; place-self: center;
  background: var(--pip);
  box-shadow: inset 0 2px 3px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.25);
}
.coin-face {
  position: absolute; inset: 0; border-radius: 9999px; display: flex;
  flex-direction: column; align-items: center; justify-content: center;
  backface-visibility: hidden;
  background: radial-gradient(circle at 32% 28%, #fde68a, #f59e0b 55%, #92400e);
  border: 5px solid #b45309;
  box-shadow: inset 0 0 0 4px rgba(253,230,138,.55), inset 0 -6px 12px rgba(0,0,0,.3);
  color: #78350f; font-weight: 900; letter-spacing: .05em;
}
`;

function makeDie(mode, sides) {
  const value = mode === "coin" ? "Heads" : mode === "d6" ? 1 : sides;
  return { value, display: value, rx: 0, ry: 0, rz: 0, dur: 0, delay: 0, dx: 0, dy: 0 };
}

function Cube({ die, theme }) {
  return (
    <div
      className="die-cube"
      style={{
        "--s": "78px",
        "--pip": theme.pip,
        transform: `rotateZ(${die.rz}deg) rotateX(${die.rx}deg) rotateY(${die.ry}deg)`,
        transition: `transform ${die.dur}ms cubic-bezier(.15,.65,.2,1) ${die.delay}ms`,
      }}
    >
      {CUBE_FACES.map(([value, rot]) => (
        <div
          key={value}
          className="die-face"
          style={{
            background: `linear-gradient(145deg, ${theme.c1}, ${theme.c2})`,
            transform: `${rot} translateZ(39px)`,
          }}
        >
          {Array.from({ length: 9 }, (_, cell) => (
            <span key={cell} className={PIPS[value].includes(cell) ? "die-pip" : ""} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PolyDie({ die, rolling, theme, flip, id }) {
  const label = String(die.display);
  return (
    <div
      style={{
        animation: rolling
          ? `${flip ? "poly-tumble-a" : "poly-tumble-b"} ${die.dur}ms cubic-bezier(.2,.7,.3,1) ${die.delay}ms both`
          : "none",
      }}
    >
      <svg viewBox="0 0 100 100" width="92" height="92" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`poly-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.c1} />
            <stop offset="100%" stopColor={theme.c2} />
          </linearGradient>
        </defs>
        <polygon
          points="50,3 91,26 91,74 50,97 9,74 9,26"
          fill={`url(#poly-${id})`}
          stroke="rgba(0,0,0,.35)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon points="50,18 80,68 20,68" fill="rgba(255,255,255,.14)" stroke="rgba(0,0,0,.25)" strokeWidth="1.2" />
        <g stroke="rgba(0,0,0,.22)" strokeWidth="1.2">
          <line x1="50" y1="3" x2="50" y2="18" />
          <line x1="91" y1="26" x2="80" y2="68" />
          <line x1="9" y1="26" x2="20" y2="68" />
          <line x1="50" y1="97" x2="50" y2="68" />
        </g>
        <text
          x="50"
          y="56"
          textAnchor="middle"
          dominantBaseline="central"
          fontWeight="900"
          fontSize={label.length > 2 ? 22 : label.length > 1 ? 28 : 34}
          fill={theme.text}
          style={{ textShadow: "0 1px 2px rgba(0,0,0,.4)" }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

function Coin({ die }) {
  return (
    <div
      style={{
        position: "relative",
        width: 84,
        height: 84,
        transformStyle: "preserve-3d",
        transform: `rotateX(${die.rx}deg)`,
        transition: `transform ${die.dur}ms cubic-bezier(.15,.65,.2,1) ${die.delay}ms`,
      }}
    >
      <div className="coin-face">
        <span style={{ fontSize: 26 }}>H</span>
        <span style={{ fontSize: 9 }}>HEADS</span>
      </div>
      <div className="coin-face" style={{ transform: "rotateX(180deg)" }}>
        <span style={{ fontSize: 26 }}>T</span>
        <span style={{ fontSize: 9 }}>TAILS</span>
      </div>
    </div>
  );
}

export default function DiceRoller() {
  const [mode, setMode] = useState("d6");
  const [count, setCount] = useState(2);
  const [customSides, setCustomSides] = useState(12);
  const [themeKey, setThemeKey] = useState("ivory");
  const [dice, setDice] = useState(() => [makeDie("d6", 6), makeDie("d6", 6)]);
  const [rolling, setRolling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [rollId, setRollId] = useState(0);
  const [history, setHistory] = useState([]);
  const [muted, setMuted] = useState(false);

  const timerRef = useRef(null);
  const shuffleRef = useRef(null);
  const audioRef = useRef(null);
  const mutedRef = useRef(false);

  const theme = THEMES[themeKey];
  const sides = mode === "custom" ? customSides : mode === "d20" ? 20 : 6;
  const maxCount = mode === "d6" ? 6 : 10;
  const flip = rollId % 2 === 1;

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Reset the table when the dice type or amount changes.
  useEffect(() => {
    setDice(Array.from({ length: count }, () => makeDie(mode, sides)));
    setSettled(false);
  }, [mode, count, sides]);

  useEffect(() => {
    setCount((c) => clamp(c, 1, maxCount));
  }, [maxCount]);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      window.clearInterval(shuffleRef.current);
      audioRef.current?.close?.();
    },
    [],
  );

  const ensureAudio = () => {
    if (!audioRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioRef.current = new AC();
    }
    if (audioRef.current?.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  };

  const thump = (afterMs, volume) => {
    const ctx = audioRef.current;
    if (!ctx || mutedRef.current) return;
    const length = Math.floor(ctx.sampleRate * 0.14);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700 + Math.random() * 500;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(ctx.currentTime + afterMs / 1000);
  };

  const roll = () => {
    if (rolling) return;
    ensureAudio();
    window.clearTimeout(timerRef.current);
    window.clearInterval(shuffleRef.current);

    const next = dice.map((die, i) => {
      const delay = i * 110;
      const dur = 1700 + Math.random() * 700;
      const dx = rand(-70, 70);
      const dy = rand(-40, 40);
      const rz = rand(-18, 18);

      if (mode === "coin") {
        const value = Math.random() < 0.5 ? "Heads" : "Tails";
        const rx = Math.ceil(die.rx / 360) * 360 + 360 * rand(4, 7) + (value === "Tails" ? 180 : 0);
        return { ...die, value, display: value, rx, dur, delay, dx, dy };
      }
      if (mode === "d6") {
        const value = rand(1, 6);
        const [tx, ty] = FACE_ROT[value];
        const rx = Math.ceil(die.rx / 360) * 360 + 360 * rand(2, 4) + tx;
        const ry = Math.ceil(die.ry / 360) * 360 + 360 * rand(2, 4) + ty;
        return { ...die, value, display: value, rx, ry, rz, dur, delay, dx, dy };
      }
      const value = rand(1, sides);
      return { ...die, value, display: value, dur, delay, dx, dy };
    });

    setDice(next);
    setRollId((id) => id + 1);
    setRolling(true);
    setSettled(false);

    next.forEach((die) => {
      [0.35, 0.65, 0.9].forEach((frac, k) => thump(die.delay + die.dur * 0.55 * frac + 250, 0.5 - k * 0.14));
    });

    if (mode === "d20" || mode === "custom") {
      shuffleRef.current = window.setInterval(() => {
        setDice((prev) => prev.map((d) => ({ ...d, display: rand(1, sides) })));
      }, 70);
    }

    const end = Math.max(...next.map((d) => d.delay + d.dur)) + 150;
    timerRef.current = window.setTimeout(() => {
      window.clearInterval(shuffleRef.current);
      setDice((prev) => prev.map((d) => ({ ...d, display: d.value })));
      setRolling(false);
      setSettled(true);

      const values = next.map((d) => d.value);
      const label =
        mode === "coin"
          ? values.join(", ")
          : `${values.length}d${sides}: ${values.join(" + ")}${values.length > 1 ? ` = ${values.reduce((a, b) => a + b, 0)}` : ""}`;
      setHistory((h) => [label, ...h].slice(0, 6));
    }, end);
  };

  const values = dice.map((d) => d.value);
  const total = mode === "coin" ? null : values.reduce((a, b) => a + b, 0);
  const heads = values.filter((v) => v === "Heads").length;

  return (
    <>
      <style>{CSS}</style>
      <main className="relative min-h-screen overflow-hidden bg-page text-text">
        <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <header className="mx-auto max-w-2xl text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
              <Dices size={28} />
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Dice roller</h1>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
              Dice thrown onto the table and seen from above. The face pointing up is your result.
            </p>
          </header>

          <section className="mt-12 grid gap-8 rounded-3xl border border-border bg-surface/70 p-5 shadow-2xl shadow-page/10 backdrop-blur sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
            {/* Controls */}
            <div>
              <p className="text-sm font-semibold text-text">Dice type</p>
              <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Dice type">
                {MODES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={rolling}
                    aria-pressed={mode === item.value}
                    onClick={() => setMode(item.value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      mode === item.value
                        ? "border-brand/50 bg-brand/15 text-brand"
                        : "border-border text-muted hover:border-muted hover:text-text"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {mode === "custom" && (
                <div className="mt-5">
                  <label htmlFor="custom-sides" className="text-sm font-semibold text-text">
                    Sides per die
                  </label>
                  <input
                    id="custom-sides"
                    type="number"
                    min="2"
                    max="100"
                    value={customSides}
                    disabled={rolling}
                    onChange={(e) => setCustomSides(clamp(Math.floor(Number(e.target.value) || 2), 2, 100))}
                    className="mt-2 w-full rounded-xl border border-border bg-page px-4 py-3 text-text disabled:opacity-60"
                  />
                </div>
              )}

              <p className="mt-5 text-sm font-semibold text-text">
                {mode === "coin" ? "Number of coins" : "Number of dice"}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Fewer"
                  disabled={rolling || count <= 1}
                  onClick={() => setCount((c) => clamp(c - 1, 1, maxCount))}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-text transition hover:border-muted disabled:opacity-40"
                >
                  <Minus size={18} />
                </button>
                <span className="flex h-11 min-w-16 flex-1 items-center justify-center rounded-xl border border-border bg-page text-lg font-bold">
                  {count}
                </span>
                <button
                  type="button"
                  aria-label="More"
                  disabled={rolling || count >= maxCount}
                  onClick={() => setCount((c) => clamp(c + 1, 1, maxCount))}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-text transition hover:border-muted disabled:opacity-40"
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">Choose from 1 to {maxCount}.</p>

              {mode !== "coin" && (
                <>
                  <p className="mt-5 text-sm font-semibold text-text">Dice color</p>
                  <div className="mt-2 flex gap-2.5" role="group" aria-label="Dice color">
                    {Object.entries(THEMES).map(([key, t]) => (
                      <button
                        key={key}
                        type="button"
                        title={t.name}
                        aria-label={t.name}
                        aria-pressed={themeKey === key}
                        onClick={() => setThemeKey(key)}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          themeKey === key ? "scale-110 border-text" : "border-border hover:border-muted"
                        }`}
                        style={{ background: t.swatch }}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={roll}
                  disabled={rolling}
                  className="primary-btn inline-flex flex-1 items-center justify-center gap-2 text-text disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Dices size={19} className={rolling ? "animate-pulse" : ""} />
                  {rolling ? "Rolling…" : mode === "coin" ? "Flip" : "Roll dice"}
                </button>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Unmute sound" : "Mute sound"}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border text-text transition hover:border-muted"
                >
                  {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
                </button>
              </div>
            </div>

            {/* Table */}
            <div>
              <div
                className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-3xl border border-brand/60 p-6"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 35%, #0f5132 0%, #0a3b26 55%, #062416 100%)",
                  perspective: "1100px",
                  boxShadow: "inset 0 0 60px rgba(0,0,0,.55)",
                }}
              >
                <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-10">
                  {dice.map((die, i) => (
                    <div key={i} className="relative flex h-28 w-28 items-center justify-center">
                      <div
                        className="absolute h-20 w-20 rounded-2xl bg-page blur-md"
                        style={{
                          opacity: rollId ? undefined : 0.5,
                          animation: rollId
                            ? `${flip ? "dice-shadow-a" : "dice-shadow-b"} ${die.dur}ms ease-out ${die.delay}ms both`
                            : "none",
                          ["--dx"]: "0px",
                        }}
                      />
                      <div
                        style={{
                          "--dx": `${die.dx}px`,
                          "--dy": `${die.dy}px`,
                          transformStyle: "preserve-3d",
                          animation: rollId
                            ? `${flip ? "dice-throw-a" : "dice-throw-b"} ${die.dur}ms ease-out ${die.delay}ms both`
                            : "none",
                        }}
                      >
                        {mode === "d6" && (
                          <div style={{ transformStyle: "preserve-3d", transform: "rotateX(-62deg) rotateY(-32deg) rotateX(90deg)" }}>
                            <Cube die={die} theme={theme} />
                          </div>
                        )}
                        {(mode === "d20" || mode === "custom") && (
                          <PolyDie die={die} rolling={rolling} theme={theme} flip={flip} id={i} />
                        )}
                        {mode === "coin" && <Coin die={die} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex min-h-14 flex-wrap items-center justify-between gap-3" aria-live="polite">
                {settled ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {values.map((v, i) => (
                        <span
                          key={i}
                          className="rounded-xl border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-lg font-black"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted">
                      {mode === "coin" ? (
                        <>
                          <span className="font-bold text-text">{heads}</span> heads ·{" "}
                          <span className="font-bold text-text">{values.length - heads}</span> tails
                        </>
                      ) : values.length > 1 ? (
                        <>
                          Total: <span className="text-2xl font-black text-text">{total}</span>
                        </>
                      ) : null}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    {rolling ? "The dice are tumbling…" : "Press roll to throw the dice."}
                  </p>
                )}
              </div>

              {history.length > 0 && (
                <div className="mt-6 rounded-2xl border border-border bg-page/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text">Recent rolls</p>
                    <button
                      type="button"
                      onClick={() => setHistory([])}
                      className="flex items-center gap-1.5 text-xs text-muted transition hover:text-text"
                    >
                      <Trash2 size={13} /> Clear
                    </button>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted">
                    {history.map((item, i) => (
                      <li key={`${i}-${item}`} className={i === 0 ? "text-text" : ""}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <p className="mt-6 text-center text-xs text-muted">
            Results are generated in your browser and are for fun.
          </p>
        </div>
      </main>
            <ToolArticle {...Article} />
                    <ToolFAQ
                      faqs={FAQ}
                    description="Roll 3D dice online. Throw a classic d6, D20 or custom die, or flip a coin, and see the result on the top face."
                    />
      <Footer />
    </>
  );
}