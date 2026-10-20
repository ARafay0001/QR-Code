import { BrowserRouter, Routes, Route } from "react-router-dom";

import ImageCompressor from "./pages/ImageCompressor";
import Home from "./pages/Home";
import QRGenerator from "./pages/QRGenerator";
import BackgroundRemover from "./pages/BackgroundRemover";
import VideoCompressor from "./pages/VideoCompressor";
import CompressPDF from "./pages/pdf/CompressPDF";
import ScrollToTop from "./components/common/ScrollToTop";
import PDFTools from "./pages/PDFTools";
import UnitConverter from "./pages/Unitconverter";
import PDFEditor from "./pages/pdf/PDFEditor";
import DocumentScanner from "./pages/pdf/DocumentScanner";

import NotFound from "./pages/NotFound";
import WebpToImage from "./pages/WebptoImg";
import CompressorTools from "./pages/CompressorTools";
import ImagetoVector from "./pages/ImagetoVector";
import VideoEditor from "./pages/VideoDownloader";
  import VideoDownloader from "./pages/VideoDownloader";
  import Typingtutor from "./pages/Typingtutor";
  import ScientificCalculator from "./pages/ScientificCalculator";
  import InputTester from "./pages/InputTester";
import PDFtoWord from "./pages/pdf/PdftoWord";
import PDFtoExcel from "./pages/pdf/PdftoExcel.jsx";

import Texttool from "./pages/Texttool.jsx";
  export default function App() {
    return (
      <BrowserRouter>
      <ScrollToTop />

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
        <Route path="/image-to-vector" element={<ImagetoVector />} />
        <Route path="/video-editor" element={<VideoEditor />} />

      <Route path="/video-downloader" element={<VideoDownloader />} />
      <Route path="/typing-tutor" element={<Typingtutor />} />
      <Route path="/scientific-calculator" element={<ScientificCalculator />} />
      <Route path="/input-tester" element={<InputTester />} />
      <Route path="/text-tool" element={<Texttool />} />
        {/* 404 - MUST BE LAST */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
