import PersonalInfo from "./resumeForms/PersonalInfo";
import Summary from "./resumeForms/Summary";
import Experience from "./resumeForms/Experience";
import Education from "./resumeForms/Education";
import Projects from "./resumeForms/Projects";
import Skills from "./resumeForms/Skills";
import Certifications from "./resumeForms/Certifications";
import Languages from "./resumeForms/Languages";

export default function EditorPanel({
  activeSection,
}) {

  switch (activeSection) {

    case "personal":
      return <PersonalInfo />;

    case "summary":
      return <Summary />;

    case "experience":
      return <Experience />;

    case "education":
      return <Education />;

    case "projects":
      return <Projects />;

    case "skills":
      return <Skills />;

    case "certifications":
      return <Certifications />;

    case "languages":
      return <Languages />;

    default:
      return null;

  }
}