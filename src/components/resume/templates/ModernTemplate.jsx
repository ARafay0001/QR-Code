import Header from "../templateSections/Header";
import SummarySection from "../templateSections/SummarySection";

export default function ModernTemplate({
  data,
  preview = false,
}) {
  const personal = data?.personal || {};

  return (
    <div className={`bg-white text-black ${
  preview
    ? "w-[794px] min-h-[1123px]"
    : "w-[794px] min-h-[1123px]"
} p-10`}>

      <h1 className="text-4xl font-bold">
        {personal.firstName || "John"}{" "}
        {personal.lastName || "Doe"}
      </h1>

      <h2 className="mt-2 text-lg text-slate-600">
        {personal.jobTitle || "Frontend Developer"}
      </h2>

      <div className="mt-8 space-y-2 text-sm">

        {personal.email && <p>{personal.email}</p>}

        {personal.phone && <p>{personal.phone}</p>}

        {personal.location && <p>{personal.location}</p>}

        {personal.website && <p>{personal.website}</p>}

        {personal.linkedin && <p>{personal.linkedin}</p>}

        {personal.github && <p>{personal.github}</p>}

        {personal.portfolio && <p>{personal.portfolio}</p>

}

      </div>
      {data.summary && (
  <section className="mt-10">
    <h3 className="mb-3 border-b border-slate-300 pb-2 text-xl font-bold uppercase">
      Professional Summary
    </h3>

    <p className="leading-7 text-slate-700">
      {data.summary}
    </p>
  </section>
  
)}
{data.experience.length > 0 &&
  data.experience.some(
    (exp) =>
      exp.position ||
      exp.company ||
      exp.description
  ) && (
    <section className="mt-10">

      <h3 className="mb-4 border-b border-slate-300 pb-2 text-xl font-bold uppercase">
        Experience
      </h3>

      <div className="space-y-8">

        {data.experience.map((exp) => {

          if (
            !exp.position &&
            !exp.company &&
            !exp.description
          ) {
            return null;
          }

          return (
            <div key={exp.id}>

              <div className="flex items-center justify-between">

                <h4 className="text-lg font-bold">
                  {exp.position || "Job Title"}
                </h4>

                <span className="text-sm text-slate-500">

                  {exp.startDate}

                  {exp.startDate && exp.endDate && " - "}

                  {exp.current ? "Present" : exp.endDate}

                </span>

              </div>

              <p className="font-medium text-slate-700">
                {exp.company}

                {exp.company && exp.location && " • "}

                {exp.location}
              </p>

              {exp.description && (
                <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">
                  {exp.description}
                </p>
              )}

            </div>
          );
        })}

      </div>

    </section>
)}
{data.education.length > 0 &&
  data.education.some(
    (edu) =>
      edu.degree ||
      edu.school ||
      edu.description
  ) && (
    <section className="mt-10">

      <h3 className="mb-4 border-b border-slate-300 pb-2 text-xl font-bold uppercase">
        Education
      </h3>

      <div className="space-y-8">

        {data.education.map((edu) => {

          if (
            !edu.degree &&
            !edu.school &&
            !edu.description
          ) {
            return null;
          }

          return (
            <div key={edu.id}>

              <div className="flex items-center justify-between">

                <h4 className="text-lg font-bold">
                  {edu.degree || "Degree"}
                </h4>

                <span className="text-sm text-slate-500">

                  {edu.startDate}

                  {edu.startDate && edu.endDate && " - "}

                  {edu.endDate}

                </span>

              </div>

              <p className="font-medium text-slate-700">
                {edu.school}

                {edu.school && edu.location && " • "}

                {edu.location}
              </p>

              {edu.description && (
                <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">
                  {edu.description}
                </p>
              )}

            </div>
          );
        })}

      </div>

    </section>
)}
{data.projects.length > 0 &&
  data.projects.some(
    (project) =>
      project.name ||
      project.techStack ||
      project.description
  ) && (
    <section className="mt-10">

      <h3 className="mb-4 border-b border-slate-300 pb-2 text-xl font-bold uppercase">
        Projects
      </h3>

      <div className="space-y-8">

        {data.projects.map((project) => {

          if (
            !project.name &&
            !project.description
          )
            return null;

          return (
            <div key={project.id}>

              <h4 className="text-lg font-bold">
                {project.name || "Project"}
              </h4>

              {project.techStack && (
                <p className="mt-1 text-sm italic text-slate-600">
                  {project.techStack}
                </p>
              )}

              <div className="mt-2 flex gap-5 text-sm">

                {project.liveLink && (
                  <a
                    href={project.liveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Live Demo
                  </a>
                )}

                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    GitHub
                  </a>
                )}

              </div>

              {project.description && (
                <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">
                  {project.description}
                </p>
              )}

            </div>
          );
        })}

      </div>

    </section>
)}

{data.skills.length > 0 && (
<section className="mt-10">

<h3 className="mb-4 border-b border-slate-300 pb-2 text-xl font-bold uppercase">
Skills
</h3>

<div className="flex flex-wrap gap-3">

{data.skills.map((skill,index)=>(

<div
key={index}
className="rounded-full bg-slate-200 px-4 py-2 text-sm"
>

{skill}

</div>

))}

</div>

</section>
)}


{data.languages.length > 0 && (
<section className="mt-10">

<h3 className="mb-4 border-b border-slate-300 pb-2 text-xl font-bold uppercase">
Languages
</h3>

<div className="flex flex-wrap gap-3">

{data.languages.map((language,index)=>(

<div
key={index}
className="rounded-full bg-slate-200 px-4 py-2 text-sm"
>

{language}

</div>

))}

</div>

</section>
)}


{data.certifications.length > 0 && (
<section className="mt-10">

<h3 className="mb-4 border-b border-slate-300 pb-2 text-xl font-bold uppercase">
Certifications
</h3>

<ul className="list-disc space-y-2 pl-6">

{data.certifications.map((certificate,index)=>(

<li key={index}>

{certificate}

</li>

))}

</ul>

</section>
)}
    </div>
  );
}