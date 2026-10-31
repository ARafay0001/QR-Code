import Footer from "../components/common/Footer";
import ToolArticle from "../components/common/ToolArticle";
import ToolFAQ from "../components/common/ToolFAQ";
import { Image, Video } from "lucide-react";
import { CompressorToolsArticle as Article, CompressorToolsFAQ as FAQ } from "../data/seoContent.js";
import ToolSubCard from "../components/ui/ToolSubCard";

const tools = [
  {
    title: "Image Compressor",
    description:
      "Reduce image size while preserving quality for faster websites.",
    path: "/image-compressor",
    icon: Image,
    features: ["Fast Compression", "Multiple Formats"],
  },
  {
    title: "Video Compressor",
    description:
      "Reduce video size while preserving quality for faster websites.",
    path: "/video-compressor",
    icon: Video,
    features: ["HD Quality", "One Click"],
  },
];

export default function MediaTools() {
  return (
    <>

      <div className="relative min-h-screen overflow-hidden bg-page text-text">
        {/* Background Glow */}
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          {/* Heading */}
          <h1 className="text-center text-4xl font-black tracking-tight sm:text-5xl">
            Media Tools
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-muted">
            Compress images and videos with easy, fast, and free online tools.
            Reduce file sizes while maintaining quality.
          </p>

          {/* Tools Grid */}
          <div className="mt-10 grid gap-4 sm:mt-16 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => {
              return (
                <ToolSubCard key={tool.title} {...tool} />
              );
            })}
          </div>
        </div> <ToolArticle {...Article} />
      <ToolFAQ faqs={FAQ} />
      </div>

     
      <Footer />
    </>
  );
}