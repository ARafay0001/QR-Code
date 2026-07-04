import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

export default function PreviewPanel({
    selectedFile,
    compressedImage,
    compressedFile,
    setSelectedFile,
}) {
  const [dimensions, setDimensions] = useState({
  width: 0,
  height: 0,
});
  const [preview, setPreview] = useState(null);

  const inputRef = useRef(null);
useEffect(() => {
  if (!selectedFile) {
    setPreview(null);
    return;
  }

  const url = URL.createObjectURL(selectedFile);

  setPreview(url);

  const img = new Image();

  img.onload = () => {
    setDimensions({
      width: img.width,
      height: img.height,
    });
  };

  img.src = url;

  return () => URL.revokeObjectURL(url);

}, [selectedFile]);

  const chooseImage = () => {
    inputRef.current.click();
  };

  const handleChange = (e) => {
  const file = e.target.files[0];

  if (!file) return;


  setSelectedFile(file);
};

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={handleChange}
      />

      <div className="border-b border-slate-800 px-6 py-4">

        <h2 className="font-semibold">
          Preview
        </h2>

      </div>

      {!selectedFile ? (

        <div className="flex h-[650px] flex-col items-center justify-center">

          <div className="rounded-full bg-blue-600/20 p-6">

            <ImagePlus
              size={60}
              className="text-blue-400"
            />

          </div>

          <h2 className="mt-8 text-3xl font-bold">
            Upload Image
          </h2>

          <p className="mt-3 max-w-md text-center text-slate-400">
            Drag & drop your image here or choose one from your computer.
          </p>

          <button
            onClick={chooseImage}
            className="mt-8 rounded-xl cursor-pointer bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-700"
          >
            Choose Image
          </button>

          <p className="mt-5 text-sm text-slate-500">
            PNG • JPG • JPEG • WEBP
          </p>

        </div>

      ) : (

        <div className="p-6">

          <div className="flex h-[333px] items-center justify-center rounded-2xl bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b),linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b)] bg-[length:30px_30px] bg-[position:0_0,15px_15px]">

            <img
            src={compressedImage || preview}
              alt=""
              className="max-h-full max-w-full object-contain"
            />

          </div>

         <div className="mt-6  rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

  <div className="grid gap-5 sm:grid-cols-2 ">

    <div>
      <p className="text-xs  uppercase tracking-wide text-slate-500">
        File Name
      </p>

      <p className="mt-1 truncate font-medium">
        {selectedFile.name}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Format
      </p>

      <p className="mt-1 font-medium">
        {selectedFile.type.split("/")[1].toUpperCase()}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Resolution
      </p>

      <p className="mt-1 font-medium">
        {dimensions.width} × {dimensions.height}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        File Size
      </p>

      <p className="mt-1 font-medium">
        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
      </p>
    </div>

  </div>

  <button
    onClick={chooseImage}
    className="mt-2 w-full cursor-pointer rounded-xl border border-slate-700 py-3 transition hover:border-blue-500"
  >
    Change Image
  </button>
{compressedImage && (
  <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-5">

    <h3 className="text-lg font-bold text-green-400">
      Compression Result
    </h3>

    <div className="mt-5 grid grid-cols-2 gap-5">

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Original Size
        </p>

        <p className="mt-1 text-lg font-semibold">
          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Compressed Size
        </p>

        <p className="mt-1 text-lg font-semibold text-green-400">
          {(compressedFile.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Saved
        </p>

        <p className="mt-1 text-lg font-semibold text-green-400">
          {(
            ((selectedFile.size - compressedFile.size) /
              selectedFile.size) *
            100
          ).toFixed(1)}
          %
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Saved Space
        </p>

        <p className="mt-1 text-lg font-semibold text-green-400">
          {(
            (selectedFile.size - compressedFile.size) /
            1024 /
            1024
          ).toFixed(2)}{" "}
          MB
        </p>
      </div>
      {compressedImage && (
  <a
    href={compressedImage}
    download={`compressed-${selectedFile.name}`}
    className="mt-2 block w-full rounded-2xl bg-blue-600 py-4 text-center text-lg font-bold transition hover:bg-blue-700"
  >
     Download Image
  </a>
)}

    </div>

  </div>
)}
</div>

        </div>

      )}

    </div>
  );
}