import { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import DownloadButtons from "./DownloadButtons";
import QRCustomizer from "./QRCustomizer";
import QRForm from "./QRForm";
import placeholderQR from "../assets/blur-qr.jpg";

export default function QRGenerator() {
  const qrContainer = useRef(null);
  const qrCode = useRef(null);

  const [qrType, setQrType] = useState("url");

  const [formData, setFormData] = useState({
    url: "",
    text: "",
    email: "",
    subject: "",
    message: "",
    phone: "",
    wifiName: "",
    wifiPassword: "",
    wifiSecurity: "WPA",
    latitude: "",
    longitude: "",
  });
  const [foregroundColor, setForegroundColor] = useState("#2563eb");
const [backgroundColor, setBackgroundColor] = useState("#ffffff");
const PREVIEW_SIZE = 200;

const [downloadSize, setDownloadSize] = useState(250);

const [dotStyle, setDotStyle] = useState("rounded");

const [cornerSquareStyle, setCornerSquareStyle] = useState("extra-rounded");

const [cornerDotStyle, setCornerDotStyle] = useState("dot");

const [logo, setLogo] = useState("");
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
const [hasGenerated, setHasGenerated] = useState(false);
  useEffect(() => {
    qrCode.current = new QRCodeStyling({
      width: PREVIEW_SIZE,
height: PREVIEW_SIZE,
      data: "",
      image: "",
      dotsOptions: {
  color: foregroundColor,
  type: dotStyle,
},
backgroundOptions: {
  color: backgroundColor,
},
      cornersSquareOptions: {
        type: cornerSquareStyle,
      },
      cornersDotOptions: {
        type: cornerDotStyle,
      },
    });

    qrContainer.current.innerHTML = "";
    qrCode.current.append(qrContainer.current);

    return () => {
      if (qrContainer.current) {
        qrContainer.current.innerHTML = "";
      }
    };
  }, []);
useEffect(() => {
  if (!qrCode.current) return;

  qrCode.current.update({
    width: PREVIEW_SIZE,
height: PREVIEW_SIZE,
    image: logo,

    dotsOptions: {
      color: foregroundColor,
      type: dotStyle,
    },

    backgroundOptions: {
      color: backgroundColor,
    },

    cornersSquareOptions: {
      type: cornerSquareStyle,
    },

    cornersDotOptions: {
      type: cornerDotStyle,
    },
  });
}, [
  foregroundColor,
  backgroundColor,
  downloadSize,
  dotStyle,
  cornerSquareStyle,
  cornerDotStyle,
]);
  const generateQRCode = () => {
    let data = "";
setHasGenerated(true);
    switch (qrType) {
      case "url":
        data = formData.url;
        break;

      case "text":
        data = formData.text;
        break;

      case "email":
        data = `mailto:${formData.email}?subject=${encodeURIComponent(
          formData.subject
        )}&body=${encodeURIComponent(formData.message)}`;
        break;

      case "phone":
        data = `tel:${formData.phone}`;
        break;

      case "sms":
        data = `SMSTO:${formData.phone}:${formData.message}`;
        break;

      case "whatsapp":
        data = `https://wa.me/${formData.phone.replace(
          /\+/g,
          ""
        )}?text=${encodeURIComponent(formData.message)}`;
        break;

      case "wifi":
        data = `WIFI:T:${formData.wifiSecurity};S:${formData.wifiName};P:${formData.wifiPassword};;`;
        break;

      case "location":
        data = `geo:${formData.latitude},${formData.longitude}`;
        break;

      default:
        data = "";
    }

   qrCode.current.update({
  data,
  image: logo,
  dotsOptions: {
    color: foregroundColor,
  },
  backgroundOptions: {
    color: backgroundColor,
  },
});
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto bg-slate-800 rounded-3xl shadow-2xl p-8">

        <h2 className="text-4xl font-bold text-center">
          QR Code Generator
        </h2>

        <p className="text-center text-slate-400 mt-3 mb-8">
          Generate QR Codes instantly.
        </p>

        {/* QR Type */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-slate-300">
            QR Type
          </label>

          <select
            value={qrType}
            onChange={(e) => setQrType(e.target.value)}
            className="w-full rounded-xl bg-slate-700 border border-slate-600 p-4 text-white outline-none focus:border-blue-500"
          >
            <option value="url">🌐 Website URL</option>
            <option value="text">📝 Text</option>
            <option value="email">📧 Email</option>
            <option value="phone">📞 Phone</option>
            <option value="sms">💬 SMS</option>
            <option value="whatsapp">💚 WhatsApp</option>
            <option value="wifi">📶 WiFi</option>
            <option value="location">📍 Location</option>
          </select>
        </div>

        {/* Dynamic Form */}
        <QRForm
          qrType={qrType}
          formData={formData}
          handleChange={handleChange}
        />
<div className="mt-8 flex flex-col gap-8 lg:flex-row">

  {/* Left Side */}
  <div className="w-full lg:w-1/2">
    <QRCustomizer
      foregroundColor={foregroundColor}
      setForegroundColor={setForegroundColor}
      backgroundColor={backgroundColor}
      setBackgroundColor={setBackgroundColor}
      qrSize={downloadSize}
setQrSize={setDownloadSize}
      dotStyle={dotStyle}
      setDotStyle={setDotStyle}
      cornerSquareStyle={cornerSquareStyle}
      setCornerSquareStyle={setCornerSquareStyle}
      cornerDotStyle={cornerDotStyle}
      setCornerDotStyle={setCornerDotStyle}
      logo={logo}
      setLogo={setLogo}
    />
  </div>

  {/* Right Side */}
  <div className=" w-full h-[100%] lg:w-1/2 mt-8 ">

    <div className="rounded-3xl bg-slate-900 border border-slate-700 p-6">

      <h3 className="mb-6 text-center text-2xl font-bold">
        QR Code Preview
      </h3>

 <div className="relative overflow-hidden flex justify-center">

  {!hasGenerated && (
    <div className="rounded-4xl overflow-hidden">
      <img
      src={placeholderQR} loading="lazy"
      alt="QR Preview"
      className="absolute mt-1  left-1/2 -translate-x-1/2 w-[190px] h-[190px] roun object-contain opacity-60"
    />
    </div>
  )}
  <div
  ref={qrContainer}
  className="flex h-[200px] w-[200px] items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl"
/>


</div>

      <button type="button"
        onClick={generateQRCode}
        className="mt-8 w-full rounded-xl cursor-pointer bg-blue-600 py-4 font-semibold hover:bg-blue-700 transition"
      >
        Generate QR Code
      </button>

      <div className="mt-16">
        <DownloadButtons qrCode={qrCode} downloadSize={downloadSize}/>
      </div>

    </div>

  </div>

</div>
      </div>
    </section>
  );
}