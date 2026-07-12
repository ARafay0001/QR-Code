import { useRef, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Upload } from "lucide-react";
import { PDFDocument } from "pdf-lib";
export default function SplitPDF() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [pageCount, setPageCount] = useState(0);

  const [startPage, setStartPage] = useState(1);

  const [endPage, setEndPage] = useState(1);

  const chooseFile = () => {
    inputRef.current.click();
  };

  const handleFiles = async (e) => {
  const pdf = e.target.files[0];

  if (!pdf) return;

  setFile(pdf);

  // Read PDF
  const bytes = await pdf.arrayBuffer();

  const pdfDoc = await PDFDocument.load(bytes);

  const totalPages = pdfDoc.getPageCount();

  setPageCount(totalPages);

  // Default range
  setStartPage(1);
  setEndPage(totalPages);
};
  const splitPDF = async () => {
  if (!file) return;

  setLoading(true);

  try {
    const bytes = await file.arrayBuffer();

    const pdf = await PDFDocument.load(bytes);

    const newPdf = await PDFDocument.create();

    const pages = await newPdf.copyPages(
      pdf,
      Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage - 1 + i
      )
    );

    pages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();

    const blob = new Blob([pdfBytes], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `${file.name.replace(".pdf", "")}-pages-${startPage}-${endPage}.pdf`;

    a.click();

    URL.revokeObjectURL(url);

  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="text-center">
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              PDF Tools
            </span>

            <h1 className="mt-6 text-5xl font-black">Split PDF</h1>

            <p className="mt-5 text-slate-400">
              Extract pages from a PDF document.
            </p>
          </div>

          <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
            <input
              ref={inputRef}
              hidden
              type="file"
              accept=".pdf"
              onChange={handleFiles}
            />

            <button 
              onClick={chooseFile}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-700 py-10 transition hover:border-blue-500"
            >
              <Upload size={28} />
              Upload PDF
            </button>
{file && (
  <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-4">

    <p className="font-semibold">
      {file.name}
    </p>

    <p className="mt-2 text-slate-400">
      Total Pages:
      <span className="ml-2 font-bold text-white">
        {pageCount}
      </span>
    </p>

  </div>
)}
            {file && (
              <div className="mt-10">
                <div className="rounded-2xl border border-slate-800 p-5">
                  <h3 className="text-xl font-bold">{file.name}</h3>

                  <p className="mt-2 text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block">Start Page</label>
<input
  type="number"
  value={startPage}
  onChange={(e) => setStartPage(e.target.value)}
  onBlur={() => {
    let value = Number(startPage);

    if (isNaN(value) || value < 1) value = 1;
    if (value > pageCount) value = pageCount;

    setStartPage(value);

    if (endPage < value) {
      setEndPage(value);
    }
  }}
  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
/>
                  </div>

                  <div>
                    <label className="mb-2 block">End Page</label>
                  <input
  type="number"
  value={endPage}
  onChange={(e) => setEndPage(e.target.value)}
  onBlur={() => {
    let value = Number(endPage);

    if (isNaN(value) || value < startPage)
      value = startPage;

    if (value > pageCount)
      value = pageCount;

    setEndPage(value);
  }}
  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
/>
                  </div>
                </div>

                <button
                  onClick={splitPDF}
                  disabled={loading}
                  className="mt-8 w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold hover:bg-blue-700"
                >
                  {loading ? "Splitting..." : "Split PDF"}
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
