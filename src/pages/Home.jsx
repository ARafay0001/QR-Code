import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Search,
  SlidersHorizontal,
  Download,
  ChevronDown,
  QrCode,
  FileText,
  Image,
  Minimize2,
  Zap,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import SectionTitle from "../components/ui/SectionTitle";

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const products = [
  {
    title: "PDF Tools",
    description:
      "Merge, split, compress, convert and edit PDF files with a complete toolkit.",
    icon: FileText,
    status: "live",
    href: "/pdf-tools",
    features: ["Merge & Split", "Compress PDF", "PDF to Word", "JPG to PDF"],
  },
  {
    title: "Background Remover",
    description:
      "Remove image backgrounds in seconds with high-quality AI results.",
    icon: Image,
    status: "live",
    href: "/background-remover",
    features: ["HD Quality", "One Click"],
  },
  {
    title: "Image Compressor",
    description:
      "Reduce image size while preserving quality for faster websites.",
    icon: Minimize2,
    status: "live",
    href: "/image-compressor",
    features: ["Fast Compression", "Multiple Formats"],
  },
  {
    title: "Video Compressor",
    description:
      "Reduce video size while preserving quality for faster websites.",
    icon: Minimize2,
    status: "live",
    href: "/video-compressor",
    features: ["HD Quality", "One Click"],
  },
  {
    title: "QR Generator",
    description:
      "Generate beautiful QR codes with custom colors, logos, gradients, and multiple export formats.",
    icon: QrCode,
    status: "live",
    href: "/qr-generator",
    features: ["Logo Support", "SVG & PNG Export", "Custom Colors", "Free Forever"],
  },
];

const steps = [
  {
    number: "01",
    title: "Choose a Tool",
    description:
      "Browse our growing collection of online tools and select the one that fits your needs.",
    icon: Search,
  },
  {
    number: "02",
    title: "Customize",
    description:
      "Adjust the settings, colors, or options to create exactly what you need.",
    icon: SlidersHorizontal,
  },
  {
    number: "03",
    title: "Download",
    description:
      "Export your finished result instantly in high quality without unnecessary steps.",
    icon: Download,
  },
];

const features = [
  {
    title: "Lightning Fast",
    description:
      "Every tool is optimized for speed, delivering results instantly without unnecessary waiting.",
    icon: Zap,
    accent: "text-yellow-400",
    span: "md:col-span-2",
  },
  {
    title: "Privacy First",
    description:
      "Your files and data stay secure. We avoid collecting unnecessary personal information.",
    icon: ShieldCheck,
    accent: "text-emerald-400",
    span: "",
  },
  {
    title: "Free to Use",
    description:
      "Core tools are completely free, with no sign-up required to get started.",
    icon: Globe,
    accent: "text-blue-400",
    span: "",
  },
  {
    title: "Beautiful Experience",
    description:
      "Modern UI, responsive design, and an enjoyable experience across desktop and mobile devices.",
    icon: Sparkles,
    accent: "text-violet-400",
    span: "md:col-span-2",
  },
];

const faqs = [
  {
    question: "Is Qrvia free to use?",
    answer:
      "Yes. Our core tools are completely free to use with no sign-up required.",
  },
  {
    question: "Do I need to create an account?",
    answer: "No. Most Qrvia tools work instantly without requiring an account.",
  },
  {
    question: "Can I use generated QR codes commercially?",
    answer:
      "Absolutely. QR codes generated with Qrvia can be used for both personal and commercial projects.",
  },
  {
    question: "Are my files stored on your servers?",
    answer:
      "We prioritize user privacy. Whenever possible, processing happens directly in your browser. If a tool requires server-side processing, it will be clearly stated.",
  },
  {
    question: "What tools are coming next?",
    answer:
      "We're working on an AI Resume Builder, Background Remover, Image Compressor, and many more useful online tools.",
  },
  {
    question: "Which file formats do you support?",
    answer:
      "Depending on the tool, we support formats such as PNG, SVG, PDF, JPG, and WebP.",
  },
];

const statusStyles = {
  live: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  beta: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  soon: "bg-slate-800 text-slate-400 border border-slate-700",
};

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pt-16 text-center sm:px-6 sm:pt-24">
        <Badge>
          <Sparkles size={14} className="mr-2" />
          FREE ONLINE TOOLS
        </Badge>

        <h1 className="mt-6 max-w-5xl text-4xl font-black leading-tight sm:mt-8 sm:text-5xl md:text-7xl">
          One Place.
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
            Every Tool You Need.
          </span>
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-7 text-slate-400 sm:mt-8 sm:text-lg sm:leading-8">
          Generate QR codes, remove image backgrounds with AI, compress
          images, convert files, and access a growing collection of fast,
          free, and beautifully designed online tools&mdash;all in one place.
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-12 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4">
          <a href="#products" className="w-full sm:w-auto">
            <Button className="w-full justify-center sm:w-auto">
              Explore Tools
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </a>

          <Link to="/background-remover" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full justify-center sm:w-auto">
              Try AI Background Remover
            </Button>
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2.5 text-xs text-slate-400 sm:mt-12 sm:gap-3 sm:text-sm">
          <span className="rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2">
            QR Generator
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2">
            AI Background Remover
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2">
            Image Compressor
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2">
            More Coming Soon
          </span>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

function ProductCard({ title, description, icon: Icon, status, href, features = [] }) {
  return (
    <Link
      to={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:bg-slate-800/60 hover:shadow-[0_0_40px_rgba(37,99,235,.18)] sm:rounded-3xl sm:p-8 sm:hover:-translate-y-2"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-cyan-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:from-blue-500/5 group-hover:to-cyan-500/5" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 sm:h-14 sm:w-14 sm:rounded-2xl">
            <Icon size={24} className="sm:size-7" />
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:px-3 sm:text-xs ${statusStyles[status]}`}
          >
            {status}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-6 text-xl font-bold text-white sm:mt-8 sm:text-2xl">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm leading-6 text-slate-400 sm:mt-4 sm:text-base sm:leading-7">
          {description}
        </p>

        {/* Features */}
        <div className="mt-6 space-y-2.5 sm:mt-8 sm:space-y-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 text-xs text-slate-300 sm:text-sm"
            >
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 sm:h-2 sm:w-2" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 sm:pt-10">
          {status === "live" ? (
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition-all group-hover:gap-3 sm:text-base">
              Open Tool
              <ArrowUpRight
                size={18}
                className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </div>
          ) : (
            <span className="text-xs text-slate-500 sm:text-sm">
              Available soon
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Products() {
  return (
    <section
      id="products"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-32"
    >
      <SectionTitle
        badge="PRODUCTS"
        title="Everything you need in one platform."
        subtitle="Qrvia is building a growing suite of fast, privacy-focused online tools."
      />

      <div className="mt-12 grid gap-5 sm:mt-20 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.title} {...product} />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  How It Works                                                              */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-blue-400 sm:py-2 sm:text-sm">
          HOW IT WORKS
        </span>

        <h2 className="mt-5 text-3xl font-bold text-white sm:mt-6 sm:text-5xl">
          Three simple steps.
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
          Every Qrvia tool follows the same simple workflow, helping you get
          results in seconds.
        </p>
      </div>

      <div className="relative mt-12 grid gap-6 sm:mt-24 sm:gap-10 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(37,99,235,.18)] sm:rounded-3xl sm:p-8 sm:hover:-translate-y-2"
            >
              <span className="absolute right-6 top-6 text-4xl font-black text-slate-800 sm:right-8 sm:top-8 sm:text-6xl">
                {step.number}
              </span>

              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 sm:h-16 sm:w-16 sm:rounded-2xl">
                <Icon size={28} className="sm:size-8" />
              </div>

              <h3 className="mt-6 text-xl font-bold text-white sm:mt-8 sm:text-2xl">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400 sm:mt-4 sm:text-base sm:leading-7">
                {step.description}
              </p>

              {index !== steps.length - 1 && (
                <div className="absolute -right-5 top-1/2 hidden h-0.5 w-10 bg-gradient-to-r from-blue-500 to-transparent lg:block" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Why Choose                                                                */
/* -------------------------------------------------------------------------- */

function WhyChoose() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-blue-400 sm:py-2 sm:text-sm">
          WHY QRVIA
        </span>

        <h2 className="mt-5 text-3xl font-bold text-white sm:mt-6 sm:text-5xl">
          Built for speed.
          <br />
          Designed for everyone.
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
          Every Qrvia tool is crafted with performance, simplicity, and
          privacy in mind.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:mt-20 sm:gap-6 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className={`group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(37,99,235,.18)] sm:rounded-3xl sm:p-8 sm:hover:-translate-y-2 ${feature.span}`}
            >
              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 sm:mb-6 sm:h-16 sm:w-16 sm:rounded-2xl ${feature.accent}`}
              >
                <Icon size={28} className="sm:size-8" />
              </div>

              <h3 className="text-xl font-bold text-white sm:text-2xl">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400 sm:mt-4 sm:text-base sm:leading-7">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                       */
/* -------------------------------------------------------------------------- */

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-32">
      <div className="text-center">
        <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-blue-400 sm:py-2 sm:text-sm">
          FAQ
        </span>

        <h2 className="mt-5 text-3xl font-bold text-white sm:mt-6 sm:text-5xl">
          Frequently Asked Questions
        </h2>

        <p className="mt-4 text-base text-slate-400 sm:mt-6 sm:text-lg">
          Everything you need to know before using Qrvia.
        </p>
      </div>

      <div className="mt-10 space-y-4 sm:mt-16 sm:space-y-5">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={faq.question}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur transition-all duration-300 hover:border-blue-500/40 sm:rounded-2xl"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-8 sm:py-6"
              >
                <h3 className="text-base font-semibold text-white sm:text-lg">
                  {faq.question}
                </h3>

                <ChevronDown
                  size={20}
                  className={`shrink-0 text-slate-400 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-blue-400" : ""
                  }`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-6 text-slate-400 sm:px-8 sm:pb-6 sm:text-base sm:leading-7">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  CTA                                                                       */
/* -------------------------------------------------------------------------- */

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
      <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 px-6 py-14 text-center shadow-[0_0_80px_rgba(37,99,235,.15)] sm:rounded-[40px] sm:px-8 sm:py-20 md:px-16">
        {/* Background Glow */}
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[120px]" />

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs text-blue-100 backdrop-blur sm:text-sm">
            <Sparkles size={16} />
            Start Building Today
          </div>

          {/* Heading */}
          <h2 className="mt-6 text-3xl font-black text-white sm:mt-8 sm:text-4xl md:text-6xl">
            Ready to create
            <br />
            something amazing?
          </h2>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:mt-6 sm:text-lg sm:leading-8">
            Generate QR codes in seconds and explore a growing collection of
            fast, modern, privacy-focused online tools.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              to="/qr-generator"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-slate-900 transition-all duration-300 hover:scale-105 sm:w-auto sm:py-4"
            >
              Launch QR Generator
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/tools"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-white/20 sm:w-auto sm:py-4"
            >
              Explore Tools
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Home                                                                      */
/* -------------------------------------------------------------------------- */

export default function Home() {
  return (
    <>
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-72 w-72 rounded-full bg-blue-600/20 blur-[100px] sm:h-96 sm:w-96 sm:blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[320px] w-[320px] rounded-full bg-violet-600/15 blur-[120px] sm:h-[500px] sm:w-[500px] sm:blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[110px] sm:h-[400px] sm:w-[400px] sm:blur-[150px]" />
      </div>

      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <Hero />
        <Products />
        <WhyChoose />
        <HowItWorks />
        <FAQ />
        <CTA />

        <Footer />
      </div>
    </>
  );
}