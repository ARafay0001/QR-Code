
import { useRef, useState } from "react";
import {
  Wifi,
  Laptop,
  Smartphone,
  Monitor,
  Upload,
  Download,
  File,
  Search,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Send,
  X,
  HardDrive,
  Radio,
} from "lucide-react";

export default function LANShare() {
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState(
    "No local discovery service connected"
  );

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2)
      return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3)
      return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  };

  const selectFiles = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  // Browser-only placeholder:
  // browsers cannot scan the LAN automatically.
  const discoverDevices = () => {
    setScanning(true);
    setDevices([]);
    setSelectedDevice(null);
    setStatus(
      "Automatic discovery requires a local discovery service."
    );

    // No fake devices are added.
    setTimeout(() => setScanning(false), 700);
  };

  const sendFiles = () => {
    if (!selectedDevice || files.length === 0) return;

    setStatus(
      "No connection established. Connect a real local transfer service first."
    );
  };

  const removeFile = (index) => {
    setFiles((previous) =>
      previous.filter((_, i) => i !== index)
    );
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">

        {/* Header */}
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            <Wifi size={16} />
            Local Network Sharing
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            LAN File Share
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
            Transfer files between devices on the same Wi-Fi
            network, without cloud storage.
          </p>
        </header>

        {/* Network status */}
        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <Radio size={23} />
              </div>

              <div>
                <h2 className="font-bold">Local network</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {status}
                </p>
              </div>
            </div>

            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
              Not connected
            </span>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-blue-400"
            />
            <p className="text-xs leading-6 text-slate-400">
              This interface does not scan your network or
              transfer files yet. A local discovery and transfer
              mechanism must be connected to enable real sharing.
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">

          {/* Sender */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                <Upload size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold">Send files</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose files from this device.
                </p>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={selectFiles}
            />

            <button
              onClick={() => inputRef.current?.click()}
              className="mt-7 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/50 px-4 py-12 transition hover:border-blue-500 hover:bg-blue-500/5"
            >
              <div className="rounded-2xl bg-slate-800 p-4 text-blue-400">
                <Upload size={28} />
              </div>

              <span className="mt-4 font-semibold">
                Select files
              </span>

              <span className="mt-2 text-xs text-slate-500">
                Select multiple files to share
              </span>
            </button>

            {files.length > 0 && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    Selected files ({files.length})
                  </span>

                  <button
                    onClick={() => {
                      setFiles([]);
                      if (inputRef.current) {
                        inputRef.current.value = "";
                      }
                    }}
                    className="text-slate-500 hover:text-red-400"
                  >
                    Clear all
                  </button>
                </div>

                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <div className="rounded-lg bg-slate-800 p-2 text-blue-400">
                      <File size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-medium">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatSize(file.size)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={sendFiles}
                  disabled={!selectedDevice}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={18} />
                  Send files
                </button>
              </div>
            )}
          </section>

          {/* Devices */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
                  <Monitor size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Nearby devices
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Devices available for transfer
                  </p>
                </div>
              </div>

              <button
                onClick={discoverDevices}
                disabled={scanning}
                aria-label="Refresh device discovery"
                className="rounded-xl border border-slate-700 p-3 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={scanning ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="mt-7 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-5 py-10 text-center">
              <div className="rounded-2xl bg-slate-800 p-5 text-slate-500">
                <Search size={30} />
              </div>

              <h3 className="mt-5 font-semibold">
                {scanning
                  ? "Checking discovery status..."
                  : "No devices discovered"}
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                Nearby devices will appear here when a real
                local-network discovery service is connected.
              </p>

              <button
                onClick={discoverDevices}
                disabled={scanning}
                className="mt-5 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                Refresh devices
              </button>
            </div>

                         {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`mt-3 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                    selectedDevice?.id === device.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-600"
                  }`}
                >
                  {device.type === "phone" ? (
                    <Smartphone size={22} />
                  ) : (
                    <Laptop size={22} />
                  )}

                  <span className="flex-1">
                    <span className="block font-semibold">
                      {device.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {device.address}
                    </span>
                  </span>

                  {selectedDevice?.id === device.id && (
                    <CheckCircle2
                      className="text-blue-400"
                      size={20}
                    />
                  )}
                </button>
              ))}
          </section>
        </div>

        {/* Transfers */}
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
              <HardDrive size={23} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Transfer activity
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Your recent file transfers
              </p>
            </div>
          </div>

          {transfers.length === 0 ? (
            <div className="py-12 text-center">
              <Download
                size={30}
                className="mx-auto text-slate-600"
              />
              <p className="mt-4 text-sm text-slate-500">
                No transfers yet
              </p>
            </div>
          ) : (
            transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="mt-4 flex items-center gap-3 rounded-xl border border-slate-800 p-4"
              >
                <CheckCircle2
                  className="text-emerald-400"
                  size={21}
                />
                <div className="flex-1">
                  <p className="font-medium">{transfer.name}</p>
                  <p className="text-xs text-slate-500">
                    {transfer.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>

        <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={15} />
          Designed for private local-network sharing
        </footer>
      </main>
    </div>
  );
}
