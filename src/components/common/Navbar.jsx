import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, QrCode } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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

          <a
            href="#products"
            className={navLink}
          >
            Products
          </a>

          <a
            href="#about"
            className={navLink}
          >
            About
          </a>

        </div>

        {/* Desktop Button */}

        <Link
          to="/qr-generator"
          className="hidden rounded-full bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 md:block"
        >
          QR Generator
        </Link>

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

            <Link to="/" onClick={() => setIsOpen(false)}>
              Home
            </Link>

            <a href="#products" onClick={() => setIsOpen(false)}>
              Products
            </a>

            <a href="#about" onClick={() => setIsOpen(false)}>
              About
            </a>

            <Link
              to="/qr-generator"
              onClick={() => setIsOpen(false)}
              className="rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold"
            >
              QR Generator
            </Link>

          </div>

        </div>
      )}

    </header>
  );
}