export default function ProfessionalHeader({ personal }) {
  return (
    <div className="flex flex-col items-center text-center">

      <div className="mb-6 h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-slate-700">

        {personal.photo ? (
          <img
            src={personal.photo}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-300">
            Photo
          </div>
        )}

      </div>

      <h1 className="text-3xl font-bold">
        {personal.firstName || "John"}{" "}
        {personal.lastName || "Doe"}
      </h1>

      <h2 className="mt-2 text-sm uppercase tracking-widest text-slate-300">
        {personal.jobTitle || "Frontend Developer"}
      </h2>

      <div className="mt-8 w-full border-t border-slate-600 pt-6 text-left text-sm space-y-3">

        {personal.email && (
          <p>{personal.email}</p>
        )}

        {personal.phone && (
          <p>{personal.phone}</p>
        )}

        {personal.location && (
          <p>{personal.location}</p>
        )}

        {personal.website && (
          <p>{personal.website}</p>
        )}

        {personal.linkedin && (
          <p>{personal.linkedin}</p>
        )}

        {personal.github && (
          <p>{personal.github}</p>
        )}

        {personal.portfolio && (
          <p>{personal.portfolio}</p>
        )}

      </div>

    </div>
  );
}