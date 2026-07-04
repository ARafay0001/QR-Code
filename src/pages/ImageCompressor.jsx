import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useEffect, useRef, useState } from "react";
import UploadArea from "../components/compressor/UploadArea";
import PreviewPanel from "../components/compressor/PreviewPanel";
import Toolbar from "../components/compressor/Toolbar";
import imageCompression from "browser-image-compression";
export default function ImageCompressor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
const [loading, setLoading] = useState(false);
const [compressedFile, setCompressedFile] = useState(null);const [compressionMode, setCompressionMode] = useState("balanced");const [targetSize, setTargetSize] = useState(500);
const [targetUnit, setTargetUnit] = useState("KB");
const compressImage = async () => {
  if (!selectedFile) {
    alert("Please choose an image first.");
    return;
  }

  try {
    setLoading(true);

    // Convert target size to MB
    const targetSizeMB =
      targetUnit === "MB"
        ? targetSize
        : targetSize / 1024;

    let options;

    switch (compressionMode) {
      case "quality":
        options = {
          maxSizeMB: targetSizeMB,
          maxWidthOrHeight: 4000,
          initialQuality: 0.95,
          useWebWorker: true,
        };
        break;

      case "small":
        options = {
          maxSizeMB: targetSizeMB,
          maxWidthOrHeight: 1920,
          initialQuality: 0.55,
          useWebWorker: true,
        };
        break;

      default: // balanced
        options = {
          maxSizeMB: targetSizeMB,
          maxWidthOrHeight: 2560,
          initialQuality: 0.8,
          useWebWorker: true,
        };
    }

    const compressed = await imageCompression(
      selectedFile,
      options
    );

    setCompressedFile(compressed);

    const url = URL.createObjectURL(compressed);

    setCompressedImage(url);

  } catch (err) {
    console.error(err);
    alert("Compression failed.");
  } finally {
    setLoading(false);
  }
};
  return (
    <>
      {/* Background Effects */}

      <div className="fixed inset-0 -z-10 overflow-hidden">

        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />

        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[180px]" />

        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />

      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

        <Navbar />

        <main className="mx-auto max-w-7xl px-6 py-4">

          {/* Hero */}

          <div className="text-center">

            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              Image Compressor
            </span>

            <h1 className="mt-6 text-5xl font-black">
              Compress Images
              <br />
              Without Losing Quality.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Reduce image size for websites, forms and social media in seconds.
            </p>

          </div>

          {/* Workspace */}
<div className="mt-20 grid gap-8 lg:grid-cols-[380px_1fr]">
<Toolbar
  onCompress={compressImage}
  loading={loading}
  compressionMode={compressionMode}
  setCompressionMode={setCompressionMode}
  targetSize={targetSize}
  setTargetSize={setTargetSize}
  targetUnit={targetUnit}
  setTargetUnit={setTargetUnit}
/>
<PreviewPanel
  selectedFile={selectedFile}
  compressedImage={compressedImage}
  compressedFile={compressedFile}
  setSelectedFile={(file) => {
    setCompressedImage(null);
    setCompressedFile(null);
    setSelectedFile(file);
  }}
/>
</div>

        </main>

        <Footer />

      </div>

    </>
  );
}