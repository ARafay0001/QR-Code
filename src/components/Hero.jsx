import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-28 px-6">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* Left Side */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <Sparkles size={16} />
            Free Online QR Code Generator
          </div>

          <h1 className="mt-8 text-5xl font-extrabold leading-tight md:text-7xl">
            Create Beautiful
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              QR Codes
            </span>
            in Seconds
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-400">
            Generate professional QR codes for websites, WiFi, WhatsApp,
            Email, Phone, SMS, Locations and more. Download them in PNG,
            JPEG, SVG or PDF — completely free.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#generator"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-semibold transition hover:bg-blue-700"
            >
              Generate QR
              <ArrowRight size={18} />
            </a>

            <a
              href="#features"
              className="rounded-xl border border-slate-700 px-7 py-4 font-semibold transition hover:bg-slate-800"
            >
              Learn More
            </a>
          </div>

          <div className="mt-10 flex items-center gap-4 text-sm text-slate-400">
            <span>⭐⭐⭐⭐⭐</span>
            <span>Fast • Free • No Signup Required</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="relative flex justify-center">
          {/* Background Glow */}
          <div className="absolute h-72 w-72 rounded-full bg-blue-600/20 blur-3xl"></div>

          <div className="hidden lg:inline-block relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
            <div className="rounded-2xl bg-white p-6 flex justify-center">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://yourwebsite.com"
                alt="QR Code Preview"
                className="w-64"
              />
            </div>

            <div className="mt-6 text-center">
              <h3 className="text-xl font-semibold">
                Instant QR Generation
              </h3>

              <p className="mt-2 text-slate-400">
                Create, customize and download <br /> your QR code in seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}