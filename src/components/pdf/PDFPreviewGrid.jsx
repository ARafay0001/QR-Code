import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Check } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PDFPreviewGrid({
  file,
  pageCount,
  mode,
  selectedPages,
  setSelectedPages,
  lastSelectedPage,
  setLastSelectedPage,
  zoom,
}) {
  const togglePage = (page) => {
    setSelectedPages((prev) => {
      if (prev.includes(page)) {
        return prev.filter((p) => p !== page);
      }

      return [...prev, page].sort((a, b) => a - b);
    });
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          PDF Preview
        </h2>

        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm">
          {pageCount} Pages
        </span>
      </div>

      <Document
        file={file}
        loading="Loading PDF..."
      >
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from(
            { length: pageCount },
            (_, i) => i + 1
          ).map((page) => (
            <button
              key={page}
              onClick={() => {
                if (mode === "custom") {
                  togglePage(page);
                }
              }}
              className={`group overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                selectedPages.includes(page)
                  ? "border-2 border-blue-500 shadow-lg shadow-blue-500/20"
                  : "border border-slate-700 hover:border-blue-500"
              }`}
            >
              <div
                className="relative flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-200"
              style={{
  height: "220px",
}}
              >
                {selectedPages.includes(page) && (
                  <div className="absolute inset-0 z-10 rounded-lg border-4 border-blue-500 bg-blue-500/10" />
                )}

       <Page
  pageNumber={page}
  width={150}
  scale={zoom}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-700 bg-slate-900 px-4 py-3">
                <span className="font-semibold">
                  Page {page}
                </span>

                {selectedPages.includes(page) && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600">
                    <Check size={16} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </Document>
    </div>
  );
}