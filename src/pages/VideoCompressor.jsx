import { useState, useEffect } from "react";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

import VideoToolbar from "../components/compressor/videoCompressor/VideoToolbar";
import VideoPanel from "../components/compressor/videoCompressor/VideoPanel";
import {
  loadFFmpeg,
  compressVideo as compressWithFFmpeg,
} from "../utils/ffmpeg";
export default function VideoCompressor() {

  const [progress, setProgress] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [compressedVideo, setCompressedVideo] = useState(null);

  const [compressedFile, setCompressedFile] = useState(null);

  const [loading, setLoading] = useState(false);
const [stats, setStats] = useState(null);
  const [targetSize, setTargetSize] = useState(25);
const [targetUnit, setTargetUnit] = useState("MB");

  const [resolution, setResolution] = useState("original");
  useEffect(() => {
  loadFFmpeg();
}, []);
useEffect(() => {
  if (!selectedVideo) return;

  const originalMB = selectedVideo.size / (1024 * 1024);

  setTargetSize(
    Math.max(1, Math.round(originalMB / 2))
  );

  setTargetUnit("MB");
}, [selectedVideo]);


const compressVideo = async () => {
  if (!selectedVideo) {
    alert("Please choose a video first.");
    return;
  }

 
try {
  setProgress(0);   // Reset progress to 0%
  setLoading(true);

  const blob = await compressWithFFmpeg(
  selectedVideo,
  targetSize,
  targetUnit,
  resolution,
  (progress) => {
  setProgress(progress);
}
);
    const compressed = new File(
      [blob],
      `compressed-${selectedVideo.name}`,
      {
        type: "video/mp4",
      }
    );

  setCompressedFile(compressed);

setCompressedVideo(
  URL.createObjectURL(compressed)
);

// ----------------------------
// Calculate Compression Stats
// ----------------------------

const originalSize = selectedVideo.size;

const compressedSize = compressed.size;

const savedBytes = originalSize - compressedSize;

const savedPercent = (
  (savedBytes / originalSize) * 100
).toFixed(1);

setStats({
  originalSize,
  compressedSize,
  savedBytes,
  savedPercent,
});

// ----------------------------

setProgress(100);

  } catch (err) {
    console.error(err);
    alert("Compression failed.");
  } finally {
    setLoading(false);
  }
};
console.log({
  loading,
  progress,
});
  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />

        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[180px]" />

        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <main className="mx-auto max-w-7xl px-6 py-10">

          {/* Hero */}

          <div className="text-center">

            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              Video Compressor
            </span>

            <h1 className="mt-6 text-5xl font-black">
              Compress Videos
              <br />
              Without Losing Quality.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Compress MP4, MOV, AVI and WebM videos directly in your browser.
              No uploads. Completely private.
            </p>

          </div>

          {/* Workspace */}

          <div className="mt-20 grid gap-8 lg:grid-cols-[380px_1fr]">

            {/* Left */}
<VideoToolbar
  selectedVideo={selectedVideo}
  targetSize={targetSize}
  setTargetSize={setTargetSize}
  targetUnit={targetUnit}
  setTargetUnit={setTargetUnit}
  resolution={resolution}
  setResolution={setResolution}
  loading={loading}
  progress={progress}
  onCompress={compressVideo}
/>
            {/* Right */}
<VideoPanel
  selectedVideo={selectedVideo}
  setSelectedVideo={(file) => {
    setCompressedVideo(null);
    setCompressedFile(null);
    setStats(null);
    setSelectedVideo(file);
  }}
  compressedVideo={compressedVideo}
  compressedFile={compressedFile}
  stats={stats}
/>

          </div>

        </main>

        <Footer />

      </div>
    </>
  );
}