export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition-all duration-300";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,.45)]",

    secondary:
      "border border-slate-700 bg-slate-900/60 text-white hover:border-blue-500",

    ghost:
      "text-slate-300 hover:text-white",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}