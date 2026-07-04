import Navbar from "./components/common/Navbar";
import Hero from "./components/qr/QRHero";
import QRGenerator from "./pages/QRGenerator";
import Features from "./components/home/WhyChoose";
import FAQ from "./components/home/FAQ";
import Footer from "./components/common/Footer";
import Home from "./pages/Home"

import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <>
       <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/qr-generator" element={<QRGenerator />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}
