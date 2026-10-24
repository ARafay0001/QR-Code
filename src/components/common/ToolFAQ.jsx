import { useState } from "react";
import { ChevronDown } from "lucide-react";

const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export default function ToolFAQ({
  faqs,
  id,
  title = "Frequently asked questions",
  description = "Answers to common questions about this tool.",
  className = "py-16 sm:py-20",
}) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id={id} className={`${container} scroll-mt-24 ${className}`}>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">
            {description}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const question = faq.question ?? faq.q;
            const answer = faq.answer ?? faq.a;
            const isOpen = openIndex === index;
            const panelId = `tool-faq-panel-${index}`;

            return (
              <div
                key={question}
                className={`overflow-hidden rounded-xl border bg-slate-900/60 transition-colors ${
                  isOpen
                    ? "border-blue-500/40"
                    : "border-slate-800 hover:border-slate-600"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-6"
                >
                  <h3 className="text-base font-semibold text-white sm:text-lg">
                    {question}
                  </h3>
                  <ChevronDown
                    size={20}
                    aria-hidden="true"
                    className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                      isOpen ? "rotate-180 text-blue-400" : "text-slate-500"
                    }`}
                  />
                </button>

                <div
                  id={panelId}
                  className={`grid transition-all duration-300 motion-reduce:transition-none ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-6 text-slate-400 sm:px-6 sm:text-base sm:leading-7">
                      {answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
