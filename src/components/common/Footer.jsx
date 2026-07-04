import { Mail } from "lucide-react";
import logo from "../../assets/logo.svg";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-12 md:grid-cols-4">

          {/* Brand */}

          <div>
            <div className="flex items-center gap-3">

              <img
                src={logo}
                alt="Qrvia Logo"
                className="h-10 w-10"
              />

              <h2 className="text-2xl font-bold text-white">
                Qrvia
              </h2>

            </div>

            <p className="mt-4 leading-7 text-slate-400">
              Qrvia is a growing collection of modern, fast,
              and privacy-focused online tools built for
              creators, developers, students, and businesses.
            </p>

          </div>

          {/* Products */}

          <div>

            <h3 className="mb-4 text-lg font-semibold text-white">
              Products
            </h3>

            <ul className="space-y-3 text-slate-400">

              <li>
                <a href="#products" className="transition hover:text-white">
                  QR Generator
                </a>
              </li>

              <li>
                <span className="cursor-default">
                  AI Resume Builder
                </span>
              </li>

              <li>
                <span className="cursor-default">
                  Background Remover
                </span>
              </li>

              <li>
                <span className="cursor-default">
                  Image Compressor
                </span>
              </li>

            </ul>

          </div>

          {/* Resources */}

          <div>

            <h3 className="mb-4 text-lg font-semibold text-white">
              Resources
            </h3>

            <ul className="space-y-3 text-slate-400">

              <li>
                <a href="#faq" className="transition hover:text-white">
                  FAQ
                </a>
              </li>

              <li>
                <a href="#" className="transition hover:text-white">
                  Privacy Policy
                </a>
              </li>

              <li>
                <a href="#" className="transition hover:text-white">
                  Terms of Service
                </a>
              </li>

              <li>
                <a href="#" className="transition hover:text-white">
                  Contact
                </a>
              </li>

            </ul>

          </div>

          {/* Contact */}

          <div>

            <h3 className="mb-4 text-lg font-semibold text-white">
              Contact
            </h3>

            <a
              href="mailto:hello@qrvia.com"
              className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 transition hover:bg-blue-600"
            >
              <Mail size={20} />

              <span>Email Us</span>

            </a>

            <p className="mt-6 text-sm text-slate-500">
              Have feedback or a tool request?
              We'd love to hear from you.
            </p>

          </div>

        </div>

        {/* Bottom */}

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-8 md:flex-row md:items-center md:justify-between">

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Qrvia. All rights reserved.
          </p>

          <p className="text-sm text-slate-500">
            Built for speed. Designed for everyone.
          </p>

        </div>

      </div>
    </footer>
  );
}