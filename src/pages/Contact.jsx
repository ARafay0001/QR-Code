import { Mail } from "lucide-react";
import Footer from "../components/common/Footer";
import Navbar from "../components/common/Navbar";

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
          Contact
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Get in touch with Qrvia.
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          Have feedback, a question, or an idea for a useful online tool? Send
          us an email.
        </p>
        <a
          href="mailto:hello@qrvia.com"
          className="mt-8 inline-flex items-center gap-3 rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          <Mail size={20} aria-hidden="true" />
          hello@qrvia.com
        </a>
      </main>
      <Footer />
    </div>
  );
}