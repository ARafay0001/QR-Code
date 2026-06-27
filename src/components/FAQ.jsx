import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is QRify completely free?",
    answer:
      "Yes. QRify is completely free to use. You can generate and download unlimited QR codes without creating an account.",
  },
  {
    question: "Do I need to sign up?",
    answer:
      "No. There is no registration or login required. Simply enter your data, customize your QR code, and download it instantly.",
  },
  {
    question: "What types of QR codes can I create?",
    answer:
      "You can generate QR codes for websites, text, email, phone numbers, SMS, WhatsApp, WiFi networks, and locations.",
  },
  {
    question: "Can I customize my QR code?",
    answer:
      "Yes. You can change colors, dot styles, corner styles, size, and even upload your own logo to create a unique QR code.",
  },
  {
    question: "Which file formats can I download?",
    answer:
      "You can download your QR code in PNG, JPEG, SVG, and PDF formats for both digital and print use.",
  },
  {
    question: "Are my QR codes permanent?",
    answer:
      "Yes. Static QR codes remain functional as long as the content they point to exists. For example, if your website stays online, the QR code will continue to work.",
  },
  {
    question: "Is my data stored?",
    answer:
      "No. Your QR codes are generated directly in your browser. We do not store your personal data or the information you enter.",
  },
  {
    question: "Can I use QRify for commercial projects?",
    answer:
      "Yes. You are free to use the generated QR codes for business cards, menus, flyers, product packaging, marketing campaigns, and other commercial purposes.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center">
          Frequently Asked Questions
        </h2>

        <p className="mt-4 text-center text-slate-400">
          Everything you need to know about QRify.
        </p>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span className="font-semibold">{faq.question}</span>

                <ChevronDown
                  className={`transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  size={20}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6 text-slate-400 leading-7">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}