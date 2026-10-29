import { Link } from "react-router-dom";
import Footer from "../components/common/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-page text-text">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">
          About Toolited
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Useful tools, without the extra steps.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-text">
          Toolited is a growing collection of free online tools for common
          creative, document, and everyday tasks. The platform brings QR code
          creation, image and video utilities, PDF tools, and other browser
          tools together in one place.
        </p>
        <p className="mt-4 max-w-3xl leading-7 text-muted">
          Choose a tool and get started without creating an account. Processing
          behavior depends on the tool; tools that process files in your
          browser keep that work on your device.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-brand px-5 py-3 font-semibold transition hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Explore free online tools
        </Link>
      </main>
      <Footer />
    </div>
  );
}