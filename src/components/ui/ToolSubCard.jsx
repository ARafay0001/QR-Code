import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ToolSubCard({
  title,
  description,
  path,
  icon: Icon,
  features = [],
}) {
  return (
    <Link
      to={path}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-page p-4 backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:border-accent hover:shadow-[0_0_35px_color-mix(in_srgb,var(--theme-brand)_15%,transparent)] lg:p-5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand/0 via-brand/0 to-accent/0 transition-all duration-500 group-hover:from-brand/5 group-hover:to-accent/10" />

      <div className="relative flex h-full min-w-0 flex-col">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent shadow-lg">
          <Icon className="h-6 w-6 text-text" />
        </div>

        <h2 className="mt-4 text-lg font-bold leading-snug sm:text-xl">
          {title}
        </h2>

        <p className="mt-1.5 text-[13px] leading-5 text-muted sm:text-sm">
          {description}
        </p>

        {features.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="rounded-full border border-border bg-surface/70 px-2.5 py-1 text-xs font-medium leading-5 text-text"
              >
                {feature}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center gap-2 pt-5 font-semibold text-brand">
          Open Tool
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
        </div>
      </div>
    </Link>
  );
}
