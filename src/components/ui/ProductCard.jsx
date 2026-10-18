import { Link } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Accent palette (full class names so Tailwind can detect them)            */
/* -------------------------------------------------------------------------- */

const ACCENTS = {
  blue: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
    border: "hover:border-blue-500/40",
    chip: "border-blue-500/15 bg-blue-500/5",
    btn: "group-hover:bg-blue-500 group-hover:border-blue-500",
    glow: "rgba(59,130,246,.16)",
  },
  violet: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
    border: "hover:border-violet-500/40",
    chip: "border-violet-500/15 bg-violet-500/5",
    btn: "group-hover:bg-violet-500 group-hover:border-violet-500",
    glow: "rgba(139,92,246,.16)",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    border: "hover:border-emerald-500/40",
    chip: "border-emerald-500/15 bg-emerald-500/5",
    btn: "group-hover:bg-emerald-500 group-hover:border-emerald-500",
    glow: "rgba(16,185,129,.16)",
  },
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    ring: "ring-cyan-500/20",
    border: "hover:border-cyan-500/40",
    chip: "border-cyan-500/15 bg-cyan-500/5",
    btn: "group-hover:bg-cyan-500 group-hover:border-cyan-500",
    glow: "rgba(34,211,238,.16)",
  },
  pink: {
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    ring: "ring-pink-500/20",
    border: "hover:border-pink-500/40",
    chip: "border-pink-500/15 bg-pink-500/5",
    btn: "group-hover:bg-pink-500 group-hover:border-pink-500",
    glow: "rgba(244,114,182,.16)",
  },
  red: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    border: "hover:border-red-500/40",
    chip: "border-red-500/15 bg-red-500/5",
    btn: "group-hover:bg-red-500 group-hover:border-red-500",
    glow: "rgba(248,113,113,.16)",
  },
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    border: "hover:border-amber-500/40",
    chip: "border-amber-500/15 bg-amber-500/5",
    btn: "group-hover:bg-amber-500 group-hover:border-amber-500",
    glow: "rgba(251,191,36,.16)",
  },
};

const STATUS = {
  live: {
    label: "Live",
    pill: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    pulse: true,
  },
  beta: {
    label: "Beta",
    pill: "border-violet-500/20 bg-violet-500/10 text-violet-400",
    dot: "bg-violet-400",
    pulse: false,
  },
  soon: {
    label: "Soon",
    pill: "border-slate-700 bg-slate-800 text-slate-400",
    dot: "bg-slate-500",
    pulse: false,
  },
};

/* -------------------------------------------------------------------------- */
/*  ProductCard                                                              */
/* -------------------------------------------------------------------------- */

export default function ProductCard({
  title,
  description,
  icon: Icon,
  status = "live",
  href,
  features = [],
  accent = "blue",
}) {
  const a = ACCENTS[accent] || ACCENTS.blue;
  const s = STATUS[status] || STATUS.live;
  const isLive = status === "live" || status === "beta";

  // Cursor-following spotlight
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  const base =
    "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 motion-reduce:transition-none sm:p-7";

  const interactive = `${a.border} hover:bg-slate-900/80 hover:shadow-[0_20px_60px_rgba(0,0,0,.35)] active:scale-[0.99] sm:hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60`;

  const Wrapper = isLive ? Link : "div";
  const wrapperProps = isLive
    ? { to: href, onMouseMove: handleMove, "aria-label": `Open ${title}` }
    : { "aria-disabled": true };

  return (
    <Wrapper
      {...wrapperProps}
      className={`${base} ${isLive ? interactive : "opacity-70"}`}
    >
      {/* Spotlight */}
      {isLive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(320px circle at var(--mx, 50%) var(--my, 0%), ${a.glow}, transparent 70%)`,
          }}
        />
      )}

      {/* Top accent line */}
      <div
        aria-hidden="true"
        className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-60 ${a.text}`}
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transform-none sm:h-14 sm:w-14 ${a.bg} ${a.text} ${a.ring}`}
          >
            <Icon size={24} className="sm:size-7" />
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${s.pill}`}
          >
            <span className="relative flex h-1.5 w-1.5">
              {s.pulse && (
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.dot}`}
                />
              )}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot}`} />
            </span>
            {s.label}
          </span>
        </div>

        {/* Title + description */}
        <h3 className="mt-6 text-xl font-bold tracking-tight text-white sm:text-2xl">
          {title}
        </h3>

        <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-slate-400 sm:text-[15px]">
          {description}
        </p>

        {/* Feature chips */}
        {features.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {features.slice(0, 4).map((feature) => (
              <li
                key={feature}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-slate-300 ${a.chip}`}
              >
                <Check size={12} className={a.text} />
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-800/80 pt-5 sm:mt-auto">
          {isLive ? (
            <>
              <span className="text-sm font-semibold text-slate-200 transition-colors group-hover:text-white">
                Open tool
              </span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 text-slate-300 transition-all duration-300 group-hover:text-white ${a.btn}`}
              >
                <ArrowUpRight
                  size={17}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-500">Available soon</span>
          )}
        </div>
      </div>
    </Wrapper>
  );
}