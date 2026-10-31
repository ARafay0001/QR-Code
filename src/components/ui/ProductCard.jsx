import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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
}) {
  const s = STATUS[status] || STATUS.live;
  const isLive = status === "live" || status === "beta";

  const base =
    "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-border/70 bg-page p-4 backdrop-blur transition-all duration-300 motion-reduce:transition-none lg:p-5";

  const interactive =
    "hover:-translate-y-2 hover:border-accent hover:shadow-[0_0_35px_color-mix(in_srgb,var(--theme-brand)_15%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60";

  const Wrapper = isLive ? Link : "div";
  const wrapperProps = isLive
    ? { to: href, "aria-label": `Open ${title}` }
    : { "aria-disabled": true };

  return (
    <Wrapper
      {...wrapperProps}
      className={`${base} ${isLive ? interactive : "opacity-70"}`}
    >
      {isLive && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-brand/0 via-brand/0 to-accent/0 transition-all duration-500 group-hover:from-brand/5 group-hover:to-accent/10"
        />
      )}

      <div className="relative flex h-full min-w-0 flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent shadow-lg"
          >
            <Icon className="h-6 w-6 text-text" />
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
        <h3 className="mt-4 break-words text-lg font-bold leading-snug sm:text-xl">
          {title}
        </h3>

        <p className="mt-1.5 break-words text-[13px] leading-5 text-muted sm:text-sm">
          {description}
        </p>

        {/* Feature chips */}
        {features.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {features.slice(0, 4).map((feature) => (
              <li
                key={feature}
                className="max-w-full break-words rounded-full border border-border bg-surface/70 px-2.5 py-1 text-xs font-medium leading-5 text-text"
              >
                {feature}
              </li>
            ))}
          </ul>
        )}
        
        {/* Footer */}
        <div className="mt-auto flex items-center gap-2 pt-5 font-semibold text-brand">
          {isLive ? (
            <>
              Open Tool
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-2" />
            </>
          ) : (
            <span className="text-sm text-muted">Available soon</span>
          )}
        </div>
      </div>
    </Wrapper>
  );
}