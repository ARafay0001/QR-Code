import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import QRGenerator from "./components/QRGenerator";
import Features from "./components/Features";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Blue Glow */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />

        {/* Purple Glow */}
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[180px]" />

        {/* Cyan Glow */}
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <header>
          <Hero />
        </header>

        <main>
          <section id="generator">
            <QRGenerator />
          </section>

          <section id="features">
            <Features />
          </section>

          <section id="faq">
            <FAQ />
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
