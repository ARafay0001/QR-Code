export default function QRCustomizer({
  foregroundColor,
  setForegroundColor,
  backgroundColor,
  setBackgroundColor,
  qrSize,
  setQrSize,
  dotStyle,
  setDotStyle,
  cornerSquareStyle,
  setCornerSquareStyle,
  cornerDotStyle,
  setCornerDotStyle,
  logo,
  setLogo,
}) {
  return (
    <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-900/70 backdrop-blur-md p-5 sm:p-6 lg:p-8 shadow-xl">

      <h3 className="mb-8 text-2xl font-bold text-white">
        Customize QR
      </h3>

      {/* Colors */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Foreground Color
          </label>

          <input
            type="color"
            value={foregroundColor}
            onChange={(e) => setForegroundColor(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-slate-600 bg-slate-800"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Background Color
          </label>

          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-slate-600 bg-slate-800"
          />
        </div>

      </div>

      {/* QR Size */}
      <div className="mt-8">
        <div className="mb-2 flex justify-between">
          <label className="text-sm font-medium text-slate-300">
            QR Size
          </label>

          <span className="text-blue-400 text-sm">
            {qrSize}px
          </span>
        </div>

        <input
          type="range"

          min="200"
          max="500"
          step="10"
          value={qrSize}
          onChange={(e) => setQrSize(Number(e.target.value))}
          className="w-full cursor-pointer accent-blue-600"
        />
      </div>

      {/* Selects */}
      <div className="mt-8  grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Dot Style
          </label>

          <select
            value={dotStyle}
            onChange={(e) => setDotStyle(e.target.value)}
            className="w-full  cursor-pointer rounded-xl border border-slate-600 bg-slate-800 p-3 text-white focus:border-blue-500 outline-none"
          >
            <option value="square">Square</option>
            <option value="rounded">Rounded</option>
            <option value="dots">Dots</option>
            <option value="classy">Classy</option>
            <option value="classy-rounded">Classy Rounded</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Corner Square
          </label>

          <select
            value={cornerSquareStyle}
            onChange={(e) => setCornerSquareStyle(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-800  p-3 cursor-pointer text-white focus:border-blue-500 outline-none"
          >
            <option value="square">Square</option>
            <option value="extra-rounded">Extra Rounded</option>
            <option value="dot">Dot</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Corner Dot
          </label>

          <select
            value={cornerDotStyle}
            onChange={(e) => setCornerDotStyle(e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-600 bg-slate-800 p-3 text-white focus:border-blue-500 outline-none"
          >
            <option value="square">Square</option>
            <option value="dot">Dot</option>
          </select>
        </div>

      </div>

      {/* Logo Upload */}
      <div className="mt-8">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Upload Logo
        </label>

        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = () => {
              setLogo(reader.result);
            };

            reader.readAsDataURL(file);
          }}
          className="block w-full rounded-xl border border-slate-600 bg-slate-800 cursor-pointer p-3 text-sm text-slate-300
          file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600
          file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
        />

        {logo && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Logo Preview"
                className="h-16 w-16 rounded-xl bg-white object-contain p-2"
              />

              <div>
                <p className="font-semibold text-white">
                  Logo Uploaded
                </p>

                <p className="text-sm text-slate-400">
                  Your logo will appear in the center of the QR code.
                </p>
              </div>
            </div>

            <button
              onClick={() => setLogo("")}
              className="rounded-xl bg-red-600 px-5 py-2 font-medium transition hover:bg-red-700"
            >
              Remove
            </button>

          </div>
        )}

      </div>

    </div>
  );
}