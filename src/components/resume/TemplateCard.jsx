import { Link } from "react-router-dom";

export default function TemplateCard({ template }) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 transition duration-300 hover:-translate-y-2 hover:border-blue-500">

      {/* Preview */}

      <div className="flex h-80 items-center justify-center bg-slate-800 p-6">

        <div className="h-[250px] w-[180px] overflow-hidden rounded-xl border border-slate-600 bg-white shadow-lg">

         <div className="flex h-[250px] w-[180px] items-center justify-center rounded-xl border border-slate-600 bg-white text-slate-400">
  Template Preview
</div>

        </div>

      </div>

      {/* Content */}

      <div className="space-y-4 p-6">

        <div className="flex items-center justify-between">

          <h3 className="text-xl font-bold text-white">
            {template.name}
          </h3>

          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            {template.badge}
          </span>

        </div>

        <p className="text-sm leading-6 text-slate-400">
          {template.description}
        </p>

        <Link
          to={`/resume-builder/editor/${template.id}`}
          className="block w-full rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
        >
          Use Template
        </Link>

      </div>

    </div>
  );
}