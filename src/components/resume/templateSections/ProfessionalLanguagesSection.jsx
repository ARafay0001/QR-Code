import SectionHeading from "./SectionHeading";

export default function ProfessionalLanguagesSection({
  languages,
}) {

  if (!languages.length) return null;

  return (
    <section className="mt-10">

      <SectionHeading
        title="Languages"
        dark
      />

      <ul className="space-y-2">

        {languages.map((language, index) => (

          <li
            key={index}
            className="text-sm"
          >
            • {language}
          </li>

        ))}

      </ul>

    </section>
  );
}