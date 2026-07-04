import { Search, SlidersHorizontal, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Choose a Tool",
    description:
      "Browse our growing collection of online tools and select the one that fits your needs.",
    icon: Search,
  },
  {
    number: "02",
    title: "Customize",
    description:
      "Adjust the settings, colors, or options to create exactly what you need.",
    icon: SlidersHorizontal,
  },
  {
    number: "03",
    title: "Download",
    description:
      "Export your finished result instantly in high quality without unnecessary steps.",
    icon: Download,
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-32">

      <div className="mx-auto max-w-3xl text-center">

        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
          HOW IT WORKS
        </span>

        <h2 className="mt-6 text-5xl font-bold text-white">
          Three simple steps.
        </h2>

        <p className="mt-6 text-lg leading-8 text-slate-400">
          Every Qrvia tool follows the same simple workflow,
          helping you get results in seconds.
        </p>

      </div>

      <div className="relative mt-24 grid gap-10 lg:grid-cols-3">

        {steps.map((step, index) => {

          const Icon = step.icon;

          return (

            <div
              key={step.number}
              className="group relative rounded-3xl border border-slate-800 bg-slate-900/60 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(37,99,235,.18)]"
            >

              <span className="absolute right-8 top-8 text-6xl font-black text-slate-800">
                {step.number}
              </span>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">

                <Icon size={32} />

              </div>

              <h3 className="mt-8 text-2xl font-bold text-white">
                {step.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-400">
                {step.description}
              </p>

              {index !== steps.length - 1 && (
                <div className="absolute -right-5 top-1/2 hidden h-0.5 w-10 bg-gradient-to-r from-blue-500 to-transparent lg:block" />
              )}

            </div>

          );
        })}

      </div>

    </section>
  );
}