import { forwardRef } from "react";

import { resumeTemplates } from "../../data/resumeTemplates";
import { useResume } from "../../context/ResumeContext";

const ResumePreview = forwardRef(({ previewRef }, ref) => {

  const {
  resumeData,
  selectedTemplate,
} = useResume();

  const currentTemplate = resumeTemplates.find(
    t => t.id === selectedTemplate
  );

  if (!currentTemplate) {
    return (
      <div className="rounded-3xl border border-red-500 p-10">
        Template Not Found
      </div>
    );
  }

  const Template = currentTemplate.component;

 return (
  <div className="sticky top-28 flex justify-center rounded-3xl border border-slate-800 bg-[#0f172a] p-10">

    <div className="rounded-md bg-white shadow-[0_25px_60px_rgba(0,0,0,0.35)]">

      <Template data={resumeData} />

    </div>

  </div>
);
});

export default ResumePreview;