import { useMemo, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Ruler,
  Search,
  SlidersHorizontal,
  Download,
  Keyboard,
  QrCode,
  Text,
  FileText,
  Image,
  Wrench,
  Minimize2,
  Zap,
  ShieldCheck,
  Calculator,
  Globe,
  ChevronRight,
  Gamepad2,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ToolFAQ from "../components/common/ToolFAQ";
import Button from "../components/ui/Button";
import ProductCard from "../components/ui/ProductCard";

/* -------------------------------------------------------------------------- */
/*  Shared                                                                    */
/* -------------------------------------------------------------------------- */

const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

function SectionHeader({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

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
    category: "Documents",
    features: ["Edit PDF", "Merge & Split", "Compress PDF", "Image to PDF"],
  },
  
  {
    title: "Unit Converter",
    description:
      "Convert length, weight, temperature, volume, area, speed, time, data storage, pressure, energy, power, angle, frequency and force.",
    icon: Ruler,
    status: "live",
    href: "/unit-converter",
    category: "Utilities",
    features: ["Convert every unit", "One Click"],
  },
  {
    title: "Scientific Calculator",
    description:
      "Perform advanced mathematical calculations with this powerful scientific calculator.",
    icon: Calculator,
    status: "live",
    href: "/scientific-calculator",
    category: "Utilities",
    features: ["Advanced Functions", "Scientific Notation", "Graphing Capabilities"],
  },
  {
    title: "All Calculator",
    description:
      "Perform advanced mathematical, financial and other calculations.",
    icon: Calculator,
    status: "live",
    href: "/all-calculators",
    category: "Utilities",
    features: [
  "Financial Calculators",
  "Fitness & Health Calculators",
  "Math Calculators",
  "Other Calculators",
],

  },
  {
    title: "Background Remover",
    description:
      "Remove image backgrounds in seconds with high-quality AI results.",
    icon: Image,
    status: "live",
    href: "/background-remover",
    category: "Images",
    features: ["HD Quality", "One Click"],
  },
  {
    title: "Image to SVG & Vector",
    description: "Convert images to scalable vector graphics with ease.",
    icon: Image,
    status: "live",
    href: "/image-to-vector",
    category: "Images",
    features: ["Convert Image to SVG & Vector", "One Click"],
  },
  {
    title: "WebP to JPG & PNG",
    description: "Convert WebP images to JPG or PNG format with ease.",
    icon: Image,
    status: "live",
    href: "/webp-to-image",
    category: "Images",
    features: ["WebP to JPG & PNG", "One Click"],
  },
  {
    title: "Image / Video Compressor",
    description:
      "Reduce image and video sizes while preserving quality for faster websites.",
    icon: Minimize2,
    status: "live",
    href: "/image-video-compressor",
    category: "Images",
    features: ["Fast Compression", "Multiple Formats", "HD Quality", "One Click"],
  },
  {
    title: "Mouse / Keyboard Input Tester",
    description:
      "Test your mouse and keyboard inputs with our interactive tester.",
    icon: Wrench,
    status: "live",
    href: "/input-tester",
    category: "Utilities",
    features: ["Mouse", "Keyboard","Gamepad", "Steering Wheel","joystick" ,"Real-time Feedback"],
  },
  // {
  //   title: "Video Editor, Vocal Saperator",
  //   description:
  //     "Edit videos, remove vocals, and enhance audio with our online video editor.",
  //   icon: Minimize2,
  //   status: "live",
  //   href: "/video-editor",
  //   category: "Images",
  //   features: ["Video Editor", "Vocal Saperator", "Multiple Formats", "HD Quality", "One Click"],
  // },
  {
    title: "Typing Tutor",
    description:
      "Improve your typing skills with our interactive typing tutor.",
    icon: Keyboard,
    status: "live",
    href: "/typing-tutor",
    category: "Utilities",
    features: ["Test", "Learn", "Type"],
  },
  {
    title: "Text Tool",
    description:
      "Convert, clean, encode and count text with 50+ free tools.",
    icon: Text,
    status: "live",
    href: "/text-tool",
    category: "Utilities",
    features: ["Convert", "Clean", "Encode", "Count"],
  },
  {
    title: "Games",
    description:
      "Make quick decisions with a dice roller or a customizable spin wheel.",
    icon: Gamepad2,
    status: "live",
    href: "/games",
    category: "Utilities",
    features: ["Dice Roller", "Spin the Wheel", "Custom Options"],
  },
  {
    title: "QR Generator",
    description:
      "Generate beautiful QR codes with custom colors, logos, gradients, and multiple export formats.",
    icon: QrCode,
    status: "live",
    href: "/qr-generator",
    category: "Utilities",
    features: ["Logo Support", "SVG & PNG Export", "Custom Colors"],
  },
];

const categories = ["All", ...new Set(products.map((p) => p.category))];

const steps = [
  {
    title: "Choose a tool",
    description:
      "Browse the collection and pick the tool that fits your task.",
    icon: Search,
  },
  {
    title: "Customize",
    description:
      "Adjust settings, colors, or options to get exactly what you need.",
    icon: SlidersHorizontal,
  },
  {
    title: "Download",
    description:
      "Export your finished result instantly, with no extra steps.",
    icon: Download,
  },
];

const features = [
  {
    title: "Lightning fast",
    description:
      "Every tool is optimized for speed, delivering results without unnecessary waiting.",
    icon: Zap,
    accent: "text-yellow-400 bg-yellow-400/10",
    span: "md:col-span-2",
  },
  {
    title: "Privacy first",
    description:
      "Your files and data stay secure. We avoid collecting unnecessary personal information.",
    icon: ShieldCheck,
    accent: "text-emerald-400 bg-emerald-400/10",
    span: "",
  },
  {
    title: "Free to use",
    description:
      "Core tools are completely free, with no sign-up required to get started.",
    icon: Globe,
    accent: "text-blue-400 bg-blue-400/10",
    span: "",
  },
  {
    title: "Works on any device",
    description:
      "A clean, responsive interface that feels just as good on your phone as on your desktop.",
    icon: Sparkles,
    accent: "text-violet-400 bg-violet-400/10",
    span: "md:col-span-2",
  },
];

const faqs = [
  {
    question: "Is Toolited free to use?",
    answer:
      "Yes. Our core tools are completely free to use with no sign-up required.",
  },
  {
    question: "Do I need to create an account?",
    answer: "No. Most Toolited tools work instantly without requiring an account.",
  },
  {
    question: "Can I use generated QR codes commercially?",
    answer:
      "Absolutely. QR codes generated with Toolited can be used for both personal and commercial projects.",
  },
  {
    question: "Are my files stored on your servers?",
    answer:
      "We prioritize user privacy. Whenever possible, processing happens directly in your browser. If a tool requires server-side processing, it will be clearly stated.",
  },
  {
    question: "What tools are coming next?",
    answer:
      "We're working on an AI Resume Builder and many more useful online tools. Check back often.",
  },
  {
    question: "Which file formats do you support?",
    answer:
      "Depending on the tool, we support formats such as PNG, SVG, PDF, JPG, and WebP.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function ToolPreview() {
  const rows = products.slice(0, 5);

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-tr from-blue-600/20 via-cyan-400/10 to-violet-600/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="ml-3 text-xs font-medium text-slate-400">
            Popular tools
          </span>
        </div>

        <ul className="divide-y divide-slate-800/80">
          {rows.map(({ title, icon: Icon, href, category }) => (
            <li key={title}>
              <Link
                to={href}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-800/50 focus:outline-none focus-visible:bg-slate-800/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {title}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {category}
                  </span>
                </span>
                <ChevronRight
                  size={18}
                  className="text-slate-600 transition-colors group-hover:text-blue-400"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section>
      <div
        className={`${container} grid items-center gap-14 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-24 lg:pt-28`}
      >
        <div>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
            Free online tools.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
              Every tool you need.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Create a free QR code, remove image backgrounds with AI, compress
            images online, or reduce video file sizes. Explore practical tools
            for files, documents, and everyday tasks in one place.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#tools" className="w-full sm:w-auto">
              <Button className="w-full justify-center sm:w-auto">
                Explore tools
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </a>

            <Link to="/pdf-tools" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full justify-center sm:w-auto"
              >
                Try PDF Tools
              </Button>
            </Link>
          </div>
        </div>

        <ToolPreview />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stats strip                                                               */
/* -------------------------------------------------------------------------- */

function Stats() {
  const stats = [
    { value: `${products.length}+`, label: "Tools live today" },
    { value: "$0", label: "Free, forever" },
    { value: "0", label: "Sign-ups required" },
  ];

  return (
    <section className="border-y border-slate-800/80 bg-slate-950/40 backdrop-blur">
      <dl
        className={`${container} grid grid-cols-3 divide-x divide-slate-800/80`}
      >
        {stats.map((s) => (
          <div key={s.label} className="px-2 py-6 text-center sm:px-6 sm:py-8">
            <dt className="order-2 text-xs text-slate-400 sm:text-sm">
              {s.label}
            </dt>
            <dd className="text-2xl font-bold text-white sm:text-4xl">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;
      const matchesSearch =
        !query ||
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <section id="tools" className={`${container} scroll-mt-24 py-20 sm:py-28`}>
      <SectionHeader
        title="Everything you need in one platform."
        subtitle="Toolited is a growing suite of fast, privacy-focused online tools."
      >
        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 md:w-80">
          <Search size={18} className="shrink-0 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            aria-label="Search tools"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs font-medium text-slate-400 transition hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </SectionHeader>

      {/* Category filters */}
      <div
        className="mt-8 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by category"
      >
        {categories.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                active
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(({ category: _category, ...product }) => (
            <ProductCard key={product.title} {...product} />
          ))
        ) : (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-700 py-14 text-center text-slate-400">
            No tools match &ldquo;{search}&rdquo;. Try a different search or
            category.
          </p>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Why Choose                                                                */
/* -------------------------------------------------------------------------- */

function WhyChoose() {
  return (
    <section className={`${container} py-20 sm:py-28`}>
      <SectionHeader
        title="Built for speed. Designed for everyone."
        subtitle="Every Toolited tool is crafted with performance, simplicity, and privacy in mind."
      />

      <div className="mt-12 grid gap-4 sm:gap-6 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-colors hover:border-slate-600 sm:p-8 ${feature.span}`}
            >
              <div
                className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${feature.accent}`}
              >
                <Icon size={24} />
              </div>

              <h3 className="text-xl font-semibold text-white">
                {feature.title}
              </h3>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
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
/*  How It Works                                                              */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <section className={`${container} py-20 sm:py-28`}>
      <SectionHeader
        title="Three simple steps."
        subtitle="Every Toolited tool follows the same workflow, so you get results in seconds."
      />

      <ol className="mt-12 grid overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <li
              key={step.title}
              className="relative border-b border-slate-800 p-6 last:border-b-0 sm:p-8 lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
                  <Icon size={24} />
                </span>
                <span className="text-sm font-semibold text-slate-600">
                  Step {index + 1}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                {step.description}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  CTA                                                                       */
/* -------------------------------------------------------------------------- */

function CTA() {
  return (
    <section className={`${container} pb-20 pt-10 sm:pb-28`}>
      <div className="relative overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 px-6 py-14 sm:px-12 sm:py-20 lg:px-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/25 blur-[120px]" />

        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to create something amazing?
            </h2>
            <p className="mt-5 text-base leading-7 text-blue-100 sm:text-lg sm:leading-8">
              Generate QR codes in seconds and explore a growing collection of
              fast, modern, privacy-focused online tools.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
           

            <Link
              to="#tools"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Explore tools
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
    /*
      NOTE: `overflow-x-clip` (not `overflow-x-hidden`) is required here.
      `overflow-x-hidden` turns this wrapper into a scroll container and
      silently breaks `position: sticky` on the navbar.
    */
    <div className="relative isolate min-h-screen overflow-x-clip bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-72 w-72 rounded-full bg-blue-600/20 blur-[100px] sm:h-96 sm:w-96 sm:blur-[140px]" />
        <div className="absolute -right-32 top-1/2 h-[320px] w-[320px] rounded-full bg-violet-600/15 blur-[120px] sm:h-[500px] sm:w-[500px] sm:blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[110px] sm:h-[400px] sm:w-[400px] sm:blur-[150px]" />
      </div>

      {/* Sticky navbar */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
        <Navbar />
      </div>

      <main>
        <Hero />
        <Stats />
        <Products />
        <WhyChoose />
        <HowItWorks />
        <ToolFAQ
          id="faq"
          faqs={faqs}
          description="Everything you need to know before using Toolited."
          className="py-20 sm:py-28"
        />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}