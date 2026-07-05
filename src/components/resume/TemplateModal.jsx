import { resumeTemplates } from "../../data/resumeTemplates";
import { useResume } from "../../context/ResumeContext";

export default function TemplateModal({
  open,
  onClose,
}) {

const {
  selectedTemplate,
  setSelectedTemplate,
  resumeData,
} = useResume();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

      <div className="w-[1000px] rounded-3xl bg-slate-900 p-8">

        <div className="mb-8 flex items-center justify-between">

          <h2 className="text-2xl font-bold">
            Choose Template
          </h2>

          <button onClick={onClose}>
            ✕
          </button>

        </div>

        <div className="grid grid-cols-3 gap-6">

         {resumeTemplates.map((template) => {

  const Template = template.component;

  return (

    <button
      key={template.id}
      onClick={() => {
        setSelectedTemplate(template.id);
        onClose();
      }}
      className={`overflow-hidden rounded-2xl border transition ${
        selectedTemplate === template.id
          ? "border-blue-500"
          : "border-slate-700 hover:border-slate-500"
      }`}
    >

      {/* Preview */}

      <div className="flex h-72 items-center justify-center overflow-hidden bg-slate-800">

        <div className="origin-top scale-[0.28]">

          <Template
            data={resumeData}
            preview
          />

        </div>

      </div>

      {/* Footer */}

      <div className="space-y-2 p-4 text-left">

        <div className="flex items-center justify-between">

          <h3 className="font-bold">
            {template.name}
          </h3>

          <span className="rounded-full bg-blue-600/20 px-2 py-1 text-xs text-blue-400">
            {template.badge}
          </span>

        </div>

        <p className="text-sm text-slate-400">
          {template.description}
        </p>

      </div>

    </button>

  );

})}

        </div>

      </div>

    </div>
  );
}