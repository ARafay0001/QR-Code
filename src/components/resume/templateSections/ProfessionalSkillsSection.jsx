import SectionHeading from "./SectionHeading";

export default function ProfessionalSkillsSection({
  skills,
}) {

  if (!skills.length) return null;

  return (
    <section className="mt-10">

      <SectionHeading
        title="Skills"
        dark
      />

      <ul className="space-y-2">

        {skills.map((skill, index) => (

          <li
            key={index}
            className="text-sm"
          >
            • {skill}
          </li>

        ))}

      </ul>

    </section>
  );
}