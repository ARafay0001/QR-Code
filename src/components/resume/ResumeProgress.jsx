import { useResume } from "../../context/ResumeContext";

export default function ResumeProgress() {
  const { resumeData } = useResume();

  const sections = [
    !!resumeData.personal.firstName &&
      !!resumeData.personal.lastName &&
      !!resumeData.personal.email,

    !!resumeData.summary,

    resumeData.experience.some(
      (e) => e.company || e.position
    ),

    resumeData.education.some(
      (e) => e.school || e.degree
    ),

    resumeData.projects.some(
      (p) => p.name
    ),

    resumeData.skills.length > 0,

    resumeData.languages.length > 0,

    resumeData.certifications.length > 0,
  ];

  const completed =
    sections.filter(Boolean).length;

  const percentage = Math.round(
    (completed / sections.length) * 100
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="mb-3 flex items-center justify-between">

        <h3 className="font-semibold">
          Resume Completeness
        </h3>

        <span className="font-bold text-blue-400">
          {percentage}%
        </span>

      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-800">

        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}