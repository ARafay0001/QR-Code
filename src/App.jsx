import { BrowserRouter, Routes, Route } from "react-router-dom";
import ImageCompressor from "./pages/ImageCompressor";
import Home from "./pages/Home";
import QRGenerator from "./pages/QRGenerator";
import BackgroundRemover from "./pages/BackgroundRemover";
import VideoCompressor from "./pages/VideoCompressor";
import ScrollToTop from "./components/common/ScrollToTop";

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
      </Routes>
    </BrowserRouter>
  );
}
