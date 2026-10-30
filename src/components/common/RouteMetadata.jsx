import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_ORIGIN = "https://toolited.com";
const SOCIAL_IMAGE = `${SITE_ORIGIN}/preview.png.jpg`;

const PAGE_METADATA = {
  "/": {
    title: "Toolited | Free Online Tools",
    description:
      "Use free browser-based PDF, image, invoice, calculator, text, and everyday tools. Create invoices and process files privately in your browser.",
  },
  "/about": {
    title: "About Toolited | Free Online Tools",
    description:
      "Learn about Toolited, a growing collection of free online tools for QR codes, images, documents, and everyday tasks.",
  },
  "/contact": {
    title: "Contact Toolited | Support & Feedback",
    description:
      "Contact Toolited with feedback, questions, or suggestions for useful free online tools.",
  },
  "/qr-generator": {
    title: "Free QR Code Generator Online | Toolited",
    description:
      "Create custom QR codes for websites, text, email, phone, SMS, WhatsApp, Wi-Fi, and locations. Adjust the style and download your QR code.",
  },
  "/image-compressor": {
    title: "Free Online Image Compressor | Toolited",
    description:
      "Compress JPEG, PNG, and WebP images in your browser. Adjust quality and size, process multiple images, and download the results.",
  },
  "/unit-converter": {
    title: "Free Online Unit Converter | Toolited",
    description:
      "Convert measurements across length, weight, temperature, volume, area, speed, time, data, and other unit categories.",
  },
  "/currency-converter": {
    title: "Free Currency Converter: Convert 160+ Currencies | Toolited",
    description:
      "Convert amounts between more than 160 world currencies with regularly updated exchange rates. Compare popular currencies and check when rates were last updated.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Toolited Currency Converter",
      description:
        "Convert amounts between more than 160 world currencies with regularly updated exchange rates.",
      url: `${SITE_ORIGIN}/currency-converter`,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
    },
  },
  "/invoice-generator": {
    title: "Free Online Invoice Generator | Toolited",
    description:
      "Create professional invoices with customizable line items, taxes, discounts, payment terms, and PDF export. Your invoice data stays on your device.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Toolited Invoice Generator",
      description:
        "Create and download professional invoices in your browser. Invoice details are stored on your device.",
      url: `${SITE_ORIGIN}/invoice-generator`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
    },
  },
  "/video-compressor": {
    title: "Free Online Video Compressor | Toolited",
    description:
      "Compress MP4, MOV, AVI, WebM, and MKV videos in your browser, choose a target file size, and export an MP4.",
  },
  "/background-remover": {
    title: "Free AI Background Remover Online | Toolited",
    description:
      "Remove an image background with AI in your browser and download the result as a transparent PNG.",
  },
  "/pdf-tools": {
    title: "Free Online PDF Tools: Edit, Compress & Convert | Toolited",
    description:
      "Edit and organize PDFs, compress documents, convert images to PDF, or export PDF content to Word and Excel with free online PDF tools.",
  },
  "/pdf-tools/compress": {
    title: "Compress PDF Online Free | Toolited",
    description:
      "Reduce PDF file size in your browser with adjustable compression settings and download the compressed document.",
  },
  "/image-video-compressor": {
    title: "Online Image & Video Compressor Tools | Toolited",
    description:
      "Choose a free online image compressor or video compressor to reduce media file sizes in your browser.",
  },
  "/pdf-tools/pdf-editor": {
    title: "Edit, Organize & Annotate PDF Online | Toolited",
    description:
      "Edit and organize PDF pages in your browser. Add annotations, reorder or rotate pages, and download the updated PDF.",
  },
  "/pdf-tools/image-to-pdf": {
    title: "Image to PDF Converter Online | Toolited",
    description:
      "Combine images into a PDF document with the browser-based image-to-PDF tool.",
  },
  "/pdf-tools/pdf-to-word": {
    title: "PDF to Word Converter Online | Toolited",
    description:
      "Convert PDF documents to editable Word files with the available PDF conversion tool.",
  },
  "/pdf-tools/pdf-to-excel": {
    title: "PDF to Excel Converter Online | Toolited",
    description:
      "Extract tables from text or scanned PDFs and export them to Excel or CSV. Configure table detection and spreadsheet output in your browser.",
  },
  "/webp-to-image": {
    title: "WebP to JPG or PNG Converter Online | Toolited",
    description:
      "Convert WebP images in batches to JPG or PNG in your browser. Choose image quality, size, and background for JPG exports.",
  },
  "/image-to-vector": {
    title: "Image to SVG Vector Converter Online | Toolited",
    description:
      "Trace raster images into scalable SVG artwork in your browser. Adjust vector settings, preview the result, and download the SVG.",
  },
  "/typing-tutor": {
    title: "Free Online Typing Practice & Tutor | Toolited",
    description:
      "Practice touch typing with interactive lessons and typing tests. Build speed and accuracy with the free browser-based typing tutor.",
  },
  "/scientific-calculator": {
    title: "Free Scientific Calculator Online | Toolited",
    description:
      "Calculate with trigonometry, logarithms, fractions, scientific notation, constants, and advanced math functions in a free online calculator.",
  },
  "/input-tester": {
    title: "Keyboard, Mouse & Gamepad Input Tester | Toolited",
    description:
      "Check keyboard keys, mouse buttons and movement, and supported gamepad controls with this interactive browser-based input tester.",
  },
  "/text-tool": {
    title: "Free Online Text Tools | Toolited",
    description:
      "Use browser-based text tools to transform, clean, encode, and count text.",
  },
  "/games": {
    title: "Free Online Dice Roller & Spin Wheel | Toolited",
    description:
      "Roll dice in multiple modes or spin a customizable wheel with your own options, colors, or numbers.",
  },
  "/games/dice-roller": {
    title: "Free Online Dice Roller | Toolited",
    description:
      "Roll virtual dice for board games, classroom activities, and quick random choices with Toolited's free dice roller.",
  },
  "/games/spin-wheel": {
    title: "Free Customizable Spin Wheel | Toolited",
    description:
      "Create a custom spin wheel with your own choices, then spin it to make a fun and fair random selection.",
  },
  "/all-calculators": {
    title: "Free Online Calculators for Everyday Use | Toolited",
    description:
      "Use free financial, health, math, date, and everyday calculators in your browser, including percentage, loan, BMI, and unit calculations.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | Toolited",
    description:
      "Read how Toolited handles information, browser-based file processing, analytics, and privacy when you use our online tools.",
  },
};

function upsertMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath =
      pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    const page = PAGE_METADATA[normalizedPath];
    const title = page?.title || "Page not found | Toolited";
    const description =
      page?.description || "The page you requested could not be found.";
    const canonicalUrl = `${SITE_ORIGIN}${normalizedPath}`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", page ? "index, follow" : "noindex, follow");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:site_name", "Toolited");
    upsertMeta("property", "og:image", SOCIAL_IMAGE);
    upsertMeta("property", "og:image:alt", "Toolited online tools");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", SOCIAL_IMAGE);
    upsertMeta("name", "twitter:image:alt", "Toolited online tools");

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (page) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
      upsertMeta("property", "og:url", canonicalUrl);
    } else {
      canonical?.remove();
      document.head
        .querySelector('meta[property="og:url"]')
        ?.remove();
    }

    document.getElementById("route-json-ld")?.remove();
    const structuredData =
      page?.structuredData ??
      (normalizedPath === "/"
        ? {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Toolited",
            url: `${SITE_ORIGIN}/`,
            description,
          }
        : null);
    if (structuredData) {
      const script = document.createElement("script");
      script.id = "route-json-ld";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [pathname]);

  return null;
}
