
const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export default function ToolArticle({
  id,
  title,
  intro,
  sections = [],
  relatedTools = [],
  className = "pb-16 sm:pb-20",
}) {
  return (
    <article
      id={id}
      className={`mt-12 ${container} scroll-mt-24 ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            {title}
          </h2>

          {intro && (
            <p className="mt-5 text-base leading-8 text-muted sm:text-lg">
              {intro}
            </p>
          )}
        </header>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <section key={`${section.heading}-${index}`}>
              <h3 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">
                {section.heading}
              </h3>

              {section.paragraphs?.map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  className="mt-4 text-base leading-8 text-muted"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets?.length > 0 && (
                <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-muted marker:text-brand">
                  {section.bullets.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {relatedTools.length > 0 && (
          <nav
            aria-label="Related tools"
            className="mt-10 border-t border-border pt-6"
          >
            <h3 className="text-lg font-semibold text-text">
              Related tools
            </h3>

            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
              {relatedTools.map((tool) => (
                <li key={tool.href}>
                  <a
                    href={tool.href}
                    className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                  >
                    {tool.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </article>
  );
}
