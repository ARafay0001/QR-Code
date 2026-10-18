import { useEffect, useRef, useState } from "react";
import {
  Download, Link2, Loader2, ClipboardPaste, X, Video, Music, AlertTriangle, Check,
  Clock, User, ShieldCheck, Globe, RefreshCw,
} from "lucide-react";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

/* Brand icons (newer lucide-react versions no longer include them) */
const brand = (children) =>
  function BrandIcon({ size = 24, className = "" }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {children}
      </svg>
    );
  };

const Youtube = brand(<><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></>);
const Twitter = brand(<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />);
const Instagram = brand(<><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></>);
const Facebook = brand(<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />);
/* ========================================================================== */
/*  Video & Audio Downloader — front end                                      */
/*  Talks to a small backend (see server.js) that runs yt-dlp + ffmpeg.       */
/*  Browsers can't fetch these platforms directly (CORS), so a server is      */
/*  required. Set VITE_API_URL (or change API below) to point at it.          */
/*                                                                            */
/*  GET  {API}/info?url=...                                                   */
/*       → { title, thumbnail, duration, uploader, platform,                  */
/*           video: [{ id, label, ext, size? }], audio: [{ id, label, ext }] }*/
/*  GET  {API}/download?url=...&type=video|audio&id=...                       */
/*       → file stream (Content-Disposition: attachment)                      */
/* ========================================================================== */

const API = (import.meta.env && import.meta.env.VITE_API_URL) || "/api";

const PLATFORMS = [
  { name: "YouTube", re: /(^|\.)(youtube\.com|youtu\.be)$/i, icon: Youtube, color: "text-red-400" },
  { name: "Instagram", re: /(^|\.)instagram\.com$/i, icon: Instagram, color: "text-pink-400" },
  { name: "X / Twitter", re: /(^|\.)(twitter\.com|x\.com)$/i, icon: Twitter, color: "text-sky-400" },
  { name: "Facebook", re: /(^|\.)(facebook\.com|fb\.watch|fb\.com)$/i, icon: Facebook, color: "text-blue-400" },
  { name: "TikTok", re: /(^|\.)tiktok\.com$/i, icon: Video, color: "text-cyan-300" },
  { name: "Reddit", re: /(^|\.)reddit\.com$/i, icon: Globe, color: "text-orange-400" },
  { name: "Vimeo", re: /(^|\.)vimeo\.com$/i, icon: Video, color: "text-teal-300" },
];

const parseUrl = (s) => {
  try {
    const u = new URL(s.trim());
    return /^https?:$/.test(u.protocol) ? u : null;
  } catch { return null; }
};
const detect = (s) => {
  const u = parseUrl(s);
  return u ? PLATFORMS.find((p) => p.re.test(u.hostname)) || { name: u.hostname.replace(/^www\./, ""), icon: Globe, color: "text-slate-300" } : null;
};
const fmtTime = (sec) => {
  if (!sec) return "";
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};
const fmtBytes = (b) => (!b ? "" : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : b < 1073741824 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1073741824).toFixed(2)} GB`);

const card = "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl";
const lbl = "text-xs font-semibold uppercase tracking-wide text-slate-500";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,.3)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100";

const Tab = ({ on, onClick, icon: Icon, children }) => (
  <button onClick={onClick} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${on ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,.3)]" : "text-slate-400 hover:text-white"}`}>
    <Icon size={16} />{children}
  </button>
);

/* ================================== PAGE ================================== */

export default function VideoDownloader() {
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("video");
  const [sel, setSel] = useState({ video: null, audio: null });
  const [dl, setDl] = useState({ state: "idle", pct: 0 }); // idle | preparing | downloading | done
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  const platform = detect(url);
  const valid = !!parseUrl(url);

  useEffect(() => () => abortRef.current?.abort(), []);

  const analyze = async (value = url) => {
    const u = parseUrl(value);
    if (!u) return setErr("That doesn’t look like a valid link. Paste the full video URL, starting with https://");
    abortRef.current?.abort();
    const ac = (abortRef.current = new AbortController());
    setErr(""); setInfo(null); setLoading(true); setDl({ state: "idle", pct: 0 });
    try {
      const r = await fetch(`${API}/info?url=${encodeURIComponent(u.href)}`, { signal: ac.signal });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "We couldn’t read this link. It may be private, removed or unsupported.");
      setInfo(data);
      const t = data.video?.length ? "video" : "audio";
      setTab(t);
      setSel({ video: data.video?.[0]?.id ?? null, audio: data.audio?.[0]?.id ?? null });
    } catch (e) {
      if (e.name !== "AbortError") setErr(e.message === "Failed to fetch" ? "Can’t reach the download server. Check that the backend is running." : e.message);
    } finally {
      if (abortRef.current === ac) setLoading(false);
    }
  };

  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setUrl(t);
      if (parseUrl(t)) analyze(t);
    } catch { inputRef.current?.focus(); setErr("Clipboard access was blocked. Press Ctrl+V in the box instead."); }
  };

  const clear = () => { abortRef.current?.abort(); setUrl(""); setInfo(null); setErr(""); setLoading(false); setDl({ state: "idle", pct: 0 }); inputRef.current?.focus(); };

  const download = async () => {
    const id = sel[tab];
    if (!info || id == null) return;
    const ac = (abortRef.current = new AbortController());
    setErr(""); setDl({ state: "preparing", pct: 0 });
    try {
      const r = await fetch(`${API}/download?url=${encodeURIComponent(url.trim())}&type=${tab}&id=${encodeURIComponent(id)}`, { signal: ac.signal });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "The download failed. Try another quality.");
      const total = Number(r.headers.get("Content-Length")) || 0;
      const reader = r.body.getReader();
      const chunks = []; let got = 0;
      setDl({ state: "downloading", pct: 0 });
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); got += value.length;
        if (total) setDl({ state: "downloading", pct: got / total });
      }
      const cd = r.headers.get("Content-Disposition") || "";
      const m = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
      const ext = tab === "audio" ? (list.find((f) => f.id === id)?.ext || "mp3") : "mp4";
      const name = m ? decodeURIComponent(m[1] || m[2]) : `${(info.title || "download").replace(/[\\/:*?"<>|]+/g, "").slice(0, 80)}.${ext}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(chunks));
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      setDl({ state: "done", pct: 1 });
      setTimeout(() => setDl((d) => (d.state === "done" ? { state: "idle", pct: 0 } : d)), 3000);
    } catch (e) {
      if (e.name !== "AbortError") setErr(e.message);
      setDl({ state: "idle", pct: 0 });
    }
  };

  const list = info?.[tab] || [];
  const picked = list.find((f) => f.id === sel[tab]);
  const working = dl.state === "preparing" || dl.state === "downloading";

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="text-center">
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">Video Downloader</span>
            <h1 className="mt-5 text-4xl font-black sm:text-5xl">Download any video or audio.</h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">Paste a link from YouTube, Instagram, X, Facebook and more. Save it as MP4 video or MP3 audio.</p>
          </div>

          {/* Link box */}
          <section className={`${card} mt-8 p-3 sm:p-4`}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className={`flex flex-1 items-center gap-2 rounded-xl border bg-slate-950/60 px-3 transition focus-within:border-blue-500 ${err && !info ? "border-amber-500/40" : "border-slate-700"}`}>
                {platform ? <platform.icon size={18} className={`shrink-0 ${platform.color}`} /> : <Link2 size={18} className="shrink-0 text-slate-500" />}
                <input
                  ref={inputRef}
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); if (err) setErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && analyze()}
                  placeholder="Paste video link here…"
                  aria-label="Video link"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white placeholder-slate-500 outline-none"
                />
                {url ? (
                  <button onClick={clear} aria-label="Clear" className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"><X size={16} /></button>
                ) : (
                  <button onClick={paste} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/10"><ClipboardPaste size={14} />Paste</button>
                )}
              </div>
              <button onClick={() => analyze()} disabled={!valid || loading} className={`${btnPrimary} sm:w-36`}>
                {loading ? <><Loader2 size={16} className="animate-spin" />Checking…</> : <><Download size={16} />Get video</>}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-1 pt-3 text-xs text-slate-500">
              {[Youtube, Instagram, Twitter, Facebook].map((I, i) => <I key={i} size={15} />)}
              <span>and 1000+ other sites</span>
            </div>
          </section>

          {err && (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />{err}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <section className={`${card} mt-5 animate-pulse p-4 sm:p-5`}>
              <div className="flex gap-4">
                <div className="aspect-video w-40 shrink-0 rounded-xl bg-slate-800 sm:w-56" />
                <div className="flex-1 space-y-3 py-1"><div className="h-4 w-3/4 rounded bg-slate-800" /><div className="h-3 w-1/2 rounded bg-slate-800" /><div className="h-3 w-1/3 rounded bg-slate-800" /></div>
              </div>
            </section>
          )}

          {/* Result */}
          {info && !loading && (
            <div className="mt-5 space-y-5">
              <section className={`${card} p-4 sm:p-5`}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-slate-800 sm:w-60">
                    {info.thumbnail && <img src={info.thumbnail} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
                    {info.duration > 0 && <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">{fmtTime(info.duration)}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-lg font-bold leading-snug">{info.title || "Untitled video"}</h2>
                    <div className="mt-3 space-y-1.5 text-sm text-slate-400">
                      {info.uploader && <p className="flex items-center gap-2"><User size={14} className="shrink-0" /><span className="truncate">{info.uploader}</span></p>}
                      {info.duration > 0 && <p className="flex items-center gap-2"><Clock size={14} className="shrink-0" />{fmtTime(info.duration)}</p>}
                      {(info.platform || platform) && <p className="flex items-center gap-2"><Globe size={14} className="shrink-0" />{info.platform || platform.name}</p>}
                    </div>
                  </div>
                </div>
              </section>

              <section className={`${card} space-y-5 p-4 sm:p-6`}>
                <div className="flex gap-1 rounded-2xl border border-slate-800 bg-slate-950/50 p-1">
                  <Tab on={tab === "video"} onClick={() => setTab("video")} icon={Video}>Video</Tab>
                  <Tab on={tab === "audio"} onClick={() => setTab("audio")} icon={Music}>Audio only</Tab>
                </div>

                <div className="space-y-2.5">
                  <p className={lbl}>{tab === "video" ? "Choose quality" : "Choose format"}</p>
                  {list.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">No {tab} formats are available for this link.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {list.map((f) => {
                        const on = sel[tab] === f.id;
                        return (
                          <button key={f.id} onClick={() => setSel({ ...sel, [tab]: f.id })} disabled={working}
                            className={`rounded-xl border px-4 py-3 text-left transition disabled:opacity-60 ${on ? "border-blue-500 bg-blue-500/15" : "border-slate-700 hover:border-slate-500"}`}>
                            <span className="flex items-center justify-between">
                              <span className="font-bold">{f.label}</span>
                              {on && <Check size={15} className="text-blue-400" />}
                            </span>
                            <span className="mt-0.5 block text-xs uppercase text-slate-400">{f.ext}{f.size ? ` · ${fmtBytes(f.size)}` : ""}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-5">
                  <button onClick={download} disabled={!picked || working} className={`${btnPrimary} w-full py-3.5 text-base`}>
                    {dl.state === "preparing" && <><Loader2 size={18} className="animate-spin" />Preparing your file…</>}
                    {dl.state === "downloading" && <><Loader2 size={18} className="animate-spin" />Downloading{dl.pct ? ` ${Math.round(dl.pct * 100)}%` : "…"}</>}
                    {dl.state === "done" && <><Check size={18} />Saved to your device</>}
                    {dl.state === "idle" && <><Download size={18} />Download {picked ? `${tab === "video" ? "MP4" : picked.ext.toUpperCase()} · ${picked.label}` : ""}</>}
                  </button>
                  {working && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className={`h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all ${dl.state === "preparing" || !dl.pct ? "w-1/3 animate-pulse" : ""}`} style={dl.state === "downloading" && dl.pct ? { width: `${dl.pct * 100}%` } : undefined} />
                    </div>
                  )}
                  {working && <p className="text-center text-xs text-slate-500">Larger files can take a minute to prepare. Keep this tab open.</p>}
                </div>
              </section>

              <div className="flex justify-center">
                <button onClick={clear} className={btn}><RefreshCw size={16} />Download another</button>
              </div>
            </div>
          )}

          {/* Empty-state help */}
          {!info && !loading && (
            <section className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                [Link2, "Paste a link", "Copy the video’s address from the app or browser."],
                [Video, "Pick a quality", "Choose a video resolution, or switch to audio only."],
                [Download, "Save the file", "It downloads straight to your device."],
              ].map(([I, t, d]) => (
                <div key={t} className={`${card} p-4`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400"><I size={20} /></span>
                  <p className="mt-3 font-semibold">{t}</p>
                  <p className="mt-1 text-sm text-slate-400">{d}</p>
                </div>
              ))}
            </section>
          )}

          <p className="mx-auto mt-8 flex max-w-xl items-start justify-center gap-2 pb-4 text-center text-xs text-slate-500">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            Only download content you own or have permission to save. Respect each platform’s terms and the creator’s copyright.
          </p>
        </main>

        <Footer />
      </div>
    </>
  );
}
