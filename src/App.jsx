import { lazy, Suspense } from "react";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import RouteMetadata from "./components/common/RouteMetadata";
import ScrollToTop from "./components/common/ScrollToTop";
import Navbar from "./components/common/Navbar";
import Home from "./pages/Home";
import "./App.css";
const QRGenerator = lazy(() => import("./pages/QRGenerator"));
const ImageCompressor = lazy(() => import("./pages/ImageCompressor"));
const UnitConverter = lazy(() => import("./pages/Unitconverter"));
const CurrencyConverter = lazy(() => import("./pages/CurrencyConverter"));
const VideoCompressor = lazy(() => import("./pages/VideoCompressor"));
const BackgroundRemover = lazy(() => import("./pages/BackgroundRemover"));
const PDFTools = lazy(() => import("./pages/PDFTools"));
const CompressPDF = lazy(() => import("./pages/pdf/CompressPDF"));
const CompressorTools = lazy(() => import("./pages/CompressorTools"));
const PDFEditor = lazy(() => import("./pages/pdf/PDFEditor"));
const DocumentScanner = lazy(() => import("./pages/pdf/DocumentScanner"));
const PDFtoWord = lazy(() => import("./pages/pdf/PdftoWord"));
const PDFtoExcel = lazy(() => import("./pages/pdf/PdftoExcel"));
const WebpToImage = lazy(() => import("./pages/WebptoImg"));
const ImageToVector = lazy(() => import("./pages/ImagetoVector"));
const TypingTutor = lazy(() => import("./pages/Typingtutor"));
const ScientificCalculator = lazy(() => import("./pages/ScientificCalculator"));
const InputTester = lazy(() => import("./pages/InputTester"));
const TextTool = lazy(() => import("./pages/Texttool"));
const Games = lazy(() => import("./pages/Games"));
const DiceRoller = lazy(() => import("./pages/games/DiceRoller"));
const SpinWheel = lazy(() => import("./pages/games/SpinWheel"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AllCalculators = lazy(() => import("./pages/Allcalculators"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const InvoiceGenerator = lazy(() => import("./pages/InvoiceGenerator"));

function PageLoading() {
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 text-text">
      <div className="w-full max-w-sm" role="status" aria-live="polite" aria-busy="true">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/70 p-5 shadow-xl shadow-page/20">
          <Loader2
            className="h-5 w-5 shrink-0 animate-spin text-brand motion-reduce:animate-none"
            aria-hidden="true"
          />
          <p className="text-sm text-text">Loading your tool…</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
          <div className="h-full w-2/5 animate-pulse rounded-full bg-gradient-to-r from-brand to-accent motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}

export default function App() {

  return (
    <BrowserRouter>
      <RouteMetadata />
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/qr-generator" element={<QRGenerator />} />
          <Route path="/image-compressor" element={<ImageCompressor />} />
          <Route path="/unit-converter" element={<UnitConverter />} />
          <Route path="/currency-converter" element={<CurrencyConverter />} />
          <Route path="/invoice-generator" element={<InvoiceGenerator />} />
          <Route path="/video-compressor" element={<VideoCompressor />} />
          <Route path="/background-remover" element={<BackgroundRemover />} />
          <Route path="/pdf-tools" element={<PDFTools />} />
          <Route path="/pdf-tools/compress" element={<CompressPDF />} />
          <Route path="/image-video-compressor" element={<CompressorTools />} />
          <Route path="/pdf-tools/pdf-editor" element={<PDFEditor />} />
          <Route path="/pdf-tools/image-to-pdf" element={<DocumentScanner />} />
          <Route path="/pdf-tools/pdf-to-word" element={<PDFtoWord />} />
          <Route path="/pdf-tools/pdf-to-excel" element={<PDFtoExcel />} />
          <Route path="/webp-to-image" element={<WebpToImage />} />
          <Route path="/image-to-vector" element={<ImageToVector />} />
          <Route path="/typing-tutor" element={<TypingTutor />} />
          <Route path="/all-calculators" element={<AllCalculators />} />
          <Route path="/scientific-calculator" element={<ScientificCalculator />} />
          <Route path="/input-tester" element={<InputTester />} />
          <Route path="/text-tool" element={<TextTool />} />

          <Route path="/games" element={<Games />} />
          <Route path="/games/dice-roller" element={<DiceRoller />} />
          <Route path="/games/spin-wheel" element={<SpinWheel />} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}