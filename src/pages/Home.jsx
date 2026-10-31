import { useMemo, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Ruler,
  Banknote,
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

import Footer from "../components/common/Footer";
import ToolFAQ from "../components/common/ToolFAQ";
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
        <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
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
    category: "Converters",
    features: ["Convert every unit", "One Click"],
  },
  {
    title: "Currency Converter",
    description:
      "Convert amounts between more than 160 world currencies using regularly updated exchange rates.",
    icon: Banknote,
    status: "live",
    href: "/currency-converter",
    category: "Converters",
    features: ["160+ currencies", "Popular currency conversions", "Rate update times"],
  },
  {
    title: "Invoice Generator",
    description:
      "Create professional invoices with line items, taxes, discounts, payment terms, and downloadable PDFs.",
    icon: FileText,
    status: "live",
    href: "/invoice-generator",
    category: "Business",
    features: ["Custom invoices", "Multiple currencies", "PDF export"],
  },
  {
    title: "Scientific Calculator",
    description:
      "Perform advanced mathematical calculations with this powerful scientific calculator.",
    icon: Calculator,
    status: "live",
    href: "/scientific-calculator",
    category: "Calculators",
    features: ["Advanced Functions", "Scientific Notation", "Graphing Capabilities"],
  },
  {
    title: "All Calculator",
    description:
      "Perform advanced mathematical, financial and other calculations.",
    icon: Calculator,
    status: "live",
    href: "/all-calculators",
    category: "Calculators",
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
    category: "Text & Typing",
    features: ["Test", "Learn", "Type"],
  },
  {
    title: "Text Tool",
    description:
      "Convert, clean, encode and count text with 50+ free tools.",
    icon: Text,
    status: "live",
    href: "/text-tool",
    category: "Text & Typing",
    features: ["Convert", "Clean", "Encode", "Count"],
  },
  {
    title: "Games",
    description:
      "Make quick decisions with a dice roller or a customizable spin wheel.",
    icon: Gamepad2,
    status: "live",
    href: "/games",
    category: "Games",
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

const searchSynonymGroups = [
  ["pdf", "document", "documents"],
  ["edit", "modify", "change", "annotate", "sign"],
  ["merge", "combine", "join"],
  ["split", "separate", "divide"],
  ["compress", "shrink", "reduce", "smaller"],
  ["image", "images", "photo", "photos", "picture", "pictures"],
  ["qr", "code", "barcode"],
  ["background", "bg"],
  ["remove", "erase", "cutout"],
  ["convert", "converter", "conversion", "transform", "format"],
  ["calculator", "calculate", "math", "arithmetic"],
  ["video", "movie", "clip"],
  ["currency", "exchange", "money", "rates"],
  ["unit", "units", "measurement", "measure"],
  ["type", "typing", "keyboard", "wpm"],
  ["invoice", "billing", "bill", "receipt"],
  ["test", "tester", "check"],
];

const searchSynonyms = new Map(
  searchSynonymGroups.flatMap((group) =>
    group.map((word) => [word, group]),
  ),
);
const searchStopWords = new Set([
  "a",
  "an",
  "and",
  "for",
  "i",
  "in",
  "it",
  "me",
  "my",
  "of",
  "on",
  "please",
  "the",
  "to",
  "want",
  "with",
]);

function getSearchGroups(query) {
  const words = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  const groups = new Map();

  for (const word of words) {
    if (searchStopWords.has(word)) continue;
    const synonyms = searchSynonyms.get(word);
    const key = synonyms ? synonyms[0] : word;
    if (!groups.has(key)) groups.set(key, synonyms || [word]);
  }

  return [...groups.values()];
}

function getProductSearchScore(product, queryGroups) {
  const title = new Set(product.title.toLowerCase().match(/[a-z0-9]+/g) || []);
  const features = new Set(
    product.features.join(" ").toLowerCase().match(/[a-z0-9]+/g) || [],
  );
  const description = new Set(
    `${product.description} ${product.category}`
      .toLowerCase()
      .match(/[a-z0-9]+/g) || [],
  );

  return queryGroups.reduce((score, group) => {
    if (group.some((word) => title.has(word))) return score + 6;
    if (group.some((word) => features.has(word))) return score + 4;
    if (group.some((word) => description.has(word))) return score + 2;
    return score;
  }, 0);
}

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
    accent: "text-brand bg-brand/10",
    span: "md:col-span-2",
  },
  {
    title: "Privacy first",
    description:
      "Your files and data stay secure. We avoid collecting unnecessary personal information.",
    icon: ShieldCheck,
    accent: "text-brand bg-brand/10",
    span: "",
  },
  {
    title: "Free to use",
    description:
      "Core tools are completely free, with no sign-up required to get started.",
    icon: Globe,
    accent: "text-brand bg-brand/10",
    span: "",
  },
  {
    title: "Works on any device",
    description:
      "A clean, responsive interface that feels just as good on your phone as on your desktop.",
    icon: Sparkles,
    accent: "text-brand bg-brand/10",
    span: "md:col-span-2",
  },
];

const faqs = [
  {
    question: "What free online tools can I use on Toolited?",
    answer:
      "Toolited brings together online PDF and image tools, a QR code generator, an invoice generator, unit and currency converters, calculators, text tools, and more. Browse the tool categories or search by task to find the right tool.",
  },
  {
    question: "Are Toolited's online tools free, and do I need an account?",
    answer:
      "Toolited's core tools are free to use, and you can get started without creating an account. Open a tool, follow its on-page instructions, and check its individual limits or requirements for your task.",
  },
  {
    question: "What can I put in a QR code with the free QR code generator?",
    answer:
      "Create QR codes for website links, plain text, email, phone numbers, SMS, WhatsApp, Wi-Fi, or locations. You can customize the design and download the generated code. Test a downloaded QR code with a phone camera before sharing or printing it.",
  },
  {
    question: "Can I create an invoice online and download it as a PDF?",
    answer:
      "Yes. Use the online invoice generator to add line items, taxes, discounts, payment terms, and other invoice details, then download a PDF. Invoice details are stored in your browser on your device.",
  },
  {
    question: "Are files uploaded or stored when I use an online tool?",
    answer:
      "File handling depends on the tool: some processing happens in your browser, while other features may rely on an online service. Check the specific tool's instructions before using it, especially with sensitive files. Invoice data is saved in your browser on your device.",
  },
  {
    question: "Which file formats do Toolited's PDF and image tools support?",
    answer:
      "Supported formats vary by tool and task. Image tools include workflows for formats such as JPG, PNG, and WebP, while PDF tools work with PDF documents and offer selected conversions. Check the tool page for its accepted input and download formats.",
  },
  {
    question: "Can I use Toolited on a phone or tablet?",
    answer:
      "Yes. Toolited pages are designed to work in a mobile or desktop browser, so you can use many tools without installing an app. File processing speed and available memory can depend on your device and the size of the file.",
  },
  {
    question: "How do I find the right tool for my task?",
    answer:
      "Search the tool directory using a task such as compressing an image, editing a PDF, converting a unit, or creating a QR code. You can also browse by category and open a tool to see its steps and requirements.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function ToolPreview() {
  const featuredPaths = [
    "/pdf-tools",
    "/qr-generator",
    "/background-remover",
    "/image-video-compressor",
  ];
  const rows = featuredPaths
    .map((href) => products.find((product) => product.href === href))
    .filter(Boolean);

  return (
    <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
      <div className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-brand/25 via-brand/10 to-accent/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-border/80 bg-surface/80 shadow-2xl shadow-brand/20 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Sparkles size={18} />
            </span> */}
            <div>
              <p className="text-sm font-semibold text-text">A good place to start</p>
              <p className="mt-0.5 text-xs text-muted">A few everyday favorites</p>
            </div>
          </div>
          <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
            Free to use
          </span>
        </div>

        <ul className="grid gap-2 p-3 sm:p-4">
          {rows.map(({ title, icon: Icon, href, category }, index) => (
            <li key={title}>
              <Link
                to={href}
                className="group flex items-center gap-4 rounded-2xl border border-transparent px-3 py-3 transition-all hover:border-border hover:bg-page/60 focus-visible:border-brand/40 focus-visible:bg-page/60 sm:px-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-transform group-hover:scale-105">
                  <Icon size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{category}</span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-all group-hover:bg-brand/10 group-hover:text-brand">
                  {index === 0 ? <ArrowRight size={17} /> : <ChevronRight size={18} />}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 border-t border-border/80 px-5 py-4 text-xs text-muted sm:px-6">
          <ShieldCheck size={15} className="shrink-0 text-brand" />
          <span>No account needed. Just pick a tool and get started.</span>
        </div>
      </div>
    </div>
  );
}

function Hero({ searchInput, setSearchInput, onSearch }) {
  return (
    <section className="relative">
      <div
        className={`${container} grid items-center gap-12 pb-16 pt-14 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-24`}
      >
        <div className="relative z-10">
          {/* <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3.5 py-2 text-xs font-semibold tracking-wide text-brand sm:text-sm">
            YOUR EVERYDAY TOOLKIT
          </div> */}

          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-text sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
            Free online tools.
            <br />
            <span className="bg-gradient-to-r from-brand via-accent to-brand bg-clip-text text-transparent">
              Ready when you are.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:mt-7 sm:text-lg sm:leading-8">
            Convert a file, make a QR code, or get a document in order. Handy,
            free tools for the little jobs that shouldn’t take all day.
          </p>

          <div className="mt-8 max-w-xl">
            <label
              htmlFor="hero-tool-search"
              className="mb-2 block text-sm font-semibold text-text"
            >
              What can we help you with?
            </label>
            <form
              role="search"
              onSubmit={onSearch}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-1 shadow-lg shadow-page/20 transition focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10 focus-within:shadow-[0_0_24px_color-mix(in_srgb,var(--theme-brand)_24%,transparent)]"
            >
              <Search size={19} className="shrink-0 text-muted" aria-hidden="true" />
              <input
                id="hero-tool-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Try “edit a PDF”"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-text outline-none placeholder:text-muted sm:text-base"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Search
              </button>
            </form>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="mr-1 text-muted">Popular:</span>
            {[
              { label: "PDF tools", href: "/pdf-tools" },
              { label: "QR codes", href: "/qr-generator" },
              { label: "Image tools", href: "/background-remover" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="rounded-full border border-border/80 bg-surface/50 px-3 py-1.5 font-medium text-text transition hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
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
    { value: `${products.length}+`, label: "Tools live today", icon: Zap },
    { value: "$0", label: "Free, forever", icon: ShieldCheck },
    { value: "N0", label: "Sign-ups required", icon: Globe },
  ];

  return (
    <section className="border-y border-border/60 bg-page/85 py-6 backdrop-blur-2xl sm:py-8">
      <dl
        className={`${container} grid overflow-hidden rounded-2xl border border-border/80 bg-surface/75 shadow-lg shadow-black/20 sm:grid-cols-3`}
      >
        {stats.map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="group relative overflow-hidden border-b border-border/70 p-5 transition-colors hover:bg-brand/5 last:border-b-0 sm:border-b-0 sm:border-r sm:p-6 sm:last:border-r-0"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand/10 blur-3xl transition-opacity group-hover:bg-brand/20"
            />
            <div className="relative flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand transition-colors group-hover:bg-brand/15">
                <Icon size={21} />
              </span>
              <div>
                <dt className="text-xs font-medium text-muted sm:text-sm">
                  {label}
                </dt>
                <dd className="text-3xl font-black tracking-tight text-text sm:text-4xl">
                  {value}
                </dd>
              </div>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

function Products({
  search,
  searchInput,
  setSearchInput,
  setSearch,
  category,
  setCategory,
  onClearSearch,
  onSearch,
}) {
  const filteredProducts = useMemo(() => {
    const queryGroups = getSearchGroups(search);
    return products
      .map((product) => ({
        product,
        score: queryGroups.length
          ? getProductSearchScore(product, queryGroups)
          : 1,
      }))
      .filter(
        ({ product, score }) =>
          score > 0 && (category === "All" || product.category === category),
      )
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);
  }, [search, category]);

  return (
    <section id="tools" className={`${container} scroll-mt-24 py-20 sm:py-28`}>
      <SectionHeader
        title={search ? `Tools for “${search}”` : "Everything you need in one platform."}
        subtitle={
          search
            ? `${filteredProducts.length} matching ${filteredProducts.length === 1 ? "tool" : "tools"}, ranked by relevance.`
            : "Toolited is a growing suite of fast, privacy-focused online tools."
        }
      >
        <form
          role="search"
          onSubmit={onSearch}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-1 transition-colors focus-within:border-brand/60 md:w-80"
        >
          <Search size={18} className="shrink-0 text-muted" />
          <input
            id="tools-search-input"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search tools..."
            aria-label="Search tools"
            className="w-full bg-transparent py-2 text-sm text-text outline-none placeholder:text-muted"
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search"
              className="rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              Clear
            </button>
          )}
        </form>
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
              onClick={() => {
                setCategory(c);
                setSearch("");
                setSearchInput("");
              }}
              aria-pressed={active}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                active
                  ? "border-brand/50 bg-brand/15 text-brand"
                  : "border-border text-muted hover:border-muted hover:text-text"
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
          <p className="col-span-full rounded-2xl border border-dashed border-border py-14 text-center text-muted">
            No tools match &ldquo;{search}&rdquo;. Try another description, like
            “edit a PDF” or “make a QR code”.
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
              className={`rounded-2xl border border-border bg-surface/60 p-6 transition-colors hover:border-muted sm:p-8 ${feature.span}`}
            >
              <div
                className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${feature.accent}`}
              >
                <Icon size={24} />
              </div>

              <h3 className="text-xl font-semibold text-text">
                {feature.title}
              </h3>

              <p className="mt-3 max-w-md text-sm leading-6 text-muted sm:text-base sm:leading-7">
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

      <ol className="mt-12 grid overflow-hidden rounded-2xl border border-border bg-surface/60 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <li
              key={step.title}
              className="relative border-b border-border p-6 last:border-b-0 sm:p-8 lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon size={24} />
                </span>
                <span className="text-sm font-semibold text-muted">
                  Step {index + 1}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-semibold text-text">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base sm:leading-7">
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
      <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-brand via-brand to-accent px-6 py-14 sm:px-12 sm:py-20 lg:px-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/25 blur-[120px]" />

        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-text sm:text-4xl md:text-5xl">
              Ready to create something amazing?
            </h2>
            <p className="mt-5 text-base text-black leading-7 sm:text-lg sm:leading-8">
              Generate QR codes in seconds and explore a growing collection of
              fast, modern, privacy-focused online tools.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
           

            <Link
              to="#tools"
              className="inline-flex items-center justify-center rounded-xl border border-text/25 bg-text/10 px-7 py-3.5 font-semibold text-text backdrop-blur transition hover:bg-text/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-text"
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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const handleSearch = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setCategory("All");
    document.getElementById("tools")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setCategory("All");
  };

  return (
    /*
      NOTE: `overflow-x-clip` (not `overflow-x-hidden`) is required here.
      `overflow-x-hidden` turns this wrapper into a scroll container and
      silently breaks `position: sticky` on the navbar.
    */
    <div className="relative isolate min-h-screen overflow-x-clip bg-gradient-to-br from-page via-surface to-page text-text">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-72 w-72 rounded-full bg-brand/20 blur-[100px] sm:h-96 sm:w-96 sm:blur-[140px]" />
        <div className="absolute -right-32 top-1/2 h-[320px] w-[320px] rounded-full bg-brand/15 blur-[120px] sm:h-[500px] sm:w-[500px] sm:blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-brand/10 blur-[110px] sm:h-[400px] sm:w-[400px] sm:blur-[150px]" />
      </div>


      <main>
        <Hero
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          onSearch={handleSearch}
        />
        <Stats />
        <Products
          search={search}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          onClearSearch={handleClearSearch}
          onSearch={handleSearch}
        />
        <WhyChoose />
        <HowItWorks />
        <ToolFAQ
          id="faq"
          faqs={faqs}
          description="Answers about Toolited's free online tools, QR codes, invoices, file formats, privacy, and using tools on mobile."
          className="py-20 sm:py-28"
        />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}