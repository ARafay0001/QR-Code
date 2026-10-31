import Footer from "../components/common/Footer";
import ToolFAQ from "../components/common/ToolFAQ";

import {
  Shrink,
  FileText,
  Image,
} from "lucide-react";

import ToolArticle from "../components/common/ToolArticle";
import ToolSubCard from "../components/ui/ToolSubCard";
import { PDFToolsArticle as pdfArticle, PDFToolsFAQ as FAQ } from "../data/seoContent.js";

const tools = [
  
  {
    title: "Edit PDF",
    description: "Edit, Merge, Delete content from a PDF.",
    path: "/pdf-tools/pdf-editor",
    icon: FileText,
  },
  {
    title: "Image to PDF",
    description: "Convert images into a PDF document.",
    path: "/pdf-tools/image-to-pdf",
    icon: Image,
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF size while keeping quality.",
    path: "/pdf-tools/compress",
    icon: Shrink,
  },
  {
    title: "PDF to Word",
    description: "Convert PDF files to editable Word documents.",
    path: "/pdf-tools/pdf-to-word",
    icon: FileText,
  },
  {
    title: "PDF to Excel",
    description: "Convert PDF files to editable Excel documents.",
    path: "/pdf-tools/pdf-to-excel",
    icon: FileText,
  },
];

export default function PDFTools() {
  return (
    <>

      <div className="relative min-h-screen overflow-x-clip bg-page text-text">

        {/* Background Glow */}
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16">

          <h1 className="text-center text-5xl font-black tracking-tight">
            PDF Tools
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-muted">
            Merge, Split, Compress, Convert and Edit your PDF files with fast,
            secure and free online tools.
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

            {tools.map((tool) => {
              return (
                <ToolSubCard key={tool.title} {...tool} />
              );
            })}

          </div>
<ToolArticle {...pdfArticle} />
          <ToolFAQ
            faqs={FAQ}
            description="Find the right PDF workflow, from reducing file size to editing and converting documents."
          />
        </div>
      </div>

      <Footer />
    </>
  );
}