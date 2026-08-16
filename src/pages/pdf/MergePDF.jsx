import { useRef, useState, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Upload, FilePlus2, AlertTriangle, Info } from "lucide-react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import { PDFDocument } from "pdf-lib";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import SortablePDFItem from "../../components/pdf/SortablePDFItem";

export default function MergePDF() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const chooseFiles = () => {
    inputRef.current.click();
  };

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);

    if (incoming.length === 0) return;

    const validPdfs = incoming.filter(
      (file) => file.type === "application/pdf"
    );

    if (validPdfs.length < incoming.length) {
      setError("Some files were skipped because they weren't PDFs.");
    } else {
      setError("");
    }

    if (validPdfs.length === 0) return;

    const selected = validPdfs.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
    }));

    setFiles((prev) => [...prev, ...selected]);
  };

  const handleFiles = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setFiles((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);

      const newIndex = items.findIndex((item) => item.id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError("Select at least two PDFs to merge.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const bytes = await item.file.arrayBuffer();

        const pdf = await PDFDocument.load(bytes);

        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );

        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();

      const blob = new Blob([mergedBytes], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "merged.pdf";

      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF merge failed:", err);
      setError(
        "Failed to merge these PDFs. Make sure every file is a valid, unencrypted PDF."
      );
    } finally {
      setLoading(false);
    }
  };

  const totalSizeMb = (
    files.reduce((sum, file) => sum + file.size, 0) /
    1024 /
    1024
  ).toFixed(2);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          {/* Hero */}
          <div className="text-center">
            <span className="inline-block rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-red-400 sm:py-2 sm:text-sm">
              PDF Tools
            </span>

            <h1 className="mt-5 text-3xl font-black sm:mt-6 sm:text-5xl">
              Merge PDF Files
            </h1>

            <p className="mt-4 text-sm text-slate-400 sm:mt-5 sm:text-base">
              Combine multiple PDF files into one document.
            </p>
          </div>

          {/* Card */}
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:mt-16 sm:rounded-3xl sm:p-8">
            <input
              ref={inputRef}
              hidden
              multiple
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFiles}
            />

            <button
              onClick={chooseFiles}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:flex-row sm:gap-3 sm:py-10 ${
                isDragging
                  ? "scale-[1.01] border-red-500 bg-red-500/10"
                  : "border-slate-700 hover:border-blue-500 hover:bg-slate-900/40"
              }`}
            >
              <Upload
                size={26}
                className={isDragging ? "text-red-400" : "text-slate-300"}
              />
              <span className="font-semibold">
                {isDragging ? "Drop your PDFs here" : "Upload PDFs"}
              </span>
              <span className="text-sm font-normal text-slate-500 sm:before:mx-1 sm:before:content-['·']">
                or drag and drop, select multiple
              </span>
            </button>

            {files.length === 0 && !error && (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-left sm:px-5">
                <Info size={16} className="mt-0.5 shrink-0 text-slate-500" />
                <p className="text-xs text-slate-400 sm:text-sm">
                  Add at least two PDFs, then drag them into the order you
                  want before merging.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left text-sm text-red-400">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-8 sm:mt-10">
                {/* Header */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold sm:text-xl">
                      Uploaded PDFs
                    </h3>

                    <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold sm:px-3 sm:py-1 sm:text-sm">
                      {files.length}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 sm:text-sm">
                    Total: {totalSizeMb} MB
                  </span>
                </div>

                <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 sm:mb-6 sm:text-sm">
                  Drag items to reorder — pages merge top to bottom.
                </p>

                {/* Draggable List */}
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={files}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 sm:space-y-4">
                      {files.map((file, index) => (
                        <SortablePDFItem
                          key={file.id}
                          file={file}
                          onRemove={() => removeFile(index)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Merge Button */}
                <button
                  onClick={mergePDFs}
                  disabled={files.length < 2 || loading}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-base font-bold transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-8 sm:py-4 sm:text-lg"
                >
                  {loading ? (
                    <>
                      <FilePlus2 size={20} className="animate-pulse" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <FilePlus2 size={20} />
                      Merge PDFs
                    </>
                  )}
                </button>

                {files.length === 1 && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    Add one more PDF to enable merging.
                  </p>
                )}

                {/* Clear */}
                <button
                  onClick={() => {
                    setFiles([]);
                    setError("");
                  }}
                  disabled={loading}
                  className="mt-3 w-full rounded-xl border border-slate-700 py-3 font-semibold transition hover:border-red-500 hover:text-red-400 disabled:opacity-50"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}