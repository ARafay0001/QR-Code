import {
  SlidersHorizontal,
  HardDrive,
  Monitor,
  Sparkles,
} from "lucide-react";

export default function VideoToolbar({
  selectedVideo,
  targetSize,
  setTargetSize,
  targetUnit,
  setTargetUnit,
  resolution,
  setResolution,
  loading,
  progress,
  onCompress,
})  {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">

      <div className="flex items-center gap-3">
        <SlidersHorizontal className="text-blue-400" size={24} />
        <h2 className="text-2xl font-bold">Compression Settings</h2>
      </div>

      {/* Target Size */}

      <div className="mt-10">

        <div className="mb-4 flex items-center gap-2">
          <HardDrive size={18} className="text-blue-400" />
          <h3 className="font-semibold">Target File Size</h3>
        </div>

        <div className="flex gap-3">

  <input
    type="number"
    min="1"
    max={
      selectedVideo
        ? Math.floor(selectedVideo.size / 1024 / 1024)
        : 100
    }
    value={targetSize}
    onChange={(e) =>
      setTargetSize(Number(e.target.value))
    }
    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
  />

  <select
    value={targetUnit}
    onChange={(e) =>
      setTargetUnit(e.target.value)
    }
    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
  >
    <option value="MB">MB</option>
    <option value="KB">KB</option>
  </select>

</div>

{selectedVideo && (
  <p className="mt-3 text-sm text-slate-400">
    Original Size:{" "}
    {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
  </p>
)}

{selectedVideo &&
  targetSize > selectedVideo.size / 1024 / 1024 && (
    <p className="mt-2 text-sm font-medium text-red-400">
      Target size cannot exceed the original file size.
    </p>
)}
        <div className="mt-5 grid grid-cols-4 gap-2">

          {[10, 25, 50, 100].map((size) => (
            <button
              key={size}
              onClick={() => {
                setTargetSize(size);
                setTargetUnit("MB");
              }}
              className={`rounded-xl py-3 text-sm font-medium transition ${
                targetSize === size && targetUnit === "MB"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-700 hover:border-blue-500"
              }`}
            >
              {size} MB
            </button>
          ))}

        </div>

      </div>

      {/* Resolution */}

      <div className="mt-10">

        <div className="mb-4 flex items-center gap-2">
          <Monitor size={18} className="text-blue-400" />
          <h3 className="font-semibold">Resolution</h3>
        </div>

        <select
          value={resolution}
          onChange={(e) =>
            setResolution(e.target.value)
          }
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
        >
          <option value="original">Original</option>
          <option value="1080">1080p</option>
          <option value="720">720p</option>
          <option value="480">480p</option>
          <option value="360">360p</option>
        </select>

      </div>

      {/* Recommendation */}

      <div className="mt-10 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">

        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-400" size={18} />
          <h3 className="font-semibold text-blue-400">
            Recommended
          </h3>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          <strong>25 MB</strong> at{" "}
          <strong>720p</strong> provides an excellent
          balance between quality and file size for
          social media and web uploads.
        </p>

      </div>
{loading && (
  <div className="mt-10">

    <div className="mb-3 flex justify-between text-sm text-slate-300">
      <span>Compressing Video...</span>
      <span>{progress}%</span>
    </div>

    <div className="h-3 overflow-hidden rounded-full bg-slate-800">

      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
        style={{
          width: `${progress}%`,
        }}
      />

    </div>

  </div>
)}
      {/* Compress */}

      <button
        onClick={onCompress}
        disabled={loading}
        className="mt-10 w-full cursor-pointer rounded-2xl bg-blue-600 py-4 text-lg font-bold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
  ? `Compressing... ${progress}%`
  : "Compress Video"}
      </button>

    </div>
  );
}