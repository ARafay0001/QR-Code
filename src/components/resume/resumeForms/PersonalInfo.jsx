import ResumeInput from "../ResumeInput";
import { useResume } from "../../../context/ResumeContext";
import { resumeTemplates } from "../../../data/resumeTemplates";
import PhotoUpload from "../PhotoUpload";
export default function PersonalInfo() {
  const { templateId } = useResume();
  
  const currentTemplate = resumeTemplates.find(
  t => t.id === templateId
);
  const { resumeData, setResumeData } = useResume();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setResumeData((prev) => ({
      ...prev,

      personal: {
        ...prev.personal,
        [name]: value,
      },
    }));
  };

  return (
    <div className="space-y-5">
{currentTemplate?.hasPhoto && (
    <PhotoUpload />
)}
      <ResumeInput
        label="First Name"
        name="firstName"
        placeholder="John"
        value={resumeData.personal.firstName}
        onChange={handleChange}
      />

      <ResumeInput
        label="Last Name"
        name="lastName"
        placeholder="Doe"
        value={resumeData.personal.lastName}
        onChange={handleChange}
      />

      <ResumeInput
        label="Professional Title"
        name="jobTitle"
        placeholder="Frontend Developer"
        value={resumeData.personal.jobTitle}
        onChange={handleChange}
      />

      <ResumeInput
        label="Email"
        type="email"
        name="email"
        placeholder="john@gmail.com"
        value={resumeData.personal.email}
        onChange={handleChange}
      />

      <ResumeInput
        label="Phone"
        name="phone"
        placeholder="+92..."
        value={resumeData.personal.phone}
        onChange={handleChange}
      />

      <ResumeInput
        label="Location"
        name="location"
        placeholder="Karachi, Pakistan"
        value={resumeData.personal.location}
        onChange={handleChange}
      />

      <ResumeInput
        label="Website"
        name="website"
        placeholder="https://..."
        value={resumeData.personal.website}
        onChange={handleChange}
      />

      <ResumeInput
        label="LinkedIn"
        name="linkedin"
        placeholder="linkedin.com/in/..."
        value={resumeData.personal.linkedin}
        onChange={handleChange}
      />

      <ResumeInput
        label="GitHub"
        name="github"
        placeholder="github.com/..."
        value={resumeData.personal.github}
        onChange={handleChange}
      />

      <ResumeInput
        label="Portfolio"
        name="portfolio"
        placeholder="portfolio.com"
        value={resumeData.personal.portfolio}
        onChange={handleChange}
      />

    </div>
  );
}