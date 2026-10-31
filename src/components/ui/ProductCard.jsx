import { Link } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Accent palette (full class names so Tailwind can detect them)            */
/* -------------------------------------------------------------------------- */

const ACCENTS = {
  blue: {
    text: "text-brand",
    bg: "bg-brand/10",
    ring: "ring-brand/20",
    border: "hover:border-accent/40",
    chip: "border-brand/15 bg-brand/5",
    btn: "group-hover:bg-accent group-hover:border-accent",
    glow: "color-mix(in srgb, var(--theme-brand) 16%, transparent)",
  },
  violet: {
    text: "text-brand",
    bg: "bg-brand/10",
    ring: "ring-brand/20",
    border: "hover:border-accent/40",
    chip: "border-brand/15 bg-brand/5",
    btn: "group-hover:bg-accent group-hover:border-accent",
    glow: "color-mix(in srgb, var(--theme-brand) 16%, transparent)",
  },
  emerald: {
    text: "text-brand",
    bg: "bg-brand/10",
    ring: "ring-brand/20",
    border: "hover:border-accent/40",
    chip: "border-brand/15 bg-brand/5",
    btn: "group-hover:bg-accent group-hover:border-accent",
    glow: "color-mix(in srgb, var(--theme-brand) 16%, transparent)",
  },
  cyan: {
    text: "text-brand",
    bg: "bg-brand/10",
    ring: "ring-brand/20",
    border: "hover:border-accent/40",
    chip: "border-brand/15 bg-brand/5",
    btn: "group-hover:bg-accent group-hover:border-accent",
    glow: "color-mix(in srgb, var(--theme-brand) 16%, transparent)",
  },
  pink: {
    text: "text-brand",
    bg: "bg-brand/10",
    ring: "ring-brand/20",
    border: "hover:border-accent/40",
    chip: "border-brand/15 bg-brand/5",
    btn: "group-hover:bg-accent group-hover:border-accent",
    glow: "color-mix(in srgb, var(--theme-brand) 16%, transparent)",
  },
  red: {
    text: "text-brand",
    bg: "bg-brand/10",
    ring: "ring-brand/20",
    border: "hover:border-accent/40",
    chip: "border-brand/15 bg-brand/5",
    btn: "group-hover:bg-accent group-hover:border-accent",
    glow: "color-mix(in srgb, var(--theme-brand) 16%, transparent)",
  },
  amber: {
    text: "text-brand",
    bg: "bg-brand/10",
    ring: "ring-brand/20",
    border: "hover:border-accent/40",
    chip: "border-brand/15 bg-brand/5",
    btn: "group-hover:bg-accent group-hover:border-accent",
    glow: "color-mix(in srgb, var(--theme-brand) 16%, transparent)",
  },
};

const STATUS = {
  live: {
    label: "Live",
    pill: "border-success/20 bg-success/10 text-success",
    dot: "bg-success",
    pulse: true,
  },
  beta: {
    label: "Beta",
    pill: "border-brand/20 bg-brand/10 text-brand",
    dot: "bg-brand",
    pulse: false,
  },
  soon: {
    label: "Soon",
    pill: "border-border bg-surface text-muted",
    dot: "bg-surface",
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
    "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-page p-4 backdrop-blur-xl transition-all duration-300 motion-reduce:transition-none lg:p-5";

  const interactive = `${a.border} hover:bg-surface/80 hover:shadow-[0_20px_60px_rgba(0,0,0,.35)] active:scale-[0.99] sm:hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60`;

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

      <div className="relative z-10 flex h-full min-w-0 flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transform-none sm:h-12 sm:w-12 ${a.bg} ${a.text} ${a.ring}`}
          >
            <Icon size={20} className="sm:size-6" />
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${s.pill}`}
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
        <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-text sm:mt-4 sm:text-xl">
          {title}
        </h3>

        <p className="mt-1.5 text-[13px] leading-5 tracking-[0.005em] text-muted sm:mt-2 sm:text-sm sm:leading-5">
          {description}
        </p>

        {/* Feature chips */}
        {features.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5 sm:mt-4">
            {features.slice(0, 4).map((feature) => (
              <li
                key={feature}
                className={`inline-flex max-w-full items-center gap-1.5 break-words rounded-full border px-2 py-0.5 text-xs leading-5 text-text ${a.chip}`}
              >
                <Check size={12} className={`shrink-0 ${a.text}`} />
                {feature}
              </li>
            ))}
          </ul>
        )}
        
        {/* Footer */}
        <div className="mt-auto flex items-center justify-end border-t border-border/80 pt-3 sm:pt-4">
          {isLive ? (
            <>
              {/* <span className="text-sm font-semibold text-text transition-colors group-hover:text-text">
                Open tool
              </span> */}
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/80 text-text transition-all duration-300 group-hover:text-text ${a.btn}`}
              >
                <ArrowUpRight
                  size={17}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </span>
            </>
          ) : (
            <span className="text-sm text-muted">Available soon</span>
          )}
        </div>
      </div>
    </Wrapper>
  );
}