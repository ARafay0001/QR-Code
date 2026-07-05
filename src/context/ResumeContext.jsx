import { createContext, useContext, useState } from "react";

const ResumeContext = createContext();

export function ResumeProvider({
  children,
  templateId,
}) {

  const [selectedTemplate, setSelectedTemplate] =
    useState(templateId);
const [resumeData, setResumeData] = useState({
  personal: {
    firstName: "",
    lastName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
    portfolio: "",
    photo: null,
  },

  summary: "",

  experience: [
    {
      id: crypto.randomUUID(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    },
  ],

  education: [
    {
      id: crypto.randomUUID(),
      school: "",
      degree: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ],

  skills: [],

  projects: [],

  certifications: [],

  languages: [],
});

  return (
    <ResumeContext.Provider
     value={{
  resumeData,
  setResumeData,

  selectedTemplate,
  setSelectedTemplate,
}}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export const useResume = () => useContext(ResumeContext);