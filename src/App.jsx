import { BrowserRouter, Routes, Route } from "react-router-dom";
import ImageCompressor from "./pages/ImageCompressor";
import Home from "./pages/Home";
import QRGenerator from "./pages/QRGenerator";
import BackgroundRemover from "./pages/BackgroundRemover";
import VideoCompressor from "./pages/VideoCompressor";
import ScrollToTop from "./components/common/ScrollToTop";
import PDFTools from "./pages/PDFTools";
import MergePDF from "./pages/pdf/MergePDF";
import SplitPDF from "./pages/pdf/SplitPDF";
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/qr-generator" element={<QRGenerator />} />
        <Route path="/image-compressor" element={<ImageCompressor />} />

        <Route path="/video-compressor" element={<VideoCompressor />} />
        <Route path="/background-remover" element={<BackgroundRemover />} />
        <Route path="/pdf-tools" element={<PDFTools />} />
        <Route path="/pdf-tools/merge" element={<MergePDF />} />
        <Route path="/pdf-tools/split" element={<SplitPDF />} />
      </Routes>
    </BrowserRouter>
  );
}
