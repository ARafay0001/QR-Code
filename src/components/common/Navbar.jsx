import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  QrCode,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Ruler,
  Minimize2,
  LayoutGrid,
  Calculator,
  Keyboard,
  Type,
  Wrench,
  Gamepad2,
} from "lucide-react";
import logo from "../../assets/logo.svg";
import Breadcrumbs from "./Breadcrumbs";
/* -------------------------------------------------------------------------- */
/*  Tools                                                                    */
/* -------------------------------------------------------------------------- */

const TOOLS = [
  {
    title: "PDF Tools",
    description: "Merge, split, compress & convert PDFs",
    icon: FileText,
    href: "/pdf-tools",
    accent: "text-red-400",
    accentBg: "bg-red-500/10",
  },
  {
    title: "Background Remover",
    description: "Remove image backgrounds with AI",
    icon: ImageIcon,
    href: "/background-remover",
    accent: "text-violet-400",
    accentBg: "bg-violet-500/10",
  },
  {
    title: "Unit Converter",
    description: "21 categories, from inches to pixels",
    icon: Ruler,
    href: "/unit-converter",
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
  },
  {
    title: "Image Compressor",
    description: "Compress JPEG, PNG, and WebP images",
    icon: Minimize2,
    href: "/image-compressor",
    accent: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
  },
  {
    title: "Video Compressor",
    description: "Compress video files in your browser",
    icon: Minimize2,
    href: "/video-compressor",
    accent: "text-indigo-400",
    accentBg: "bg-indigo-500/10",
  },
  {
    title: "Image to Vector",
    description: "Trace images into SVG vector graphics",
    icon: ImageIcon,
    href: "/image-to-vector",
    accent: "text-pink-400",
    accentBg: "bg-pink-500/10",
  },
  {
    title: "WebP Converter",
    description: "Convert WebP images to JPG or PNG",
    icon: ImageIcon,
    href: "/webp-to-image",
    accent: "text-amber-400",
    accentBg: "bg-amber-500/10",
  },
  {
    title: "QR Generator",
    description: "Custom QR codes with logos & colors",
    icon: QrCode,
    href: "/qr-generator",
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10",
  },
  {
    title: "Scientific Calculator",
    description: "Calculate with advanced math functions",
    icon: Calculator,
    href: "/scientific-calculator",
    accent: "text-orange-400",
    accentBg: "bg-orange-500/10",
  },
  {
  title: "All Calculators",
  description: "Explore calculators for math, finance, health, and everyday needs",
  icon: Calculator,
  href: "/all-calculators",
  accent: "text-violet-400",
  accentBg: "bg-violet-500/10",
},
  {
    title: "Typing Tutor",
    description: "Practice typing and track your progress",
    icon: Keyboard,
    href: "/typing-tutor",
    accent: "text-lime-400",
    accentBg: "bg-lime-500/10",
  },
  {
    title: "Text Tools",
    description: "Transform, clean, encode, and count text",
    icon: Type,
    href: "/text-tool",
    accent: "text-fuchsia-400",
    accentBg: "bg-fuchsia-500/10",
  },
  {
    title: "Input Tester",
    description: "Check keyboard, mouse, and controller inputs",
    icon: Wrench,
    href: "/input-tester",
    accent: "text-teal-400",
    accentBg: "bg-teal-500/10",
  },
  {
    title: "Games",
    description: "Roll dice or spin a customizable wheel",
    icon: Gamepad2,
    href: "/games",
    accent: "text-violet-400",
    accentBg: "bg-violet-500/10",
  },
];

const linkBase =
  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors";
const linkIdle = "text-slate-300 hover:bg-white/5 hover:text-white";
const linkActive = "bg-white/10 text-white";

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                   */
/* -------------------------------------------------------------------------- */

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const location = useLocation();
  const isHome = location.pathname === "/";

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setToolsOpen(false);
  }, [location.pathname]);

  // Scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click outside + Escape
  useEffect(() => {
    const onMouseDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setToolsOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const activeTool = TOOLS.find((t) => location.pathname.startsWith(t.href));

  const pillClass = ({ isActive }) =>
    `${linkBase} ${isActive ? linkActive : linkIdle}`;

  const mobileLinkClass = ({ isActive }) =>
    `block rounded-2xl px-4 py-3.5 text-base font-medium ${
      isActive ? "bg-white/10 text-white" : "text-slate-300"
    }`;

  return (
    <>
    <header className="sticky top-0 z-50 px-3 py-3 sm:px-5 sm:py-5">
      <nav
        aria-label="Primary navigation"
        className={`relative mx-auto flex max-w-7xl items-center justify-between rounded-full border px-3 py-2.5 backdrop-blur-xl transition-all duration-300 sm:px-4 ${
          scrolled
            ? "border-slate-700/80 bg-slate-900/85 shadow-[0_10px_40px_rgba(0,0,0,.45)]"
            : "border-slate-800 bg-slate-900/60"
        }`}
      >
        {/* Logo */}
        <Link to="/" aria-label="Toolited home" className="group flex items-center  pl-1">
          <div>
            <img src={logo} alt="" width="1000" height="500" className=" w-26" />
          </div>
          {/* <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Toolited
          </span> */}
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={pillClass}>
            Home
          </NavLink>

          {/* Tools mega menu */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setToolsOpen((o) => !o)}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
              aria-controls="desktop-tools"
              className={`${linkBase} flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                toolsOpen || activeTool ? linkActive : linkIdle
              }`}
            >
              Tools
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${
                  toolsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`absolute left-1/2 top-full mt-4 w-[620px] -translate-x-1/2 origin-top transition-all duration-200 ${
                toolsOpen
                  ? "visible translate-y-0 scale-100 opacity-100"
                  : "invisible -translate-y-2 scale-95 opacity-0"
              }`}
            >
              <div
                id="desktop-tools"
                className="max-h-[70vh] overflow-y-auto rounded-3xl border border-slate-700/80 bg-slate-900/95 shadow-[0_30px_80px_rgba(0,0,0,.6)] backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    All Tools
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    {TOOLS.length} live
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-3">
                  {TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const active = location.pathname.startsWith(tool.href);
                    return (
                      <Link
                        key={tool.href}
                        to={tool.href}
                        onClick={() => setToolsOpen(false)}
                        className={`group flex items-start gap-3.5 rounded-2xl p-3.5 transition-colors ${
                          active ? "bg-white/10" : "hover:bg-white/5"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${tool.accentBg} ${tool.accent}`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                            {tool.title}
                            <ArrowUpRight
                              size={14}
                              className="text-slate-500 opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                            />
                          </div>
                          <p className="mt-0.5 text-xs leading-5 text-slate-400">
                            {tool.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {isHome ? (
                  <a
                    href="#tools"
                    onClick={() => setToolsOpen(false)}
                    className="flex items-center justify-between border-t border-slate-800 bg-slate-950/40 px-6 py-3.5 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutGrid size={15} />
                      Browse all tools
                    </span>
                    <ArrowRight size={15} />
                  </a>
                ) : (
                  <Link
                    to="/"
                    onClick={() => setToolsOpen(false)}
                    className="flex items-center justify-between border-t border-slate-800 bg-slate-950/40 px-6 py-3.5 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutGrid size={15} />
                      Browse all tools
                    </span>
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <NavLink to="/about" className={pillClass}>
            About
          </NavLink>

          <NavLink to="/contact" className={pillClass}>
            Contact
          </NavLink>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-white transition-colors hover:bg-slate-700 md:hidden"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile sheet (only mounted while open) */}
      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="mx-auto mt-3 max-w-7xl md:hidden"
        >
          <div className="max-h-[75vh] overflow-y-auto rounded-3xl border border-slate-700/80 bg-slate-900/95 p-3 shadow-[0_30px_80px_rgba(0,0,0,.6)] backdrop-blur-2xl">
            <NavLink to="/" end className={mobileLinkClass}>
              Home
            </NavLink>

            <button
              onClick={() => setMobileToolsOpen((o) => !o)}
              aria-expanded={mobileToolsOpen}
              aria-controls="mobile-tools"
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-base font-medium text-slate-300"
            >
              Tools
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  mobileToolsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mobileToolsOpen && (
              <div id="mobile-tools" className="space-y-1 pb-2">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const active = location.pathname.startsWith(tool.href);
                  return (
                    <Link
                      key={tool.href}
                      to={tool.href}
                      className={`flex items-center gap-3.5 rounded-2xl px-3 py-2.5 ${
                        active ? "bg-white/10" : "active:bg-white/5"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tool.accentBg} ${tool.accent}`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">
                          {tool.title}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {tool.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <NavLink to="/about" className={mobileLinkClass}>
              About
            </NavLink>

            <NavLink to="/contact" className={mobileLinkClass}>
              Contact
            </NavLink>
          </div>
        </nav>
      )}
    </header>
    <Breadcrumbs />
    </>
  );
}