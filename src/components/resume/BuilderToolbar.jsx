import { useState } from "react";
import { LayoutTemplate } from "lucide-react";

import { resumeTemplates } from "../../data/resumeTemplates";
import { useResume } from "../../context/ResumeContext";

import PDFDownloadButton from "./pdf/PDFDownloadButton";
import TemplateModal from "./TemplateModal";

export default function BuilderToolbar() {

  const [openModal, setOpenModal] = useState(false);

  const { selectedTemplate } = useResume();

  const currentTemplate = resumeTemplates.find(
    (t) => t.id === selectedTemplate
  );

  return (
    <>
      <div className="sticky top-20 z-30 mb-6 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 shadow-lg">

        <div>

          <h2 className="text-lg font-bold">
            Resume Builder
          </h2>

          <p className="text-sm text-slate-400">
            {currentTemplate?.name} • ATS Friendly
          </p>

        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 transition hover:bg-slate-800"
          >

            <LayoutTemplate size={18} />

            Change Template

          </button>

          <PDFDownloadButton />

        </div>

      </div>

      <TemplateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />

    </>
  );
}