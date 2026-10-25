export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

  const variants = {
    primary:
      "bg-brand text-on-brand hover:bg-accent hover:shadow-[0_0_25px_color-mix(in_srgb,var(--theme-brand)_45%,transparent)]",

    secondary:
      "border border-border bg-surface/60 text-text hover:border-accent",

    ghost:
      "text-text hover:text-text",
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