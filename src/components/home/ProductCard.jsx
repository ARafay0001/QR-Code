import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const statusStyles = {
  live: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  beta: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  soon: "bg-slate-800 text-slate-400 border border-slate-700",
};

export default function ProductCard({
  title,
  description,
  icon: Icon,
  status,
  href,
  features = [],
}) {
  return (
    <Link to={href} className="group  relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(37,99,235,.18)]">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-cyan-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:from-blue-500/5 group-hover:to-cyan-500/5" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
            <Icon size={28} />
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[status]}`}
          >
            {status}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-8 text-2xl font-bold text-white">{title}</h3>

        {/* Description */}
        <p className="mt-4 leading-7 text-slate-400">{description}</p>

        {/* Features */}
        <div className="mt-8 space-y-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 text-sm text-slate-300"
            >
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-10">
  {status === "live" ? (
    <div className="inline-flex items-center gap-2 font-semibold text-blue-400 transition-all group-hover:gap-3">
      Open Tool
      <ArrowUpRight
        size={18}
        className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
      />
    </div>
  ) : (
    <span className="text-sm text-slate-500">
      Available soon
    </span>
  )}
</div>
      </div>
    </Link>
  );
}