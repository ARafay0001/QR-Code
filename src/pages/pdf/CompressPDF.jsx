import { useRef, useState, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
import Footer from "../../components/common/Footer";
import {
  Upload,
  Download,
  RefreshCw,
  FileArchive,
  X,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Feather,
  Zap,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

export default function CompressPDF() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [compression, setCompression] = useState("medium");
  const [isDragging, setIsDragging] = useState(false);

  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  const [compressedPdf, setCompressedPdf] = useState(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");

  const compressionSettings = {
    low: {
      scale: 1.5,
      quality: 0.85,
      label: "Low Compression",
      hint: "Best quality",
      icon: Feather,
    },
    medium: {
      scale: 1.2,
      quality: 0.65,
      label: "Medium Compression",
      hint: "Recommended",
      icon: Gauge,
    },
    high: {
      scale: 0.9,
      quality: 0.45,
      label: "High Compression",
      hint: "Smallest file",
      icon: Zap,
    },
  };

  const chooseFile = () => {
    inputRef.current?.click();
  };

  const applyFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setCompressedSize(0);
    setCompressedPdf(null);
    setProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
    setError("");
  };

  const handleFile = (event) => {
    applyFile(event.target.files?.[0]);
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    applyFile(event.dataTransfer.files?.[0]);
  }, []);

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const changeFile = () => {
    setFile(null);
    setCompressedPdf(null);
    setCompressedSize(0);
    setProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const compressPDF = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setError("");
    setCompressedPdf(null);

    try {
      const settings = compressionSettings[compression];

      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

      setTotalPages(pdf.numPages);

      const outputPdf = await PDFDocument.create();

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setCurrentPage(pageNumber);

        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({
          scale: settings.scale,
        });

        const canvas = document.createElement("canvas");

        const context = canvas.getContext("2d", {
          alpha: false,
        });

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const jpegDataUrl = canvas.toDataURL("image/jpeg", settings.quality);

        const jpegBytes = await fetch(jpegDataUrl).then((response) =>
          response.arrayBuffer()
        );

        const image = await outputPdf.embedJpg(jpegBytes);

        const outputPage = outputPdf.addPage([viewport.width, viewport.height]);

        outputPage.drawImage(image, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });

        const percentage = Math.round((pageNumber / pdf.numPages) * 100);

        setProgress(percentage);
      }

      const pdfBytes = await outputPdf.save({
        useObjectStreams: true,
      });

      const compressedBlob = new Blob([pdfBytes], {
        type: "application/pdf",
      });

      // Never use a larger PDF as the "compressed" result.
      if (compressedBlob.size >= file.size) {
        setCompressedPdf(null);
        setCompressedSize(compressedBlob.size);

        setError(
          "This PDF is already well optimized. The selected compression level would make the file larger, so the original PDF is kept."
        );

        return;
      }

      setCompressedPdf(compressedBlob);
      setCompressedSize(compressedBlob.size);
    } catch (err) {
      console.error("PDF compression failed:", err);

      setError("Failed to compress this PDF. Please try another PDF file.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!compressedPdf || !file) return;

    const url = URL.createObjectURL(compressedPdf);

    const link = document.createElement("a");

    link.href = url;

    link.download = file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const compressionPercentage =
    originalSize && compressedSize
      ? Math.max(
          0,
          Math.round(((originalSize - compressedSize) / originalSize) * 100)
        )
      : 0;

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-page via-surface to-page text-text">
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="text-center">
            {/* <span className="inline-block rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-xs font-medium tracking-wide text-brand sm:py-2 sm:text-sm">
              PDF Tools
            </span> */}

            <h1 className="mt-5 text-3xl font-black sm:mt-6 sm:text-5xl">
              Compress PDF
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted sm:mt-5 sm:text-base">
              Reduce PDF file size while keeping your document readable.
            </p>
          </div>

          <input
            hidden
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFile}
          />

          {!file && (
            <div className="mt-10 sm:mt-16">
              <button
                onClick={chooseFile}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:rounded-3xl sm:py-24 ${
                  isDragging
                    ? "scale-[1.01] border-brand bg-brand/10"
                    : "border-border bg-surface/60 hover:border-accent hover:bg-surface"
                }`}
              >
                <div
                  className={`rounded-full p-4 transition-colors ${
                    isDragging ? "bg-brand/20" : "bg-surface/60"
                  }`}
                >
                  <Upload
                    size={36}
                    className={isDragging ? "text-brand" : "text-text"}
                  />
                </div>

                <span className="mt-5 text-lg font-bold sm:text-xl">
                  {isDragging ? "Drop your PDF here" : "Upload PDF"}
                </span>

                <span className="mt-2 text-sm text-muted">
                  Drag and drop, or click to browse your computer
                </span>

                {/* Important Note */}
                <div className="mt-6 flex max-w-md items-start gap-2 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-left sm:px-5">
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-warning"
                  />
                  <p className="text-xs text-warning sm:text-sm">
                    <span className="font-semibold">Note:</span> This
                    compression tool works only with scanned/image-based PDFs.
                  </p>
                </div>
              </button>
            </div>
          )}

          {file && (
            <div className="mt-10 grid gap-6 sm:mt-16 sm:gap-8 lg:grid-cols-[320px_1fr]">
              {/* Sidebar */}
              <div className="h-fit rounded-2xl border border-border bg-surface/60 p-5 sm:rounded-3xl sm:p-6 lg:sticky lg:top-6">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-brand/10 p-2.5">
                    <FileArchive className="text-brand" size={24} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold" title={file.name}>
                      {file.name}
                    </p>

                    <p className="mt-0.5 text-sm text-muted">
                      {formatSize(originalSize)}
                    </p>
                  </div>

                  <button
                    onClick={changeFile}
                    disabled={loading}
                    aria-label="Remove file"
                    className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-text disabled:opacity-40"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-7 sm:mt-8">
                  <h2 className="text-base font-bold sm:text-lg">
                    Compression Level
                  </h2>

                  <div className="mt-4 space-y-2.5">
                    {Object.entries(compressionSettings).map(([key, opt]) => {
                      const Icon = opt.icon;
                      const active = compression === key;

                      return (
                        <button
                          key={key}
                          onClick={() => setCompression(key)}
                          disabled={loading}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            active
                              ? "bg-brand shadow-lg shadow-brand/20"
                              : "border border-border hover:border-accent/60 hover:bg-surface/50"
                          }`}
                        >
                          <Icon
                            size={18}
                            className={active ? "text-text" : "text-muted"}
                          />
                          <span className="flex-1">
                            <span className="block text-sm font-semibold">
                              {opt.label}
                            </span>
                            <span
                              className={`text-xs ${
                                active ? "text-brand" : "text-muted"
                              }`}
                            >
                              {opt.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={compressPDF}
                  disabled={loading}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-bold transition hover:bg-accent active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-8"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    "Compress PDF"
                  )}
                </button>

                <button
                  onClick={changeFile}
                  disabled={loading}
                  className="mt-3 w-full rounded-xl border border-border py-3 font-semibold transition hover:border-accent disabled:opacity-50"
                >
                  Change PDF
                </button>
              </div>

              {/* Result */}
              <div className="rounded-2xl border border-border bg-surface/60 p-5 sm:rounded-3xl sm:p-8">
                <h2 className="text-xl font-bold sm:text-2xl">
                  Compression Result
                </h2>

                {!compressedPdf && !loading && !error && (
                  <div className="mt-10 text-center text-muted sm:mt-12">
                    <FileArchive size={56} className="mx-auto opacity-30 sm:size-16" />

                    <p className="mt-5 text-sm sm:text-base">
                      Choose a compression level and compress your PDF.
                    </p>

                    <div className="mx-auto mt-6 flex max-w-md items-start gap-2 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-left sm:px-5">
                      <AlertTriangle
                        size={16}
                        className="mt-0.5 shrink-0 text-warning"
                      />
                      <p className="text-xs text-warning sm:text-sm">
                        <span className="font-semibold">Note:</span> This
                        compression tool works only with scanned/image-based
                        PDFs.
                      </p>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="mt-10 sm:mt-12">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>
                        Processing page {currentPage} of {totalPages || "…"}
                      </span>
                      <span className="font-semibold text-brand">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface sm:h-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <p className="mt-4 text-xs text-muted sm:text-sm">
                      Larger files with many pages can take a little longer.
                      Keep this tab open.
                    </p>
                  </div>
                )}

                {compressedPdf && (
                  <div className="mt-8 animate-[fadeIn_0.3s_ease-out] sm:mt-10">
                    <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
                      <CheckCircle2 size={18} className="shrink-0" />
                      Your PDF was compressed successfully.
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 xs:grid-cols-3 sm:grid-cols-3 sm:gap-4">
                      <div className="rounded-xl bg-page/60 p-4 sm:rounded-2xl sm:p-5">
                        <p className="text-xs text-muted sm:text-sm">
                          Original
                        </p>
                        <p className="mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl">
                          {formatSize(originalSize)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-page/60 p-4 sm:rounded-2xl sm:p-5">
                        <p className="text-xs text-muted sm:text-sm">
                          Compressed
                        </p>
                        <p className="mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl">
                          {formatSize(compressedSize)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-brand/10 p-4 sm:rounded-2xl sm:p-5">
                        <p className="text-xs text-brand sm:text-sm">
                          Reduced
                        </p>
                        <p className="mt-1.5 text-lg font-bold text-brand sm:mt-2 sm:text-2xl">
                          {compressionPercentage}%
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={downloadPDF}
                      className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-bold transition hover:bg-accent active:scale-[0.99] sm:mt-8 sm:py-4"
                    >
                      <Download size={20} />
                      Download Compressed PDF
                    </button>

                    <div className="mx-auto mt-6 flex max-w-md items-start gap-2 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-left sm:px-5">
                      <AlertTriangle
                        size={16}
                        className="mt-0.5 shrink-0 text-warning"
                      />
                      <p className="text-xs text-warning sm:text-sm">
                        <span className="font-semibold">Note:</span> This
                        compression tool currently works only with
                        scanned/image-based PDFs.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-6 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
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