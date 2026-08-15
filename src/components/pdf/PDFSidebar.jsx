import { FileText, Download  } from "lucide-react";
import { PDFDocument } from "pdf-lib";
export default function PDFSidebar({
  file,
  mode,
  setMode,
  startPage,
  setStartPage,
  endPage,
  setEndPage,
  pageCount,
  selectedPages,
  setSelectedPages,
  pageInput,
  setPageInput,
  inputError,
}) {
  const downloadPDF = async () => {
  if (!file || selectedPages.length === 0) return;

  try {
    const bytes = await file.arrayBuffer();

    const sourcePDF = await PDFDocument.load(bytes);
    const newPDF = await PDFDocument.create();

    const pageIndexes = selectedPages.map((page) => page - 1);

    const copiedPages = await newPDF.copyPages(
      sourcePDF,
      pageIndexes
    );

    copiedPages.forEach((page) => {
      newPDF.addPage(page);
    });

    const pdfBytes = await newPDF.save();

    const blob = new Blob([pdfBytes], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${file.name.replace(
      /\.pdf$/i,
      ""
    )}-split.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF split failed:", error);
    alert("Failed to create the PDF. Please try again.");
  }
};
  const selectAll = () => {
    const pages = Array.from(
      { length: pageCount },
      (_, i) => i + 1
    );

    setSelectedPages(pages);

    // Keep custom input synchronized
    if (mode === "custom") {
      setPageInput(
        pages.length === pageCount
          ? `1-${pageCount}`
          : pages.join(",")
      );
    }
  };

  const clearSelection = () => {
    setSelectedPages([]);

    if (mode === "custom") {
      setPageInput("");
    }
  };

  const invertSelection = () => {
    const allPages = Array.from(
      { length: pageCount },
      (_, i) => i + 1
    );

    const invertedPages = allPages.filter(
      (page) => !selectedPages.includes(page)
    );

    setSelectedPages(invertedPages);

    if (mode === "custom") {
      setPageInput(
        formatPageRanges(invertedPages)
      );
    }
  };

  const formatPageRanges = (pages) => {
    if (!pages.length) return "";

    const sorted = [...pages].sort(
      (a, b) => a - b
    );

    const ranges = [];

    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(
          start === end
            ? `${start}`
            : `${start}-${end}`
        );

        start = sorted[i];
        end = sorted[i];
      }
    }

    ranges.push(
      start === end
        ? `${start}`
        : `${start}-${end}`
    );

    return ranges.join(",");
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">

      {/* PDF INFORMATION */}

      <h2 className="text-2xl font-bold">
        PDF Information
      </h2>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

        <div className="flex items-start gap-3">

          <FileText className="mt-1 flex-shrink-0 text-red-400" />

          <div className="min-w-0">

            <h3 className="break-all font-semibold">
              {file.name}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>

          </div>

        </div>

      </div>


      {/* PAGE COUNT */}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

        <p className="text-slate-400">
          Total Pages
        </p>

        <h3 className="mt-2 text-3xl font-bold">
          {pageCount}
        </h3>

      </div>


      {/* EXTRACTION MODE */}

      <div className="mt-8">

        <h3 className="mb-4 text-lg font-bold">
          Extraction Mode
        </h3>

        <div className="grid grid-cols-2 gap-3">

          <button
            onClick={() => setMode("range")}
            className={`cursor-pointer rounded-xl py-3 font-semibold transition ${
              mode === "range"
                ? "bg-blue-600 text-white"
                : "border border-slate-700 text-slate-300 hover:border-blue-500"
            }`}
          >
            Range
          </button>

          <button
            onClick={() => setMode("custom")}
            className={`cursor-pointer rounded-xl py-3 font-semibold transition ${
              mode === "custom"
                ? "bg-blue-600 text-white"
                : "border border-slate-700 text-slate-300 hover:border-blue-500"
            }`}
          >
            Custom
          </button>

        </div>


        {/* RANGE MODE */}

        {mode === "range" && (

          <div className="mt-8">

            <h3 className="mb-4 text-lg font-bold">
              Page Range
            </h3>

            <div className="space-y-5">

              <div>

                <label className="mb-2 block text-sm text-slate-400">
                  Start Page
                </label>

                <input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={startPage}
                  onChange={(e) => {
                    let value = Number(
                      e.target.value
                    );

                    if (!value) {
                      value = 1;
                    }

                    if (value < 1) {
                      value = 1;
                    }

                    if (value > pageCount) {
                      value = pageCount;
                    }

                    setStartPage(value);

                    if (value > endPage) {
                      setEndPage(value);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-blue-500"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm text-slate-400">
                  End Page
                </label>

                <input
                  type="number"
                  min={startPage}
                  max={pageCount}
                  value={endPage}
                  onChange={(e) => {
                    let value = Number(
                      e.target.value
                    );

                    if (!value) {
                      value = startPage;
                    }

                    if (value < startPage) {
                      value = startPage;
                    }

                    if (value > pageCount) {
                      value = pageCount;
                    }

                    setEndPage(value);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-blue-500"
                />

              </div>

            </div>

            <div className="mt-5 rounded-xl bg-slate-800/70 p-4">

              <p className="text-sm text-slate-400">
                Pages to extract
              </p>

              <p className="mt-2 font-semibold text-blue-400">
                {startPage}–{endPage}
              </p>

            </div>

          </div>

        )}


        {/* CUSTOM MODE */}

        {mode === "custom" && (

          <div className="mt-8">

            <h3 className="text-lg font-bold">
              Custom Pages
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Enter the pages you want to extract.
            </p>


            {/* PAGE INPUT */}

            <input
              type="text"
              value={pageInput}
              onChange={(e) =>
                setPageInput(e.target.value)
              }
              placeholder="1,3-6,9,14"
              className={`mt-5 w-full rounded-xl border bg-slate-800 px-4 py-3 outline-none transition ${
                inputError
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-700 focus:border-blue-500"
              }`}
            />


            <p className="mt-2 text-xs text-slate-500">
              Example: 1,3-6,9,14
            </p>


            {/* ERROR */}

            {inputError && (

              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">

                <p className="text-sm text-red-400">
                  {inputError}
                </p>

              </div>

            )}


            {/* CURRENT SELECTION */}

            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/50 p-4">

              <p className="text-sm text-slate-400">
                Selected Pages
              </p>

              {selectedPages.length === 0 ? (

                <p className="mt-2 text-sm text-slate-500">
                  No pages selected
                </p>

              ) : (

                <>

                  <div className="mt-3 rounded-xl bg-slate-900 p-3">

                    <p className="break-words text-sm leading-7 text-blue-400">
                      {formatPageRanges(
                        selectedPages
                      )}
                    </p>

                  </div>

                  <p className="mt-3 text-sm text-slate-400">
                    {selectedPages.length} page
                    {selectedPages.length !== 1
                      ? "s"
                      : ""}{" "}
                    selected
                  </p>

                </>

              )}

            </div>

          </div>

        )}

      </div>


      {/* SELECTION CONTROLS */}

      <div className="mt-8 space-y-3">

        <button
          onClick={selectAll}
          className="w-full rounded-xl border border-slate-700 py-3 font-semibold transition hover:border-blue-500 hover:bg-blue-500/5"
        >
          Select All
        </button>

        <button
          onClick={clearSelection}
          className="w-full rounded-xl border border-slate-700 py-3 font-semibold transition hover:border-red-500 hover:bg-red-500/5"
        >
          Clear Selection
        </button>

        <button
          onClick={invertSelection}
          className="w-full rounded-xl border border-slate-700 py-3 font-semibold transition hover:border-yellow-500 hover:bg-yellow-500/5"
        >
          Invert Selection
        </button>

      </div>


      {/* FINAL SELECTION SUMMARY */}

      <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">

        <h3 className="mb-3 text-lg font-bold">
          Extraction Summary
        </h3>

        {selectedPages.length === 0 ? (

          <p className="text-sm text-slate-400">
            No pages selected
          </p>

        ) : (

          <>
            <div className="rounded-xl bg-slate-900 p-4">

              <p className="break-words text-sm leading-7">
                {formatPageRanges(
                  selectedPages
                )}
              </p>

            </div>

            <p className="mt-4 text-sm text-slate-400">
              {selectedPages.length} page
              {selectedPages.length !== 1
                ? "s"
                : ""}{" "}
              will be extracted
            </p>
          </>

        )}

      </div>
        <button
  onClick={downloadPDF}
  disabled={selectedPages.length === 0}
  className={`mt-6 flex w-full items-center justify-center gap-3 rounded-xl py-4 text-lg font-bold transition ${
    selectedPages.length === 0
      ? "cursor-not-allowed bg-slate-700 text-slate-500"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  <Download size={20} />

  {selectedPages.length === 0
    ? "Select Pages First"
    : `Download PDF (${selectedPages.length} ${
        selectedPages.length === 1 ? "Page" : "Pages"
      })`}
</button>
    </div>
  );
}