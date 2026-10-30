import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const LABELS = {
  about: "About",
  contact: "Contact",
  "qr-generator": "QR Generator",
  "image-compressor": "Image Compressor",
  "unit-converter": "Unit Converter",
  "currency-converter": "Currency Converter",
  "invoice-generator": "Invoice Generator",
  "video-compressor": "Video Compressor",
  "background-remover": "Background Remover",
  "pdf-tools": "PDF Tools",
  compress: "Compress PDF",
  "pdf-editor": "PDF Editor",
  "image-to-pdf": "Image to PDF",
  "pdf-to-word": "PDF to Word",
  "pdf-to-excel": "PDF to Excel",
  "image-video-compressor": "Image & Video Compressor",
  "webp-to-image": "WebP Converter",
  "image-to-vector": "Image to Vector",
  "typing-tutor": "Typing Tutor",
  "all-calculators": "All Calculators",
  "privacy-policy": "Privacy Policy",
  "scientific-calculator": "Scientific Calculator",
  "input-tester": "Input Tester",
  "text-tool": "Text Tools",
  games: "Games",
  "dice-roller": "Dice Roller",
  "spin-wheel": "Spin Wheel",
};

export default function Breadcrumbs({ bare = false, light = false }) {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) return null;

  const crumbs = [{ label: "Home", to: "/" }];
  segments.forEach((segment, index) => {
    crumbs.push({
      label:
        LABELS[segment] ??
        segment.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      to: index < segments.length - 1 ? `/${segments.slice(0, index + 1).join("/")}` : null,
    });
  });

  const wrapperClass = bare
    ? "pb-2"
    : "mx-auto w-full max-w-7xl px-4 pb-2 sm:px-6 lg:px-8";
  const navClass = light
    ? "text-muted"
    : "text-muted";
  const linkClass = light
    ? "transition hover:text-accent focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
    : "transition hover:text-text focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";

  return (
    <div className="w-full bg-page">
      <div className={wrapperClass}>
        <nav
          aria-label="Breadcrumb"
          className={`flex w-fit max-w-full items-center gap-1 overflow-hidden text-xs sm:text-sm ${navClass}`}
        >
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.to ?? crumb.label}>
              {index > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-muted"
                />
              )}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className={`shrink-0 ${linkClass}`}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className={`truncate font-medium ${light ? "text-page dark:text-text" : "text-text"}`}
                >
                  {crumb.label}
                </span>
              )}
            </Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
}
