import ProfessionalHeader from "../templateSections/ProfessionalHeader";
import SummarySection from "../templateSections/SummarySection";
import ExperienceSection from "../templateSections/ExperienceSection";
import EducationSection from "../templateSections/EducationSection";
import ProjectsSection from "../templateSections/ProjectsSection";
import ProfessionalSkillsSection from "../templateSections/ProfessionalSkillsSection";
import ProfessionalLanguagesSection from "../templateSections/ProfessionalLanguagesSection";
import ProfessionalCertificationsSection from "../templateSections/ProfessionalCertificationsSection";

export default function CreativeTemplate({ data }) {
  return (
    <div className="min-h-[1123px] w-[794px] bg-white">

      <div className="grid grid-cols-[230px_1fr]">

        <aside className="min-h-[1123px] bg-violet-700 p-8 text-white">

          <ProfessionalHeader personal={data.personal} />

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

        <main className="p-10 text-black">

          <SummarySection summary={data.summary} />

          <ExperienceSection experience={data.experience} />

          <EducationSection education={data.education} />

          <ProjectsSection projects={data.projects} />

        </main>

      </div>

    </div>
  );
}