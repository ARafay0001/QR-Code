import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-32">

      <div className="relative overflow-hidden rounded-[40px] border border-slate-800 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 px-8 py-20 text-center shadow-[0_0_80px_rgba(37,99,235,.15)] md:px-16">

        {/* Background Glow */}
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[120px]" />

        <div className="relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-blue-100 backdrop-blur">
            <Sparkles size={16} />
            Start Building Today
          </div>

          {/* Heading */}
          <h2 className="mt-8 text-4xl font-black text-white md:text-6xl">
            Ready to create
            <br />
            something amazing?
          </h2>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            Generate QR codes in seconds and explore a growing collection
            of fast, modern, privacy-focused online tools.
          </p>

          {/* Buttons */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">

            <Link
              to="/qr-generator"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-semibold text-slate-900 transition-all duration-300 hover:scale-105"
            >
              Launch QR Generator
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/tools"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-white/20"
            >
              Explore Tools
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}