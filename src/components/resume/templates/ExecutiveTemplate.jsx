import Header from "../templateSections/Header";
import SummarySection from "../templateSections/SummarySection";
import ExperienceSection from "../templateSections/ExperienceSection";
import EducationSection from "../templateSections/EducationSection";
import ProjectsSection from "../templateSections/ProjectsSection";
import SkillsSection from "../templateSections/SkillsSection";
import CertificationsSection from "../templateSections/CertificationsSection";
import LanguagesSection from "../templateSections/LanguagesSection";

export default function ExecutiveTemplate({ data }) {
  return (
    <div className="min-h-[1123px] w-[794px] bg-white px-14 py-12 text-black">

      <Header
        personal={data.personal}
        showPhoto={false}
      />

      <div className="my-8 h-[2px] bg-black" />

      <SummarySection summary={data.summary} />

      <ExperienceSection experience={data.experience} />

      <EducationSection education={data.education} />

      <ProjectsSection projects={data.projects} />

      <SkillsSection skills={data.skills} />

      <LanguagesSection languages={data.languages} />

      <CertificationsSection certifications={data.certifications} />

    </div>
  );
}