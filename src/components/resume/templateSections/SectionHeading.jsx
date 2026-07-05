export default function SectionHeading({
  title,
  dark = false,
}) {
  return (
    <h3
      className={`mb-4 border-b pb-2 text-lg font-bold uppercase tracking-wide ${
        dark
          ? "border-slate-500 text-white"
          : "border-slate-300 text-black"
      }`}
    >
      {title}
    </h3>
  );
}