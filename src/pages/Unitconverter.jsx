import { useEffect, useMemo, useState } from "react";
import {
  Ruler,
  Weight,
  Thermometer,
  Beaker,
  Square,
  Gauge,
  Clock,
  HardDrive,
  Wind,
  Zap,
  Flame,
  Compass,
  Radio,
  Magnet,
  ArrowLeftRight,
  Search,
  Copy,
  Check,
  Sparkles,
  Type,
  ChefHat,
  Fuel,
  Wifi,
  Box,
  Wrench,
  Binary,
} from "lucide-react";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Badge from "../components/ui/Badge";
import SectionTitle from "../components/ui/SectionTitle";

/* -------------------------------------------------------------------------- */
/*  Conversion data                                                          */
/* -------------------------------------------------------------------------- */
/*  category.type controls how convert() and the panel behave:
      "linear"      value_in_base = value * unit.factor ; result = base / target.factor
      "temperature" special Celsius/Fahrenheit/Kelvin formulas
      "typography"  depends on DPI + base font size (px/pt/pc/in/cm/mm/em/rem/%)
      "cooking"     depends on ingredient density (volume <-> weight)
      "fuel"        reciprocal relationship (mpg vs L/100km)
      "numberbase"  text-based radix conversion, rendered by its own component  */

const INGREDIENTS = [
  { id: "water", label: "Water", density: 1.0 },
  { id: "flour", label: "All-Purpose Flour", density: 0.529 },
  { id: "sugar", label: "Granulated Sugar", density: 0.845 },
  { id: "brownsugar", label: "Brown Sugar (packed)", density: 0.93 },
  { id: "powderedsugar", label: "Powdered Sugar", density: 0.507 },
  { id: "butter", label: "Butter", density: 0.959 },
  { id: "milk", label: "Milk", density: 1.03 },
  { id: "honey", label: "Honey", density: 1.42 },
  { id: "oil", label: "Vegetable Oil", density: 0.92 },
  { id: "cocoa", label: "Cocoa Powder", density: 0.355 },
  { id: "rice", label: "Rice (uncooked)", density: 0.782 },
];

const CATEGORIES = [
   {
    id: "typography",
    label: "Typography & Screen",
    icon: Type,
    type: "typography",
    accent: "text-purple-400",
    accentBg: "bg-purple-500/10",
    accentBorder: "border-purple-500/40",
    glow: "rgba(192,132,252,.18)",
    units: [
      { id: "px", label: "Pixel", symbol: "px" },
      { id: "pt", label: "Point", symbol: "pt" },
      { id: "pc", label: "Pica", symbol: "pc" },
      { id: "in", label: "Inch", symbol: "in" },
      { id: "cm", label: "Centimeter", symbol: "cm" },
      { id: "mm", label: "Millimeter", symbol: "mm" },
      { id: "em", label: "Em", symbol: "em" },
      { id: "rem", label: "Rem", symbol: "rem" },
      { id: "pct", label: "Percent", symbol: "%" },
    ],
    defaults: ["in", "px"],
  },
  {
    id: "length",
    label: "Length",
    icon: Ruler,
    type: "linear",
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-500/40",
    glow: "rgba(37,99,235,.18)",
    units: [
      { id: "nm", label: "Nanometer", symbol: "nm", factor: 1e-9 },
      { id: "mm", label: "Millimeter", symbol: "mm", factor: 0.001 },
      { id: "cm", label: "Centimeter", symbol: "cm", factor: 0.01 },
      { id: "m", label: "Meter", symbol: "m", factor: 1 },
      { id: "km", label: "Kilometer", symbol: "km", factor: 1000 },
      { id: "in", label: "Inch", symbol: "in", factor: 0.0254 },
      { id: "ft", label: "Foot", symbol: "ft", factor: 0.3048 },
      { id: "yd", label: "Yard", symbol: "yd", factor: 0.9144 },
      { id: "mi", label: "Mile", symbol: "mi", factor: 1609.344 },
      { id: "nmi", label: "Nautical Mile", symbol: "nmi", factor: 1852 },
    ],
    defaults: ["km", "mi"],
  },
  {
    id: "weight",
    label: "Weight & Mass",
    icon: Weight,
    type: "linear",
    accent: "text-violet-400",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/40",
    glow: "rgba(139,92,246,.18)",
    units: [
      { id: "mg", label: "Milligram", symbol: "mg", factor: 1e-6 },
      { id: "g", label: "Gram", symbol: "g", factor: 0.001 },
      { id: "kg", label: "Kilogram", symbol: "kg", factor: 1 },
      { id: "t", label: "Metric Ton", symbol: "t", factor: 1000 },
      { id: "oz", label: "Ounce", symbol: "oz", factor: 0.0283495 },
      { id: "lb", label: "Pound", symbol: "lb", factor: 0.453592 },
      { id: "st", label: "Stone", symbol: "st", factor: 6.35029 },
      { id: "ton", label: "US Ton", symbol: "ton", factor: 907.185 },
    ],
    defaults: ["kg", "lb"],
  },
  {
    id: "temperature",
    label: "Temperature",
    icon: Thermometer,
    type: "temperature",
    accent: "text-orange-400",
    accentBg: "bg-orange-500/10",
    accentBorder: "border-orange-500/40",
    glow: "rgba(251,146,60,.18)",
    units: [
      { id: "c", label: "Celsius", symbol: "°C" },
      { id: "f", label: "Fahrenheit", symbol: "°F" },
      { id: "k", label: "Kelvin", symbol: "K" },
    ],
    defaults: ["c", "f"],
  },
  {
    id: "volume",
    label: "Volume",
    icon: Beaker,
    type: "linear",
    accent: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/40",
    glow: "rgba(34,211,238,.18)",
    units: [
      { id: "ml", label: "Milliliter", symbol: "ml", factor: 0.001 },
      { id: "l", label: "Liter", symbol: "l", factor: 1 },
      { id: "m3", label: "Cubic Meter", symbol: "m³", factor: 1000 },
      { id: "tsp", label: "Teaspoon", symbol: "tsp", factor: 0.00492892 },
      { id: "tbsp", label: "Tablespoon", symbol: "tbsp", factor: 0.0147868 },
      { id: "floz", label: "Fluid Ounce (US)", symbol: "fl oz", factor: 0.0295735 },
      { id: "cup", label: "Cup (US)", symbol: "cup", factor: 0.24 },
      { id: "pt", label: "Pint (US)", symbol: "pt", factor: 0.473176 },
      { id: "qt", label: "Quart (US)", symbol: "qt", factor: 0.946353 },
      { id: "gal", label: "Gallon (US)", symbol: "gal", factor: 3.78541 },
      { id: "galuk", label: "Gallon (UK)", symbol: "gal UK", factor: 4.54609 },
    ],
    defaults: ["l", "gal"],
  },
  {
    id: "area",
    label: "Area",
    icon: Square,
    type: "linear",
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/40",
    glow: "rgba(16,185,129,.18)",
    units: [
      { id: "mm2", label: "Square Millimeter", symbol: "mm²", factor: 1e-6 },
      { id: "cm2", label: "Square Centimeter", symbol: "cm²", factor: 0.0001 },
      { id: "m2", label: "Square Meter", symbol: "m²", factor: 1 },
      { id: "ha", label: "Hectare", symbol: "ha", factor: 10000 },
      { id: "km2", label: "Square Kilometer", symbol: "km²", factor: 1000000 },
      { id: "in2", label: "Square Inch", symbol: "in²", factor: 0.00064516 },
      { id: "ft2", label: "Square Foot", symbol: "ft²", factor: 0.092903 },
      { id: "yd2", label: "Square Yard", symbol: "yd²", factor: 0.836127 },
      { id: "acre", label: "Acre", symbol: "acre", factor: 4046.86 },
      { id: "mi2", label: "Square Mile", symbol: "mi²", factor: 2589988.11 },
    ],
    defaults: ["m2", "ft2"],
  },
  {
    id: "speed",
    label: "Speed",
    icon: Gauge,
    type: "linear",
    accent: "text-sky-400",
    accentBg: "bg-sky-500/10",
    accentBorder: "border-sky-500/40",
    glow: "rgba(56,189,248,.18)",
    units: [
      { id: "mps", label: "Meter/second", symbol: "m/s", factor: 1 },
      { id: "kph", label: "Kilometer/hour", symbol: "km/h", factor: 0.277778 },
      { id: "mph", label: "Mile/hour", symbol: "mph", factor: 0.44704 },
      { id: "knot", label: "Knot", symbol: "kn", factor: 0.514444 },
      { id: "fps", label: "Foot/second", symbol: "ft/s", factor: 0.3048 },
      { id: "mach", label: "Mach (sea level)", symbol: "Ma", factor: 343 },
    ],
    defaults: ["kph", "mph"],
  },
  {
    id: "time",
    label: "Time",
    icon: Clock,
    type: "linear",
    accent: "text-pink-400",
    accentBg: "bg-pink-500/10",
    accentBorder: "border-pink-500/40",
    glow: "rgba(244,114,182,.18)",
    units: [
      { id: "ms", label: "Millisecond", symbol: "ms", factor: 0.001 },
      { id: "s", label: "Second", symbol: "s", factor: 1 },
      { id: "min", label: "Minute", symbol: "min", factor: 60 },
      { id: "hr", label: "Hour", symbol: "hr", factor: 3600 },
      { id: "day", label: "Day", symbol: "day", factor: 86400 },
      { id: "week", label: "Week", symbol: "wk", factor: 604800 },
      { id: "month", label: "Month (30d)", symbol: "mo", factor: 2592000 },
      { id: "year", label: "Year (365d)", symbol: "yr", factor: 31536000 },
    ],
    defaults: ["hr", "min"],
  },
  {
    id: "data",
    label: "Data Storage",
    icon: HardDrive,
    type: "linear",
    accent: "text-indigo-400",
    accentBg: "bg-indigo-500/10",
    accentBorder: "border-indigo-500/40",
    glow: "rgba(129,140,248,.18)",
    units: [
      { id: "bit", label: "Bit", symbol: "bit", factor: 0.125 },
      { id: "b", label: "Byte", symbol: "B", factor: 1 },
      { id: "kb", label: "Kilobyte", symbol: "KB", factor: 1024 },
      { id: "mb", label: "Megabyte", symbol: "MB", factor: 1024 ** 2 },
      { id: "gb", label: "Gigabyte", symbol: "GB", factor: 1024 ** 3 },
      { id: "tb", label: "Terabyte", symbol: "TB", factor: 1024 ** 4 },
      { id: "pb", label: "Petabyte", symbol: "PB", factor: 1024 ** 5 },
    ],
    defaults: ["gb", "mb"],
  },
  {
    id: "datarate",
    label: "Data Transfer",
    icon: Wifi,
    type: "linear",
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-500/40",
    glow: "rgba(37,99,235,.18)",
    units: [
      { id: "bps", label: "Bit/second", symbol: "bps", factor: 1 },
      { id: "kbps", label: "Kilobit/second", symbol: "Kbps", factor: 1000 },
      { id: "mbps", label: "Megabit/second", symbol: "Mbps", factor: 1e6 },
      { id: "gbps", label: "Gigabit/second", symbol: "Gbps", factor: 1e9 },
      { id: "Bps", label: "Byte/second", symbol: "B/s", factor: 8 },
      { id: "KBps", label: "Kilobyte/second", symbol: "KB/s", factor: 8000 },
      { id: "MBps", label: "Megabyte/second", symbol: "MB/s", factor: 8e6 },
      { id: "GBps", label: "Gigabyte/second", symbol: "GB/s", factor: 8e9 },
    ],
    defaults: ["mbps", "MBps"],
  },
  {
    id: "pressure",
    label: "Pressure",
    icon: Wind,
    type: "linear",
    accent: "text-teal-400",
    accentBg: "bg-teal-500/10",
    accentBorder: "border-teal-500/40",
    glow: "rgba(45,212,191,.18)",
    units: [
      { id: "pa", label: "Pascal", symbol: "Pa", factor: 1 },
      { id: "kpa", label: "Kilopascal", symbol: "kPa", factor: 1000 },
      { id: "bar", label: "Bar", symbol: "bar", factor: 100000 },
      { id: "psi", label: "PSI", symbol: "psi", factor: 6894.76 },
      { id: "atm", label: "Atmosphere", symbol: "atm", factor: 101325 },
      { id: "mmhg", label: "mmHg (Torr)", symbol: "mmHg", factor: 133.322 },
    ],
    defaults: ["bar", "psi"],
  },
  {
    id: "energy",
    label: "Energy",
    icon: Zap,
    type: "linear",
    accent: "text-yellow-400",
    accentBg: "bg-yellow-500/10",
    accentBorder: "border-yellow-500/40",
    glow: "rgba(250,204,21,.18)",
    units: [
      { id: "j", label: "Joule", symbol: "J", factor: 1 },
      { id: "kj", label: "Kilojoule", symbol: "kJ", factor: 1000 },
      { id: "cal", label: "Calorie", symbol: "cal", factor: 4.184 },
      { id: "kcal", label: "Kilocalorie", symbol: "kcal", factor: 4184 },
      { id: "wh", label: "Watt-hour", symbol: "Wh", factor: 3600 },
      { id: "kwh", label: "Kilowatt-hour", symbol: "kWh", factor: 3600000 },
      { id: "btu", label: "BTU", symbol: "BTU", factor: 1055.06 },
      { id: "ev", label: "Electronvolt", symbol: "eV", factor: 1.602176634e-19 },
    ],
    defaults: ["kcal", "kj"],
  },
  {
    id: "power",
    label: "Power",
    icon: Flame,
    type: "linear",
    accent: "text-red-400",
    accentBg: "bg-red-500/10",
    accentBorder: "border-red-500/40",
    glow: "rgba(248,113,113,.18)",
    units: [
      { id: "w", label: "Watt", symbol: "W", factor: 1 },
      { id: "kw", label: "Kilowatt", symbol: "kW", factor: 1000 },
      { id: "mw", label: "Megawatt", symbol: "MW", factor: 1000000 },
      { id: "hp", label: "Horsepower", symbol: "hp", factor: 745.7 },
      { id: "btuh", label: "BTU/hour", symbol: "BTU/h", factor: 0.293071 },
    ],
    defaults: ["kw", "hp"],
  },
  {
    id: "torque",
    label: "Torque",
    icon: Wrench,
    type: "linear",
    accent: "text-orange-400",
    accentBg: "bg-orange-500/10",
    accentBorder: "border-orange-500/40",
    glow: "rgba(251,146,60,.18)",
    units: [
      { id: "nm", label: "Newton-meter", symbol: "N·m", factor: 1 },
      { id: "kgfm", label: "Kilogram-force meter", symbol: "kgf·m", factor: 9.80665 },
      { id: "lbfft", label: "Pound-force foot", symbol: "lbf·ft", factor: 1.35582 },
      { id: "lbfin", label: "Pound-force inch", symbol: "lbf·in", factor: 0.112985 },
    ],
    defaults: ["nm", "lbfft"],
  },
  {
    id: "density",
    label: "Density",
    icon: Box,
    type: "linear",
    accent: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/40",
    glow: "rgba(34,211,238,.18)",
    units: [
      { id: "kgm3", label: "Kilogram/m³", symbol: "kg/m³", factor: 1 },
      { id: "gcm3", label: "Gram/cm³", symbol: "g/cm³", factor: 1000 },
      { id: "gml", label: "Gram/mL", symbol: "g/mL", factor: 1000 },
      { id: "lbft3", label: "Pound/ft³", symbol: "lb/ft³", factor: 16.0185 },
      { id: "lbgal", label: "Pound/gallon (US)", symbol: "lb/gal", factor: 119.826 },
    ],
    defaults: ["gcm3", "kgm3"],
  },
  {
    id: "angle",
    label: "Angle",
    icon: Compass,
    type: "linear",
    accent: "text-lime-400",
    accentBg: "bg-lime-500/10",
    accentBorder: "border-lime-500/40",
    glow: "rgba(163,230,53,.18)",
    units: [
      { id: "deg", label: "Degree", symbol: "°", factor: 1 },
      { id: "rad", label: "Radian", symbol: "rad", factor: 57.29578 },
      { id: "grad", label: "Gradian", symbol: "grad", factor: 0.9 },
      { id: "arcmin", label: "Arcminute", symbol: "′", factor: 0.0166667 },
      { id: "arcsec", label: "Arcsecond", symbol: "″", factor: 0.000277778 },
    ],
    defaults: ["deg", "rad"],
  },
  {
    id: "frequency",
    label: "Frequency",
    icon: Radio,
    type: "linear",
    accent: "text-fuchsia-400",
    accentBg: "bg-fuchsia-500/10",
    accentBorder: "border-fuchsia-500/40",
    glow: "rgba(232,121,249,.18)",
    units: [
      { id: "hz", label: "Hertz", symbol: "Hz", factor: 1 },
      { id: "khz", label: "Kilohertz", symbol: "kHz", factor: 1000 },
      { id: "mhz", label: "Megahertz", symbol: "MHz", factor: 1000000 },
      { id: "ghz", label: "Gigahertz", symbol: "GHz", factor: 1000000000 },
    ],
    defaults: ["ghz", "mhz"],
  },
  {
    id: "force",
    label: "Force",
    icon: Magnet,
    type: "linear",
    accent: "text-rose-400",
    accentBg: "bg-rose-500/10",
    accentBorder: "border-rose-500/40",
    glow: "rgba(251,113,133,.18)",
    units: [
      { id: "n", label: "Newton", symbol: "N", factor: 1 },
      { id: "kn", label: "Kilonewton", symbol: "kN", factor: 1000 },
      { id: "lbf", label: "Pound-force", symbol: "lbf", factor: 4.44822 },
      { id: "dyn", label: "Dyne", symbol: "dyn", factor: 0.00001 },
      { id: "kgf", label: "Kilogram-force", symbol: "kgf", factor: 9.80665 },
    ],
    defaults: ["n", "lbf"],
  },
  {
    id: "fuel",
    label: "Fuel Economy",
    icon: Fuel,
    type: "fuel",
    accent: "text-green-400",
    accentBg: "bg-green-500/10",
    accentBorder: "border-green-500/40",
    glow: "rgba(74,222,128,.18)",
    units: [
      { id: "l100km", label: "Liters/100km", symbol: "L/100km", toBase: (v) => v, fromBase: (b) => b },
      { id: "kml", label: "Kilometers/Liter", symbol: "km/L", toBase: (v) => 100 / v, fromBase: (b) => 100 / b },
      { id: "mpgus", label: "Miles/Gallon (US)", symbol: "mpg (US)", toBase: (v) => 235.214 / v, fromBase: (b) => 235.214 / b },
      { id: "mpguk", label: "Miles/Gallon (UK)", symbol: "mpg (UK)", toBase: (v) => 282.481 / v, fromBase: (b) => 282.481 / b },
    ],
    defaults: ["mpgus", "l100km"],
  },
  {
    id: "typography",
    label: "Typography & Screen",
    icon: Type,
    type: "typography",
    accent: "text-purple-400",
    accentBg: "bg-purple-500/10",
    accentBorder: "border-purple-500/40",
    glow: "rgba(192,132,252,.18)",
    units: [
      { id: "px", label: "Pixel", symbol: "px" },
      { id: "pt", label: "Point", symbol: "pt" },
      { id: "pc", label: "Pica", symbol: "pc" },
      { id: "in", label: "Inch", symbol: "in" },
      { id: "cm", label: "Centimeter", symbol: "cm" },
      { id: "mm", label: "Millimeter", symbol: "mm" },
      { id: "em", label: "Em", symbol: "em" },
      { id: "rem", label: "Rem", symbol: "rem" },
      { id: "pct", label: "Percent", symbol: "%" },
    ],
    defaults: ["in", "px"],
  },
  {
    id: "cooking",
    label: "Cooking & Baking",
    icon: ChefHat,
    type: "cooking",
    accent: "text-amber-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/40",
    glow: "rgba(251,191,36,.18)",
    units: [
      { id: "ml", label: "Milliliter", symbol: "ml", kind: "volume", factor: 0.001 },
      { id: "tsp", label: "Teaspoon", symbol: "tsp", kind: "volume", factor: 0.00492892 },
      { id: "tbsp", label: "Tablespoon", symbol: "tbsp", kind: "volume", factor: 0.0147868 },
      { id: "floz", label: "Fluid Ounce", symbol: "fl oz", kind: "volume", factor: 0.0295735 },
      { id: "cup", label: "Cup (US)", symbol: "cup", kind: "volume", factor: 0.24 },
      { id: "l", label: "Liter", symbol: "l", kind: "volume", factor: 1 },
      { id: "g", label: "Gram", symbol: "g", kind: "weight", factor: 0.001 },
      { id: "kg", label: "Kilogram", symbol: "kg", kind: "weight", factor: 1 },
      { id: "oz", label: "Ounce", symbol: "oz", kind: "weight", factor: 0.0283495 },
      { id: "lb", label: "Pound", symbol: "lb", kind: "weight", factor: 0.453592 },
    ],
    defaults: ["cup", "g"],
  },
  {
    id: "numberbase",
    label: "Number Systems",
    icon: Binary,
    type: "numberbase",
    accent: "text-sky-400",
    accentBg: "bg-sky-500/10",
    accentBorder: "border-sky-500/40",
    glow: "rgba(56,189,248,.18)",
    units: [],
    defaults: [],
  },
];

/* -------------------------------------------------------------------------- */
/*  Conversion helpers                                                       */
/* -------------------------------------------------------------------------- */

function celsiusFrom(value, unitId) {
  if (unitId === "c") return value;
  if (unitId === "f") return ((value - 32) * 5) / 9;
  return value - 273.15; // kelvin
}

function celsiusTo(celsius, unitId) {
  if (unitId === "c") return celsius;
  if (unitId === "f") return (celsius * 9) / 5 + 32;
  return celsius + 273.15; // kelvin
}

function toPx(value, unitId, dpi, baseFontSize) {
  switch (unitId) {
    case "px":
      return value;
    case "pt":
      return (value * dpi) / 72;
    case "pc":
      return (value * dpi) / 6;
    case "in":
      return value * dpi;
    case "cm":
      return (value * dpi) / 2.54;
    case "mm":
      return (value * dpi) / 25.4;
    case "em":
    case "rem":
      return value * baseFontSize;
    case "pct":
      return (value / 100) * baseFontSize;
    default:
      return NaN;
  }
}

function fromPx(px, unitId, dpi, baseFontSize) {
  switch (unitId) {
    case "px":
      return px;
    case "pt":
      return (px * 72) / dpi;
    case "pc":
      return (px * 6) / dpi;
    case "in":
      return px / dpi;
    case "cm":
      return (px * 2.54) / dpi;
    case "mm":
      return (px * 25.4) / dpi;
    case "em":
    case "rem":
      return px / baseFontSize;
    case "pct":
      return (px / baseFontSize) * 100;
    default:
      return NaN;
  }
}

function toGrams(value, unit, density) {
  if (unit.kind === "volume") return value * unit.factor * 1000 * density;
  return value * unit.factor * 1000;
}

function fromGrams(grams, unit, density) {
  if (unit.kind === "volume") return grams / (1000 * density * unit.factor);
  return grams / (1000 * unit.factor);
}

function convert(category, value, fromId, toId, extra = {}) {
  if (!isFinite(value)) return NaN;

  if (category.type === "temperature") {
    return celsiusTo(celsiusFrom(value, fromId), toId);
  }

  if (category.type === "typography") {
    const { dpi, baseFontSize } = extra;
    return fromPx(toPx(value, fromId, dpi, baseFontSize), toId, dpi, baseFontSize);
  }

  if (category.type === "cooking") {
    const fromUnit = category.units.find((u) => u.id === fromId);
    const toUnit = category.units.find((u) => u.id === toId);
    if (!fromUnit || !toUnit) return NaN;
    const grams = toGrams(value, fromUnit, extra.density ?? 1);
    return fromGrams(grams, toUnit, extra.density ?? 1);
  }

  if (category.type === "fuel") {
    const fromUnit = category.units.find((u) => u.id === fromId);
    const toUnit = category.units.find((u) => u.id === toId);
    if (!fromUnit || !toUnit) return NaN;
    return toUnit.fromBase(fromUnit.toBase(value));
  }

  // linear (default)
  const fromUnit = category.units.find((u) => u.id === fromId);
  const toUnit = category.units.find((u) => u.id === toId);
  if (!fromUnit || !toUnit) return NaN;
  return (value * fromUnit.factor) / toUnit.factor;
}

function formatNumber(num) {
  if (num === null || num === undefined || Number.isNaN(num)) return "";
  if (!isFinite(num)) return "∞";
  if (num === 0) return "0";
  const abs = Math.abs(num);
  if (abs < 1e-6 || abs >= 1e12) {
    return num.toExponential(4).replace("e+", "e");
  }
  const rounded = parseFloat(num.toPrecision(8));
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

/* -------------------------------------------------------------------------- */
/*  Category sidebar                                                         */
/* -------------------------------------------------------------------------- */

function CategorySidebar({ categories, activeId, onSelect, query, setQuery }) {
  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl sm:rounded-3xl sm:p-5">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500/50"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[70vh] lg:space-y-1.5 lg:overflow-y-auto lg:pb-0 lg:pr-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = cat.id === activeId;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={`group flex shrink-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all lg:w-full ${
                  active
                    ? `${cat.accentBorder} ${cat.accentBg} text-white`
                    : "border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon
                  size={17}
                  className={active ? cat.accent : "text-slate-500 group-hover:text-slate-300"}
                />
                <span className="whitespace-nowrap lg:whitespace-normal">{cat.label}</span>
              </button>
            );
          })}
          {categories.length === 0 && (
            <p className="px-1 py-2 text-sm text-slate-500">No categories match “{query}”.</p>
          )}
        </div>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/*  Unit select (supports grouped volume/weight units for Cooking)          */
/* -------------------------------------------------------------------------- */

function UnitSelect({ units, value, onChange }) {
  const hasGroups = units.some((u) => u.kind);

  if (!hasGroups) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-sm font-semibold text-white outline-none transition-colors focus:border-blue-500/50 sm:text-base"
      >
        {units.map((u) => (
          <option key={u.id} value={u.id} className="bg-slate-900">
            {u.label} ({u.symbol})
          </option>
        ))}
      </select>
    );
  }

  const volumeUnits = units.filter((u) => u.kind === "volume");
  const weightUnits = units.filter((u) => u.kind === "weight");

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-sm font-semibold text-white outline-none transition-colors focus:border-blue-500/50 sm:text-base"
    >
      <optgroup label="Volume" className="bg-slate-900">
        {volumeUnits.map((u) => (
          <option key={u.id} value={u.id} className="bg-slate-900">
            {u.label} ({u.symbol})
          </option>
        ))}
      </optgroup>
      <optgroup label="Weight" className="bg-slate-900">
        {weightUnits.map((u) => (
          <option key={u.id} value={u.id} className="bg-slate-900">
            {u.label} ({u.symbol})
          </option>
        ))}
      </optgroup>
    </select>
  );
}

/* -------------------------------------------------------------------------- */
/*  Number base converter (binary / octal / decimal / hex)                  */
/* -------------------------------------------------------------------------- */

const BASES = [
  { id: "bin", label: "Binary", radix: 2 },
  { id: "oct", label: "Octal", radix: 8 },
  { id: "dec", label: "Decimal", radix: 10 },
  { id: "hex", label: "Hexadecimal", radix: 16 },
];

function isValidForRadix(val, radix) {
  if (val.trim() === "") return true;
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, radix);
  const re = new RegExp(`^-?[${chars}]+$`, "i");
  return re.test(val.trim());
}

function NumberBaseConverter({ category }) {
  const [fromId, setFromId] = useState("dec");
  const [inputValue, setInputValue] = useState("42");

  const fromBase = BASES.find((b) => b.id === fromId);
  const valid = isValidForRadix(inputValue, fromBase.radix);

  const results = useMemo(() => {
    if (!valid || inputValue.trim() === "") return null;
    const parsed = parseInt(inputValue.trim(), fromBase.radix);
    if (Number.isNaN(parsed)) return null;
    return BASES.reduce((acc, b) => {
      acc[b.id] = parsed.toString(b.radix).toUpperCase();
      return acc;
    }, {});
  }, [inputValue, fromBase, valid]);

  const Icon = category.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl ${category.accentBg} ${category.accent}`}
        >
          <Icon size={24} className="sm:size-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">{category.label} Converter</h2>
          <p className="text-sm text-slate-400">Binary · Octal · Decimal · Hexadecimal</p>
        </div>
      </div>

      <div
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-8"
        style={{ boxShadow: `0 0 60px ${category.glow}` }}
      >
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Input base
        </label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {BASES.map((b) => (
            <button
              key={b.id}
              onClick={() => setFromId(b.id)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
                fromId === b.id
                  ? `${category.accentBorder} ${category.accentBg} text-white`
                  : "border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Enter a ${fromBase.label.toLowerCase()} number`}
          className={`mt-4 w-full rounded-xl border bg-slate-950/60 px-4 py-3 font-mono text-lg font-bold text-white outline-none transition-colors sm:text-xl ${
            valid ? "border-slate-800 focus:border-blue-500/50" : "border-red-500/60"
          }`}
        />
        {!valid && (
          <p className="mt-2 text-sm text-red-400">
            That's not a valid {fromBase.label.toLowerCase()} number.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Converts to
        </h3>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {BASES.filter((b) => b.id !== fromId).map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm"
            >
              <span className="text-slate-400">{b.label}</span>
              <span className="font-mono font-semibold text-white">
                {results ? results[b.id] : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Converter panel (linear / temperature / typography / cooking / fuel)    */
/* -------------------------------------------------------------------------- */

function ConverterPanel({ category }) {
  const [fromId, setFromId] = useState(category.defaults[0]);
  const [toId, setToId] = useState(category.defaults[1]);
  const [inputValue, setInputValue] = useState("1");
  const [copied, setCopied] = useState(false);
  const [dpi, setDpi] = useState(96);
  const [baseFontSize, setBaseFontSize] = useState(16);
  const [ingredientId, setIngredientId] = useState(INGREDIENTS[0].id);

  useEffect(() => {
    setFromId(category.defaults[0]);
    setToId(category.defaults[1]);
    setInputValue("1");
  }, [category]);

  const numericInput = parseFloat(inputValue);

  const extra = useMemo(() => {
    if (category.type === "cooking") {
      return { density: INGREDIENTS.find((i) => i.id === ingredientId)?.density ?? 1 };
    }
    if (category.type === "typography") {
      return { dpi, baseFontSize };
    }
    return undefined;
  }, [category.type, ingredientId, dpi, baseFontSize]);

  const result = useMemo(() => {
    if (inputValue.trim() === "" || Number.isNaN(numericInput)) return null;
    return convert(category, numericInput, fromId, toId, extra);
  }, [category, numericInput, fromId, toId, inputValue, extra]);

  const fromUnit = category.units.find((u) => u.id === fromId);
  const toUnit = category.units.find((u) => u.id === toId);

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
  };

  const copyResult = async () => {
    if (result === null) return;
    try {
      await navigator.clipboard.writeText(formatNumber(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const reference = useMemo(() => {
    return category.units
      .filter((u) => u.id !== fromId)
      .map((u) => ({ unit: u, value: convert(category, 1, fromId, u.id, extra) }));
  }, [category, fromId, extra]);

  const Icon = category.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl ${category.accentBg} ${category.accent}`}
        >
          <Icon size={24} className="sm:size-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">{category.label} Converter</h2>
          <p className="text-sm text-slate-400">
            {category.units.length} units supported · updates as you type
          </p>
        </div>
      </div>

      {/* Typography controls */}
      {category.type === "typography" && (
        <div className="grid gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl sm:grid-cols-2 sm:rounded-3xl sm:p-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Resolution (DPI)
            </label>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {[72, 96, 150, 300, 600].map((d) => (
                <button
                  key={d}
                  onClick={() => setDpi(d)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    dpi === d
                      ? `${category.accentBorder} ${category.accentBg} text-white`
                      : "border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {d}
                </button>
              ))}
              <input
                type="number"
                value={dpi}
                onChange={(e) => setDpi(parseFloat(e.target.value) || 96)}
                className="w-20 rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Base font size (for em / rem / %)
            </label>
            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="number"
                value={baseFontSize}
                onChange={(e) => setBaseFontSize(parseFloat(e.target.value) || 16)}
                className="w-24 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500/50"
              />
              <span className="text-sm text-slate-500">px</span>
            </div>
          </div>
        </div>
      )}

      {/* Cooking controls */}
      {category.type === "cooking" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-6">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ingredient
          </label>
          <select
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            className="mt-2.5 w-full max-w-xs appearance-none rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500/50"
          >
            {INGREDIENTS.map((i) => (
              <option key={i.id} value={i.id} className="bg-slate-900">
                {i.label}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs text-slate-500">
            Weight-to-volume conversions are approximate — they vary by brand and how
            ingredients are packed or sifted.
          </p>
        </div>
      )}

      {/* Converter card */}
      <div
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-8"
        style={{ boxShadow: `0 0 60px ${category.glow}` }}
      >
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          {/* From */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              From
            </label>
            <UnitSelect units={category.units} value={fromId} onChange={setFromId} />
            <input
              type="number"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter value"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-lg font-bold text-white outline-none transition-colors focus:border-blue-500/50 sm:text-xl"
            />
          </div>

          {/* Swap */}
          <div className="flex justify-center">
            <button
              onClick={swap}
              aria-label="Swap units"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 text-slate-300 transition-all hover:rotate-180 hover:border-blue-500/50 hover:text-blue-400"
            >
              <ArrowLeftRight size={18} />
            </button>
          </div>

          {/* To */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              To
            </label>
            <UnitSelect units={category.units} value={toId} onChange={setToId} />
            <div className="relative">
              <div className="w-full truncate rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-lg font-bold text-white sm:text-xl">
                {result === null ? (
                  <span className="text-slate-600">—</span>
                ) : (
                  formatNumber(result)
                )}
              </div>
              <button
                onClick={copyResult}
                disabled={result === null}
                aria-label="Copy result"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-30"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {result !== null && fromUnit && toUnit && (
          <p className="mt-5 text-center text-sm text-slate-400 sm:text-left">
            <span className="font-semibold text-white">
              {formatNumber(numericInput)} {fromUnit.symbol}
            </span>{" "}
            equals{" "}
            <span className={`font-semibold ${category.accent}`}>
              {formatNumber(result)} {toUnit.symbol}
            </span>
          </p>
        )}
      </div>

      {/* Quick reference */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          1 {fromUnit?.symbol} converts to
        </h3>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {reference.map(({ unit, value }) => (
            <button
              key={unit.id}
              onClick={() => setToId(unit.id)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                unit.id === toId
                  ? `${category.accentBorder} ${category.accentBg}`
                  : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
              }`}
            >
              <span className="text-slate-400">{unit.label}</span>
              <span className="font-semibold text-white">
                {formatNumber(value)} {unit.symbol}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                     */
/* -------------------------------------------------------------------------- */

export default function UnitConverter() {
  const [activeId, setActiveId] = useState("length");
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return CATEGORIES;
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()));
  }, [query]);

  useEffect(() => {
    if (filteredCategories.length && !filteredCategories.some((c) => c.id === activeId)) {
      setActiveId(filteredCategories[0].id);
    }
  }, [filteredCategories, activeId]);

  const activeCategory = CATEGORIES.find((c) => c.id === activeId) || CATEGORIES[0];

  return (
    <>
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[180px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          {/* Hero */}
          <div className="text-center">
            <Badge>
              <Sparkles size={14} className="mr-2" />
              Unit Converter
            </Badge>

            <h1 className="mt-6 text-4xl font-black sm:text-5xl">
              Convert Anything.
              <br />
              Instantly, Accurately.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              From inches to pixels, cups to grams, or miles-per-gallon to
              liters-per-100km &mdash; {CATEGORIES.length} categories, all in one fast,
              distraction-free tool.
            </p>
          </div>

          {/* Category chips (overview) */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 sm:mt-14">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveId(cat.id)}
                className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Workspace */}
          <div className="mt-10 grid gap-8 sm:mt-14 lg:grid-cols-[300px_1fr]">
            <CategorySidebar
              categories={filteredCategories}
              activeId={activeId}
              onSelect={setActiveId}
              query={query}
              setQuery={setQuery}
            />
            {activeCategory.type === "numberbase" ? (
              <NumberBaseConverter category={activeCategory} />
            ) : (
              <ConverterPanel category={activeCategory} />
            )}
          </div>

          {/* Info strip */}
          <div className="mx-auto mt-20 max-w-3xl text-center sm:mt-32">
            <SectionTitle
              badge="WHY THIS TOOL"
              title="Precise conversions, zero clutter."
              subtitle="All calculations run instantly in your browser using industry-standard conversion factors — no sign-up, no ads, no waiting."
            />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}