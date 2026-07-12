import { useRef, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Upload, FileText, Trash2 } from "lucide-react";
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
  const inputRef = useRef(null);

  const chooseFiles = () => {
    inputRef.current.click();
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).map((file) => ({
  id: crypto.randomUUID(),
  file,
  name: file.name,
  size: file.size,
}));

setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  setFiles((items) => {
    const oldIndex = items.findIndex(
      (item) => item.id === active.id
    );

    const newIndex = items.findIndex(
      (item) => item.id === over.id
    );

    return arrayMove(items, oldIndex, newIndex);
  });
};

const mergePDFs = async () => {
  setLoading(true);

  try {


  if (files.length < 2) {
    alert("Select at least two PDFs.");
    return;
  }

  const mergedPdf = await PDFDocument.create();

  for (const item of files) {
    const bytes = await item.file.arrayBuffer();

    const pdf = await PDFDocument.load(bytes);

    const copiedPages = await mergedPdf.copyPages(
      pdf,
      pdf.getPageIndices()
    );

    copiedPages.forEach((page) =>
      mergedPdf.addPage(page)
    );
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
} finally {
  setLoading(false);
}
};

 return (
  <>
    <Navbar />

    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      <main className="mx-auto max-w-5xl px-6 py-16">

        {/* Hero */}

        <div className="text-center">

          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            PDF Tools
          </span>

          <h1 className="mt-6 text-5xl font-black">
            Merge PDF Files
          </h1>

          <p className="mt-5 text-slate-400">
            Combine multiple PDF files into one document.
          </p>

        </div>

        {/* Card */}

        <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/60 p-8">

          <input
            ref={inputRef}
            hidden
            multiple
            type="file"
            accept=".pdf"
            onChange={handleFiles}
          />

          <button
            onClick={chooseFiles}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-700 py-10 transition hover:border-blue-500"
          >
            <Upload size={28} />
            Upload PDFs
          </button>

          {files.length > 0 && (

            <div className="mt-10">

              {/* Header */}

              <div className="mb-6 flex items-center justify-between">

                <h3 className="text-xl font-bold">
                  Uploaded PDFs
                </h3>

                <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold">
                  {files.length}
                </span>

              </div>

              {/* Total Size */}

              <p className="mb-6 text-sm text-slate-400">
                Total Size:{" "}
                {(
                  files.reduce(
                    (sum, file) => sum + file.size,
                    0
                  ) /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
                MB
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

                  <div className="space-y-4">

                    {files.map((file, index) => (

                      <SortablePDFItem
                        key={file.id}
                        file={file}
                        onRemove={() =>
                          removeFile(index)
                        }
                      />

                    ))}

                  </div>

                </SortableContext>

              </DndContext>

              {/* Merge Button */}

              <button
                onClick={mergePDFs}
                disabled={
                  files.length < 2 || loading
                }
                className="mt-8 w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Merging..."
                  : "Merge PDFs"}
              </button>

              {/* Clear */}

              <button
                onClick={() => setFiles([])}
                className="mt-4 w-full rounded-xl border border-slate-700 py-3 transition hover:border-red-500 hover:text-red-400"
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