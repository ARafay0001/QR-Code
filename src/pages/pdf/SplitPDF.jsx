import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Upload } from "lucide-react";
import { PDFDocument } from "pdf-lib";

import PDFSidebar from "../../components/pdf/PDFSidebar";
import PDFPreviewGrid from "../../components/pdf/PDFPreviewGrid";

export default function SplitPDF() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);

  // range | custom
  const [mode, setMode] = useState("range");

  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);

  // Pages that will actually be extracted
  const [selectedPages, setSelectedPages] = useState([]);

  // Text entered by the user in Custom mode
  const [pageInput, setPageInput] = useState("");

  const [inputError, setInputError] = useState("");

  // Automatically select a continuous range
  // when Range mode is active.
  useEffect(() => {
    if (!pageCount || mode !== "range") return;

    const start = Number(startPage);
    const end = Number(endPage);

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end > pageCount ||
      start > end
    ) {
      return;
    }

    const pages = [];

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    setSelectedPages(pages);
  }, [startPage, endPage, pageCount, mode]);

  // Parse:
  // 1,3-6,9,14
  //
  // into:
  // [1,3,4,5,6,9,14]
  const parsePageInput = (input) => {
    if (!input.trim()) {
      return [];
    }

    const parts = input
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const pages = [];

    for (const part of parts) {
      // Single page
      if (/^\d+$/.test(part)) {
        const page = Number(part);

        if (page < 1 || page > pageCount) {
          throw new Error(
            `Page ${page} does not exist. Your PDF has ${pageCount} pages.`
          );
        }

        pages.push(page);
        continue;
      }

      // Range: 3-6
      if (/^\d+\s*-\s*\d+$/.test(part)) {
        const [start, end] = part
          .split("-")
          .map((value) => Number(value.trim()));

        if (start < 1 || end > pageCount) {
          throw new Error(
            `Page range ${part} is outside the PDF page range.`
          );
        }

        if (start > end) {
          throw new Error(
            `Invalid range ${part}. The first page must be smaller than the second.`
          );
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        continue;
      }

      throw new Error(
        `Invalid page format: "${part}". Use formats like 1,3-6,9,14.`
      );
    }

    // Remove duplicates and sort
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const handleCustomInput = (value) => {
    setPageInput(value);
    setInputError("");

    if (!value.trim()) {
      setSelectedPages([]);
      return;
    }

    try {
      const pages = parsePageInput(value);

      setSelectedPages(pages);
    } catch (error) {
      setSelectedPages([]);
      setInputError(error.message);
    }
  };

  const chooseFile = () => {
  inputRef.current.click();
};

const onChangeFile = () => {
  inputRef.current.value = "";
  inputRef.current.click();
};
  const handleFile = async (e) => {
    const pdf = e.target.files[0];

    if (!pdf) return;

    try {
      setFile(pdf);

      const bytes = await pdf.arrayBuffer();

      const pdfDoc = await PDFDocument.load(bytes);

      const totalPages = pdfDoc.getPageCount();

      setPageCount(totalPages);

      // Reset everything
      setMode("range");

      setStartPage(1);
      setEndPage(totalPages);

      setPageInput("");

      setInputError("");

      // Initially select every page
      setSelectedPages(
        Array.from(
          { length: totalPages },
          (_, i) => i + 1
        )
      );
    } catch (error) {
      console.error("Failed to load PDF:", error);

      setFile(null);
      setPageCount(0);
      setSelectedPages([]);

      setInputError("Unable to read this PDF file.");
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setInputError("");

    if (newMode === "range") {
      setPageInput("");

      const start = Number(startPage);
      const end = Number(endPage);

      if (
        start >= 1 &&
        end <= pageCount &&
        start <= end
      ) {
        const pages = [];

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        setSelectedPages(pages);
      }
    }

    if (newMode === "custom") {
      setPageInput("");
      setSelectedPages([]);
    }
  };
const handleDownload = async () => {
  if (!file || selectedPages.length === 0) return;

  try {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);

    const newPdf = await PDFDocument.create();

    const pages = await newPdf.copyPages(
      pdf,
      selectedPages.map((page) => page - 1)
    );

    pages.forEach((page) => {
      newPdf.addPage(page);
    });

    const pdfBytes = await newPdf.save();

    const blob = new Blob([pdfBytes], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.name.replace(/\.pdf$/i, "")}-split.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to create PDF:", error);
  }
};
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <main className="mx-auto max-w-7xl px-6 py-16">

          {/* Header */}
          <div className="text-center">

            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              PDF Tools
            </span>

            <h1 className="mt-6 text-5xl font-black">
              Split PDF
            </h1>

            <p className="mt-5 text-slate-400">
              Extract any pages from your PDF.
            </p>

          </div>

          <div className="mt-16">

            {/* File input */}
            <input
              hidden
              ref={inputRef}
              type="file"
              accept=".pdf"
              onChange={handleFile}
            />

            {/* Upload area */}
            {!file && (
              <button
                onClick={chooseFile}
                className="flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 py-20 transition hover:border-blue-500"
              >
                <Upload size={30} />
                Upload PDF
              </button>
            )}

            {/* PDF workspace */}
            {file && (
              <div className="grid gap-8 lg:grid-cols-[340px_1fr]">

               <PDFSidebar
  file={file}

  mode={mode}
  setMode={handleModeChange}

  startPage={startPage}
  setStartPage={setStartPage}

  endPage={endPage}
  setEndPage={setEndPage}

  pageCount={pageCount}

  selectedPages={selectedPages}
  setSelectedPages={setSelectedPages}

  pageInput={pageInput}
  setPageInput={handleCustomInput}

  inputError={inputError}

  onChangeFile={onChangeFile}

  onDownload={handleDownload}
/>
                <PDFPreviewGrid
                  file={file}
                  pageCount={pageCount}
                  mode={mode}

                  selectedPages={selectedPages}
                  setSelectedPages={setSelectedPages}
                />

              </div>
            )}

          </div>

        </main>
      </div>

      <Footer />
    </>
  );
}