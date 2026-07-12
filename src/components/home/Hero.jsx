import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 pt-24 text-center">

        <Badge>
          <Sparkles size={14} className="mr-2" />
          FREE ONLINE TOOLS
        </Badge>

        <h1 className="mt-8 max-w-5xl text-5xl font-black leading-tight md:text-7xl">
          One Place.
          <br />

          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
            Every Tool You Need.
          </span>
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-400">
          Generate QR codes, remove image backgrounds with AI,
          compress images, convert files, and access a growing
          collection of fast, free, and beautifully designed online
          tools—all in one place.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link to="/tools">
            <Button>
              Explore Tools
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>

          <Link to="/background-remover">
            <Button variant="secondary">
              Try AI Background Remover
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3 text-sm text-slate-400">
          <span className="rounded-full border border-slate-700 px-4 py-2">
            QR Generator
          </span>

          <span className="rounded-full border border-slate-700 px-4 py-2">
            AI Background Remover
          </span>

          <span className="rounded-full border border-slate-700 px-4 py-2">
            Image Compressor
          </span>

          <span className="rounded-full border border-slate-700 px-4 py-2">
            More Coming Soon
          </span>
        </div>

      </div>
    </section>
  );
}