import Badge from "./Badge"
export default function SectionTitle({
  badge,
  title,
  subtitle,
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">

      {badge && (
        <Badge>{badge}</Badge>
      )}

      <h2 className="mt-6 text-5xl font-bold">
        {title}
      </h2>

      <p className="mt-5 text-lg text-slate-400">
        {subtitle}
      </p>

    </div>
  );
}