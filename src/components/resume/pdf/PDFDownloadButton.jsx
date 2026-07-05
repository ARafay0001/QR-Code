import { PDFDownloadLink } from "@react-pdf/renderer";

import ModernPDF from "./ModernPDF";

import { useResume } from "../../../context/ResumeContext";

export default function PDFDownloadButton() {

  const { resumeData } = useResume();

  return (
    <PDFDownloadLink
      document={<ModernPDF data={resumeData} />}
      fileName="resume.pdf"
    >
      {({ loading }) => (
        <button
          className="w-full rounded-xl bg-blue-600 p-3 font-semibold hover:bg-blue-700"
        >
          {loading
            ? "Preparing PDF..."
            : "Download PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}