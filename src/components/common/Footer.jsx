import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.svg";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Toolited home" className=" w-26" />
              {/* <span className="text-2xl font-bold text-white">Toolited</span> */}
            </Link>
            <p className="mt-4 max-w-sm leading-7 text-slate-400">
              Free online tools for creators, students, developers, and
              everyday tasks.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Popular tools</h2>
            <ul className="space-y-3 text-slate-400">
              <li><Link to="/qr-generator" className="transition hover:text-white">Free QR code generator</Link></li>
              <li><Link to="/background-remover" className="transition hover:text-white">AI background remover</Link></li>
              <li><Link to="/image-compressor" className="transition hover:text-white">Online image compressor</Link></li>
              <li><Link to="/video-compressor" className="transition hover:text-white">Online video compressor</Link></li>
              <li><Link to="/pdf-tools" className="transition hover:text-white">PDF tools</Link></li>
              <li><Link to="/webp-to-image" className="transition hover:text-white">WebP image converter</Link></li>
              <li><Link to="/unit-converter" className="transition hover:text-white">Unit converter</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Explore</h2>
            <ul className="space-y-3 text-slate-400">
              <li><Link to="/#faq" className="transition hover:text-white">Frequently asked questions</Link></li>
              <li><Link to="/about" className="transition hover:text-white">About Toolited</Link></li>
              <li><Link to="/contact" className="transition hover:text-white">Contact</Link></li>
              <li>
                <Link to="/privacy-policy" className="transition hover:text-white">
                  Privacy Policy
                </Link>
              </li>
           </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Contact</h2>
            <a
              href="mailto:toolitedbusiness@gmail.com"
              className="inline-flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 transition hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            >
              <Mail size={20} aria-hidden="true" />
              <span>Email us</span>
            </a>
            <p className="mt-4 text-sm text-slate-400">
              Have feedback or a tool request? We’d love to hear from you.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            © {currentYear} Toolited. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">
            Built for speed. Designed for everyone.
          </p>
        </div>
      </div>
    </footer>
  );
}
