import { QrCode, Mail } from "lucide-react";
import logo from "../assets/logo.svg";
export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10">
                <img src={logo} alt="QRify Logo" className="h-10 w-10" />
              </div>

              <h2 className="text-2xl font-bold text-white">QRify</h2>
            </div>

            <p className="mt-4 leading-7 text-slate-400">
              Generate beautiful, customizable QR codes for websites, WiFi,
              WhatsApp, Email, SMS, and more.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Product</h3>

            <ul className="space-y-3 text-slate-400">
              <li>
                <a href="#generator" className="transition hover:text-white">
                  QR Generator
                </a>
              </li>

              <li>
                <a href="#features" className="transition hover:text-white">
                  Features
                </a>
              </li>

              <li>
                <a href="#faq" className="transition hover:text-white">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Company</h3>

            <ul className="space-y-3 text-slate-400">
              <li>
                <a href="#" className="transition hover:text-white">
                  About
                </a>
              </li>

              <li>
                <a href="#" className="transition hover:text-white">
                  Contact
                </a>
              </li>

              <li>
                <a href="#" className="transition hover:text-white">
                  Privacy Policy
                </a>
              </li>

              <li>
                <a href="#" className="transition hover:text-white">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contact</h3>

            <a
              href="mailto:contact@qrify.com"
              className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 transition hover:bg-blue-600"
            >
              <Mail size={20} />
              <span>Email Us</span>
            </a>

            <p className="mt-6 text-sm text-slate-500">
              More contact options will be added soon.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} QRify. All rights reserved.
          </p>

          <p className="text-sm text-slate-500">
            Built with React • Tailwind CSS • QR Code Styling
          </p>
        </div>
      </div>
    </footer>
  );
}
