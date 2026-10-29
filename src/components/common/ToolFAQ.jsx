import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
const stickyTop = 112;

function FAQTitle({ title, description }) {
  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
        {description}
      </p>
    </>
  );
}

export default function ToolFAQ({
  faqs,
  id,
  title = "Frequently asked questions",
  description = "Answers to common questions about this tool.",
  className = "py-16 sm:py-20",
}) {
  const [openIndex, setOpenIndex] = useState(0);
  const [stickyPosition, setStickyPosition] = useState(null);
  const sectionRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    let frame = 0;

    const updateStickyPosition = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = sectionRef.current;
        const titleElement = titleRef.current;

        if (!section || !titleElement || window.innerWidth < 1024) {
          setStickyPosition(null);
          return;
        }

        const sectionBounds = section.getBoundingClientRect();
        const titleBounds = titleElement.getBoundingClientRect();
        const titleHeight = titleElement.offsetHeight;

        if (titleBounds.top > stickyTop || sectionBounds.bottom <= titleHeight) {
          setStickyPosition(null);
          return;
        }

        const nextPosition = {
          left: titleBounds.left,
          top: Math.min(stickyTop, sectionBounds.bottom - titleHeight),
          width: titleBounds.width,
        };

        setStickyPosition((current) => {
          if (
            current &&
            Math.abs(current.left - nextPosition.left) < 1 &&
            Math.abs(current.top - nextPosition.top) < 1 &&
            Math.abs(current.width - nextPosition.width) < 1
          ) {
            return current;
          }
          return nextPosition;
        });
      });
    };

    updateStickyPosition();
    window.addEventListener("scroll", updateStickyPosition, { passive: true });
    window.addEventListener("resize", updateStickyPosition);
    const resizeObserver = new ResizeObserver(updateStickyPosition);
    if (sectionRef.current) resizeObserver.observe(sectionRef.current);
    if (titleRef.current) resizeObserver.observe(titleRef.current);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateStickyPosition);
      window.removeEventListener("resize", updateStickyPosition);
      resizeObserver.disconnect();
    };
  }, [description, title]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`${container} scroll-mt-24 ${className}`}
    >
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16">
        <div
          ref={titleRef}
          className="lg:sticky lg:top-28 lg:self-start"
          style={stickyPosition ? { visibility: "hidden" } : undefined}
        >
          <FAQTitle title={title} description={description} />
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
                className={`overflow-hidden rounded-xl border bg-surface/60 transition-colors ${
                  isOpen
                    ? "border-brand/40"
                    : "border-border hover:border-muted"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand sm:px-6"
                >
                  <h3 className="text-base font-semibold text-text sm:text-lg">
                    {question}
                  </h3>
                  <ChevronDown
                    size={20}
                    aria-hidden="true"
                    className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                      isOpen ? "rotate-180 text-brand" : "text-muted"
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
                    <p className="px-5 pb-5 text-sm leading-6 text-muted sm:px-6 sm:text-base sm:leading-7">
                      {answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {stickyPosition &&
        createPortal(
          <div
            className="fixed z-40"
            style={{
              left: stickyPosition.left,
              top: stickyPosition.top,
              width: stickyPosition.width,
            }}
          >
            <FAQTitle title={title} description={description} />
          </div>,
          document.body,
        )}
    </section>
  );
}
