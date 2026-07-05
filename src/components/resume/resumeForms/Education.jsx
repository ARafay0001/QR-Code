import { Plus, Trash2 } from "lucide-react";
import ResumeInput from "../ResumeInput";
import ResumeTextarea from "./ResumeTextarea";
import { useResume } from "../../../context/ResumeContext";

export default function Education() {
  const { resumeData, setResumeData } = useResume();

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
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
    }));
  };

  const removeEducation = (id) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((item) => item.id !== id),
    }));
  };

  const handleChange = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <div className="space-y-8">
      {resumeData.education.map((edu, index) => (
        <div
          key={edu.id}
          className="space-y-4 rounded-2xl border border-slate-700 p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Education {index + 1}
            </h3>

            {resumeData.education.length > 1 && (
              <button
                onClick={() => removeEducation(edu.id)}
                className="text-red-500"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <ResumeInput
            label="School / University"
            value={edu.school}
            onChange={(e) =>
              handleChange(edu.id, "school", e.target.value)
            }
          />

          <ResumeInput
            label="Degree"
            value={edu.degree}
            onChange={(e) =>
              handleChange(edu.id, "degree", e.target.value)
            }
          />

          <ResumeInput
            label="Location"
            value={edu.location}
            onChange={(e) =>
              handleChange(edu.id, "location", e.target.value)
            }
          />

          <ResumeInput
            label="Start Date"
            value={edu.startDate}
            onChange={(e) =>
              handleChange(edu.id, "startDate", e.target.value)
            }
          />

          <ResumeInput
            label="End Date"
            value={edu.endDate}
            onChange={(e) =>
              handleChange(edu.id, "endDate", e.target.value)
            }
          />

          <ResumeTextarea
            label="Description"
            rows={4}
            value={edu.description}
            onChange={(e) =>
              handleChange(edu.id, "description", e.target.value)
            }
          />
        </div>
      ))}

      <button
        onClick={addEducation}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold"
      >
        <Plus size={18} />
        Add Education
      </button>
    </div>
  );
}