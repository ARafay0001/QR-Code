import {
  Globe,
  Wifi,
  Smartphone,
  Download,
  ShieldCheck,
  Palette,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Multiple QR Types",
    description:
      "Generate QR codes for websites, text, email, phone, SMS, WhatsApp, WiFi, and locations.",
  },
  {
    icon: Palette,
    title: "Custom Design",
    description:
      "Customize colors, size, and QR styles to match your brand.",
  },
  {
    icon: Download,
    title: "Multiple Downloads",
    description:
      "Download your QR code in PNG, JPEG, SVG, or PDF format.",
  },
  {
    icon: Wifi,
    title: "WiFi QR Codes",
    description:
      "Let users connect to your WiFi instantly without typing passwords.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description:
      "Compatible with Android, iPhone, tablets, and desktop devices.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Free",
    description:
      "Your QR codes are generated in your browser. No registration required.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="bg-slate-950 py-24 px-6"
    >
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white">
            Everything You Need
          </h2>

          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Create professional QR codes for personal, business,
            and marketing use in just a few seconds.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="mb-6 inline-flex rounded-xl bg-blue-600/20 p-4">
                  <Icon className="h-7 w-7 text-blue-400" />
                </div>

                <h3 className="text-xl font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 text-slate-400 leading-7">
                  {feature.description}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}