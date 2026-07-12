import { useEffect, useState } from "react";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Toolbar from "../components/background/Toolbar";
import UploadArea from "../components/background/UploadArea";
import PreviewPanel from "../components/background/PreviewPanel";
import { removeBackground } from "@imgly/background-removal";
import {
  preloadBackgroundModel,
  isModelLoaded,
  getCurrentDevice,
} from "../utils/preloadAI";
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
  const [progress, setProgress] = useState(0);
 const [aiLoading, setAiLoading] = useState(true);


useEffect(() => {

  let value = 0;

  const interval = setInterval(() => {

    value++;

    setProgress(value);

    if (value >= 100) {

      clearInterval(interval);

      setTimeout(() => {
        setAiLoading(false);
      }, 200);

    }

  }, 30);

  return () => clearInterval(interval);

}, []);
useEffect(() => {
  if (isModelLoaded()) {
    console.log("✅ AI already loaded.");
    setModelReady(true);
    return;
  }

  console.log("⏳ Waiting for AI model...");

  preloadBackgroundModel()
    .then(() => {
      console.log("✅ AI Ready");
      setModelReady(true);
    })
    .catch((err) => {
      console.error("❌ AI failed to load", err);
    });
}, []);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
const [loadingMessage, setLoadingMessage] = useState("");
  const [modelReady, setModelReady] = useState(false);
const resetImage = () => {
  setSelectedFile(null);
  setResultImage(null);
};

const handleRemoveBackground = async () => {
  if (!modelReady) {
    alert("AI is still preparing. Please wait a moment.");
    return;
  }

  if (!selectedFile) {
    alert("Please select an image first.");
    return;
  }

  const messages = [
    "🔍 Detecting subject...",
    "✂️ Separating foreground...",
    "✨ Refining edges...",
    "📦 Finalizing PNG...",
  ];

  try {
    setLoading(true);

    setLoadingMessage(messages[0]);

    const config = {
      debug: true,
      model: "isnet_fp16",
      device: getCurrentDevice(), // GPU if available, otherwise CPU
      publicPath: "/assets/",
      output: {
        format: "image/png",
        quality: 1,
        type: "foreground",
      },
    };

    console.log(`🚀 Removing background using: ${config.device.toUpperCase()}`);

    const blob = await removeBackground(selectedFile, config);

    const imageUrl = URL.createObjectURL(blob);

    setResultImage(imageUrl);
  } catch (error) {
    console.error(error);
    alert("Failed to remove background.");
  } finally {
    setLoading(false);
    setLoadingMessage("");
  }
};
  const originalImage = selectedFile
    ? URL.createObjectURL(selectedFile)
    : null;
if (aiLoading) {
  return (
    <>
      <Navbar />

      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">

        <div className="text-center">

          <div className="mx-auto mb-8 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

          <h2 className="mt-6 text-3xl font-bold">
  Preparing AI...
</h2>

<p className="mt-3 text-slate-400">
  Preparing AI Model
</p>

<p className="mt-2 text-4xl font-black text-blue-400">
  {progress}%
</p><div className="mx-auto mt-8 h-3 w-80 overflow-hidden rounded-full bg-slate-800">

  <div
    className="h-full rounded-full bg-blue-500 transition-all duration-300"
    style={{ width: `${progress}%` }}
  />

</div>

        </div>

      </div>
    </>
  );
}
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
   loading={loading}
modelReady={modelReady}
    onRemoveBackground={handleRemoveBackground}
  />
</div>
        </main>

        <Footer />
      </div>
    </>
  );
}