import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ToolFAQ from "../components/common/ToolFAQ";

import { Link } from "react-router-dom";
import {
  Shrink,
  FileText,
  Image,
  ArrowRight,
} from "lucide-react";

import ToolArticle from "../components/common/ToolArticle";

const pdfArticle = {
  title: "How to Work with PDF Files Online",

  intro:
    "PDF files are useful for sharing documents while keeping their layout consistent across devices. Toolited brings together PDF editing, compression, and conversion tools so you can choose the right workflow for your document.",

  sections: [
    {
      heading: "What can you do with PDF files?",
      paragraphs: [
        "Different PDF tasks solve different problems. You may need to reduce a large document before sending it, combine a document with images, or convert its contents into an editable format.",
      ],
      bullets: [
        "Compress a PDF to reduce its file size.",
        "Edit a PDF when you need to make document changes.",
        "Convert images into a PDF for easier sharing.",
        "Convert PDF documents to Word or Excel when supported by the selected tool.",
      ],
    },
    {
      heading: "How to choose the right PDF tool",
      paragraphs: [
        "Start by identifying what you need to change. If the document is too large to email, use a compressor. If you need to work with its text or tables in another application, choose the appropriate conversion tool.",
        "After processing, open the resulting file and check that its text, layout, images, and formatting meet your needs.",
      ],
    },
    {
      heading: "Are online PDF tools safe to use?",
      paragraphs: [
        "File privacy depends on how the particular tool processes documents. Check its privacy information before uploading sensitive files, and verify whether processing takes place in your browser or on a remote server.",
      ],
    },
  ],

  relatedTools: [
    { label: "Compress PDF", href: "/pdf-tools/compress" },
    { label: "PDF Editor", href: "/pdf-tools/pdf-editor" },
    { label: "Image to PDF", href: "/pdf-tools/image-to-pdf" },
    { label: "Image Compressor", href: "/image-compressor" },
  ],
};

const FAQ = [
  {
    question: "Which PDF tasks can I do here?",
    answer:
      "Open the PDF editor, compress a document, convert images to PDF, or convert a PDF to Word or Excel. Choose a tool above to get started.",
  },
  {
    question: "Are my documents uploaded?",
    answer:
      "PDF processing runs in your browser for the tools on this page. Your files remain on your device while you work with them.",
  },
  {
    question: "Can I use these PDF tools on a phone?",
    answer:
      "Yes. The tool pages adapt to smaller screens, though editing or arranging many pages is usually easier on a larger display.",
  },
];

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
      <Navbar />

      <div className="relative min-h-screen overflow-hidden bg-page text-text">

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
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.title}
                  to={tool.path}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 bg-surface/70 p-8 backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:border-accent hover:shadow-[0_0_35px_color-mix(in_srgb,var(--theme-brand)_15%,transparent)]"
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/0 via-brand/0 to-accent/0 transition-all duration-500 group-hover:from-brand/5 group-hover:to-accent/10" />

                  <div className="relative">

                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent shadow-lg">
                      <Icon className="h-8 w-8 text-text" />
                    </div>

                    <h2 className="mt-6 text-2xl font-bold">
                      {tool.title}
                    </h2>

                    <p className="mt-3 leading-relaxed text-muted">
                      {tool.description}
                    </p>

                    <div className="mt-8 flex items-center gap-2 font-semibold text-brand">
                      Open Tool
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                    </div>

                  </div>
                </Link>
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