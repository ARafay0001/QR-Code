import { useEffect, useRef, useState } from "react";
import {
  Wifi,
  Laptop,
  Smartphone,
  Upload,
  Download,
  File as FileIcon,
  Copy,
  Link2,
  CheckCircle2,
  ShieldCheck,
  X,
  QrCode,
  RefreshCw,
} from "lucide-react";

/**
 * React-only WebRTC file sharing with manual offer/answer exchange.
 *
 * Important:
 * - This component does not need a signaling backend.
 * - Both devices must exchange the offer/answer text manually.
 * - The actual file transfer happens over a WebRTC data channel.
 * - For a reliable connection across different networks, STUN/TURN may be needed.
 * - For same-Wi-Fi use, try the default STUN configuration first.
 *
 * This component uses the browser's clipboard API when available.
 */

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const CHUNK_SIZE = 16 * 1024; // 16 KiB
const MAX_BUFFERED_AMOUNT = 1024 * 1024; // 1 MiB

function bytesToSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function waitForIceGatheringComplete(peer) {
  if (peer.iceGatheringState === "complete") return Promise.resolve();

  return new Promise((resolve) => {
    const onStateChange = () => {
      if (peer.iceGatheringState === "complete") {
        peer.removeEventListener("icegatheringstatechange", onStateChange);
        resolve();
      }
    };

    peer.addEventListener("icegatheringstatechange", onStateChange);
    // Avoid leaving the UI stuck forever if a browser never completes gathering.
    setTimeout(() => {
      peer.removeEventListener("icegatheringstatechange", onStateChange);
      resolve();
    }, 12000);
  });
}

export default function FileShare() {
  const [role, setRole] = useState("sender");
  const [offerText, setOfferText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [remoteDescription, setRemoteDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [connectionState, setConnectionState] = useState("disconnected");
  const [status, setStatus] = useState(
    "Create an offer on one device, then exchange the offer and answer manually."
  );
  const [progress, setProgress] = useState(null);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const peerRef = useRef(null);
  const channelRef = useRef(null);
  const inputRef = useRef(null);
  const incomingRef = useRef(null);
  const transferRef = useRef(null);
  const fileQueueRef = useRef([]);
  const sendIndexRef = useRef(0);
  const isSendingRef = useRef(false);

  const connected = connectionState === "connected";

  const cleanupPeer = () => {
    try {
      channelRef.current?.close();
      peerRef.current?.close();
    } catch {
      // Nothing to clean up.
    }
    channelRef.current = null;
    peerRef.current = null;
    setConnectionState("disconnected");
  };

  useEffect(() => () => {
    try {
      channelRef.current?.close();
      peerRef.current?.close();
    } catch {
      // Ignore cleanup errors.
    }
  }, []);

  const attachDataChannel = (channel) => {
    channel.binaryType = "arraybuffer";
    channelRef.current = channel;

    channel.onopen = () => {
      setConnectionState("connected");
      setStatus("Connected. Files can now be transferred directly between these browsers.");
    };

    channel.onclose = () => {
      setConnectionState("disconnected");
      setStatus("The peer connection was closed.");
    };

    channel.onerror = () => {
      setStatus("A data-channel error occurred. Try pairing again.");
    };

    channel.onmessage = async (event) => {
      if (typeof event.data === "string") {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (message.type === "file-start") {
          incomingRef.current = {
            name: message.name || "received-file",
            mimeType: message.mimeType || "application/octet-stream",
            size: Number(message.size) || 0,
            chunks: [],
            received: 0,
          };
          setStatus(`Receiving ${message.name || "file"}…`);
        } else if (message.type === "file-end" && incomingRef.current) {
          const incoming = incomingRef.current;
          const blob = new Blob(incoming.chunks, { type: incoming.mimeType });
          const received = {
            id: `${Date.now()}-${Math.random()}`,
            name: incoming.name,
            size: blob.size,
            blob,
          };
          setReceivedFiles((previous) => [received, ...previous]);
          setProgress(null);
          incomingRef.current = null;
          setStatus(`Received ${received.name} (${bytesToSize(received.size)}).`);
        } else if (message.type === "file-error") {
          setStatus(message.message || "The sender reported a transfer error.");
        }
      } else if (incomingRef.current) {
        const incoming = incomingRef.current;
        const chunk = event.data instanceof ArrayBuffer
          ? event.data
          : await event.data.arrayBuffer();
        incoming.chunks.push(chunk);
        incoming.received += chunk.byteLength;
        setProgress({
          name: incoming.name,
          current: incoming.received,
          total: incoming.size,
          direction: "receive",
        });
      }
    };
  };

  const createPeer = () => {
    cleanupPeer();

    const peer = new RTCPeerConnection(RTC_CONFIG);
    peerRef.current = peer;

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") setConnectionState("connected");
      else if (state === "connecting") setConnectionState("connecting");
      else if (state === "failed" || state === "closed" || state === "disconnected") {
        setConnectionState("disconnected");
      }
    };

    peer.ondatachannel = (event) => attachDataChannel(event.channel);

    return peer;
  };

  const createOffer = async () => {
    setBusy(true);
    setStatus("Creating connection offer and gathering network information…");
    try {
      const peer = createPeer();
      const channel = peer.createDataChannel("file-transfer", { ordered: true });
      attachDataChannel(channel);

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await waitForIceGatheringComplete(peer);

      const text = JSON.stringify(peer.localDescription);
      setOfferText(text);
      setLocalDescription(text);
      setRole("sender");
      setStatus("Offer created. Copy it to the receiving device.");
    } catch (error) {
      setStatus(`Could not create offer: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const createAnswer = async () => {
    setBusy(true);
    setStatus("Reading offer and creating answer…");
    try {
      const parsedOffer = JSON.parse(offerText.trim());
      if (!parsedOffer.type || !parsedOffer.sdp) {
        throw new Error("The offer text is not valid WebRTC connection data.");
      }

      const peer = createPeer();
      await peer.setRemoteDescription(parsedOffer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await waitForIceGatheringComplete(peer);

      const text = JSON.stringify(peer.localDescription);
      setAnswerText(text);
      setLocalDescription(text);
      setRole("receiver");
      setStatus("Answer created. Copy it back to the device that created the offer.");
    } catch (error) {
      setStatus(`Could not create answer: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const applyAnswer = async () => {
    setBusy(true);
    setStatus("Applying the answer…");
    try {
      const parsedAnswer = JSON.parse(answerText.trim());
      if (parsedAnswer.type !== "answer" || !parsedAnswer.sdp) {
        throw new Error("The answer text is not valid WebRTC answer data.");
      }
      if (!peerRef.current) {
        throw new Error("Create an offer on this device first.");
      }
      await peerRef.current.setRemoteDescription(parsedAnswer);
      setStatus("Answer applied. Waiting for the direct connection to open…");
    } catch (error) {
      setStatus(`Could not apply answer: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label} copied to clipboard.`);
    } catch {
      setStatus("Clipboard access was blocked. Select the text and copy it manually.");
    }
  };

  const addFiles = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const sendNextChunk = () => {
    const channel = channelRef.current;
    const queue = fileQueueRef.current;
    const fileIndex = sendIndexRef.current;

    if (!channel || channel.readyState !== "open") {
      isSendingRef.current = false;
      setStatus("The connection is not open.");
      return;
    }

    if (fileIndex >= queue.length) {
      isSendingRef.current = false;
      setProgress(null);
      setStatus("All selected files were sent.");
      return;
    }

    const current = queue[fileIndex];

    if (current.offset === 0 && !current.started) {
      channel.send(JSON.stringify({
        type: "file-start",
        name: current.file.name,
        mimeType: current.file.type || "application/octet-stream",
        size: current.file.size,
      }));
      current.started = true;
    }

    if (current.offset >= current.file.size) {
      channel.send(JSON.stringify({ type: "file-end" }));
      sendIndexRef.current += 1;
      sendNextChunk();
      return;
    }

    if (channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
      channel.onbufferedamountlow = () => {
        channel.onbufferedamountlow = null;
        sendNextChunk();
      };
      channel.bufferedAmountLowThreshold = MAX_BUFFERED_AMOUNT / 2;
      return;
    }

    const end = Math.min(current.offset + CHUNK_SIZE, current.file.size);
    const chunk = current.file.slice(current.offset, end);

    chunk.arrayBuffer().then((buffer) => {
      if (!channelRef.current || channelRef.current.readyState !== "open") {
        isSendingRef.current = false;
        setStatus("Connection lost during transfer.");
        return;
      }
      channel.send(buffer);
      current.offset = end;
      setProgress({
        name: current.file.name,
        current: current.offset,
        total: current.file.size,
        direction: "send",
      });
      sendNextChunk();
    }).catch((error) => {
      isSendingRef.current = false;
      setStatus(`Could not read file chunk: ${error.message}`);
    });
  };

  const sendFiles = () => {
    if (!connected || !channelRef.current || files.length === 0 || isSendingRef.current) return;

    fileQueueRef.current = files.map((file) => ({
      file,
      offset: 0,
      started: false,
    }));
    sendIndexRef.current = 0;
    isSendingRef.current = true;
    setStatus("Sending files…");
    sendNextChunk();
  };

  const downloadReceivedFile = (file) => {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const clearFiles = () => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <Wifi size={16} />
            React-only · WebRTC
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            LAN File Share
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Pair two browsers by exchanging connection text, then send files directly
            over an encrypted WebRTC data channel. No file-transfer backend is used.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-blue-300" size={21} />
            <div>
              <h2 className="font-semibold">Connection status</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">{status}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-3 py-1 ${connected ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                  {connectionState}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                  {connected ? "Direct data channel ready" : "Waiting for pairing"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-300">
                <Laptop size={23} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Device A · Create offer</h2>
                <p className="mt-1 text-sm text-slate-400">Use this on the device that starts pairing.</p>
              </div>
            </div>

            <button
              onClick={createOffer}
              disabled={busy}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
            >
              <Link2 size={18} />
              {busy ? "Working…" : "Create connection offer"}
            </button>

            <label className="mt-5 block text-sm font-medium text-slate-300">
              Offer text
            </label>
            <textarea
              value={localDescription && role === "sender" ? localDescription : ""}
              onChange={(event) => setLocalDescription(event.target.value)}
              rows={6}
              placeholder="Create an offer, then copy the text to Device B…"
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500"
            />
            <button
              onClick={() => copyText(localDescription, "Offer")}
              disabled={!localDescription || role !== "sender"}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm hover:bg-slate-800 disabled:opacity-40"
            >
              <Copy size={16} />
              Copy offer
            </button>

            <label className="mt-6 block text-sm font-medium text-slate-300">
              Paste answer from Device B
            </label>
            <textarea
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              rows={5}
              placeholder="Paste the answer text here…"
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500"
            />
            <button
              onClick={applyAnswer}
              disabled={busy || !answerText.trim()}
              className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold hover:bg-violet-500 disabled:opacity-40"
            >
              Apply answer and connect
            </button>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
                <Smartphone size={23} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Device B · Join offer</h2>
                <p className="mt-1 text-sm text-slate-400">Use this on the receiving device.</p>
              </div>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-300">
              Paste offer from Device A
            </label>
            <textarea
              value={offerText}
              onChange={(event) => setOfferText(event.target.value)}
              rows={6}
              placeholder="Paste the offer text here…"
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-violet-500"
            />
            <button
              onClick={createAnswer}
              disabled={busy || !offerText.trim()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold hover:bg-violet-500 disabled:opacity-40"
            >
              <QrCode size={18} />
              Create answer
            </button>

            <label className="mt-6 block text-sm font-medium text-slate-300">
              Answer text (send back to Device A)
            </label>
            <textarea
              value={role === "receiver" ? localDescription : ""}
              onChange={(event) => setLocalDescription(event.target.value)}
              rows={5}
              placeholder="Create an answer, then copy it back to Device A…"
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-violet-500"
            />
            <button
              onClick={() => copyText(localDescription, "Answer")}
              disabled={!localDescription || role !== "receiver"}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm hover:bg-slate-800 disabled:opacity-40"
            >
              <Copy size={16} />
              Copy answer
            </button>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
                <Upload size={23} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Send files</h2>
                <p className="mt-1 text-sm text-slate-400">Choose files after the connection is established.</p>
              </div>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
            >
              Select files
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={addFiles}
          />

          {files.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Selected files ({files.length})</span>
                <button onClick={clearFiles} className="text-slate-400 hover:text-red-300">
                  Clear all
                </button>
              </div>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <FileIcon size={20} className="shrink-0 text-blue-300" />
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-medium">{file.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{bytesToSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setFiles((previous) => previous.filter((_, i) => i !== index))}
                    aria-label={`Remove ${file.name}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
              <button
                onClick={sendFiles}
                disabled={!connected || busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Upload size={18} />
                Send selected files
              </button>
            </div>
          )}

          {progress && (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate">{progress.direction === "send" ? "Sending" : "Receiving"}: {progress.name}</span>
                <span>{progress.total ? Math.round((progress.current / progress.total) * 100) : 100}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${progress.total ? Math.min(100, (progress.current / progress.total) * 100) : 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {bytesToSize(progress.current)} of {bytesToSize(progress.total)}
              </p>
            </div>
          )}
        </section>

        {receivedFiles.length > 0 && (
          <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
            <h2 className="text-xl font-bold">Received files</h2>
            <div className="mt-4 space-y-3">
              {receivedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <Download size={20} className="shrink-0 text-emerald-300" />
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-medium">{file.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{bytesToSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => downloadReceivedFile(file)}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck size={15} />
          Direct WebRTC transfer · No cloud file storage · Manual pairing
          <button
            onClick={() => {
              cleanupPeer();
              setOfferText("");
              setAnswerText("");
              setLocalDescription("");
              setRemoteDescription("");
              setProgress(null);
              setStatus("Connection reset. Create a new offer to pair again.");
            }}
            className="ml-2 inline-flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 hover:bg-slate-800"
          >
            <RefreshCw size={13} />
            Reset connection
          </button>
        </footer>
      </main>
    </div>
  );
}
