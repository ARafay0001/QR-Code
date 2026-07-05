import { ChevronDown } from "lucide-react";

export default function Accordion({
  title,
  isOpen,
  onToggle,
  children,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">

      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-slate-800/50"
      >
        <h3 className="text-lg font-semibold text-white">
          {title}
        </h3>

        <ChevronDown
          className={`transition duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ${
          isOpen
            ? "grid-rows-[1fr]"
            : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-800 p-6">
            {children}
          </div>
        </div>
      </div>

    </div>
  );
}