import jsPDF from "jspdf";

import jpgIcon from "../../assets/jpg.png";
import pngIcon from "../../assets/png.png";
import svgIcon from "../../assets/svg.png";
import pdfIcon from "../../assets/pdf.png";

const PREVIEW_SIZE = 200;

export default function DownloadButtons({
  qrCode,
  downloadSize,
}) {
  const download = async (extension) => {
    if (!qrCode.current) return;

    // Temporarily resize for download
    qrCode.current.update({
      width: downloadSize,
      height: downloadSize,
    });

    // Wait for the QR to redraw
    await new Promise((resolve) => setTimeout(resolve, 100));

    await qrCode.current.download({
      name: "qr-code",
      extension,
    });

    // Restore preview size
    qrCode.current.update({
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
    });
  };

  const downloadPDF = async () => {
    if (!qrCode.current) return;

    // Temporarily resize for PDF
    qrCode.current.update({
      width: downloadSize,
      height: downloadSize,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const blob = await qrCode.current.getRawData("png");

    const reader = new FileReader();

    reader.onload = () => {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(reader.result, "PNG", 30, 30, 150, 150);
      pdf.save("qr-code.pdf");

      // Restore preview size
      qrCode.current.update({
        width: PREVIEW_SIZE,
        height: PREVIEW_SIZE,
      });
    };

    reader.readAsDataURL(blob);
  };

  return (
    <>
      <h2 className="mt-8 text-center text-lg font-semibold text-white">
        Download Now
      </h2>

      <div className="mt-4 flex flex-wrap justify-center gap-5">

        <button
          onClick={() => download("png")} aria-label="Download QR Code"
          className="group cursor-pointer flex items-center gap-3 rounded-2xl border border-green-500/40 bg-green-500/10 px-6 py-3 text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-green-400 hover:bg-green-500/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]"
        >
          <img
            src={pngIcon}
            alt="PNG"
            className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-semibold">PNG</span>
        </button>

        <button
          onClick={() => download("jpeg")} aria-label="Download QR Code"
          className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-purple-500/40 bg-purple-500/10 px-6 py-3 text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-purple-400 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]"
        >
          <img
            src={jpgIcon}
            alt="JPEG"
            className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-semibold">JPEG</span>
        </button>

        <button
          onClick={() => download("svg")} aria-label="Download QR Code"
          className="group flex items-center gap-3 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-6 py-3 text-white backdrop-blur-md cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400 hover:bg-yellow-500/20 hover:shadow-[0_0_20px_rgba(234,179,8,0.6)]"
        >
          <img
            src={svgIcon}
            alt="SVG"
            className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-semibold">SVG</span>
        </button>

        <button
          onClick={downloadPDF} aria-label="Download QR Code"
          className="group flex items-center gap-3 rounded-2xl border border-red-500/40 cursor-pointer bg-red-500/10 px-6 py-3 text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-red-400 hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]"
        >
          <img
            src={pdfIcon}
            alt="PDF"
            className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-semibold">PDF</span>
        </button>

      </div>
    </>
  );
}