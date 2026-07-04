export default function Toolbar({
  onCompress,
  loading,
  compressionMode,
  setCompressionMode,
  targetSize,
  setTargetSize,
  targetUnit,
  setTargetUnit,
}) {
  return (
   <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">

      <h2 className="text-xl font-bold">
        Compression Settings
      </h2>

      {/* Compression Mode */}

<div>


  <div className="mt-5 space-y-4">

    <button
  onClick={() => setCompressionMode("balanced")}
  className={`w-full rounded-2xl p-5 text-left transition ${
    compressionMode === "balanced"
      ? "border-2 border-blue-500 bg-blue-500/10"
      : "border border-slate-700 hover:border-blue-500"
  }`}
>

      <div className="flex items-start justify-between">

        <div>

          <h3 className="font-semibold text-white">
            ⭐ Balanced
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Best balance between image quality and file size.
          </p>

        </div>

        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold">
          Recommended
        </span>

      </div>

    </button>
<button
  onClick={() => setCompressionMode("quality")}
  className={`w-full rounded-2xl p-5 text-left transition ${
    compressionMode === "quality"
      ? "border-2 border-blue-500 bg-blue-500/10"
      : "border border-slate-700 hover:border-blue-500"
  }`}
>

      <h3 className="font-semibold">
        🎯 Best Quality
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        Keep maximum visual quality.
      </p>

    </button>
<button
  onClick={() => setCompressionMode("small")}
  className={`w-full rounded-2xl p-5 text-left transition ${
    compressionMode === "small"
      ? "border-2 border-blue-500 bg-blue-500/10"
      : "border border-slate-700 hover:border-blue-500"
  }`}
>

      <h3 className="font-semibold">
        📦 Smallest File
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        Maximum compression for the smallest file.
      </p>

    </button>

  </div>

</div>


      {/* Target File Size */}

<div className="mt-10">

  <h2 className="text-xl font-bold">
    Target File Size
  </h2>

  <div className="mt-5 flex gap-3">

   <input
  type="number"
  value={targetSize}
  onChange={(e) => setTargetSize(Number(e.target.value))}
  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
/>

    <select
  value={targetUnit}
  onChange={(e) => setTargetUnit(e.target.value)}
  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
>
  <option value="KB">KB</option>
  <option value="MB">MB</option>
</select>
  </div>

  <div className="mt-5 flex flex-wrap gap-2">
<button
  onClick={() => {
    setTargetSize(100);
    setTargetUnit("KB");
  }}
  className={`rounded-full px-4 py-2 text-sm ${
    targetSize === 100 && targetUnit === "KB"
      ? "border border-blue-500 bg-blue-500/10"
      : "border border-slate-700 hover:border-blue-500"
  }`}
>
 100 KB
</button>

   <button
  onClick={() => {
    setTargetSize(250);
    setTargetUnit("KB");
  }}
  className={`rounded-full px-4 py-2 text-sm ${
    targetSize === 250 && targetUnit === "KB"
      ? "border border-blue-500 bg-blue-500/10"
      : "border border-slate-700 hover:border-blue-500"
  }`}
>
 250 KB
</button>

   <button
  onClick={() => {
    setTargetSize(500);
    setTargetUnit("KB");
  }}
  className={`rounded-full px-4 py-2 text-sm ${
    targetSize === 500 && targetUnit === "KB"
      ? "border border-blue-500 bg-blue-500/10"
      : "border border-slate-700 hover:border-blue-500"
  }`}
>
 500 KB
</button>

  <button
  onClick={() => {
    setTargetSize(1);
    setTargetUnit("MB");
  }}
  className={`rounded-full px-4 py-2 text-sm ${
    targetSize === 1 && targetUnit === "MB"
      ? "border border-blue-500 bg-blue-500/10"
      : "border border-slate-700 hover:border-blue-500"
  }`}
>
 1 MB
</button>

    <button
  onClick={() => {
    setTargetSize(2);
    setTargetUnit("MB");
  }}
  className={`rounded-full px-4 py-2 text-sm ${
    targetSize === 1 && targetUnit === "MB"
      ? "border border-blue-500 bg-blue-500/10"
      : "border border-slate-700 hover:border-blue-500"
  }`}
>
 2 MB
</button>

  </div>

</div>
<div className="mt-10 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">

  <h3 className="font-semibold text-blue-400">
    💡 Recommendation
  </h3>

  <p className="mt-3 text-sm text-slate-300">
    Balanced mode with a target size of
    <span className="font-semibold text-white"> 500 KB </span>
    works best for most photos.
  </p>

</div>
      {/* Compress */}

 <button
    onClick={onCompress}
    disabled={loading}
    className="mt-11 w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold transition hover:bg-blue-700 disabled:opacity-50"
>
    {loading ? "Compressing..." : "Compress Image"}
</button>
    </div>
  );
}