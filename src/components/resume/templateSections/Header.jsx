export default function Header({
  personal,
  showPhoto = false,
}) {
  return (
    <header>

      <div className="flex items-start justify-between">

        <div>

          <h1 className="text-4xl font-bold">
            {personal.firstName || "John"}{" "}
            {personal.lastName || "Doe"}
          </h1>

          <h2 className="mt-2 text-lg text-slate-600">
            {personal.jobTitle || "Frontend Developer"}
          </h2>

        </div>

        {showPhoto && (
          <div className="h-28 w-28 overflow-hidden rounded-full border bg-slate-200">

            {personal.photo ? (
              <img
                src={personal.photo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}

          </div>
        )}

      </div>

      <div className="mt-6 space-y-1 text-sm">

        {personal.email && <p>{personal.email}</p>}

        {personal.phone && <p>{personal.phone}</p>}

        {personal.location && <p>{personal.location}</p>}

        {personal.website && <p>{personal.website}</p>}

        {personal.linkedin && <p>{personal.linkedin}</p>}

        {personal.github && <p>{personal.github}</p>}

        {personal.portfolio && <p>{personal.portfolio}</p>}

      </div>

    </header>
  );
}