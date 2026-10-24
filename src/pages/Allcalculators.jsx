import { useMemo, useState } from "react";
import {
  Search, ArrowUpRight, Calculator, HeartPulse, Sigma, Wrench,
  Wallet, SlidersHorizontal, X, ArrowLeft, RotateCcw, Copy, Check,
  LockKeyhole, CalendarDays, Ruler, Percent, Clock3, Hash, Type,
  ArrowLeftRight, GraduationCap, Activity, ChevronRight
} from "lucide-react";
import Breadcrumbs from "../components/common/Breadcrumbs";

const CATEGORIES = [
  {
    name: "Financial Calculators", icon: Wallet,
    description: "Plan payments, savings, discounts, interest, and everyday spending.",
    items: [
      { name: "Percentage Calculator", description: "Find a percentage of a number.", icon: Percent },
      { name: "Discount Calculator", description: "Calculate sale price and savings.", icon: Percent },
      { name: "Tip Calculator", description: "Split a bill and calculate a tip.", icon: Wallet },
      { name: "Compound Interest Calculator", description: "Estimate growth with compounding.", icon: Activity },
      { name: "Simple Interest Calculator", description: "Calculate interest without compounding.", icon: Activity },
      { name: "Loan Payment Calculator", description: "Estimate monthly loan payments.", icon: Calculator },
      { name: "Savings Calculator", description: "Estimate savings with regular contributions.", icon: Wallet },
    ],
  },
  {
    name: "Fitness and Health Calculators", icon: HeartPulse,
    description: "Estimate common fitness metrics. Results are informational, not medical advice.",
    items: [
      { name: "BMI Calculator", description: "Calculate body mass index from height and weight.", icon: HeartPulse },
      { name: "BMR Calculator", description: "Estimate resting energy needs.", icon: Activity },
      { name: "Pace Calculator", description: "Calculate pace from distance and time.", icon: Clock3 },
    ],
  },
  {
    name: "Math Calculators", icon: Sigma,
    description: "Solve common number, percentage, and statistics problems.",
    items: [
      { name: "Average Calculator", description: "Find the mean of a set of numbers.", icon: Sigma },
      { name: "Random Number Generator", description: "Generate a random integer in a range.", icon: Hash },
      { name: "Fraction Calculator", description: "Add, subtract, multiply, or divide fractions.", icon: Sigma },
      { name: "Quadratic Formula Calculator", description: "Solve a quadratic equation.", icon: Sigma },
      { name: "Scientific Calculator", description: "Open the dedicated scientific calculator.", icon: Sigma, href: "/scientific-calculator" },
    ],
  },
  {
    name: "Everyday Tools", icon: Wrench,
    description: "Handy date, conversion, text, and productivity utilities.",
    items: [
      { name: "Age Calculator", description: "Calculate age from a birth date.", icon: CalendarDays },
      { name: "Date Difference Calculator", description: "Count days between two dates.", icon: CalendarDays },
      { name: "Unit Converter", description: "Convert length, weight, and temperature.", icon: ArrowLeftRight },
      { name: "Password Generator", description: "Create a random password locally.", icon: LockKeyhole },
      { name: "Text Counter", description: "Count words, characters, and sentences.", icon: Type },
      { name: "Base64 Encoder / Decoder", description: "Encode or decode Base64 text.", icon: ArrowLeftRight },
      { name: "URL Encoder / Decoder", description: "Encode or decode URL text.", icon: ArrowLeftRight },
      { name: "GPA Calculator", description: "Calculate a weighted grade-point average.", icon: GraduationCap },
    ],
  },
];

const ALL_TOOLS = CATEGORIES.flatMap((category) => category.items.map((tool) => ({ ...tool, category: category.name })));
const TOOL_GUIDES = {
  "Percentage Calculator": { intro: "Calculate a percentage of a value. You can use this for marks, price changes, statistics, and everyday comparisons.", formula: "Result = (Percentage ÷ 100) × Base value", example: "20% of 150 = 30", tips: ["Enter the percentage in the first field.", "Enter the number that the percentage is taken from.", "The result is the share represented by that percentage."] },
  "Discount Calculator": { intro: "Find the amount saved and the final price after a percentage discount.", formula: "Savings = Original price × Discount ÷ 100; Sale price = Original price − Savings", example: "A 15% discount on 200 saves 30, leaving 170.", tips: ["Use the price before discount.", "Enter the discount as a percentage, such as 15 for 15%.", "Taxes, delivery, and extra fees are not included."] },
  "Tip Calculator": { intro: "Estimate a tip, the total bill, and the amount each person pays when splitting a bill evenly.", formula: "Tip = Bill × Tip rate ÷ 100; Total = Bill + Tip", example: "A 1,000 bill with a 10% tip totals 1,100.", tips: ["Enter the bill before the tip.", "Choose the tip percentage.", "Set the number of people to split the total evenly."] },
  "Compound Interest Calculator": { intro: "Estimate how an amount grows when interest is added to the balance repeatedly. Actual returns can vary and may include fees or taxes.", formula: "A = P(1 + r/n)^(nt)", example: "P is the starting balance, r is annual rate as a decimal, n is compounding periods per year, and t is years.", tips: ["Use an annual rate, not a monthly rate.", "More frequent compounding can change the result.", "This version models a lump sum and no additional deposits."] },
  "Simple Interest Calculator": { intro: "Calculate interest earned or charged when interest is calculated only on the original principal.", formula: "Interest = Principal × Annual rate × Time; Total = Principal + Interest", example: "1,000 at 5% per year for 3 years earns 150 interest.", tips: ["Enter the annual interest rate as a percentage.", "Time is measured in years.", "This does not model fees, taxes, or compounding."] },
  "Loan Payment Calculator": { intro: "Estimate a fixed monthly payment for a standard amortizing loan with a constant interest rate.", formula: "Payment = P × r ÷ (1 − (1 + r)^−n)", example: "P is loan principal, r is monthly interest rate, and n is total monthly payments.", tips: ["Loan term is entered in years and converted to monthly payments.", "The estimate assumes the rate stays constant.", "Lender fees, insurance, and taxes may increase the real payment."] },
  "Savings Calculator": { intro: "Project a possible savings balance using an initial amount, monthly contributions, an annual rate, and a time period.", formula: "Starting balance grows monthly; contributions are assumed at the end of each month.", example: "A higher contribution or longer time period generally increases the projected balance.", tips: ["Monthly deposits are assumed to be made at month-end.", "The interest rate is assumed constant.", "This is an estimate, not a guaranteed return."] },
  "BMI Calculator": { intro: "Calculate body mass index from height and weight. BMI is a broad screening measure and is not a diagnosis or a complete assessment of health.", formula: "BMI = weight in kilograms ÷ (height in metres)²", example: "For adults, BMI is commonly interpreted alongside other health information; for children and teens, age- and sex-specific interpretation is needed.", tips: ["Enter height in centimetres and weight in kilograms.", "BMI does not account for every factor that affects health.", "Discuss personal health questions with a qualified clinician."] },
  "BMR Calculator": { intro: "Estimate resting energy expenditure using the Mifflin–St Jeor equation. This is an estimate, not a personal nutrition prescription.", formula: "Male equation: 10W + 6.25H − 5A + 5; female equation: 10W + 6.25H − 5A − 161", example: "W = weight in kg, H = height in cm, A = age in years.", tips: ["Enter age, weight, and height in the requested units.", "The equation is an estimate and can differ from measured metabolism.", "Energy needs also depend on activity, growth, and individual circumstances."] },
  "Pace Calculator": { intro: "Calculate average time per kilometre from a distance and elapsed time.", formula: "Pace = Total time ÷ Distance", example: "30 minutes over 5 km gives a pace of 6:00 min/km.", tips: ["Enter distance in kilometres.", "Enter the full elapsed time using hours, minutes, and seconds.", "The result is average pace, not speed at each point of the route."] },
  "Average Calculator": { intro: "Find the arithmetic mean of a list of numbers.", formula: "Mean = Sum of values ÷ Number of values", example: "The mean of 2, 4, and 9 is 5.", tips: ["Separate numbers with commas or spaces.", "Negative and decimal values are allowed.", "Check that each entry is a valid number."] },
  "Random Number Generator": { intro: "Generate a random whole number within an inclusive minimum and maximum range.", formula: "Each integer from the minimum through the maximum can be selected.", example: "A range from 1 to 6 produces an integer from 1 through 6.", tips: ["Minimum and maximum are rounded to whole-number boundaries.", "The maximum can be equal to the minimum.", "This is intended for everyday random selection, not cryptographic use."] },
  "Fraction Calculator": { intro: "Perform arithmetic with two fractions and see the decimal result.", formula: "Addition/subtraction: use a common denominator; multiplication: multiply numerators and denominators; division: multiply by the reciprocal.", example: "1/2 + 1/4 = 3/4 = 0.75", tips: ["Denominators cannot be zero.", "Choose the arithmetic operation before calculating.", "The result is displayed as a decimal in this version."] },
  "Quadratic Formula Calculator": { intro: "Solve a quadratic equation in the form ax² + bx + c = 0.", formula: "x = (−b ± √(b² − 4ac)) ÷ 2a", example: "The discriminant D = b² − 4ac determines whether the roots are two real roots, one repeated real root, or a complex pair.", tips: ["Coefficient a must not be zero.", "Enter coefficients with their signs.", "Complex roots are shown when the discriminant is negative."] },
  "Age Calculator": { intro: "Calculate completed years between a birth date and today.", formula: "Age is based on whether the birthday has occurred yet in the current calendar year.", example: "A person turns a year older on their birthday, not automatically on January 1.", tips: ["Choose the birth date from the date picker.", "A future birth date is not valid.", "The result shows completed years."] },
  "Date Difference Calculator": { intro: "Count the calendar-day difference between two dates.", formula: "Day difference = End date − Start date", example: "A start date on Monday and an end date on Tuesday are one day apart.", tips: ["Choose both dates.", "The absolute difference is shown, even if the end date comes first.", "This counts elapsed days and does not include both endpoints as separate full days."] },
  "Unit Converter": { intro: "Convert a value between common length, mass, and temperature units.", formula: "Length and mass use unit conversion factors; temperature uses scale-specific equations.", example: "1 kilometre = 1,000 metres; °F = (°C × 9/5) + 32.", tips: ["Select the conversion type first.", "Choose compatible units from the same type.", "Temperature conversions are handled separately from length and mass."] },
  "Password Generator": { intro: "Create a random password in your browser with the character groups you choose.", formula: "Possible combinations depend on password length and the selected character set.", example: "Longer passwords with a mix of character types generally have more possible combinations.", tips: ["Choose a length between 4 and 64 characters.", "Select at least one character group.", "Use a unique password for each account and store it in a trusted password manager."] },
  "Text Counter": { intro: "Count words, characters, characters excluding whitespace, and an approximate sentence count while you type.", formula: "Words are groups separated by whitespace; characters count includes spaces and line breaks.", example: "The phrase ‘Hello world’ has 2 words and 11 characters.", tips: ["Paste or type text into the box.", "Counts update as you type.", "Sentence detection is approximate and depends on punctuation."] },
  "Base64 Encoder / Decoder": { intro: "Convert text to or from Base64 representation. Base64 is an encoding format, not encryption.", formula: "Encode converts text bytes to Base64 characters; decode converts valid Base64 back to text.", example: "The text ‘hello’ encodes to ‘aGVsbG8=’.", tips: ["Choose Encode or Decode.", "Decode requires valid Base64 input.", "Do not use Base64 to protect passwords or confidential data."] },
  "URL Encoder / Decoder": { intro: "Encode text for use in a URL or decode percent-encoded text.", formula: "Characters that need escaping are represented using percent-encoded bytes.", example: "A space is commonly represented as %20 when encoded.", tips: ["Choose Encode or Decode.", "Malformed percent-encoding will produce an error message.", "Encoding does not make a URL private or secure."] },
  "GPA Calculator": { intro: "Calculate a weighted GPA from course grade points and corresponding credit hours.", formula: "Weighted GPA = Σ(grade points × credits) ÷ Σ(credits)", example: "A 3.0 grade in a 3-credit course contributes 9 grade-points to the weighted sum.", tips: ["Enter one grade point per course.", "Enter the matching credit hours in the same order.", "Your institution may use a different grading scale or rounding policy."] },
};
const money = (n) => Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";
const num = (v) => Number.parseFloat(v);

function Field({ label, value, onChange, type = "number", min, step = "any", placeholder }) {
  return <label className="block text-sm text-slate-300">{label}<input type={type} min={min} step={step} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" /></label>;
}
function SelectField({ label, value, onChange, options }) {
  return <label className="block text-sm text-slate-300">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-sky-500">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}
function Result({ title = "Result", children, detail }) {
  return <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] p-5" aria-live="polite"><p className="text-xs font-semibold uppercase tracking-wider text-sky-300">{title}</p><p className="mt-2 break-words text-2xl font-semibold text-white">{children}</p>{detail && <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>}</div>;
}
function ToolWorkspace({ tool, onBack }) {
  const [v, setV] = useState({ a: "100", b: "20", c: "", d: "", e: "", text: "", date1: "2000-01-01", date2: new Date().toISOString().slice(0, 10), op: "add", unitFrom: "m", unitTo: "km", tempFrom: "C", tempTo: "F", count: "16", upper: true, lower: true, digits: true, symbols: false, gender: "male", years: "5", rate: "5", frequency: "12", annualContribution: "5000", annualIncrease: "3", monthlyIncrease: "0", taxRate: "0", inflation: "0", people: "1", distance: "5", hours: "0", minutes: "30", seconds: "0", grades: "4, 3, 3.5", weights: "3, 3, 4", base64Mode: "encode", urlMode: "encode" });
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [courses, setCourses] = useState([
    { id: 1, name: "Math", credits: "3", grade: "4" },
    { id: 2, name: "English", credits: "3", grade: "3.3" },
    { id: 3, name: "History", credits: "2", grade: "3.7" },
    { id: 4, name: "", credits: "", grade: "" },
    { id: 5, name: "", credits: "", grade: "" },
  ]);
  const [gradeFormat, setGradeFormat] = useState("letter");
  const [showPrior, setShowPrior] = useState(false);
  const [priorGpa, setPriorGpa] = useState("0");
  const [priorCredits, setPriorCredits] = useState("0");
  const [groupSemesters, setGroupSemesters] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const set = (key, value) => { setV((old) => ({ ...old, [key]: value })); setResult(null); };
  const updateCourse = (id, key, value) => { setCourses(old => old.map(course => course.id === id ? { ...course, [key]: value } : course)); setResult(null); };
  const fields = {
    "Percentage Calculator": <><Field label="What is the percentage? (%)" value={v.a} onChange={(x) => set("a", x)} /><Field label="Of which number?" value={v.b} onChange={(x) => set("b", x)} /></>,
    "Discount Calculator": <><Field label="Original price" value={v.a} onChange={(x) => set("a", x)} /><Field label="Discount (%)" value={v.b} onChange={(x) => set("b", x)} /></>,
    "Tip Calculator": <><Field label="Bill amount" value={v.a} onChange={(x) => set("a", x)} /><Field label="Tip (%)" value={v.b} onChange={(x) => set("b", x)} /><Field label="Number of people" value={v.c || "1"} onChange={(x) => set("c", x)} min="1" /></>,
    "Compound Interest Calculator": <><Field label="Initial amount" value={v.a} onChange={(x) => set("a", x)} /><Field label="Annual interest rate (%)" value={v.rate} onChange={(x) => set("rate", x)} /><Field label="Years" value={v.years} onChange={(x) => set("years", x)} /><Field label="Compounds per year" value={v.frequency} onChange={(x) => set("frequency", x)} min="1" /></>,
    "Simple Interest Calculator": <><Field label="Principal amount" value={v.a} onChange={(x) => set("a", x)} /><Field label="Annual interest rate (%)" value={v.rate} onChange={(x) => set("rate", x)} /><Field label="Years" value={v.years} onChange={(x) => set("years", x)} /></>,
    "Loan Payment Calculator": <><Field label="Loan amount" value={v.a} onChange={(x) => set("a", x)} /><Field label="Annual interest rate (%)" value={v.rate} onChange={(x) => set("rate", x)} /><Field label="Loan term (years)" value={v.years} onChange={(x) => set("years", x)} /></>,
    "Savings Calculator": <>
      <div className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950/70 p-4"><p className="text-sm font-semibold text-white">Savings details</p><p className="mt-1 text-xs leading-5 text-slate-400">Adjust deposits, contribution increases, interest, and taxes to estimate your future balance.</p></div>
      <Field label="Initial deposit" value={v.a} onChange={(x) => set("a", x)} min="0" />
      <Field label="Annual contribution" value={v.annualContribution} onChange={(x) => set("annualContribution", x)} min="0" />
      <Field label="Annual contribution increase (% / year)" value={v.annualIncrease} onChange={(x) => set("annualIncrease", x)} min="-100" />
      <Field label="Monthly contribution" value={v.b} onChange={(x) => set("b", x)} min="0" />
      <Field label="Monthly contribution increase (% / year)" value={v.monthlyIncrease} onChange={(x) => set("monthlyIncrease", x)} min="-100" />
      <Field label="Annual interest rate (%)" value={v.rate} onChange={(x) => set("rate", x)} min="0" />
      <SelectField label="Compound frequency" value={v.frequency} onChange={(x) => set("frequency", x)} options={[{ value: "1", label: "Annually" }, { value: "2", label: "Semi-annually" }, { value: "4", label: "Quarterly" }, { value: "12", label: "Monthly" }, { value: "365", label: "Daily" }]} />
      <Field label="Years to save" value={v.years} onChange={(x) => set("years", x)} min="0" />
      <Field label="Tax rate on interest (%)" value={v.taxRate} onChange={(x) => set("taxRate", x)} min="0" max="100" />
      <Field label="Inflation rate (%)" value={v.inflation} onChange={(x) => set("inflation", x)} min="0" />
      <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={v.depositBeginning || false} onChange={(e) => set("depositBeginning", e.target.checked)} className="accent-sky-400" /> Deposits at beginning of each month</label>
    </>,
    "BMI Calculator": <><Field label="Height (cm)" value={v.a} onChange={(x) => set("a", x)} /><Field label="Weight (kg)" value={v.b} onChange={(x) => set("b", x)} /></>,
    "BMR Calculator": <><Field label="Age (years)" value={v.a} onChange={(x) => set("a", x)} /><Field label="Weight (kg)" value={v.b} onChange={(x) => set("b", x)} /><Field label="Height (cm)" value={v.c} onChange={(x) => set("c", x)} /><SelectField label="Formula input" value={v.gender} onChange={(x) => set("gender", x)} options={[{ value: "male", label: "Male equation" }, { value: "female", label: "Female equation" }]} /></>,
    "Pace Calculator": <><Field label="Distance (km)" value={v.distance} onChange={(x) => set("distance", x)} /><Field label="Hours" value={v.hours} onChange={(x) => set("hours", x)} /><Field label="Minutes" value={v.minutes} onChange={(x) => set("minutes", x)} /><Field label="Seconds" value={v.seconds} onChange={(x) => set("seconds", x)} /></>,
    "Average Calculator": <Field label="Numbers (separate with commas or spaces)" type="text" value={v.text || "12, 15, 18, 20"} onChange={(x) => set("text", x)} placeholder="e.g. 12, 15, 18" />,
    "Random Number Generator": <><Field label="Minimum integer" value={v.a} onChange={(x) => set("a", x)} /><Field label="Maximum integer" value={v.b} onChange={(x) => set("b", x)} /></>,
    "Fraction Calculator": <><div className="grid grid-cols-2 gap-3"><Field label="First numerator" value={v.a} onChange={(x) => set("a", x)} /><Field label="First denominator" value={v.b} onChange={(x) => set("b", x)} /></div><SelectField label="Operation" value={v.op} onChange={(x) => set("op", x)} options={[{ value: "add", label: "Add" }, { value: "subtract", label: "Subtract" }, { value: "multiply", label: "Multiply" }, { value: "divide", label: "Divide" }]} /><div className="grid grid-cols-2 gap-3"><Field label="Second numerator" value={v.c} onChange={(x) => set("c", x)} /><Field label="Second denominator" value={v.d} onChange={(x) => set("d", x)} /></div></>,
    "Quadratic Formula Calculator": <><Field label="Coefficient a" value={v.a} onChange={(x) => set("a", x)} /><Field label="Coefficient b" value={v.b} onChange={(x) => set("b", x)} /><Field label="Coefficient c" value={v.c} onChange={(x) => set("c", x)} /></>,
    "Age Calculator": <Field label="Date of birth" type="date" value={v.date1} onChange={(x) => set("date1", x)} />,
    "Date Difference Calculator": <><Field label="Start date" type="date" value={v.date1} onChange={(x) => set("date1", x)} /><Field label="End date" type="date" value={v.date2} onChange={(x) => set("date2", x)} /></>,
    "Unit Converter": <><SelectField label="Conversion type" value={v.kind || "length"} onChange={(x) => set("kind", x)} options={[{ value: "length", label: "Length" }, { value: "weight", label: "Weight" }, { value: "temperature", label: "Temperature" }]} /><Field label="Value" value={v.a} onChange={(x) => set("a", x)} />{(v.kind || "length") === "length" ? <div className="grid grid-cols-2 gap-3"><SelectField label="From" value={v.unitFrom} onChange={(x) => set("unitFrom", x)} options={[{ value: "m", label: "Meters" }, { value: "km", label: "Kilometers" }, { value: "cm", label: "Centimeters" }, { value: "mi", label: "Miles" }, { value: "ft", label: "Feet" }, { value: "in", label: "Inches" }]} /><SelectField label="To" value={v.unitTo} onChange={(x) => set("unitTo", x)} options={[{ value: "m", label: "Meters" }, { value: "km", label: "Kilometers" }, { value: "cm", label: "Centimeters" }, { value: "mi", label: "Miles" }, { value: "ft", label: "Feet" }, { value: "in", label: "Inches" }]} /></div> : (v.kind || "length") === "weight" ? <div className="grid grid-cols-2 gap-3"><SelectField label="From" value={v.unitFrom} onChange={(x) => set("unitFrom", x)} options={[{ value: "kg", label: "Kilograms" }, { value: "g", label: "Grams" }, { value: "lb", label: "Pounds" }, { value: "oz", label: "Ounces" }]} /><SelectField label="To" value={v.unitTo} onChange={(x) => set("unitTo", x)} options={[{ value: "kg", label: "Kilograms" }, { value: "g", label: "Grams" }, { value: "lb", label: "Pounds" }, { value: "oz", label: "Ounces" }]} /></div> : <div className="grid grid-cols-2 gap-3"><SelectField label="From" value={v.tempFrom} onChange={(x) => set("tempFrom", x)} options={[{ value: "C", label: "Celsius" }, { value: "F", label: "Fahrenheit" }, { value: "K", label: "Kelvin" }]} /><SelectField label="To" value={v.tempTo} onChange={(x) => set("tempTo", x)} options={[{ value: "C", label: "Celsius" }, { value: "F", label: "Fahrenheit" }, { value: "K", label: "Kelvin" }]} /></div>}</>,
    "Password Generator": <><Field label="Password length (4–64)" value={v.count} onChange={(x) => set("count", x)} min="4" /><div className="grid grid-cols-2 gap-3">{[["upper", "Uppercase letters"], ["lower", "Lowercase letters"], ["digits", "Numbers"], ["symbols", "Symbols"]].map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300"><input type="checkbox" checked={v[key]} onChange={(e) => set(key, e.target.checked)} className="accent-sky-400" />{label}</label>)}</div></>,
    "Text Counter": <label className="block text-sm text-slate-300">Enter text<textarea value={v.text} onChange={(e) => set("text", e.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-sky-500" placeholder="Type or paste your text here…" /></label>,
    "Base64 Encoder / Decoder": <><SelectField label="Mode" value={v.base64Mode} onChange={(x) => set("base64Mode", x)} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} /><label className="block text-sm text-slate-300">Text<textarea value={v.text} onChange={(e) => set("text", e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-sky-500" /></label></>,
    "URL Encoder / Decoder": <><SelectField label="Mode" value={v.urlMode} onChange={(x) => set("urlMode", x)} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} /><label className="block text-sm text-slate-300">Text<textarea value={v.text} onChange={(e) => set("text", e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-sky-500" /></label></>,
    "GPA Calculator": <div className="sm:col-span-2 space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <div className="grid min-w-[520px] grid-cols-[minmax(150px,1fr)_100px_120px_36px] gap-2 px-1 pb-2 text-xs font-semibold text-slate-300"><span>Course <span className="font-normal text-slate-500">(optional)</span></span><span>Credits</span><span>Grade</span><span /></div>
        {courses.map((course) => <div key={course.id} className="mb-2 grid min-w-[520px] grid-cols-[minmax(150px,1fr)_100px_120px_36px] gap-2">
          <input aria-label="Course name" value={course.name} onChange={(e) => updateCourse(course.id, "name", e.target.value)} placeholder="Course name" className="min-w-0 rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-sky-400" />
          <input aria-label="Credit hours" type="number" min="0" step="0.5" value={course.credits} onChange={(e) => updateCourse(course.id, "credits", e.target.value)} placeholder="3" className="min-w-0 rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-sky-400" />
          {gradeFormat === "letter" ? <select aria-label="Grade" value={course.grade} onChange={(e) => updateCourse(course.id, "grade", e.target.value)} className="min-w-0 rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-sky-400">{[{value:"",label:"-"},{value:"4",label:"A"},{value:"3.7",label:"A-"},{value:"3.3",label:"B+"},{value:"3",label:"B"},{value:"2.7",label:"B-"},{value:"2.3",label:"C+"},{value:"2",label:"C"},{value:"1.7",label:"C-"},{value:"1",label:"D"},{value:"0",label:"F"}].map(g => <option key={g.label} value={g.value}>{g.label}</option>)}</select> : <input aria-label={gradeFormat === "percentage" ? "Percentage grade" : "Grade points"} type="number" min="0" max={gradeFormat === "percentage" ? "100" : "4"} step="0.1" value={course.grade} onChange={(e) => updateCourse(course.id, "grade", e.target.value)} placeholder={gradeFormat === "percentage" ? "85" : "4.0"} className="min-w-0 rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-sky-400" />}
          <button type="button" title="Remove course" onClick={() => setCourses(old => old.length > 1 ? old.filter(c => c.id !== course.id) : old)} className="rounded-md text-slate-500 hover:bg-slate-800 hover:text-red-400">×</button>
        </div>)}
        <button type="button" onClick={() => setCourses(old => [...old, { id: Date.now() + Math.random(), name: "", credits: "", grade: "" }])} className="mt-1 text-sm text-sky-300 underline underline-offset-2 hover:text-sky-200">+ add more courses</button>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-950/70">
        <button type="button" onClick={() => setShowSettings(x => !x)} className="flex w-full items-center justify-between bg-sky-800 px-3 py-2 text-left text-sm font-semibold text-white">Settings <span>{showSettings ? "−" : "+"}</span></button>
        {showSettings && <div className="space-y-3 p-4">
          <SelectField label="Grade format" value={gradeFormat} onChange={(x) => { setGradeFormat(x); setResult(null); setCourses(old => old.map(c => ({...c, grade: ""}))); }} options={[{value:"letter",label:"Letter grades"},{value:"percentage",label:"Percentage"},{value:"points",label:"Grade points (4.0 scale)"}]} />
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={showPrior} onChange={(e) => setShowPrior(e.target.checked)} className="accent-sky-400" /> Add GPA of prior semesters</label>
          {showPrior && <div className="grid gap-3 sm:grid-cols-2"><Field label="Previous cumulative GPA" value={priorGpa} onChange={setPriorGpa} min="0" /><Field label="Previous credit hours" value={priorCredits} onChange={setPriorCredits} min="0" /></div>}
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={groupSemesters} onChange={(e) => setGroupSemesters(e.target.checked)} className="accent-sky-400" /> Group courses into semesters</label>
          {groupSemesters && <p className="text-xs leading-5 text-slate-500">Semester grouping is a visual organization option; all entered courses are included in this GPA calculation.</p>}
        </div>}
      </div>
      <p className="text-xs leading-5 text-slate-500">Enter each course on its own row. Credits are weighted, so a 4-credit course affects GPA more than a 1-credit course.</p>
    </div>,
  };

  function calculate() {
    const a = num(v.a), b = num(v.b), c = num(v.c), d = num(v.d), years = num(v.years), rate = num(v.rate) / 100;
    let answer;
    switch (tool.name) {
      case "Percentage Calculator": { const value = a / 100 * b; answer = `${money(value)} (${money(a)}% of ${money(b)})`; setResult({ value: answer, detail: `${money(a)} ÷ 100 × ${money(b)} = ${money(value)}.` }); return; }
      case "Discount Calculator": answer = `Sale price: ${money(a * (1 - b / 100))}`; setResult({ value: answer, detail: `You save ${money(a * b / 100)} (${money(b)}% off).` }); return;
      case "Tip Calculator": { const people = Math.max(1, num(v.c) || 1), tip = a * b / 100; answer = `Total: ${money(a + tip)}`; setResult({ value: answer, detail: `Tip: ${money(tip)} · Per person: ${money((a + tip) / people)}` }); return; }
      case "Compound Interest Calculator": { const n = Math.max(1, num(v.frequency) || 1), total = a * Math.pow(1 + rate / n, n * years); answer = money(total); setResult({ value: answer, detail: `Starting amount: ${money(a)} · Estimated interest: ${money(total - a)} · Compounding periods: ${money(n * years)}. Assumes no additional deposits or withdrawals.` }); return; }
      case "Simple Interest Calculator": { const interest = a * rate * years; answer = money(a + interest); setResult({ value: answer, detail: `Interest: ${money(interest)}.` }); return; }
      case "Loan Payment Calculator": { const n = years * 12, r = rate / 12, payment = r === 0 ? a / n : a * r / (1 - Math.pow(1 + r, -n)); if (!(a > 0 && n > 0 && rate >= 0) || !Number.isFinite(payment)) { setResult({ value: "Enter a positive loan amount and term, and a non-negative rate." }); return; } answer = money(payment); setResult({ value: `${answer} / month`, detail: `Estimated total paid: ${money(payment * n)} · Estimated interest: ${money(payment * n - a)} · Term: ${n} monthly payments. Excludes fees and other charges.` }); return; }
      case "Savings Calculator": {
        const months = Math.max(0, Math.floor(years * 12));
        const periodsPerYear = Math.max(1, Number(v.frequency) || 12);
        const monthlyRate = Math.pow(1 + rate / periodsPerYear, periodsPerYear / 12) - 1;
        const tax = Math.min(100, Math.max(0, num(v.taxRate) || 0)) / 100;
        const annualDeposit = Math.max(0, num(v.annualContribution) || 0);
        const annualGrowth = (num(v.annualIncrease) || 0) / 100;
        const monthlyGrowth = (num(v.monthlyIncrease) || 0) / 100;
        let balance = Math.max(0, a), contributions = balance;
        for (let month = 1; month <= months; month++) {
          const yearIndex = Math.floor((month - 1) / 12);
          const monthlyDeposit = Math.max(0, (num(v.b) || 0) * Math.pow(1 + monthlyGrowth, yearIndex));
          const yearlyDeposit = month % 12 === 1 ? Math.max(0, annualDeposit * Math.pow(1 + annualGrowth, yearIndex)) : 0;
          const deposit = monthlyDeposit + yearlyDeposit;
          if (v.depositBeginning) balance += deposit;
          const interest = balance * monthlyRate;
          balance += interest * (1 - tax);
          if (!v.depositBeginning) balance += deposit;
          contributions += deposit;
        }
        const interestEarned = balance - contributions;
        const inflationRate = Math.max(0, num(v.inflation) || 0) / 100;
        const realValue = balance / Math.pow(1 + inflationRate, years || 0);
        if (![a, years, rate].every(Number.isFinite) || a < 0 || years < 0 || rate < 0) { setResult({ value: "Enter valid non-negative amounts, rate, and years." }); return; }
        setResult({ value: money(balance), detail: `Projected end balance: ${money(balance)}. Initial deposit: ${money(a)}. Total additional contributions: ${money(contributions - Math.max(0, a))}. Estimated after-tax interest: ${money(interestEarned)}. Estimated value in today's money after ${money(inflationRate * 100)}% inflation: ${money(realValue)}. Assumes a constant rate, monthly growth approximation, contributions at ${v.depositBeginning ? "month-beginning" : "month-end"}, and tax applied to interest as it accrues; actual account terms may differ.` }); return;
      }
      case "BMI Calculator": { const height = a / 100, bmi = b / (height * height); answer = Number.isFinite(bmi) && height > 0 && b > 0 ? money(bmi) : "Enter a valid height and weight"; setResult({ value: answer, detail: "BMI is a rough screening measure and does not diagnose health or determine an individual's ideal weight." }); return; }
      case "BMR Calculator": { const value = 10 * b + 6.25 * c - 5 * a + (v.gender === "male" ? 5 : -161); answer = `${money(value)} kcal/day`; setResult({ value: answer, detail: "Estimated resting energy expenditure using the Mifflin–St Jeor equation." }); return; }
      case "Pace Calculator": { const totalSeconds = (num(v.hours) || 0) * 3600 + (num(v.minutes) || 0) * 60 + (num(v.seconds) || 0), pace = totalSeconds / num(v.distance); answer = Number.isFinite(pace) && pace > 0 ? `${Math.floor(pace / 60)}:${String(Math.round(pace % 60)).padStart(2, "0")} min/km` : "Enter a valid distance and time"; break; }
      case "Average Calculator": { const nums = (v.text || "").trim().split(/[\s,;]+/).filter(Boolean).map(Number); answer = nums.length && nums.every(Number.isFinite) ? money(nums.reduce((s, x) => s + x, 0) / nums.length) : "Enter valid numbers"; setResult({ value: answer, detail: `Numbers counted: ${nums.length}.` }); return; }
      case "Random Number Generator": { const lo = Math.ceil(a), hi = Math.floor(b); answer = Number.isFinite(lo) && Number.isFinite(hi) && hi >= lo ? String(Math.floor(Math.random() * (hi - lo + 1)) + lo) : "Maximum must be at least the minimum"; break; }
      case "Fraction Calculator": { if (![a,b,c,d].every(Number.isFinite) || b === 0 || d === 0) { answer = "Enter valid fractions with non-zero denominators"; break; } const x = a / b, y = c / d, z = v.op === "add" ? x + y : v.op === "subtract" ? x - y : v.op === "multiply" ? x * y : y === 0 ? NaN : x / y; answer = Number.isFinite(z) ? `${money(z)} (decimal)` : "Cannot divide by zero"; break; }
      case "Quadratic Formula Calculator": { const disc = b * b - 4 * a * c; if (a === 0) answer = "Coefficient a cannot be zero"; else if (disc < 0) { answer = `Complex roots: ${money(-b / (2 * a))} ± ${money(Math.sqrt(-disc) / (2 * a))}i`; setResult({ value: answer, detail: `Discriminant b² − 4ac = ${money(disc)}. Since it is negative, there are no real roots.` }); return; } else { answer = disc === 0 ? `Repeated root: x = ${money(-b / (2 * a))}` : `x₁ = ${money((-b + Math.sqrt(disc)) / (2 * a))}, x₂ = ${money((-b - Math.sqrt(disc)) / (2 * a))}`; setResult({ value: answer, detail: `Discriminant b² − 4ac = ${money(disc)}. Equation: ${a}x² + (${b})x + (${c}) = 0.` }); return; } break; }
      case "Age Calculator": { const birth = new Date(`${v.date1}T00:00:00`), today = new Date(); let age = today.getFullYear() - birth.getFullYear(); const m = today.getMonth() - birth.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--; answer = birth > today ? "Birth date is in the future" : `${age} years`; break; }
      case "Date Difference Calculator": { const days = Math.round((new Date(`${v.date2}T00:00:00`) - new Date(`${v.date1}T00:00:00`)) / 86400000); answer = `${Math.abs(days)} days`; setResult({ value: answer, detail: days < 0 ? "The end date is before the start date." : "Difference between the selected dates." }); return; }
      case "Unit Converter": { const length = { m: 1, km: 1000, cm: .01, mi: 1609.344, ft: .3048, in: .0254 }, weight = { kg: 1, g: .001, lb: .45359237, oz: .028349523125 }; if ((v.kind || "length") === "temperature") { const toC = { C: a, F: (a - 32) * 5 / 9, K: a - 273.15 }, celsius = toC[v.tempFrom]; answer = money(v.tempTo === "C" ? celsius : v.tempTo === "F" ? celsius * 9 / 5 + 32 : celsius + 273.15); } else { const map = (v.kind || "length") === "weight" ? weight : length; answer = map[v.unitFrom] && map[v.unitTo] ? money(a * map[v.unitFrom] / map[v.unitTo]) : "Select compatible units"; } break; }
      case "Password Generator": { const length = Math.min(64, Math.max(4, Math.floor(num(v.count) || 16))); let chars = ""; if (v.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; if (v.lower) chars += "abcdefghijklmnopqrstuvwxyz"; if (v.digits) chars += "0123456789"; if (v.symbols) chars += "!@#$%^&*()-_=+[]{}?"; if (!chars) { answer = "Choose at least one character type"; break; } const bytes = new Uint32Array(length); if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes); else for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 100000); answer = Array.from(bytes, (n) => chars[n % chars.length]).join(""); setResult({ value: answer, detail: "Generated in your browser. Copy it somewhere safe; don't reuse passwords." }); return; }
      case "Text Counter": { const t = v.text || "", words = t.trim() ? t.trim().split(/\s+/).length : 0, sentences = t.trim() ? (t.match(/[.!?]+(?=\s|$)/g) || []).length : 0; answer = `${words} words`; setResult({ value: answer, detail: `${t.length} characters · ${t.replace(/\s/g, "").length} characters without spaces · ${sentences} sentences.` }); return; }
      case "Base64 Encoder / Decoder": try { answer = v.base64Mode === "encode" ? btoa(unescape(encodeURIComponent(v.text))) : decodeURIComponent(escape(atob(v.text))); } catch { answer = "Invalid input for this Base64 operation"; } break;
      case "URL Encoder / Decoder": try { answer = v.urlMode === "encode" ? encodeURIComponent(v.text) : decodeURIComponent(v.text); } catch { answer = "Invalid URL-encoded input"; } break;
      case "GPA Calculator": {
        const gradeMap = { "4": 4, "3.7": 3.7, "3.3": 3.3, "3": 3, "2.7": 2.7, "2.3": 2.3, "2": 2, "1.7": 1.7, "1": 1, "0": 0 };
        const validCourses = courses.filter(course => course.credits !== "" && course.grade !== "");
        const rows = validCourses.map(course => {
          const credits = Number(course.credits);
          let points = Number(course.grade);
          if (gradeFormat === "letter") points = gradeMap[course.grade];
          if (gradeFormat === "percentage") points = points >= 90 ? 4 : points >= 80 ? 3 : points >= 70 ? 2 : points >= 60 ? 1 : 0;
          return { name: course.name || "Unnamed course", credits, points };
        });
        const totalCredits = rows.reduce((sum, row) => sum + row.credits, 0);
        const totalPoints = rows.reduce((sum, row) => sum + row.points * row.credits, 0);
        const oldCredits = showPrior ? Number(priorCredits) : 0;
        const oldPoints = showPrior ? Number(priorGpa) * oldCredits : 0;
        if (!rows.length || rows.some(row => !Number.isFinite(row.credits) || row.credits <= 0 || !Number.isFinite(row.points) || row.points < 0) || (showPrior && (!Number.isFinite(oldCredits) || oldCredits < 0 || !Number.isFinite(oldPoints))) || totalCredits + oldCredits <= 0) answer = "Enter a valid grade and positive credit hours for at least one course.";
        else {
          const gpa = (totalPoints + oldPoints) / (totalCredits + oldCredits);
          const breakdown = rows.map(row => `${row.name}: ${row.credits} credits × ${money(row.points)} points`).join(" · ");
          setResult({ value: money(gpa), detail: `Total credits: ${money(totalCredits + oldCredits)}. Current courses: ${money(totalCredits)} credits. Weighted grade points: ${money(totalPoints + oldPoints)}. ${gradeFormat === "percentage" ? "Percentage conversion used: 90–100=A, 80–89=B, 70–79=C, 60–69=D, below 60=F." : ""} ${breakdown}` }); return;
        }
        break;
      }
      default: answer = "This tool is not available yet.";
    }
    setResult({ value: answer });
  }

  const isLiveText = ["Text Counter"].includes(tool.name);
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7">
    <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-sky-300"><ArrowLeft size={16} /> Back to all tools</button>
    <div className="flex items-start gap-4 border-b border-slate-800 pb-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300"><tool.icon size={22} /></span><div><p className="text-xs font-medium uppercase tracking-wider text-sky-300">{tool.category}</p><h2 className="mt-1 text-2xl font-semibold text-white">{tool.name}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{tool.description}</p></div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{fields[tool.name]}</div>
    {TOOL_GUIDES[tool.name] && <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 lg:col-span-3"><h3 className="text-sm font-semibold text-white">About this calculator</h3><p className="mt-2 text-sm leading-6 text-slate-400">{TOOL_GUIDES[tool.name].intro}</p></div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><h3 className="text-sm font-semibold text-sky-300">Formula / method</h3><p className="mt-2 text-sm leading-6 text-slate-300">{TOOL_GUIDES[tool.name].formula}</p></div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><h3 className="text-sm font-semibold text-sky-300">Example</h3><p className="mt-2 text-sm leading-6 text-slate-300">{TOOL_GUIDES[tool.name].example}</p></div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><h3 className="text-sm font-semibold text-sky-300">How to use</h3><ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6 text-slate-400">{TOOL_GUIDES[tool.name].tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></div>
    </div>}
    {!isLiveText && <div className="mt-5 flex flex-wrap gap-3"><button onClick={calculate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"><Calculator size={16} /> Calculate</button><button onClick={() => { setV({ a: "100", b: "20", c: "", d: "", e: "", text: "", date1: "2000-01-01", date2: new Date().toISOString().slice(0, 10), op: "add", unitFrom: "m", unitTo: "km", tempFrom: "C", tempTo: "F", count: "16", upper: true, lower: true, digits: true, symbols: false, gender: "male", years: "5", rate: "5", frequency: "12", annualContribution: "5000", annualIncrease: "3", monthlyIncrease: "0", taxRate: "0", inflation: "0", people: "1", distance: "5", hours: "0", minutes: "30", seconds: "0", grades: "4, 3, 3.5", weights: "3, 3, 4" }); setCourses([{ id: 1, name: "Math", credits: "3", grade: "4" }, { id: 2, name: "English", credits: "3", grade: "3.3" }, { id: 3, name: "History", credits: "2", grade: "3.7" }, { id: 4, name: "", credits: "", grade: "" }, { id: 5, name: "", credits: "", grade: "" }]); setGradeFormat("letter"); setShowPrior(false); setPriorGpa("0"); setPriorCredits("0"); setGroupSemesters(false); setResult(null); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"><RotateCcw size={15} /> Reset</button></div>}
    {isLiveText && <Result title="Live count" detail={`${(v.text || "").length} characters · ${(v.text || "").trim() ? (v.text || "").trim().split(/\s+/).length : 0} words · ${(v.text || "").replace(/\s/g, "").length} characters without spaces.`}>{(v.text || "").trim() ? `${(v.text || "").trim().split(/\s+/).length} words` : "Start typing…"}</Result>}
    {result && <><Result title="Result" detail={result.detail}>{result.value}</Result><button onClick={() => { navigator.clipboard?.writeText(String(result.value)); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-sky-400/50 hover:text-white">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy result"}</button></>}
    <p className="mt-6 text-xs leading-5 text-slate-500">Results are calculated in your browser. Check important financial, academic, or health-related results independently.</p>
  </section>;
}

function ToolCard({ tool, onClick }) {
  const Icon = tool.icon || Calculator;
  const classes = "group flex min-h-[82px] w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400";
  const content = <><span className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-800 text-sky-300"><Icon size={18} aria-hidden="true" /></span><span className="min-w-0"><span className="block text-sm font-medium text-slate-100 group-hover:text-sky-200">{tool.name}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{tool.description}</span></span></span><ChevronRight size={17} className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-sky-300" /></>;
  return tool.href ? <a href={tool.href} className={classes}>{content}</a> : <button type="button" onClick={onClick} className={classes}>{content}</button>;
}

export default function ToolsDirectory() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All tools");
  const [selectedTool, setSelectedTool] = useState(null);
  const totalTools = ALL_TOOLS.length;
  const filteredCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return CATEGORIES.filter((category) => activeCategory === "All tools" || category.name === activeCategory).map((category) => ({ ...category, items: category.items.map((tool) => ({ ...tool, category: category.name })).filter((tool) => !normalized || tool.name.toLowerCase().includes(normalized) || tool.description.toLowerCase().includes(normalized) || category.name.toLowerCase().includes(normalized)) })).filter((category) => category.items.length > 0);
  }, [query, activeCategory]);
  const visibleCount = filteredCategories.reduce((sum, category) => sum + category.items.length, 0);

  return <main className="min-h-screen bg-slate-950 text-slate-100"><Breadcrumbs /><div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.13),transparent_65%)]" /><div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-8 flex flex-col gap-6 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200"><SlidersHorizontal size={14} /> TOOLBOX</div><h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">Useful tools, <span className="text-sky-300">all in one place.</span></h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Choose a tool to open it right here. No separate calculator pages or unnecessary redirects.</p></div><div className="grid grid-cols-2 gap-3 sm:min-w-48"><div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-2xl font-semibold text-white">{totalTools}</p><p className="mt-1 text-xs text-slate-400">Working tools</p></div><div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-2xl font-semibold text-white">{CATEGORIES.length}</p><p className="mt-1 text-xs text-slate-400">Categories</p></div></div></header>
    {selectedTool ? <ToolWorkspace key={selectedTool.name} tool={selectedTool} onBack={() => setSelectedTool(null)} /> : <>
      <section aria-label="Find a tool" className="mb-8"><label htmlFor="tool-search" className="mb-2 block text-sm font-medium text-slate-300">Search tools</label><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input id="tool-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try percentage, BMI, password…" className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3.5 pl-11 pr-11 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={16} /></button>}</div><div className="flex gap-2 overflow-x-auto pb-1">{["All tools", ...CATEGORIES.map((c) => c.name)].map((name) => <button key={name} type="button" onClick={() => setActiveCategory(name)} className={`shrink-0 rounded-xl border px-4 py-3 text-sm transition ${activeCategory === name ? "border-sky-400/40 bg-sky-400/10 text-sky-200" : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white"}`}>{name}</button>)}</div></div><p className="mt-3 text-xs text-slate-500" aria-live="polite">Showing {visibleCount} of {totalTools} tools</p></section>
      <div className="space-y-10">{filteredCategories.map((category) => { const Icon = category.icon || Calculator; return <section key={category.name} aria-labelledby={`category-${category.name.replace(/\W+/g, "-")}`}><div className="mb-5 flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-sky-300"><Icon size={20} /></span><div><h2 id={`category-${category.name.replace(/\W+/g, "-")}`} className="text-xl font-semibold tracking-tight text-white">{category.name}</h2><p className="mt-1 text-sm text-slate-400">{category.description}</p><p className="mt-1 text-xs text-slate-600">{category.items.length} tools</p></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{category.items.map((tool) => <ToolCard key={tool.name} tool={tool} onClick={() => { setSelectedTool(tool); window.scrollTo?.({ top: 0, behavior: "smooth" }); }} />)}</div></section>; })}{filteredCategories.length === 0 && <div className="rounded-2xl border border-dashed border-slate-800 px-6 py-16 text-center"><Search size={28} className="mx-auto text-slate-600" /><h2 className="mt-4 text-lg font-semibold text-white">No tools found</h2><p className="mt-2 text-sm text-slate-400">Try another search term or clear the category filter.</p><button type="button" onClick={() => { setQuery(""); setActiveCategory("All tools"); }} className="mt-5 rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300">Reset filters</button></div>}</div>
    </>}
    <footer className="mt-16 border-t border-slate-800 pt-6 text-xs leading-5 text-slate-500">A collection of browser-based utilities. Scientific Calculator links to /scientific-calculator. Dice Roller and Spin Wheel are omitted because they already exist in your project.</footer>
  </div></main>;
}
