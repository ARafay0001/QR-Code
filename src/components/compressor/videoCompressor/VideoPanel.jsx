import { Video, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function VideoPanel({
  selectedVideo,
  setSelectedVideo,
  compressedVideo,
  compressedFile,
  stats,
}) {
  const [preview, setPreview] = useState(null);

  const [videoInfo, setVideoInfo] = useState({
    width: 0,
    height: 0,
    duration: 0,
  });

  const inputRef = useRef(null);

  useEffect(() => {
    if (!selectedVideo) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(selectedVideo);

    setPreview(url);

    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      setVideoInfo({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    };

    video.src = url;

    return () => URL.revokeObjectURL(url);
  }, [selectedVideo]);

  const chooseVideo = () => {
    inputRef.current.click();
  };

  const handleFile = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedVideo(file);
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">

      <input
        hidden
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleFile}
      />

      <div className="border-b border-slate-800 px-6 py-4">
        <h2 className="font-semibold">
          Preview
        </h2>
      </div>

      {!selectedVideo ? (

        <div className="flex h-[650px] flex-col items-center justify-center">

          <div className="rounded-full bg-blue-600/20 p-6">
            <Video
              size={64}
              className="text-blue-400"
            />
          </div>

          <h2 className="mt-8 text-3xl font-bold">
            Upload Video
          </h2>

          <p className="mt-4 max-w-md text-center text-slate-400">
            Drag & drop your video here or browse from your computer.
          </p>

          <button
            onClick={chooseVideo}
            className="mt-8 flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-700"
          >
            <Upload size={18} />
            Choose Video
          </button>

          <p className="mt-6 text-sm text-slate-500">
            MP4 • MOV • AVI • WEBM
          </p>

        </div>

      ) : (

        <div className="p-6">

          <video
            controls
            src={compressedVideo || preview}
            className="max-h-[420px] w-full rounded-2xl bg-black object-contain"
          />

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-6">

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  File Name
                </p>

                <p className="mt-1 break-all font-medium">
                  {selectedVideo.name}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Format
                </p>

                <p className="mt-1 font-medium">
                  {selectedVideo.type}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Resolution
                </p>

                <p className="mt-1 font-medium">
                  {videoInfo.width} × {videoInfo.height}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Duration
                </p>

                <p className="mt-1 font-medium">
                  {formatDuration(videoInfo.duration)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Original Size
                </p>

                <p className="mt-1 font-medium">
                  {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {compressedFile && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Compressed Size
                  </p>

                  <p className="mt-1 font-medium text-green-400">
                    {(compressedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

            </div>

            <button
              onClick={chooseVideo}
              className="mt-6 w-full cursor-pointer rounded-xl border border-slate-700 py-3 transition hover:border-blue-500"
            >
              Replace Video
            </button>
            

       {compressedVideo && (

<a
  href={compressedVideo}
  download={`compressed-${selectedVideo.name}`}
  className="mt-6 block w-full rounded-xl bg-blue-600 py-4 text-center text-lg font-bold transition hover:bg-blue-700"
>
  Download Compressed Video
</a>

)}

{stats && (
  <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-6">

    <h3 className="mb-5 text-xl font-bold text-green-400">
      Compression Result
    </h3>

    <div className="grid grid-cols-2 gap-5">

      <div>
        <p className="text-xs uppercase text-slate-400">
          Original
        </p>

        <p className="mt-1 text-lg font-bold">
          {(stats.originalSize / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      <div>
        <p className="text-xs uppercase text-slate-400">
          Compressed
        </p>

        <p className="mt-1 text-lg font-bold text-green-400">
          {(stats.compressedSize / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      <div>
        <p className="text-xs uppercase text-slate-400">
          Saved
        </p>

        <p className="mt-1 text-lg font-bold text-green-400">
          {stats.savedPercent}%
        </p>
      </div>

      <div>
        <p className="text-xs uppercase text-slate-400">
          Space Saved
        </p>

        <p className="mt-1 text-lg font-bold text-green-400">
          {(stats.savedBytes / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

    </div>

  </div>
)}

          </div>

        </div>

      )}

    </div>
  );
}