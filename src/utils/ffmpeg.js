import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const ffmpeg = new FFmpeg();

let loaded = false;

export async function loadFFmpeg() {
  if (loaded) return;

  await ffmpeg.load();

  loaded = true;

  console.log("✅ FFmpeg Loaded");
}

function getVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");

    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.src = URL.createObjectURL(file);
  });
}

export async function compressVideo(
  file,
  targetSize,
  targetUnit,
  resolution,
  onProgress
) {
  const inputName = "input.mp4";
  const outputName = "output.mp4";

  ffmpeg.on("progress", ({ progress }) => {
    if (onProgress) {
      onProgress(Math.round(progress * 100));
    }
  });

  //---------------------------------------
  // Calculate bitrate from target size
  //---------------------------------------

  const duration = await getVideoDuration(file);

  const targetSizeMB =
    targetUnit === "MB"
      ? targetSize
      : targetSize / 1024;

  const audioBitrate = 128;

  const totalBitrate = Math.floor(
    (targetSizeMB * 8192) / duration
  );

  const videoBitrate = Math.max(
    totalBitrate - audioBitrate,
    300
  );

  console.log({
    duration,
    targetSizeMB,
    videoBitrate,
  });

  //---------------------------------------
  // Resolution
  //---------------------------------------

  let scale = "";

  switch (resolution) {
    case "1080":
      scale = "1920:-2";
      break;

    case "720":
      scale = "1280:-2";
      break;

    case "480":
      scale = "854:-2";
      break;

    case "360":
      scale = "640:-2";
      break;

    default:
      scale = "";
  }

  //---------------------------------------
  // Write input
  //---------------------------------------

  await ffmpeg.writeFile(
    inputName,
    await fetchFile(file)
  );

  //---------------------------------------
  // FFmpeg command
  //---------------------------------------

  const command = [
    "-i",
    inputName,

    ...(scale
      ? ["-vf", `scale=${scale}`]
      : []),

    "-c:v",
    "libx264",

    "-b:v",
    `${videoBitrate}k`,

    "-maxrate",
    `${videoBitrate}k`,

    "-bufsize",
    `${videoBitrate * 2}k`,

    "-c:a",
    "aac",

    "-b:a",
    "128k",

    "-preset",
    "veryfast",

    "-movflags",
    "+faststart",

    "-y",

    outputName,
  ];

  //---------------------------------------
  // Compress
  //---------------------------------------

  await ffmpeg.exec(command);

  //---------------------------------------
  // Read output
  //---------------------------------------

  const data = await ffmpeg.readFile(outputName);

  //---------------------------------------
  // Cleanup
  //---------------------------------------

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  //---------------------------------------
  // Return blob
  //---------------------------------------

  return new Blob([data.buffer], {
    type: "video/mp4",
  });
}