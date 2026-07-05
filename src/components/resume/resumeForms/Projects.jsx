import { Plus, Trash2 } from "lucide-react";
import ResumeInput from "../ResumeInput";
import ResumeTextarea from "./ResumeTextarea";
import { useResume } from "../../../context/ResumeContext";

export default function Projects() {
  const { resumeData, setResumeData } = useResume();

  const addProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: crypto.randomUUID(),
          name: "",
          techStack: "",
          liveLink: "",
          github: "",
          description: "",
        },
      ],
    }));
  };

  const removeProject = (id) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((project) => project.id !== id),
    }));
  };

  const handleChange = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === id
          ? { ...project, [field]: value }
          : project
      ),
    }));
  };

  return (
    <div className="space-y-8">

      {resumeData.projects.map((project, index) => (

        <div
          key={project.id}
          className="space-y-4 rounded-2xl border border-slate-700 p-5"
        >

          <div className="flex items-center justify-between">

            <h3 className="font-semibold">
              Project {index + 1}
            </h3>

            <button
              onClick={() => removeProject(project.id)}
              className="text-red-500"
            >
              <Trash2 size={18} />
            </button>

          </div>

          <ResumeInput
            label="Project Name"
            value={project.name}
            onChange={(e) =>
              handleChange(project.id, "name", e.target.value)
            }
          />

          <ResumeInput
            label="Tech Stack"
            placeholder="React, Node.js, MongoDB"
            value={project.techStack}
            onChange={(e) =>
              handleChange(project.id, "techStack", e.target.value)
            }
          />

          <ResumeInput
            label="Live Demo"
            placeholder="https://..."
            value={project.liveLink}
            onChange={(e) =>
              handleChange(project.id, "liveLink", e.target.value)
            }
          />

          <ResumeInput
            label="GitHub Repository"
            placeholder="https://github.com/..."
            value={project.github}
            onChange={(e) =>
              handleChange(project.id, "github", e.target.value)
            }
          />

          <ResumeTextarea
            label="Description"
            rows={5}
            value={project.description}
            onChange={(e) =>
              handleChange(project.id, "description", e.target.value)
            }
          />

        </div>

      ))}

      <button
        onClick={addProject}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold"
      >
        <Plus size={18} />
        Add Project
      </button>

    </div>
  );
}