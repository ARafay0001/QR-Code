import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCode,
  FileImage,
  FileText,
  Globe,
  Loader2,
  MapPin,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  QrCode,
  RotateCcw,
  Type,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const PREVIEW_SIZE = 220;
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_DATA_LENGTH = 900; // keeps the QR scannable, even with a logo

const QR_TYPES = [
  { id: "url", label: "Website", icon: Globe },
  { id: "text", label: "Text", icon: Type },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "location", label: "Location", icon: MapPin },
];

const INITIAL_FORM = {
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
};

const INITIAL_STYLE = {
  foreground: "#000000",
  background: "#ffffff",
  size: 400,
  dotStyle: "square",
  cornerSquareStyle: "square",
  cornerDotStyle: "square",
};

const DOT_STYLES = [
  ["square", "Square"],
  ["rounded", "Rounded"],
  ["dots", "Dots"],
  ["classy", "Classy"],
  ["classy-rounded", "Classy Rounded"],
];
const CORNER_SQUARE_STYLES = [
  ["square", "Square"],
  ["extra-rounded", "Extra Rounded"],
  ["dot", "Dot"],
];
const CORNER_DOT_STYLES = [
  ["square", "Square"],
  ["dot", "Dot"],
];

const FOREGROUND_PRESETS = ["#000000", "#1d4ed8", "#047857", "#b91c1c", "#7c3aed"];
const BACKGROUND_PRESETS = ["#ffffff", "#f1f5f9", "#fef9c3", "#dbeafe"];

// Full class strings so Tailwind can detect them at build time.
const DOWNLOAD_FORMATS = [
  {
    ext: "png",
    label: "PNG",
    icon: FileImage,
    classes:
      "border-green-500/40 bg-green-500/10 hover:border-green-400 hover:bg-green-500/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]",
  },
  {
    ext: "jpeg",
    label: "JPEG",
    icon: FileImage,
    classes:
      "border-purple-500/40 bg-purple-500/10 hover:border-purple-400 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]",
  },
  {
    ext: "svg",
    label: "SVG",
    icon: FileCode,
    classes:
      "border-yellow-500/40 bg-yellow-500/10 hover:border-yellow-400 hover:bg-yellow-500/20 hover:shadow-[0_0_20px_rgba(234,179,8,0.6)]",
  },
  {
    ext: "pdf",
    label: "PDF",
    icon: FileText,
    classes:
      "border-red-500/40 bg-red-500/10 hover:border-red-400 hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]",
  },
];

const inputClass =
  "w-full rounded-xl border border-slate-600 bg-slate-700 p-4 text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";
const selectClass =
  "w-full cursor-pointer rounded-xl border border-slate-600 bg-slate-800 p-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{7,15}$/;

const cleanPhone = (value) => value.replace(/[\s()-]/g, "");

// Escape characters that have special meaning in the WiFi QR format.
const escapeWifi = (value) => value.replace(/([\\;,:"])/g, "\\$1");

const normalizeUrl = (raw) => {
  const value = raw.trim();
  if (!value) return "";
  return /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
};

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      (url.hostname.includes(".") || url.hostname === "localhost")
    );
  } catch {
    return false;
  }
};

/**
 * Turns the form into the string encoded in the QR code.
 * Returns { data, error }. `data` is "" when the input is empty or invalid.
 */
function buildQRData(type, f) {
  const ok = (data) => ({ data, error: null });
  const empty = ok("");
  const fail = (error) => ({ data: "", error });

  let result;

  switch (type) {
    case "url": {
      if (!f.url.trim()) return empty;
      const url = normalizeUrl(f.url);
      result = isValidUrl(url)
        ? ok(url)
        : fail("Enter a valid website address, e.g. example.com");
      break;
    }

    case "text":
      result = f.text.trim() ? ok(f.text) : empty;
      break;

    case "email": {
      const email = f.email.trim();
      if (!email) return empty;
      if (!EMAIL_RE.test(email)) return fail("Enter a valid email address");
      const params = [];
      if (f.subject.trim())
        params.push(`subject=${encodeURIComponent(f.subject.trim())}`);
      if (f.message.trim())
        params.push(`body=${encodeURIComponent(f.message.trim())}`);
      result = ok(`mailto:${email}${params.length ? `?${params.join("&")}` : ""}`);
      break;
    }

    case "phone": {
      const phone = cleanPhone(f.phone);
      if (!phone) return empty;
      result = PHONE_RE.test(phone)
        ? ok(`tel:${phone}`)
        : fail("Use international format, e.g. +923001234567");
      break;
    }

    case "sms": {
      const phone = cleanPhone(f.phone);
      if (!phone) return empty;
      result = PHONE_RE.test(phone)
        ? ok(`SMSTO:${phone}:${f.message}`)
        : fail("Use international format, e.g. +923001234567");
      break;
    }

    case "whatsapp": {
      const phone = cleanPhone(f.phone);
      if (!phone) return empty;
      if (!PHONE_RE.test(phone))
        return fail("Use international format, e.g. +923001234567");
      const digits = phone.replace(/\D/g, "");
      const text = f.message.trim()
        ? `?text=${encodeURIComponent(f.message.trim())}`
        : "";
      result = ok(`https://wa.me/${digits}${text}`);
      break;
    }

    case "wifi": {
      const ssid = f.wifiName.trim();
      if (!ssid) return empty;
      if (f.wifiSecurity === "nopass") {
        result = ok(`WIFI:T:nopass;S:${escapeWifi(ssid)};;`);
      } else if (!f.wifiPassword) {
        return fail("Enter the WiFi password, or choose “No Password”");
      } else {
        result = ok(
          `WIFI:T:${f.wifiSecurity};S:${escapeWifi(ssid)};P:${escapeWifi(
            f.wifiPassword,
          )};;`,
        );
      }
      break;
    }

    case "location": {
      const latText = f.latitude.trim();
      const lngText = f.longitude.trim();
      if (!latText || !lngText) return empty;
      const lat = Number(latText);
      const lng = Number(lngText);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90)
        return fail("Latitude must be a number between -90 and 90");
      if (!Number.isFinite(lng) || lng < -180 || lng > 180)
        return fail("Longitude must be a number between -180 and 180");
      result = ok(`geo:${lat},${lng}`);
      break;
    }

    default:
      return empty;
  }

  if (result.data.length > MAX_DATA_LENGTH) {
    return fail("That's too much content for a reliable QR code. Try shortening it.");
  }
  return result;
}

const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const buildQROptions = ({ size, data, style, logo }) => ({
  width: size,
  height: size,
  margin: 10, // quiet zone so scanners can find the code
  data,
  image: logo || "",
  // Higher error correction keeps the code scannable when a logo covers the center.
  qrOptions: { errorCorrectionLevel: logo ? "H" : "M" },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.3,
    margin: 6,
    crossOrigin: "anonymous",
  },
  dotsOptions: { color: style.foreground, type: style.dotStyle },
  backgroundOptions: { color: style.background },
  cornersSquareOptions: { color: style.foreground, type: style.cornerSquareStyle },
  cornersDotOptions: { color: style.foreground, type: style.cornerDotStyle },
});

const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* -------------------------------------------------------------------------- */
/*                               Small components                             */
/* -------------------------------------------------------------------------- */

function Field({ label, htmlFor, hint, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function PasswordInput({ id, name, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className={`${inputClass} pr-14`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-2 text-slate-400 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function TypeSelector({ value, onChange }) {
  return (
    <div
      role="group"
      aria-label="QR code type"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {QR_TYPES.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 ${
              active
                ? "border-blue-500 bg-blue-600/20 text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]"
                : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-600/70"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   QR Form                                  */
/* -------------------------------------------------------------------------- */

function QRForm({ qrType, formData, handleChange, setFields, notify }) {
  const phoneField = (
    <Field
      label="Phone Number"
      htmlFor="phone"
      hint="Include the country code, e.g. +923001234567"
    >
      <input
        id="phone"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="+923001234567"
        autoComplete="tel"
        className={inputClass}
      />
    </Field>
  );

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      notify("error", "Location isn't supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setFields({
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }),
      () => notify("error", "Couldn't get your location. Check browser permissions."),
    );
  };

  switch (qrType) {
    case "url":
      return (
        <Field
          label="Website URL"
          htmlFor="url"
          hint="https:// is added automatically if you leave it out."
        >
          <input
            id="url"
            type="text"
            inputMode="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://example.com"
            autoComplete="url"
            className={inputClass}
          />
        </Field>
      );

    case "text":
      return (
        <Field label="Text" htmlFor="text">
          <textarea
            id="text"
            name="text"
            value={formData.text}
            onChange={handleChange}
            rows={5}
            maxLength={MAX_DATA_LENGTH}
            placeholder="Enter your text"
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1.5 text-right text-xs text-slate-400">
            {formData.text.length}/{MAX_DATA_LENGTH}
          </p>
        </Field>
      );

    case "email":
      return (
        <div className="space-y-4">
          <Field label="Email Address" htmlFor="email">
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              autoComplete="email"
              className={inputClass}
            />
          </Field>
          <Field label="Subject (optional)" htmlFor="subject">
            <input
              id="subject"
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Subject"
              className={inputClass}
            />
          </Field>
          <Field label="Message (optional)" htmlFor="message">
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              placeholder="Message"
              className={`${inputClass} resize-y`}
            />
          </Field>
        </div>
      );

    case "phone":
      return phoneField;

    case "sms":
    case "whatsapp":
      return (
        <div className="space-y-4">
          {phoneField}
          <Field label="Message (optional)" htmlFor="message">
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              placeholder={qrType === "sms" ? "SMS message" : "WhatsApp message"}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </div>
      );

    case "wifi":
      return (
        <div className="space-y-4">
          <Field label="Network Name (SSID)" htmlFor="wifiName">
            <input
              id="wifiName"
              type="text"
              name="wifiName"
              value={formData.wifiName}
              onChange={handleChange}
              placeholder="WiFi Name"
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          <Field label="Security" htmlFor="wifiSecurity">
            <select
              id="wifiSecurity"
              name="wifiSecurity"
              value={formData.wifiSecurity}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No Password</option>
            </select>
          </Field>

          {formData.wifiSecurity !== "nopass" && (
            <Field label="Password" htmlFor="wifiPassword">
              <PasswordInput
                id="wifiPassword"
                name="wifiPassword"
                value={formData.wifiPassword}
                onChange={handleChange}
                placeholder="WiFi Password"
              />
            </Field>
          )}
        </div>
      );

    case "location":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Latitude" htmlFor="latitude">
              <input
                id="latitude"
                type="text"
                inputMode="decimal"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="24.8607"
                className={inputClass}
              />
            </Field>
            <Field label="Longitude" htmlFor="longitude">
              <input
                id="longitude"
                type="text"
                inputMode="decimal"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="67.0011"
                className={inputClass}
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 outline-none transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <MapPin size={16} />
            Use my current location
          </button>
        </div>
      );

    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Customizer                                 */
/* -------------------------------------------------------------------------- */

function ColorField({ id, label, value, onChange, presets }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        {label}
      </label>

      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-16 cursor-pointer rounded-xl border border-slate-600 bg-slate-800 p-1"
        />
        <span className="font-mono text-sm uppercase text-slate-400">{value}</span>
      </div>

      <div className="mt-3 flex gap-2">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Use ${color}`}
            style={{ backgroundColor: color }}
            className={`h-7 w-7 cursor-pointer rounded-full border-2 outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-blue-500 ${
              value.toLowerCase() === color ? "border-blue-400" : "border-slate-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function SelectField({ id, label, value, onChange, options, className = "" }) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

const QRCustomizer = memo(function QRCustomizer({
  style,
  updateStyle,
  logo,
  setLogo,
  notify,
}) {
  const lowContrast = contrastRatio(style.foreground, style.background) < 3;
  const inverted = luminance(style.foreground) > luminance(style.background);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("error", "Please choose an image file (PNG, JPG or WebP).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      notify("error", "Logo is too large. Please use an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md sm:p-6 lg:p-8">
      <h3 className="mb-8 text-2xl font-bold text-white">Customize QR</h3>

      {/* Colors */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <ColorField
          id="foreground"
          label="Foreground Color"
          value={style.foreground}
          onChange={(v) => updateStyle("foreground", v)}
          presets={FOREGROUND_PRESETS}
        />
        <ColorField
          id="background"
          label="Background Color"
          value={style.background}
          onChange={(v) => updateStyle("background", v)}
          presets={BACKGROUND_PRESETS}
        />
      </div>

      {(lowContrast || inverted) && (
        <p
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {lowContrast
            ? "These colors are too similar and the QR code may not scan."
            : "Dark dots on a light background scan most reliably."}
        </p>
      )}

      {/* Size */}
      <div className="mt-8">
        <div className="mb-2 flex justify-between">
          <label htmlFor="size" className="text-sm font-medium text-slate-300">
            Download Size
          </label>
          <span className="text-sm text-blue-400">
            {style.size} × {style.size}px
          </span>
        </div>
        <input
          id="size"
          type="range"
          min="200"
          max="1000"
          step="50"
          value={style.size}
          onChange={(e) => updateStyle("size", Number(e.target.value))}
          className="w-full cursor-pointer accent-blue-600"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          The preview stays the same size. This only affects downloads.
        </p>
      </div>

      {/* Styles */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <SelectField
          id="dotStyle"
          label="Dot Style"
          value={style.dotStyle}
          onChange={(v) => updateStyle("dotStyle", v)}
          options={DOT_STYLES}
        />
        <SelectField
          id="cornerSquareStyle"
          label="Corner Square"
          value={style.cornerSquareStyle}
          onChange={(v) => updateStyle("cornerSquareStyle", v)}
          options={CORNER_SQUARE_STYLES}
        />
        <SelectField
          id="cornerDotStyle"
          label="Corner Dot"
          value={style.cornerDotStyle}
          onChange={(v) => updateStyle("cornerDotStyle", v)}
          options={CORNER_DOT_STYLES}
          className="sm:col-span-2 lg:col-span-1 xl:col-span-2"
        />
      </div>

      {/* Logo */}
      <div className="mt-8">
        <span className="mb-2 block text-sm font-medium text-slate-300">
          Logo (optional)
        </span>

        {!logo ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/60 p-6 text-center transition focus-within:border-blue-500 hover:border-blue-500 hover:bg-slate-800">
            <Upload size={22} className="text-blue-400" />
            <span className="text-sm font-medium text-slate-200">
              Click to upload a logo
            </span>
            <span className="text-xs text-slate-400">PNG, JPG or WebP, up to 2MB</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
              className="sr-only"
            />
          </label>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Uploaded logo preview"
                className="h-16 w-16 rounded-xl bg-white object-contain p-2"
              />
              <div>
                <p className="font-semibold text-white">Logo added</p>
                <p className="text-sm text-slate-400">
                  It appears in the center of your QR code.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLogo("")}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2 font-medium outline-none transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <X size={16} />
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                              Download buttons                              */
/* -------------------------------------------------------------------------- */

function DownloadButtons({ disabled, busy, size, onDownload, onCopy }) {
  return (
    <div className="mt-8 border-t border-slate-700 pt-6">
      <h4 className="text-center text-lg font-semibold text-white">Download Now</h4>
      <p className="mt-1 text-center text-xs text-slate-400">
        {disabled
          ? "Fill in the details above to enable downloads."
          : `Exports at ${size} × ${size}px`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DOWNLOAD_FORMATS.map(({ ext, label, icon: Icon, classes }) => (
          <button
            key={ext}
            type="button"
            disabled={disabled || Boolean(busy)}
            onClick={() => onDownload(ext)}
            aria-label={`Download QR code as ${label}`}
            className={`group flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-white outline-none backdrop-blur-md transition-all duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none ${classes}`}
          >
            {busy === ext ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <Icon
                size={22}
                className="transition-transform duration-300 group-hover:scale-110"
              />
            )}
            <span className="text-sm font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || Boolean(busy)}
        onClick={onCopy}
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 py-3 text-sm font-medium text-slate-200 outline-none transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Copy size={16} />
        Copy image to clipboard
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function QRGenerator() {
  const previewRef = useRef(null);
  const qrRef = useRef(null);
  const toastTimer = useRef(null);

  const [qrType, setQrType] = useState("url");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [style, setStyle] = useState(INITIAL_STYLE);
  const [logo, setLogo] = useState("");
  const [busy, setBusy] = useState(null); // extension currently being exported
  const [toast, setToast] = useState(null);

  /* ----------------------------- state helpers ----------------------------- */

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFields = useCallback(
    (patch) => setFormData((prev) => ({ ...prev, ...patch })),
    [],
  );

  const updateStyle = useCallback(
    (key, value) => setStyle((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const notify = useCallback((type, text) => {
    clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleReset = () => {
    setQrType("url");
    setFormData(INITIAL_FORM);
    setStyle(INITIAL_STYLE);
    setLogo("");
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ---------------------------- QR data + preview --------------------------- */

  const { data, error } = useMemo(
    () => buildQRData(qrType, formData),
    [qrType, formData],
  );
  const debouncedData = useDebounce(data);
  const hasQR = Boolean(data && debouncedData);

  // Create the preview instance once.
  useEffect(() => {
    const element = previewRef.current;
    const qr = new QRCodeStyling(
      buildQROptions({ size: PREVIEW_SIZE, data: "", style: INITIAL_STYLE, logo: "" }),
    );
    qrRef.current = qr;
    qr.append(element);

    return () => {
      element.innerHTML = "";
      qrRef.current = null;
    };
  }, []);

  // Live-update the preview whenever content or styling changes.
  useEffect(() => {
    qrRef.current?.update(
      buildQROptions({ size: PREVIEW_SIZE, data: debouncedData, style, logo }),
    );
  }, [debouncedData, style, logo]);

  /* -------------------------------- exporting ------------------------------- */

  // Exports use a separate, off-screen instance so the preview never flickers or resizes.
  const createExportQR = async () => {
    const qr = new QRCodeStyling(
      buildQROptions({ size: style.size, data, style, logo }),
    );
    await wait(100); // let the canvas finish drawing (logos load asynchronously)
    return qr;
  };

  const handleDownload = async (ext) => {
    if (!data || busy) return;
    setBusy(ext);

    try {
      const qr = await createExportQR();

      if (ext === "pdf") {
        // jsPDF is only loaded when someone actually exports a PDF.
        const [{ jsPDF }, blob] = await Promise.all([
          import("jspdf"),
          qr.getRawData("png"),
        ]);
        const image = await blobToDataURL(blob);

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const side = 120;
        pdf.addImage(image, "PNG", (210 - side) / 2, 40, side, side);
        pdf.save("qr-code.pdf");
      } else {
        await qr.download({ name: "qr-code", extension: ext });
      }

      notify("success", `${ext.toUpperCase()} downloaded`);
    } catch {
      notify("error", "Download failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleCopy = async () => {
    if (!data || busy) return;
    setBusy("copy");

    try {
      const qr = await createExportQR();
      const blob = await qr.getRawData("png");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      notify("success", "QR code copied to clipboard");
    } catch {
      notify("error", "Copying isn't supported in this browser. Try downloading instead.");
    } finally {
      setBusy(null);
    }
  };

  /* --------------------------------- render --------------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar />

      <main>
        <section id="qrcode" className="px-4 py-20">
          <div
            id="generator"
            className="mx-auto max-w-4xl scroll-mt-24 rounded-3xl bg-slate-800 p-5 shadow-2xl sm:p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 sm:pl-10">
                <h2 className="text-center text-3xl font-bold sm:text-4xl">
                  QR Code Generator
                </h2>
                <p className="mt-3 text-center text-slate-400">
                  Pick a type, enter your details and your QR code appears instantly.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset everything"
                title="Reset everything"
                className="cursor-pointer rounded-xl border border-slate-600 bg-slate-700 p-3 text-slate-300 outline-none transition hover:bg-slate-600 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Step 1 */}
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-medium text-slate-300">
                1. Choose a QR type
              </h3>
              <TypeSelector value={qrType} onChange={setQrType} />
            </div>

            {/* Step 2 */}
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-medium text-slate-300">
                2. Enter your details
              </h3>
              <QRForm
                qrType={qrType}
                formData={formData}
                handleChange={handleChange}
                setFields={setFields}
                notify={notify}
              />

              {error && (
                <p
                  role="alert"
                  className="mt-4 flex items-center gap-2 text-sm text-red-400"
                >
                  <AlertTriangle size={16} className="shrink-0" />
                  {error}
                </p>
              )}
            </div>

            {/* Step 3 */}
            <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="w-full lg:w-1/2">
                <QRCustomizer
                  style={style}
                  updateStyle={updateStyle}
                  logo={logo}
                  setLogo={setLogo}
                  notify={notify}
                />
              </div>

              <div className="w-full lg:sticky lg:top-6 lg:w-1/2">
                <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
                  <h3 className="mb-6 text-center text-2xl font-bold">
                    QR Code Preview
                  </h3>

                  <div className="flex justify-center">
                    <div
                      className="relative"
                      style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                    >
                      {!hasQR && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/50 px-6 text-center text-slate-400">
                          <QrCode size={48} className="opacity-60" />
                          <span className="text-sm">
                            Your QR code will appear here
                          </span>
                        </div>
                      )}

                      <div
                        ref={previewRef}
                        aria-label="QR code preview"
                        className={`overflow-hidden rounded-2xl shadow-xl ${
                          hasQR ? "" : "invisible"
                        }`}
                        style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                      />
                    </div>
                  </div>

                  <p className="mt-4 min-h-4 text-center text-xs text-slate-400">
                    {hasQR && "Scan it with your phone to test it before downloading."}
                  </p>

                  <DownloadButtons
                    disabled={!hasQR}
                    busy={busy}
                    size={style.size}
                    onDownload={handleDownload}
                    onCopy={handleCopy}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Toast */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4"
      >
        {toast && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "border-green-500/40 bg-green-500/20 text-green-100"
                : "border-red-500/40 bg-red-500/20 text-red-100"
            }`}
          >
            {toast.type === "success" ? (
              <Check size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}