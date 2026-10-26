import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.svg";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-border bg-page">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logo}
                alt="Toolited home"
                width="1000"
                height="500"
                className=" w-26"
              />
              {/* <span className="text-2xl font-bold text-text">Toolited</span> */}
            </Link>
            <p className="mt-4 max-w-sm leading-7 text-muted">
              Free online tools for creators, students, developers, and
              everyday tasks.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-text">Popular tools</h2>
            <ul className="space-y-3 text-muted">
              <li><Link to="/qr-generator" className="transition hover:text-text">Free QR code generator</Link></li>
              <li><Link to="/background-remover" className="transition hover:text-text">AI background remover</Link></li>
              <li><Link to="/image-compressor" className="transition hover:text-text">Online image compressor</Link></li>
              <li><Link to="/video-compressor" className="transition hover:text-text">Online video compressor</Link></li>
              <li><Link to="/pdf-tools" className="transition hover:text-text">PDF tools</Link></li>
              <li><Link to="/webp-to-image" className="transition hover:text-text">WebP image converter</Link></li>
              <li><Link to="/unit-converter" className="transition hover:text-text">Unit converter</Link></li>
              <li><Link to="/currency-converter" className="transition hover:text-text">Currency converter</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-text">Explore</h2>
            <ul className="space-y-3 text-muted">
              <li><Link to="/#faq" className="transition hover:text-text">Frequently asked questions</Link></li>
              <li><Link to="/about" className="transition hover:text-text">About Toolited</Link></li>
              <li><Link to="/contact" className="transition hover:text-text">Contact</Link></li>
              <li>
                <Link to="/privacy-policy" className="transition hover:text-text">
                  Privacy Policy
                </Link>
              </li>
           </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-text">Contact</h2>
            <a
              href="mailto:toolitedbusiness@gmail.com"
              className="inline-flex items-center gap-3 rounded-xl bg-surface px-4 py-3 transition hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Mail size={20} aria-hidden="true" />
              <span>Email us</span>
            </a>
            <p className="mt-4 text-sm text-muted">
              Have feedback or a tool request? We’d love to hear from you.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            © {currentYear} Toolited. All rights reserved.
          </p>
          <p className="text-sm text-muted">
            Built for speed. Designed for everyone.
          </p>
        </div>
      </div>
    </footer>
  );
}
