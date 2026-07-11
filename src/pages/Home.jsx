import Navbar from "../components/common/Navbar";
import Hero from "../components/home/Hero";
import WhyChoose from "../components/home/WhyChoose";
import FAQ from "../components/home/FAQ";
import Footer from "../components/common/Footer";
import Products from "../components/home/Products";
import HowItWorks from "../components/home/HowItWorks";
import CTA from "../components/home/CTA";
import { useEffect } from "react";
import { preloadBackgroundModel } from "../utils/preloadAI";
export default function Home() {
  useEffect(() => {
  preloadBackgroundModel();
}, []);
  return (
    <>
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

        <Navbar />

        <Hero />

        <Products />

       <WhyChoose />


<HowItWorks />
{/* <CTA /> */}


        <FAQ />

        <Footer />

      </div>
    </>
  );
}