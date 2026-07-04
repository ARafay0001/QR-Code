import { useEffect, useState } from "react";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Toolbar from "../components/background/Toolbar";
import UploadArea from "../components/background/UploadArea";
import PreviewPanel from "../components/background/PreviewPanel";
import {
  removeBackground,
  preload,
} from "@imgly/background-removal";
const config = {
  debug: true,
  model: "isnet_fp16",
  device: "cpu",
  output: {
    format: "image/png",
    quality: 1,
    type: "foreground",
  },
};
export default function BackgroundRemover() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
const [loadingMessage, setLoadingMessage] = useState("");
  const [modelReady, setModelReady] = useState(false);
const resetImage = () => {
  setSelectedFile(null);
  setResultImage(null);
};
  // useEffect comes next...
useEffect(() => {
  const loadModel = async () => {
    try {
      await preload(config);

      setModelReady(true);

      console.log("AI model loaded.");
    } catch (error) {
      console.error(error);
    }
  };

  loadModel();
}, []);

const handleRemoveBackground = async () => {
  if (!selectedFile) {
    alert("Please select an image first.");
    return;
  }

  let messageInterval;

  const messages = [
    "🔍 Detecting subject...",
    "✂️ Separating foreground...",
    "✨ Refining edges...",
    "📦 Finalizing PNG...",
  ];

  try {
    setLoading(true);

    let index = 0;
    setLoadingMessage(messages[index]);

    setLoadingMessage("🔍 Finalizing PNG...");

    const blob = await removeBackground(selectedFile, config);

    const imageUrl = URL.createObjectURL(blob);

    setResultImage(imageUrl);
  } catch (error) {
    console.error(error);
    alert("Failed to remove background.");
  } finally {
    clearInterval(messageInterval);
    setLoading(false);
    setLoadingMessage("");
  }
};
  const originalImage = selectedFile
    ? URL.createObjectURL(selectedFile)
    : null;

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

        <main className="mx-auto max-w-6xl px-6 py-24">
          {/* Hero */}
          <div className="text-center">
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              Background Remover
            </span>

            <h1 className="mt-6 text-5xl font-black">
              Remove Backgrounds
              <br />
              Instantly.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Upload an image and remove its background in seconds.
              Free. No account required.
            </p>
          </div>

          {/* Upload Area */}
        <div className="mx-auto mt-20 grid gap-8 lg:grid-cols-2 lg:items-start">

  {/* Upload */}
  <div>
    <UploadArea
      onFileSelect={(file) => {
        setSelectedFile(file);
        setResultImage(null);
      }}
    />
  </div>

  {/* Preview */}
  <PreviewPanel
    originalImage={originalImage}
    resultImage={resultImage}
    loading={loading}
    loadingMessage={loadingMessage}
    onReset={resetImage}
  />

</div>

<div className="mt-10 flex justify-center">
  <Toolbar
    imageSelected={!!selectedFile}
    loading={loading || !modelReady}
    onRemoveBackground={handleRemoveBackground}
  />
</div>
        </main>

        <Footer />
      </div>
    </>
  );
}