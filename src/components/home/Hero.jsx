import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">

      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 pt-24 text-center">

        <Badge>
           FREE ONLINE TOOLS
        </Badge>

        <h1 className="mt-8 max-w-5xl text-5xl font-black leading-tight md:text-7xl">

          Powerful Tools.

          <br />

          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
            Beautifully Built.
          </span>

        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400">

          Create QR codes, build resumes, remove image
          backgrounds, compress files, and discover a growing
          collection of beautifully designed online tools.

        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-4">

          <Button>

            Start Creating

            <ArrowRight size={18} className="ml-2" />

          </Button>

          <Link to="/qr-generator">

            <Button variant="secondary">

              Open QR Generator

            </Button>

          </Link>

        </div>

      </div>

    </section>
  );
}