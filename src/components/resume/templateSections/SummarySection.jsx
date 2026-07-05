export default function SummarySection({
  summary,
}) {

  if (!summary) return null;

  return (
    <section className="mt-10">

      <h3 className="mb-3 border-b border-slate-300 pb-2 text-xl font-bold uppercase">

        Professional Summary

      </h3>

      <p className="leading-7 text-slate-700">
        {summary}
      </p>

    </section>
  );
}