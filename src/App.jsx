import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import QRGenerator from "./pages/QRGenerator";
import BackgroundRemover from "./pages/BackgroundRemover";
import ScrollToTop from "./components/common/ScrollToTop";

export default function App() {
  return (
    <BrowserRouter>
    <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/qr-generator" element={<QRGenerator />} />

        <Route
          path="/background-remover"
          element={<BackgroundRemover />}
        />
      </Routes>
    </BrowserRouter>
  );
}