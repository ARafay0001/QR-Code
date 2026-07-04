import BeforeAfterSlider from "./BeforeAfterSlider";
import { Download } from "lucide-react";
export default function PreviewPanel({
  originalImage,
  resultImage,
  loading,
  loadingMessage,
  onReset,
}) {
  return (
    <div className=" ">
      {/* Original */}

      {/* Result */}
      <div className="w-full h-[483px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="font-semibold text-white">Preview</h3>
        </div>

        <div className="relative flex h-[440px] items-center justify-center bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b),linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b)] bg-[length:30px_30px] bg-[position:0_0,15px_15px] ">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b),linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b)] bg-[length:30px_30px] bg-[position:0_0,15px_15px] backdrop-blur-md">
              <div className="w-[340px] rounded-2xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl">
                <div className="flex justify-center items-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
                </div>

                <h2 className="mt-6 text-center text-2xl font-bold text-white">
                  Removing Background.
                </h2>

                <p className="mt-2 text-center text-slate-400">
                  Please wait while our AI processes your image.
                </p>

                {/* Progress Bar */}

                {/* Steps */}
                <div className="mt-8">
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <p className="animate-pulse text-lg font-medium text-blue-400">
                      {loadingMessage}
                    </p>
                  </div>

                  <p className="mt-6 text-center text-sm text-slate-400">
                    AI is processing your image.
                  </p>

                  <p className="mt-2 text-center text-xs text-slate-500">
                    Usually takes 5–15 seconds.
                  </p>
                </div>
              </div>
            </div>
          )}
          {resultImage || originalImage ? (
            <div className="flex w-full items-center justify-center">
              <div className="flex w-full max-w-4xl items-center justify-center rounded-2xl p-6 h-full">
                <img
                  src={resultImage || originalImage}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>

              {resultImage && (
                <div className="flex flex-wrap justify-center p-12 gap-4">
                  <a
                    href={resultImage}
                    download="background-removed.png"
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
                  >
                    Download PNG
                  </a>

                  <button
                    onClick={onReset}
                    className="rounded-xl border border-slate-700 px-6 py-3 font-semibold transition hover:bg-slate-800"
                  >
                    Choose Another Image
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500">
              Background removed image will appear here
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
