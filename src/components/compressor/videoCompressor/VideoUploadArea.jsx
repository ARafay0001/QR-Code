import { Video } from "lucide-react";

export default function VideoPanel({
  selectedVideo,
  setSelectedVideo,
  compressedVideo,
  compressedFile,
  stats,
}){
const handleFileChange = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  setSelectedVideo(file);
};
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 p-8">

      <div className="flex flex-col items-center">

        <div className="rounded-full bg-blue-600/20 p-5">
          <Video size={48} className="text-blue-400" />
        </div>

        <h2 className="mt-6 text-2xl font-bold">
          {selectedVideo ? "Video Selected" : "Upload Video"}
        </h2>

        <p className="mt-3 text-center text-slate-400">
          {selectedVideo
            ? selectedVideo.name
            : "Upload MP4, MOV, AVI or WebM videos."}
        </p>

        <label className="mt-8 cursor-pointer rounded-xl bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-700">

          {selectedVideo ? "Replace Video" : "Choose Video"}

          <input
            hidden
            type="file"
            accept="video/*"
            onChange={handleFileChange}
          />

        </label>

        <p className="mt-5 text-sm text-slate-500">
          MP4 • MOV • AVI • WEBM
        </p>

      </div>

    </div>
  );
}