import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function BeforeAfterSlider({ original, result }) {
  const containerRef = useRef(null);

  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePosition = (clientX) => {
    const rect = containerRef.current.getBoundingClientRect();

    const x = clientX - rect.left;

    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setPosition(percentage);
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 select-none"
      onMouseDown={(e) => {
        setDragging(true);
        updatePosition(e.clientX);
      }}
      onMouseMove={(e) => {
        if (dragging) updatePosition(e.clientX);
      }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
    >
      {/* Original */}
      <img
        src={original}
        alt="Original"
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Result */}
      <img
        src={result}
        alt="Result"
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        draggable={false}
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`,
        }}
      />

      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white"
        style={{
          left: `${position}%`,
          transform: "translateX(-50%)",
        }}
      />

      {/* Handle */}
      <div
        className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-blue-600 shadow-xl"
        style={{
          left: `${position}%`,
        }}
      >
        <ChevronLeft size={18} />
        <ChevronRight size={18} />
      </div>

      {/* Labels */}
      <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
        Original
      </div>

      <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
        Result
      </div>
    </div>
  );
}