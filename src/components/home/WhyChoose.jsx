import {
  Zap,
  ShieldCheck,
  Globe,
  Sparkles,
} from "lucide-react";

const features = [
  {
    title: "Lightning Fast",
    description:
      "Every tool is optimized for speed, delivering results instantly without unnecessary waiting.",
    icon: Zap,
    accent: "text-yellow-400",
    span: "md:col-span-2",
  },
  {
    title: "Privacy First",
    description:
      "Your files and data stay secure. We avoid collecting unnecessary personal information.",
    icon: ShieldCheck,
    accent: "text-emerald-400",
    span: "",
  },
  {
    title: "Free to Use",
    description:
      "Core tools are completely free, with no sign-up required to get started.",
    icon: Globe,
    accent: "text-blue-400",
    span: "",
  },
  {
    title: "Beautiful Experience",
    description:
      "Modern UI, responsive design, and an enjoyable experience across desktop and mobile devices.",
    icon: Sparkles,
    accent: "text-violet-400",
    span: "md:col-span-2",
  },
];

export default function WhyChoose() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-32">

      {/* Heading */}

      <div className="mx-auto max-w-3xl text-center">

        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
          WHY QRVIA
        </span>

        <h2 className="mt-6 text-5xl font-bold text-white">
          Built for speed.
          <br />
          Designed for everyone.
        </h2>

        <p className="mt-6 text-lg leading-8 text-slate-400">
          Every Qrvia tool is crafted with performance,
          simplicity, and privacy in mind.
        </p>

      </div>

      {/* Bento Grid */}

      <div className="mt-20 grid gap-6 md:grid-cols-3">

        {features.map((feature) => {

          const Icon = feature.icon;

          return (

            <div
              key={feature.title}
              className={`group rounded-3xl border border-slate-800 bg-slate-900/60 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(37,99,235,.18)] ${feature.span}`}
            >

              <div
                className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 ${feature.accent}`}
              >
                <Icon size={32} />
              </div>

              <h3 className="text-2xl font-bold text-white">
                {feature.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-400">
                {feature.description}
              </p>

            </div>

          );

        })}

      </div>

    </section>
  );
}