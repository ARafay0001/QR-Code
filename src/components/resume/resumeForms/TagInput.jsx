import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useResume } from "../../../context/ResumeContext";

export default function TagInput({
  title,
  field,
  placeholder,
}) {
  const { resumeData, setResumeData } = useResume();

  const [value, setValue] = useState("");

  const tags = resumeData[field] || [];

  const addTag = () => {
    const tag = value.trim();

    if (!tag) return;

    if (tags.includes(tag)) {
      setValue("");
      return;
    }

    setResumeData((prev) => ({
      ...prev,
      [field]: [...prev[field], tag],
    }));

    setValue("");
  };

  const removeTag = (index) => {
    setResumeData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-5">

      <label className="block text-sm font-medium text-slate-300">
        {title}
      </label>

      <div className="flex gap-3">

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <button
          type="button"
          onClick={addTag}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5"
        >
          <Plus size={18} />
          Add
        </button>

      </div>

      <div className="flex flex-wrap gap-3">

        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2"
          >
            <span>{tag}</span>

            <button
              type="button"
              onClick={() => removeTag(index)}
            >
              <X size={15} />
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}