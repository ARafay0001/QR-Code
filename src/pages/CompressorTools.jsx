import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { Link } from "react-router-dom";
import { Minimize2, ArrowRight, Image, Video } from "lucide-react";

const tools = [
  {
    title: "Image Compressor",
    description:
      "Reduce image size while preserving quality for faster websites.",
    path: "/image-compressor",
    icon: Image,
    features: ["Fast Compression", "Multiple Formats"],
  },
  {
    title: "Video Compressor",
    description:
      "Reduce video size while preserving quality for faster websites.",
    path: "/video-compressor",
    icon: Video,
    features: ["HD Quality", "One Click"],
  },
];

export default function MediaTools() {
  return (
    <>
      <Navbar />

      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        {/* Background Glow */}
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16">
          {/* Heading */}
          <h1 className="text-center text-5xl font-black tracking-tight">
            Media Tools
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-slate-400">
            Compress images and videos with easy, fast, and free online tools.
            Reduce file sizes while maintaining quality.
          </p>

          {/* Tools Grid */}
          <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.title}
                  to={tool.path}
                  className="group relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/70 p-8 backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 hover:shadow-[0_0_35px_rgba(59,130,246,0.15)]"
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-blue-600/0 to-cyan-500/0 transition-all duration-500 group-hover:from-blue-600/5 group-hover:to-cyan-500/10" />

                  <div className="relative">
                    {/* Icon */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    {/* Title */}
                    <h2 className="mt-6 text-2xl font-bold">
                      {tool.title}
                    </h2>

                    {/* Description */}
                    <p className="mt-3 leading-relaxed text-slate-400">
                      {tool.description}
                    </p>

                    {/* Features */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {tool.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs font-medium text-slate-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Open Tool */}
                    <div className="mt-8 flex items-center gap-2 font-semibold text-blue-400">
                      Open Tool
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}