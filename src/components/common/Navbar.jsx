import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, QrCode, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
const isHome = location.pathname === "/";
const [toolsOpen, setToolsOpen] = useState(false);
const dropdownRef = useRef(null);
useEffect(() => {
  function handleClickOutside(event) {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setToolsOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  const navLink =
    "transition text-slate-300 hover:text-white";

  const activeLink = "text-blue-500";

  return (
    <header className="sticky top-0 z-50 px-5 py-5">

      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-800 bg-slate-900/70 px-6 py-4 backdrop-blur-xl">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="rounded-xl bg-blue-600 p-2">
            <QrCode size={20} />
          </div>

          <span className="text-2xl font-bold">
            Qrvia
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">

          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? `${navLink} ${activeLink}`
                : navLink
            }
          >
            Home
          </NavLink>

         {isHome ? (
  <a href="#products" className={navLink}>
    Tools
  </a>
) : (
<div
  ref={dropdownRef}
  className="relative"
>
   <button
  onClick={() => setToolsOpen(!toolsOpen)}
  className={`${navLink} flex items-center gap-1`}
>
  Tools

  <ChevronDown
    size={16}
    className={`transition-transform duration-200 ${
      toolsOpen ? "rotate-180" : ""
    }`}
  />
</button>

    {toolsOpen && (
      <div className="absolute left-0 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

        <Link
          to="/qr-generator"
          className="block px-5 py-4 transition hover:bg-slate-800"
          onClick={() => setToolsOpen(false)}
        >
          QR Generator
        </Link>

        <Link
          to="/background-remover"
          className="block px-5 py-4 transition hover:bg-slate-800"
          onClick={() => setToolsOpen(false)}
        >
          Background Remover
        </Link>
        <Link
          to="/image-compressor"
          className="block px-5 py-4 transition hover:bg-slate-800"
          onClick={() => setToolsOpen(false)}
        >
         Image Compressor
        </Link>

      </div>
    )}
  </div>
)}

          <a
            href="#about"
            className={navLink}
          >
            About
          </a>

        </div>

        {/* Desktop Button */}

        {/* <Link
          to="/qr-generator"
          className="hidden rounded-full bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 md:block"
        >
          QR Generator
        </Link> */}

        {/* Mobile Button */}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
        >
          {isOpen ? <X /> : <Menu />}
        </button>

      </nav>

    {/* Mobile Menu */}

{isOpen && (
  <div className="mx-auto mt-4 max-w-7xl rounded-3xl border border-slate-800 bg-slate-900 p-6 backdrop-blur-xl md:hidden">

    <div className="flex flex-col gap-5">

      <Link
        to="/"
        onClick={() => setIsOpen(false)}
      >
        Home
      </Link>

      {isHome ? (
        <a
          href="#products"
          onClick={() => setIsOpen(false)}
        >
          Tools
        </a>
      ) : (
        <div>

          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className="flex w-full items-center justify-between"
          >
            <span>Tools</span>

            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${
                toolsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {toolsOpen && (
            <div className="mt-3 ml-4 flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-800">

              <Link
                to="/qr-generator"
                onClick={() => {
                  setIsOpen(false);
                  setToolsOpen(false);
                }}
                className="px-4 py-3 hover:bg-slate-700"
              >
                QR Generator
              </Link>

              <Link
                to="/background-remover"
                onClick={() => {
                  setIsOpen(false);
                  setToolsOpen(false);
                }}
                className="px-4 py-3 hover:bg-slate-700"
              >
                Background Remover
              </Link>

              <Link
                to="/image-compressor"
                onClick={() => {
                  setIsOpen(false);
                  setToolsOpen(false);
                }}
                className="px-4 py-3 hover:bg-slate-700"
              >
                Image Compressor
              </Link>

            </div>
          )}

        </div>
      )}

      <a
        href="#about"
        onClick={() => setIsOpen(false)}
      >
        About
      </a>

    </div>

  </div>
)}
    </header>
  );
}