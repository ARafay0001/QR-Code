import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_ORIGIN = "https://toolited.com";
const SOCIAL_IMAGE = `${SITE_ORIGIN}/preview.png.jpg`;

const PAGE_METADATA = {
  "/": {
    title: "Toolited | Free Online Tools for Everyday Tasks",
    description:
      "Use free online tools for everyday tasks: create QR codes, remove image backgrounds with AI, compress files, convert documents, and more.",
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
    title: "Free Online PDF Tools | Toolited",
    description:
      "Explore PDF tools to compress, edit, organize, and convert PDF documents and images.",
  },
  "/pdf-tools/compress": {
    title: "Compress PDF Online | Toolited",
    description:
      "Reduce PDF file size in your browser with adjustable compression settings and download the compressed document.",
  },
  "/image-video-compressor": {
    title: "Online Image & Video Compressor Tools | Toolited",
    description:
      "Choose a free online image compressor or video compressor to reduce media file sizes in your browser.",
  },
  "/pdf-tools/pdf-editor": {
    title: "Edit PDF Online | Toolited",
    description:
      "Open the PDF editor to organize and edit PDF documents using the available browser-based tools.",
  },
  "/pdf-tools/image-to-pdf": {
    title: "Convert Images to PDF Online | Toolited",
    description:
      "Combine images into a PDF document with the browser-based image-to-PDF tool.",
  },
  "/pdf-tools/pdf-to-word": {
    title: "Convert PDF to Word Online | Toolited",
    description:
      "Convert PDF documents to editable Word files with the available PDF conversion tool.",
  },
  "/pdf-tools/pdf-to-excel": {
    title: "Convert PDF to Excel Online | Toolited",
    description:
      "Convert PDF tables into Excel spreadsheets with the available PDF conversion tool.",
  },
  "/webp-to-image": {
    title: "Convert WebP to JPG or PNG Online | Toolited",
    description:
      "Convert WebP images to JPG or PNG format with the free browser-based image converter.",
  },
  "/image-to-vector": {
    title: "Convert Images to SVG Online | Toolited",
    description:
      "Trace an image into a scalable SVG vector graphic in your browser and adjust the result before downloading.",
  },
  "/typing-tutor": {
    title: "Free Online Typing Tutor | Toolited",
    description:
      "Practice typing with an interactive online typing tutor and track your typing performance.",
  },
  "/scientific-calculator": {
    title: "Free Online Scientific Calculator | Toolited",
    description:
      "Use an online scientific calculator for common, advanced, and scientific math calculations.",
  },
  "/input-tester": {
    title: "Keyboard, Mouse & Gamepad Tester | Toolited",
    description:
      "Test keyboard, mouse, and supported controller inputs with an interactive online input tester.",
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
    title: "Free Online Calculators | Toolited",
    description:
      "Browse practical financial, fitness, math, and everyday calculators, with each tool ready to use in your browser.",
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
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", SOCIAL_IMAGE);

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
    if (normalizedPath === "/") {
      const structuredData = document.createElement("script");
      structuredData.id = "route-json-ld";
      structuredData.type = "application/ld+json";
      structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Toolited",
        url: `${SITE_ORIGIN}/`,
        description,
      });
      document.head.appendChild(structuredData);
    }
  }, [pathname]);

  return null;
}
