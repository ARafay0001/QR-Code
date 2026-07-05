import ResumeTextarea from "./ResumeTextarea";
import { useResume } from "../../../context/ResumeContext";

export default function Summary() {
  const { resumeData, setResumeData } = useResume();

  const handleChange = (e) => {
    setResumeData((prev) => ({
      ...prev,
      summary: e.target.value,
    }));
  };

  return (
    <ResumeTextarea
      label="Professional Summary"
      name="summary"
      value={resumeData.summary}
      onChange={handleChange}
      rows={7}
      placeholder="Write a short professional summary..."
    />
  );
}