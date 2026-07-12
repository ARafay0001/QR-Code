import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, Trash2, GripVertical } from "lucide-react";

export default function SortablePDFItem({
  file,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: file.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 p-5"
    >
      <div
        className="flex items-center gap-4 cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="text-slate-400" />
        <FileText className="text-red-400" />

        <div>
          <h3 className="font-semibold">
            {file.name}
          </h3>

          <p className="text-sm text-slate-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="rounded-xl p-3 hover:bg-red-500/20"
      >
        <Trash2 className="text-red-400" />
      </button>
    </div>
  );
}