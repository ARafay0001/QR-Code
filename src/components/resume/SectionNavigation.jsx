import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Wrench,
  Award,
  Languages,
} from "lucide-react";

const sections = [
  {
    id: "personal",
    title: "Personal",
    icon: User,
  },
  {
    id: "summary",
    title: "Summary",
    icon: FileText,
  },
  {
    id: "experience",
    title: "Experience",
    icon: Briefcase,
  },
  {
    id: "education",
    title: "Education",
    icon: GraduationCap,
  },
  {
    id: "projects",
    title: "Projects",
    icon: FolderGit2,
  },
  {
    id: "skills",
    title: "Skills",
    icon: Wrench,
  },
  {
    id: "certifications",
    title: "Certificates",
    icon: Award,
  },
  {
    id: "languages",
    title: "Languages",
    icon: Languages,
  },
];

export default function SectionNavigation({
  activeSection,
  setActiveSection,
}) {
  return (
    <div className="space-y-2">

      {sections.map((section) => {

        const Icon = section.icon;

        return (
          <button
            key={section.id}
            onClick={() =>
              setActiveSection(section.id)
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
              activeSection === section.id
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-800"
            }`}
          >
            <Icon size={18} />

            {section.title}

          </button>
        );
      })}

    </div>
  );
}