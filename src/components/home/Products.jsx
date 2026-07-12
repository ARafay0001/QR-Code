import {
  QrCode,
  FileText,
  Image,
  Minimize2,
  // SquareVideo ,
} from "lucide-react";

import ProductCard from "./ProductCard";
import SectionTitle from "../ui/SectionTitle";
import { href } from "react-router-dom";

const products = [
  {
    title: "QR Generator",
    description:
      "Generate beautiful QR codes with custom colors, logos, gradients, and multiple export formats.",
    icon: QrCode,
    status: "live",
    href: "/qr-generator",
    features: [
      "Logo Support",
      "SVG & PNG Export",
      "Custom Colors",
      "Free Forever",
    ],
  },
   {
    title: "Background Remover",
    description:
      "Remove image backgrounds in seconds with high-quality AI results.",
    icon: Image,
    status: "live",
    href: "/background-remover",
    features: [
      "HD Quality",
      "One Click",
    ],
  },
  {
    title: "Video Compressor",
    description:
      "Reduce video size while preserving quality for faster websites.",
    icon: Minimize2,
    status: "live",
    href: "/video-compressor",
    features: [
      "HD Quality",
      "One Click",
    ],
  },
 
  {
    title: "Image Compressor",
    description:
      "Reduce image size while preserving quality for faster websites.",
    icon: Minimize2,
    status: "live",
    href: "/image-compressor",
    features: [
      "Fast Compression",
      "Multiple Formats",
    ],
  },
];

export default function Products() {
  return (
    <section id="products" className="mx-auto max-w-7xl px-6 py-32">
      <SectionTitle 
        badge="PRODUCTS"
        title="Everything you need in one platform."
        subtitle="Qrvia is building a growing suite of fast, privacy-focused online tools."
      />

      <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.title}
            {...product}
          />
        ))}
      </div>
    </section>
  );
}