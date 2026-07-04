import { Wand2 } from "lucide-react";

export default function Toolbar({
  imageSelected,
  loading,
  onRemoveBackground,
}) {
  return (
    <div className=" rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h3 className="text-xl font-bold text-white">
            Background Removal
          </h3>

          <p className="mt-2 text-slate-400">
            Remove the background while preserving the subject.
          </p>
        </div>

        <a className="cursor-pointer" href="#preview">
          <button
          disabled={!imageSelected || loading}
          onClick={onRemoveBackground}
          className="flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wand2 size={20} />

          {loading ? "Processing..." : "Remove Background"}
        </button>
        </a>

      </div>

    </div>
  );
}