import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is Qrvia free to use?",
    answer:
      "Yes. Our core tools are completely free to use with no sign-up required.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. Most Qrvia tools work instantly without requiring an account.",
  },
  {
    question: "Can I use generated QR codes commercially?",
    answer:
      "Absolutely. QR codes generated with Qrvia can be used for both personal and commercial projects.",
  },
  {
    question: "Are my files stored on your servers?",
    answer:
      "We prioritize user privacy. Whenever possible, processing happens directly in your browser. If a tool requires server-side processing, it will be clearly stated.",
  },
  {
    question: "What tools are coming next?",
    answer:
      "We're working on an AI Resume Builder, Background Remover, Image Compressor, and many more useful online tools.",
  },
  {
    question: "Which file formats do you support?",
    answer:
      "Depending on the tool, we support formats such as PNG, SVG, PDF, JPG, and WebP.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mx-auto max-w-5xl px-6 py-32">

      {/* Heading */}

      <div className="text-center">

        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
          FAQ
        </span>

        <h2 className="mt-6 text-5xl font-bold text-white">
          Frequently Asked Questions
        </h2>

        <p className="mt-6 text-lg text-slate-400">
          Everything you need to know before using Qrvia.
        </p>

      </div>

      {/* Questions */}

      <div className="mt-16 space-y-5">

        {faqs.map((faq, index) => {

          const isOpen = openIndex === index;

          return (

            <div
              key={faq.question}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur transition-all duration-300 hover:border-blue-500/40"
            >

              <button
                onClick={() =>
                  setOpenIndex(isOpen ? -1 : index)
                }
                className="flex w-full items-center justify-between px-8 py-6 text-left"
              >

                <h3 className="text-lg font-semibold text-white">
                  {faq.question}
                </h3>

                <ChevronDown
                  className={`transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />

              </button>

              <div
                className={`grid transition-all duration-300 ${
                  isOpen
                    ? "grid-rows-[1fr]"
                    : "grid-rows-[0fr]"
                }`}
              >

                <div className="overflow-hidden">

                  <p className="px-8 pb-6 leading-7 text-slate-400">
                    {faq.answer}
                  </p>

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </section>
  );
}