import { ImagePlus } from "lucide-react";

export default function UploadArea({
  selectedFile,
  setSelectedFile,
}) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);
  };

  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 p-8">

      <div className="flex flex-col items-center">

        <div className="rounded-full bg-blue-600/20 p-5">
          <ImagePlus
            size={48}
            className="text-blue-400"
          />
        </div>

        <h2 className="mt-6 text-2xl font-bold">
          {selectedFile ? "Image Selected" : "Upload Image"}
        </h2>

        <p className="mt-3 text-center text-slate-400">

          {selectedFile
            ? selectedFile.name
            : "Drag & drop your image here or browse from your device."}

        </p>

        <label className="mt-8 cursor-pointer rounded-xl bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-700">

          {selectedFile ? "Replace Image" : "Choose Image"}

          <input
            hidden
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

        </label>

        <p className="mt-5 text-sm text-slate-500">
          PNG • JPG • JPEG • WEBP
        </p>

      </div>

    </div>
  );
}