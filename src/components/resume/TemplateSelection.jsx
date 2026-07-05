import { resumeTemplates } from "../../data/resumeTemplates";
import TemplateCard from "./TemplateCard";
import Navbar from "../common/Navbar"
export default function TemplateSelection() {
  const handleSelect = (template) => {
    console.log(template);
  };

  return (
    <>
    <Navbar/>
      <div className="text-center ">

        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 sm:px-4 sm:text-sm">
          ATS Friendly Templates
        </span>

        <h1 className="mt-6 text-3xl font-black sm:text-4xl lg:text-5xl">
          Choose Your Resume Template
        </h1>

        <p className="mx-auto mt-6 max-w-2xl px-4 text-base text-slate-400 sm:text-lg">
          Select a professionally designed template.
          You can switch templates anytime.
        </p>

      </div>

      <div className="mt-12 px-12 grid m-auto max-w-[1680px] gap-6 sm:mt-16 sm:gap-8 md:grid-cols-2 xl:mt-20 xl:grid-cols-3">

        {resumeTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={handleSelect}
          />
        ))}

      </div>
    </>
  );
}