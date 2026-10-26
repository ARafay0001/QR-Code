import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RotateCw, Shuffle, Trash2, Trophy, Volume2, VolumeX } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import ToolArticle from "../../components/common/ToolArticle";
import ToolFAQ from "../../components/common/ToolFAQ";

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#84cc16",
  "#06b6d4",
  "#f43f5e",
];

const Article = {
  title: "How to Use a Spin the Wheel Decision Maker",
 
  intro:
    "When you cannot decide between options, or when you need a fair way to pick a winner, a spinning wheel takes the pressure off. Toolited's spin the wheel lets you type your own choices, spins with a ticking pointer for at least 8 seconds, and announces the winner with a celebration. It works for meals, games, giveaways, classroom activities and more.",
 
  sections: [
    {
      heading: "What is a spin the wheel tool?",
      paragraphs: [
        "A spin the wheel tool puts your options on the segments of a colorful wheel. When you spin it, the wheel turns, slows down and stops with the pointer on one segment. That segment is the winner.",
        "It turns a decision into a quick, fun moment that everyone can watch, which makes the result feel fair and easy to accept.",
      ],
    },
    {
      heading: "How to use the wheel",
      paragraphs: ["Setting up and spinning the wheel takes less than a minute."],
      bullets: [
        "Choose a preset such as Numbers, Colors, Yes / No or What to eat, or pick Custom.",
        "Type your options in the box, one per line. You can use between 2 and 20 options.",
        "Use the shuffle button to mix the order of the segments if you like.",
        "Press the spin button, or click the SPIN button in the center of the wheel.",
        "Watch the wheel spin for at least 8 seconds and read the winner when it stops.",
        "Spin again, or remove the winner from the wheel to pick the next one.",
      ],
    },
    {
      heading: "How does the wheel choose a winner?",
      paragraphs: [
        "When you press spin, the tool picks one option at random in your browser, with every option having an equal chance. The wheel animation is then played so it comes to rest on that result.",
        "The spin lasts from 8 to about 10 seconds, with a ticking pointer and flashing lights to build suspense. It is meant for fun and everyday decisions, not for lotteries or gambling.",
      ],
    },
    {
      heading: "Ideas for using a decision wheel",
      paragraphs: ["A random wheel is handy far beyond choosing dinner."],
      bullets: [
        "Picking what to eat, where to go or which movie to watch.",
        "Choosing a winner for a giveaway or a prize draw among friends.",
        "Selecting students to answer questions or present in class.",
        "Deciding who does a chore, who pays the bill or who goes first.",
        "Running team games, truth or dare, and party challenges.",
        "Making a quick choice when you are stuck between a few good options.",
      ],
    },
    {
      heading: "Tips for a better wheel",
      paragraphs: [
        "Keep option names short so they are easy to read on the wheel. Names are shortened when they are very long, and the font gets smaller as you add more segments, so around 8 to 12 options gives the clearest result.",
        "To pick several winners in a row, use the option to remove the winner from the wheel after each spin, so the same name does not come up twice.",
      ],
    },
  ],
 
  relatedTools: [
    { label: "Dice Roller", href: "/games/dice-roller" },
    { label: "Text Tool", href: "/text-tool" },
    { label: "Typing Tutor", href: "/typing-tutor" },
    { label: "Unit Converter", href: "/unit-converter" },
  ],
};
 
const FAQ = [
  {
    question: "Is the spin the wheel fair?",
    answer:
      "Yes. Every option has an equal chance of winning, and the result is chosen at random in your browser each time you spin. It is fair for games and everyday decisions, but it should not be used for lotteries or gambling.",
  },
  {
    question: "How many options can I put on the wheel?",
    answer:
      "You can add between 2 and 20 options, one per line. For the clearest wheel, around 8 to 12 options works best.",
  },
  {
    question: "How long does the wheel spin for?",
    answer:
      "Every spin lasts at least 8 seconds, and up to about 10 seconds, so the wheel builds suspense and slows down gradually before it stops.",
  },
  {
    question: "Can I use my own names and choices?",
    answer:
      "Yes. Select Custom and type your own options, one per line. You can also start from a preset such as Numbers, Colors, Yes / No or What to eat and edit it.",
  },
  {
    question: "How do I pick more than one winner?",
    answer:
      "After a spin, use the button to remove the winner from the wheel, then spin again. Repeat this to pick as many different winners as you need.",
  },
  {
    question: "Does the wheel make sound?",
    answer:
      "Yes. The pointer ticks as it passes each segment, and a short tune plays when the winner is chosen. You can turn the sound off with the speaker button.",
  },
  {
    question: "Is it free, and does it work on a phone?",
    answer:
      "It is free, needs no account, and the wheel adapts to phones, tablets and computers.",
  },
];
const PRESETS = {
  numbers: { label: "Numbers", items: Array.from({ length: 12 }, (_, i) => `${i + 1}`) },
  colors: { label: "Colors", items: ["Red", "Orange", "Yellow", "Green", "Teal", "Blue", "Purple", "Pink"] },
  yesno: { label: "Yes / No", items: ["Yes", "No", "Maybe", "Ask again"] },
  food: {
    label: "What to eat",
    items: ["Pizza", "Burger", "Biryani", "Tacos", "Sushi", "Pasta", "Salad", "Shawarma"],
  },
  custom: { label: "Custom", items: [] },
};

const MIN_SPIN_MS = 8000; // minimum spin time
const MAX_EXTRA_MS = 2500; // random extra time on top
const MAX_OPTIONS = 20;
const C = 220; // wheel center in the SVG viewBox
const R = 190; // wheel radius
const BULBS = 24;

const polar = (deg, r) => {
  const rad = (deg * Math.PI) / 180;
  return [C + r * Math.sin(rad), C - r * Math.cos(rad)];
};

const segmentPath = (i, n) => {
  const seg = 360 / n;
  const [x1, y1] = polar(i * seg, R);
  const [x2, y2] = polar((i + 1) * seg, R);
  return `M${C} ${C} L${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
};

const segmentColor = (i, n) => {
  if (i === n - 1 && n > 1 && i % PALETTE.length === 0) return PALETTE[Math.floor(PALETTE.length / 2)];
  return PALETTE[i % PALETTE.length];
};

const CSS = `
@keyframes bulb-glow { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
@keyframes confetti-fall {
  0%   { transform: translate3d(0, -8vh, 0) rotate(0deg); opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translate3d(var(--dx), 108vh, 0) rotate(var(--rot)); opacity: 0; }
}
@keyframes winner-pulse { 0%, 100% { opacity: .15; } 50% { opacity: .5; } }
@keyframes pop-in { 0% { transform: scale(.7); opacity: 0; } 70% { transform: scale(1.06); } 100% { transform: scale(1); opacity: 1; } }
`;

export default function SpinWheel() {
  const [preset, setPreset] = useState("numbers");
  const [wheelText, setWheelText] = useState(PRESETS.numbers.items.join("\n"));
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null); // { index, label }
  const [history, setHistory] = useState([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [confetti, setConfetti] = useState([]);

  const wheelRef = useRef(null);
  const pointerRef = useRef(null);
  const barRef = useRef(null);
  const timeRef = useRef(null);
  const rotRef = useRef(0);
  const pointerAngRef = useRef(0);
  const rafRef = useRef(0);
  const audioRef = useRef(null);
  const mutedRef = useRef(false);
  const confettiTimer = useRef(null);

  const entries = useMemo(
    () => wheelText.split(/\r?\n/).map((e) => e.trim()).filter(Boolean),
    [wheelText],
  );
  const n = entries.length;
  const seg = 360 / Math.max(n, 1);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const applyTransforms = () => {
    wheelRef.current?.setAttribute("transform", `rotate(${rotRef.current} ${C} ${C})`);
    pointerRef.current?.setAttribute("transform", `rotate(${-pointerAngRef.current} ${C} 8)`);
  };

  // Keep the imperative transforms in sync after any React re-render.
  useLayoutEffect(() => {
    applyTransforms();
  });

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(confettiTimer.current);
      audioRef.current?.close?.();
    },
    [],
  );

  /* ---------- audio ---------- */
  const ensureAudio = () => {
    if (!audioRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioRef.current = new AC();
    }
    if (audioRef.current?.state === "suspended") audioRef.current.resume();
  };

  const playTick = (speed) => {
    const ctx = audioRef.current;
    if (!ctx || mutedRef.current) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520 + Math.min(speed, 2) * 420, now);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  };

  const playFanfare = () => {
    const ctx = audioRef.current;
    if (!ctx || mutedRef.current) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  };

  /* ---------- editing ---------- */
  const choosePreset = (key) => {
    if (isSpinning) return;
    setPreset(key);
    setWinner(null);
    setError("");
    setWheelText(PRESETS[key].items.join("\n"));
  };

  const shuffleEntries = () => {
    if (isSpinning) return;
    const copy = [...entries];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setWinner(null);
    setWheelText(copy.join("\n"));
  };

  const removeWinner = () => {
    if (!winner || isSpinning) return;
    setWheelText(entries.filter((_, i) => i !== winner.index).join("\n"));
    setWinner(null);
    setPreset("custom");
  };

  /* ---------- spinning ---------- */
  const launchConfetti = () => {
    const pieces = Array.from({ length: 70 }, (_, id) => ({
      id,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 2.6 + Math.random() * 1.8,
      dx: (Math.random() - 0.5) * 280,
      rot: 360 + Math.random() * 720,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      color: PALETTE[id % PALETTE.length],
    }));
    setConfetti(pieces);
    window.clearTimeout(confettiTimer.current);
    confettiTimer.current = window.setTimeout(() => setConfetti([]), 5200);
  };

  const spin = () => {
    if (isSpinning) return;
    if (n < 2) {
      setError("Add at least two options to spin the wheel.");
      return;
    }
    if (n > MAX_OPTIONS) {
      setError(`The wheel supports up to ${MAX_OPTIONS} options.`);
      return;
    }
    setError("");
    setWinner(null);
    setConfetti([]);
    ensureAudio();
    setIsSpinning(true);

    // Pick the result first, then animate towards it.
    const winnerIdx = Math.floor(Math.random() * n);
    const within = seg * (0.12 + Math.random() * 0.76); // stay away from the edges
    const pointerAngle = winnerIdx * seg + within;
    const finalMod = (360 - pointerAngle) % 360;
    const start = rotRef.current;
    const startMod = ((start % 360) + 360) % 360;
    let delta = finalMod - startMod;
    if (delta < 0) delta += 360;

    const total = 360 * (9 + Math.floor(Math.random() * 4)) + delta; // 9–12 full turns
    const duration = MIN_SPIN_MS + Math.random() * MAX_EXTRA_MS; // 8.0–10.5 s
    const t0 = performance.now();
    let lastIdx = Math.floor(start / seg);
    let lastSound = 0;
    let finished = false;

    const frame = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // fast start, long dramatic slow-down
      const angle = start + total * eased;
      rotRef.current = angle;

      const idx = Math.floor(angle / seg);
      if (idx !== lastIdx) {
        lastIdx = idx;
        const speed = ((3 * total) / duration) * Math.pow(1 - t, 2); // deg per ms
        pointerAngRef.current = Math.min(30, 12 + speed * 10);
        if (now - lastSound > 38) {
          playTick(speed);
          lastSound = now;
        }
      }
      pointerAngRef.current *= 0.86;
      applyTransforms();

      if (barRef.current) barRef.current.style.width = `${(t * 100).toFixed(1)}%`;
      if (timeRef.current) {
        timeRef.current.textContent = `${Math.max(0, (duration - (now - t0)) / 1000).toFixed(1)}s`;
      }

      if (t >= 1 && !finished) {
        finished = true;
        rotRef.current = start + total;
        const label = entries[winnerIdx];
        setWinner({ index: winnerIdx, label });
        setHistory((h) => [{ label, color: segmentColor(winnerIdx, n) }, ...h].slice(0, 8));
        setIsSpinning(false);
        launchConfetti();
        playFanfare();
      }
      if (!finished || pointerAngRef.current > 0.2) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        pointerAngRef.current = 0;
        applyTransforms();
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  };

  const fontSize = n <= 8 ? 17 : n <= 12 ? 15 : n <= 16 ? 13 : 11;
  const maxChars = n <= 8 ? 16 : n <= 12 ? 14 : 12;
  const bulbs = useMemo(
    () =>
      Array.from({ length: BULBS }, (_, i) => {
        const [x, y] = polar((360 / BULBS) * i, 202);
        return { x, y, i };
      }),
    [],
  );

  return (
    <>
      <Navbar />
      <style>{CSS}</style>
      <main className="relative min-h-screen overflow-hidden bg-page text-text">
        <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />

        {confetti.length > 0 && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
            {confetti.map((p) => (
              <span
                key={p.id}
                className="absolute top-0 block rounded-sm"
                style={{
                  left: `${p.left}%`,
                  width: p.w,
                  height: p.h,
                  background: p.color,
                  "--dx": `${p.dx}px`,
                  "--rot": `${p.rot}deg`,
                  animation: `confetti-fall ${p.dur}s ease-in ${p.delay}s both`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <header className="mx-auto max-w-2xl text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
              <RotateCw size={28} />
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Spin the wheel</h1>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
              Add your options and let the wheel decide. Every spin builds suspense for at least 8 seconds.
            </p>
          </header>

          <section className="mt-12 grid items-center gap-10 rounded-3xl border border-border bg-surface/70 p-5 shadow-2xl shadow-page/10 backdrop-blur sm:p-8 lg:grid-cols-2 lg:p-10">
            {/* Wheel */}
            <div className="flex flex-col items-center lg:order-2">
              <div className="w-[min(88vw,30rem)]">
                <svg
                  viewBox="0 0 440 440"
                  className="h-auto w-full"
                  style={{ filter: "drop-shadow(0 24px 40px rgba(0,0,0,.55))" }}
                  role="img"
                  aria-label={`Prize wheel with ${n} options`}
                >
                  <defs>
                    <radialGradient id="gloss" cx="50%" cy="38%" r="65%">
                      <stop offset="0%" stopColor="#fff" stopOpacity=".28" />
                      <stop offset="60%" stopColor="#fff" stopOpacity="0" />
                      <stop offset="100%" stopColor="#000" stopOpacity=".28" />
                    </radialGradient>
                    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                    <radialGradient id="hub" cx="40%" cy="35%" r="70%">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="60%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#92400e" />
                    </radialGradient>
                    <linearGradient id="needle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>

                  {/* outer rim */}
                  <circle cx={C} cy={C} r="214" fill="url(#rim)" />
                  <circle cx={C} cy={C} r="214" fill="none" stroke="#64748b" strokeWidth="2" />
                  {bulbs.map((b) => (
                    <circle
                      key={b.i}
                      cx={b.x}
                      cy={b.y}
                      r="5"
                      fill={b.i % 2 ? "#fde047" : "#f472b6"}
                      style={{
                        filter: "drop-shadow(0 0 4px currentColor)",
                        animation: `bulb-glow ${isSpinning ? 0.3 : 1.6}s ease-in-out ${(b.i % 2) * (isSpinning ? 0.15 : 0.8)}s infinite`,
                      }}
                    />
                  ))}

                  {/* rotating wheel */}
                  <g ref={wheelRef}>
                    {entries.map((entry, i) => {
                      const dim = winner && winner.index !== i;
                      return (
                        <path
                          key={`seg-${i}`}
                          d={segmentPath(i, n)}
                          fill={segmentColor(i, n)}
                          stroke="rgba(255,255,255,.55)"
                          strokeWidth="1.5"
                          opacity={dim ? 0.4 : 1}
                          style={{ transition: "opacity .4s" }}
                        />
                      );
                    })}
                    <circle cx={C} cy={C} r={R} fill="url(#gloss)" pointerEvents="none" />

                    {entries.map((entry, i) => {
                      const mid = (i + 0.5) * seg;
                      const text = entry.length > maxChars ? `${entry.slice(0, maxChars - 1)}…` : entry;
                      return (
                        <g key={`label-${i}`} transform={`rotate(${mid - 90} ${C} ${C})`}>
                          <text
                            x={C + R - 22}
                            y={C}
                            textAnchor="end"
                            dominantBaseline="central"
                            fontSize={fontSize}
                            fontWeight="900"
                            fill="#fff"
                            stroke="rgba(0,0,0,.45)"
                            strokeWidth="3"
                            paintOrder="stroke"
                            opacity={winner && winner.index !== i ? 0.5 : 1}
                          >
                            {text}
                          </text>
                        </g>
                      );
                    })}

                    {/* pegs on every divider */}
                    {entries.map((_, i) => {
                      const [x, y] = polar(i * seg, R - 6);
                      return <circle key={`peg-${i}`} cx={x} cy={y} r="4.5" fill="#f8fafc" stroke="#475569" strokeWidth="1" />;
                    })}

                    {winner && n >= 2 && (
                      <path
                        d={segmentPath(winner.index, n)}
                        fill="#fff"
                        stroke="#fff"
                        strokeWidth="4"
                        strokeLinejoin="round"
                        style={{ animation: "winner-pulse 1s ease-in-out infinite" }}
                        pointerEvents="none"
                      />
                    )}
                  </g>

                  {/* hub */}
                  <g onClick={spin} style={{ cursor: isSpinning ? "default" : "pointer" }}>
                    <circle cx={C} cy={C} r="40" fill="#0f172a" stroke="#475569" strokeWidth="3" />
                    <circle cx={C} cy={C} r="32" fill="url(#hub)" stroke="#78350f" strokeWidth="2" />
                    <text
                      x={C}
                      y={C}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="14"
                      fontWeight="900"
                      fill="#451a03"
                      letterSpacing="1"
                    >
                      {isSpinning ? "…" : "SPIN"}
                    </text>
                  </g>

                  {/* flapper pointer */}
                  <g ref={pointerRef}>
                    <polygon
                      points="208,0 232,0 220,40"
                      fill="url(#needle)"
                      stroke="#78350f"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      style={{ filter: "drop-shadow(0 3px 3px rgba(0,0,0,.6))" }}
                    />
                    <circle cx={C} cy="8" r="5" fill="#334155" stroke="#e2e8f0" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>

              {/* status area */}
              <div className="mt-6 min-h-24 w-full max-w-md text-center" aria-live="polite">
                {isSpinning ? (
                  <div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface">
                      <div
                        ref={barRef}
                        className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
                        style={{ width: "0%" }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-muted">
                      Spinning… <span ref={timeRef} className="font-bold text-text" />
                    </p>
                  </div>
                ) : winner ? (
                  <div style={{ animation: "pop-in .5s ease-out both" }}>
                    <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand">
                      <Trophy size={16} /> Winner
                    </p>
                    <p
                      className="mt-2 break-words text-3xl font-black sm:text-4xl"
                      style={{ color: segmentColor(winner.index, n) }}
                    >
                      {winner.label}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    {n} {n === 1 ? "option" : "options"} on the wheel · press spin when ready
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="lg:order-1">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Wheel presets">
                {Object.entries(PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => choosePreset(key)}
                    aria-pressed={preset === key}
                    disabled={isSpinning}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      preset === key
                        ? "border-brand/50 bg-brand/15 text-brand"
                        : "border-border text-muted hover:border-muted hover:text-text"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <label htmlFor="wheel-options" className="mt-6 block text-sm font-semibold text-text">
                Wheel options
              </label>
              <textarea
                id="wheel-options"
                value={wheelText}
                onChange={(e) => {
                  setWheelText(e.target.value);
                  setWinner(null);
                  setPreset("custom");
                }}
                disabled={isSpinning}
                rows={8}
                placeholder={"Enter one option per line\nExample:\nPizza\nTacos"}
                className="mt-2 w-full resize-y rounded-xl border border-border bg-page px-4 py-3 text-text placeholder:text-muted disabled:opacity-60"
              />
              <p className="mt-2 text-xs text-muted">
                Enter one option per line. Add 2–{MAX_OPTIONS} options to spin.
              </p>
              {error && (
                <p className="mt-3 text-sm text-danger" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={spin}
                  disabled={isSpinning}
                  className="primary-btn inline-flex flex-1 items-center justify-center gap-2 text-text disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCw size={18} className={isSpinning ? "animate-spin" : ""} />
                  {isSpinning ? "Spinning…" : winner ? "Spin again" : "Spin the wheel"}
                </button>
                <button
                  type="button"
                  onClick={shuffleEntries}
                  disabled={isSpinning || n < 2}
                  aria-label="Shuffle options"
                  title="Shuffle options"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border text-text transition hover:border-muted disabled:opacity-40"
                >
                  <Shuffle size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Unmute sound" : "Mute sound"}
                  title={muted ? "Unmute" : "Mute"}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border text-text transition hover:border-muted"
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

              {winner && !isSpinning && n > 2 && (
                <button
                  type="button"
                  onClick={removeWinner}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text transition hover:border-danger/50 hover:text-danger"
                >
                  <Trash2 size={16} /> Remove “{winner.label}” from the wheel
                </button>
              )}

              {history.length > 0 && (
                <div className="mt-7 rounded-2xl border border-border bg-page/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text">Previous winners</p>
                    <button
                      type="button"
                      onClick={() => setHistory([])}
                      className="text-xs text-muted transition hover:text-text"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {history.map((h, i) => (
                      <span
                        key={`${i}-${h.label}`}
                        className="rounded-full border border-border px-3 py-1 text-sm font-semibold"
                        style={{ borderColor: h.color, color: i === 0 ? "#fff" : "#cbd5e1" }}
                      >
                        {h.label}
                      </span>
                    ))}
                  </div>
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
                  description="Spin the wheel with your own options and let it pick a winner. Add up to 20 choices for food, games, giveaways and more."
                    />
      <Footer />
    </>
  );
}