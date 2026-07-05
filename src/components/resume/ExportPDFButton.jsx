import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";

export default function ExportPDFButton({ previewRef }) {
  const downloadPDF = async () => {
    try {
      const element = previewRef.current;

      if (!element) return;

      const dataUrl = await toJpeg(element, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(dataUrl);

      const pdfWidth = 210;
      const pdfHeight =
        (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(
        dataUrl,
        "JPEG",
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      pdf.save("resume.pdf");

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      onClick={downloadPDF}
      className="w-full cursor-pointer rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700"
    >
      Download PDF
    </button>
  );
}