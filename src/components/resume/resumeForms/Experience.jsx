import { Plus, Trash2 } from "lucide-react";
import ResumeInput from "../ResumeInput";
import ResumeTextarea from "./ResumeTextarea";
import { useResume } from "../../../context/ResumeContext";

export default function Experience() {
  const { resumeData, setResumeData } = useResume();

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
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
    }));
  };

  const removeExperience = (id) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((item) => item.id !== id),
    }));
  };

  const handleChange = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      ),
    }));
  };

  return (
    <div className="space-y-8">

      {resumeData.experience.map((exp, index) => (

        <div
          key={exp.id}
          className="space-y-4 rounded-2xl border border-slate-700 p-5"
        >

          <div className="flex items-center justify-between">

            <h3 className="font-semibold">
              Experience {index + 1}
            </h3>

            {resumeData.experience.length > 1 && (
              <button
                onClick={() => removeExperience(exp.id)}
                className="text-red-500"
              >
                <Trash2 size={18} />
              </button>
            )}

          </div>

          <ResumeInput
            label="Job Title"
            value={exp.position}
            onChange={(e) =>
              handleChange(exp.id, "position", e.target.value)
            }
          />

          <ResumeInput
            label="Company"
            value={exp.company}
            onChange={(e) =>
              handleChange(exp.id, "company", e.target.value)
            }
          />

          <ResumeInput
            label="Location"
            value={exp.location}
            onChange={(e) =>
              handleChange(exp.id, "location", e.target.value)
            }
          />

          <ResumeInput
            label="Start Date"
            value={exp.startDate}
            onChange={(e) =>
              handleChange(exp.id, "startDate", e.target.value)
            }
          />

          <ResumeInput
            label="End Date"
            value={exp.endDate}
            onChange={(e) =>
              handleChange(exp.id, "endDate", e.target.value)
            }
          />

          <ResumeTextarea
            label="Description"
            rows={5}
            value={exp.description}
            onChange={(e) =>
              handleChange(exp.id, "description", e.target.value)
            }
          />

        </div>

      ))}

      <button
        onClick={addExperience}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold"
      >
        <Plus size={18} />
        Add Experience
      </button>

    </div>
  );
}