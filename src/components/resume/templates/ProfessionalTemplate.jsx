import ProfessionalHeader from "../templateSections/ProfessionalHeader";

import ProfessionalSkillsSection from "../templateSections/ProfessionalSkillsSection";
import ProfessionalLanguagesSection from "../templateSections/ProfessionalLanguagesSection";
import ProfessionalCertificationsSection from "../templateSections/ProfessionalCertificationsSection";
import SummarySection from "../templateSections/SummarySection";
import ExperienceSection from "../templateSections/ExperienceSection";
import EducationSection from "../templateSections/EducationSection";
import ProjectsSection from "../templateSections/ProjectsSection";
import SkillsSection from "../templateSections/SkillsSection";
import CertificationsSection from "../templateSections/CertificationsSection";
import LanguagesSection from "../templateSections/LanguagesSection";

export default function ProfessionalTemplate({
  data,
}) {

  return (
<div className="min-h-[1123px] w-[794px] bg-white text-black">

  <div className="grid grid-cols-[250px_1fr]">

    {/* LEFT SIDEBAR */}

 <aside className="min-h-[1123px] bg-slate-800 p-8 text-white">

  <ProfessionalHeader
    personal={data.personal}
  />

  <ProfessionalSkillsSection
    skills={data.skills}
  />

  <ProfessionalLanguagesSection
    languages={data.languages}
  />

  <ProfessionalCertificationsSection
    certifications={data.certifications}
  />

</aside>

    {/* RIGHT */}

   <main className="p-10">

  <SummarySection
    summary={data.summary}
  />

  <ExperienceSection
    experience={data.experience}
  />

  <EducationSection
    education={data.education}
  />

  <ProjectsSection
    projects={data.projects}
  />

</main>
  </div>

</div>
  );

}