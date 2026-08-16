import { useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Upload,
  FileText,
  Download,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Document as WordDocument, Packer, Paragraph } from "docx";

import { createWorker } from "tesseract.js";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PDFToWord() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wordUrl, setWordUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const chooseFile = () => {
    inputRef.current?.click();
  };

  const loadFile = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setStatus("");
    setWordUrl(null);
    setPageCount(0);
    setProgress(0);

    try {
      const bytes = await selectedFile.arrayBuffer();

      const pdf = await pdfjs.getDocument({
        data: bytes,
      }).promise;

      setPageCount(pdf.numPages);
    } catch (err) {
      console.error(err);
      setFile(null);
      setError("Unable to read this PDF file.");
    }
  };

  const handleFile = async (e) => {
    await loadFile(e.target.files?.[0]);
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    await loadFile(e.dataTransfer.files?.[0]);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const extractTextFromPDF = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setWordUrl(null);
    setStatus("Opening PDF...");
    setProgress(0);

    let worker = null;

    try {
      const bytes = await file.arrayBuffer();

      const pdf = await pdfjs.getDocument({
        data: bytes,
      }).promise;

      const paragraphs = [];

      worker = await createWorker("eng");

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setStatus(`Processing page ${pageNumber} of ${pdf.numPages}...`);

        const page = await pdf.getPage(pageNumber);

        /*
         * First try selectable PDF text.
         */
        const textContent = await page.getTextContent();

        const textItems = textContent.items || [];

        const selectableText = textItems
          .map((item) => item.str || "")
          .join(" ")
          .trim();

        if (selectableText.length > 0) {
          /*
           * Normal PDF.
           */
          const lines = selectableText
            .split(/\s{2,}/)
            .map((line) => line.trim())
            .filter(Boolean);

          if (lines.length > 0) {
            lines.forEach((line) => {
              paragraphs.push(
                new Paragraph({
                  text: line,
                })
              );
            });
          }
        } else {
          /*
           * Scanned PDF.
           *
           * Render page to a high-resolution canvas.
           */
          setStatus(`OCR: processing page ${pageNumber} of ${pdf.numPages}...`);

          const scale = 3;

          const viewport = page.getViewport({
            scale,
          });

          const canvas = document.createElement("canvas");

          const context = canvas.getContext("2d", {
            willReadFrequently: true,
          });

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          /*
           * Convert canvas to PNG.
           */
          const image = canvas.toDataURL("image/png");

          /*
           * OCR.
           */
          const result = await worker.recognize(image);

          const ocrText = result?.data?.text?.trim() || "";

          console.log(`OCR page ${pageNumber}:`, ocrText);

          if (ocrText.length > 0) {
            const lines = ocrText
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);

            lines.forEach((line) => {
              paragraphs.push(
                new Paragraph({
                  text: line,
                })
              );
            });
          } else {
            paragraphs.push(
              new Paragraph({
                text: `[No text detected on page ${pageNumber}]`,
              })
            );
          }

          /*
           * Free canvas memory.
           */
          canvas.width = 1;
          canvas.height = 1;
        }

        /*
         * Add page separator.
         */
        if (pageNumber < pdf.numPages) {
          paragraphs.push(
            new Paragraph({
              text: "",
            })
          );
        }

        setProgress(Math.round((pageNumber / pdf.numPages) * 100));
      }

      /*
       * Stop OCR worker.
       */
      await worker.terminate();
      worker = null;

      /*
       * Make sure we actually have content.
       */
      if (paragraphs.length === 0) {
        throw new Error("No text could be extracted or recognized from this PDF.");
      }

      setStatus("Creating Word document...");

      const wordDocument = new WordDocument({
        creator: "QRify",
        title: file.name.replace(/\.pdf$/i, ""),
        sections: [
          {
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(wordDocument);

      if (!blob || blob.size === 0) {
        throw new Error("The Word document was generated empty.");
      }

      console.log("Generated Word file size:", blob.size);

      const url = URL.createObjectURL(blob);

      setWordUrl(url);

      setStatus("PDF successfully converted to Word.");
    } catch (err) {
      console.error("PDF to Word conversion error:", err);

      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Ignore worker cleanup errors
        }
      }

      setWordUrl(null);

      setError(err.message || "Failed to convert this PDF.");

      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const downloadWord = () => {
    if (!wordUrl || !file) return;

    const link = document.createElement("a");

    link.href = wordUrl;

    link.download = `${file.name.replace(/\.pdf$/i, "")}.docx`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const changeFile = () => {
    if (wordUrl) {
      URL.revokeObjectURL(wordUrl);
    }

    setFile(null);
    setPageCount(0);
    setStatus("");
    setError("");
    setWordUrl(null);
    setProgress(0);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          {/* Header */}
          <div className="text-center">
            <span className="inline-block rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-red-400 sm:py-2 sm:text-sm">
              PDF Tools
            </span>

            <h1 className="mt-5 text-3xl font-black sm:mt-6 sm:text-5xl">
              PDF to Word
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 sm:mt-5 sm:text-base">
              Convert your PDF into an editable Word document.
            </p>
          </div>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFile}
          />

          {/* Upload */}
          {!file && (
            <div className="mt-10 sm:mt-16">
              <button
                onClick={chooseFile}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:rounded-3xl sm:py-24 ${
                  isDragging
                    ? "scale-[1.01] border-red-500 bg-red-500/10"
                    : "border-slate-700 bg-slate-900/60 hover:border-blue-500 hover:bg-slate-900"
                }`}
              >
                <div
                  className={`rounded-full p-4 transition-colors ${
                    isDragging ? "bg-red-500/20" : "bg-slate-800/60"
                  }`}
                >
                  <Upload
                    size={36}
                    className={isDragging ? "text-red-400" : "text-slate-300"}
                  />
                </div>

                <span className="mt-5 text-lg font-bold sm:text-xl">
                  {isDragging ? "Drop your PDF here" : "Upload PDF"}
                </span>

                <span className="mt-2 text-sm text-slate-400">
                  Drag and drop, or click to browse your computer
                </span>
              </button>
            </div>
          )}

          {/* Workspace */}
          {file && (
            <div className="mt-10 grid gap-6 sm:mt-16 sm:gap-8 lg:grid-cols-[340px_1fr]">
              {/* Sidebar */}
              <div className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:rounded-3xl sm:p-6 lg:sticky lg:top-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold sm:text-2xl">
                    PDF Information
                  </h2>

                  <button
                    onClick={changeFile}
                    disabled={loading}
                    aria-label="Remove file"
                    className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:mt-8 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-red-500/10 p-2">
                      <FileText size={20} className="text-red-400" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold" title={file.name}>
                        {file.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:mt-6 sm:p-5">
                  <p className="text-sm text-slate-400 sm:text-base">
                    Total Pages
                  </p>

                  <p className="text-2xl font-bold sm:text-3xl">{pageCount}</p>
                </div>

                <button
                  onClick={extractTextFromPDF}
                  disabled={loading}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-8"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Convert to Word
                    </>
                  )}
                </button>

                <button
                  onClick={changeFile}
                  disabled={loading}
                  className="mt-3 w-full rounded-xl border border-slate-700 py-3 font-semibold transition hover:border-blue-500 disabled:opacity-50"
                >
                  Change PDF
                </button>

                {loading && (
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span className="truncate pr-2">{status}</span>
                      <span className="shrink-0 font-semibold text-blue-400">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {!loading && status && (
                  <p className="mt-5 text-center text-sm text-slate-400">
                    {status}
                  </p>
                )}

                {error && (
                  <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-400">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Result */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:rounded-3xl sm:p-6">
                <h2 className="text-xl font-bold sm:text-2xl">
                  Conversion Result
                </h2>

                {!wordUrl && !loading && (
                  <div className="flex min-h-[280px] items-center justify-center sm:min-h-[350px]">
                    <div className="text-center">
                      <FileText size={52} className="mx-auto text-slate-700 sm:size-[60px]" />

                      <p className="mt-5 text-base font-semibold text-slate-400 sm:text-lg">
                        Your Word document will appear here
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Upload a PDF and click Convert to Word.
                      </p>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="flex min-h-[280px] items-center justify-center sm:min-h-[350px]">
                    <div className="w-full max-w-xs text-center">
                      <RefreshCw
                        size={44}
                        className="mx-auto animate-spin text-blue-500 sm:size-[50px]"
                      />

                      <p className="mt-5 font-semibold">Converting PDF...</p>

                      <p className="mt-2 text-sm text-slate-400">{status}</p>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {progress}% complete
                      </p>
                    </div>
                  </div>
                )}

                {wordUrl && !loading && (
                  <div className="mt-6 animate-[fadeIn_0.3s_ease-out] sm:mt-8">
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                      <CheckCircle2 size={18} className="shrink-0" />
                      Your document was converted successfully.
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 sm:p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 sm:h-14 sm:w-14">
                          <FileText size={24} className="sm:size-7" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold">Word document ready</h3>

                          <p className="mt-1 truncate text-sm text-slate-400">
                            {file.name.replace(/\.pdf$/i, ".docx")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={downloadWord}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold transition hover:bg-blue-500 active:scale-[0.99] sm:py-4"
                    >
                      <Download size={20} />
                      Download Word Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}