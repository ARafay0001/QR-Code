import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RouteMetadata from "./components/common/RouteMetadata";
import ScrollToTop from "./components/common/ScrollToTop";

const Home = lazy(() => import("./pages/Home"));
const QRGenerator = lazy(() => import("./pages/QRGenerator"));
const ImageCompressor = lazy(() => import("./pages/ImageCompressor"));
const UnitConverter = lazy(() => import("./pages/Unitconverter"));
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
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoading() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center px-6 text-slate-300"
      role="status"
      aria-live="polite"
    >
      Loading tool…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteMetadata />
      <ScrollToTop />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/qr-generator" element={<QRGenerator />} />
          <Route path="/image-compressor" element={<ImageCompressor />} />
          <Route path="/unit-converter" element={<UnitConverter />} />
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
          <Route
            path="/scientific-calculator"
            element={<ScientificCalculator />}
          />
          <Route path="/input-tester" element={<InputTester />} />
          <Route path="/text-tool" element={<TextTool />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
