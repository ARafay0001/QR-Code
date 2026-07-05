import SectionHeading from "./SectionHeading";

export default function ProfessionalCertificationsSection({
  certifications,
}) {

  if (!certifications.length) return null;

  return (
    <section className="mt-10">

      <SectionHeading
        title="Certifications"
        dark
      />

      <ul className="space-y-3">

        {certifications.map((certificate, index) => (

          <li
            key={index}
            className="text-sm"
          >
            • {certificate}
          </li>

        ))}

      </ul>

    </section>
  );
}