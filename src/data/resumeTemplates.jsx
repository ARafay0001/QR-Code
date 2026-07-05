import ModernTemplate from "../components/resume/templates/ModernTemplate";
import ProfessionalTemplate from "../components/resume/templates/ProfessionalTemplate";
import ExecutiveTemplate from "../components/resume/templates/ExecutiveTemplate";
import MinimalTemplate from "../components/resume/templates/MinimalTemplate";
import CreativeTemplate from "../components/resume/templates/CreativeTemplate";

export const resumeTemplates = [
  {
    id: "modern",
    component: ModernTemplate,
    name: "Modern",
    description: "Perfect for developers and students.",
    badge: "Most Popular",
    hasPhoto: false,
  },

  {
    id: "professional",
    component: ProfessionalTemplate,
    name: "Professional",
    description: "Elegant sidebar layout.",
    badge: "Photo",
    hasPhoto: true,
  },

  {
    id: "executive",
    component: ExecutiveTemplate,
    name: "Executive",
    description: "Ideal for senior professionals.",
    badge: "ATS",
    hasPhoto: false,
  },

  {
    id: "minimal",
    component: MinimalTemplate,
    name: "Minimal",
    description: "Clean and ATS Friendly.",
    badge: "ATS",
    hasPhoto: false,
  },

  {
    id: "creative",
    component: CreativeTemplate,
    name: "Creative",
    description: "Creative design with photo.",
    badge: "Designer",
    hasPhoto: true,
  },
];