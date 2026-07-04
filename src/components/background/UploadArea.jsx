import { useRef, useState } from "react";
import { UploadCloud, ImageIcon } from "lucide-react";

export default function UploadArea({ onFileSelect }) {
  const inputRef = useRef(null);

  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;

    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Only PNG, JPG, JPEG and WEBP images are supported.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert("Maximum file size is 20MB.");
      return;
    }

    onFileSelect(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);

          handleFile(e.dataTransfer.files[0]);
        }}
        className={`cursor-pointer rounded-3xl border-2 border-dashed p-14 text-center transition-all duration-300

        ${
          dragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-700 hover:border-blue-500 hover:bg-slate-900/50"
        }`}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
          <UploadCloud size={40} />
        </div>

        <h2 className="mt-8 text-2xl font-bold text-white">
          Drag & Drop your image
        </h2>

        <p className="mt-3 text-slate-400">
          or click to browse files
        </p>

        <button
          type="button"
          className="mt-8 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-500"
        >
          Browse Files
        </button>

        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} />
            PNG
          </div>

          <div>JPG</div>

          <div>JPEG</div>

          <div>WEBP</div>
        </div>

        <p className="mt-5 text-sm text-slate-500">
          Maximum size: 20 MB • Up to 4096 × 4096 px
        </p>
      </div>
    </>
  );
}