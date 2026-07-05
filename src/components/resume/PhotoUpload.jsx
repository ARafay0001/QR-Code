import { ImagePlus } from "lucide-react";
import { useRef } from "react";
import { useResume } from "../../context/ResumeContext";

export default function PhotoUpload() {

  const inputRef = useRef();

  const { resumeData, setResumeData } = useResume();

  const handleChange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    setResumeData(prev => ({
      ...prev,

      personal: {
        ...prev.personal,

        photo: url,
      },
    }));

  };

  return (
    <div>

      <button
        onClick={() => inputRef.current.click()}
        type="button"
        className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-600 hover:border-blue-500"
      >

        {resumeData.personal.photo ? (

          <img
            src={resumeData.personal.photo}
            className="h-full w-full object-cover"
          />

        ) : (

          <ImagePlus />

        )}

      </button>

      <input
        hidden
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
      />

    </div>
  );
}