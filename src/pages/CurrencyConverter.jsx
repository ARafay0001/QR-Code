import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Banknote, ChevronDown, Clock, RefreshCw, Search, TriangleAlert } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ToolArticle from "../components/common/ToolArticle";
import ToolFAQ from "../components/common/ToolFAQ";

const POPULAR = ["USD", "EUR", "GBP", "PKR", "AED", "SAR", "INR", "CAD", "AUD", "CNY", "JPY", "TRY"];
const QUICK_AMOUNTS = [1, 10, 100, 1000, 10000];



const Article = {
  title: "How to Convert Currency Online and Understand Exchange Rates",
 
  intro:
    "Whether you are shopping from an overseas store, planning a trip, sending money to family, or pricing work for an international client, you need to know what an amount is worth in another currency. Toolited's currency converter turns any amount into more than 160 world currencies using up-to-date exchange rates, so you can get a clear estimate in a few seconds.",
 
  sections: [
    {
      heading: "What is a currency converter?",
      paragraphs: [
        "A currency converter calculates how much a sum of money in one currency is worth in another. It multiplies your amount by the exchange rate between the two currencies. For example, if 1 US dollar equals a certain number of Pakistani rupees, then 100 dollars is worth 100 times that rate.",
        "Exchange rates change as currencies are traded on global markets, which is why the same amount can be worth slightly more or less from one day to the next.",
      ],
    },
    {
      heading: "How to convert currency step by step",
      paragraphs: [
        "Converting an amount with Toolited takes only a few clicks.",
      ],
      bullets: [
        "Enter the amount you want to convert, or tap one of the quick amounts.",
        "Choose the currency you are converting from, for example USD.",
        "Choose the currency you want to convert to, for example PKR, EUR, GBP or AED.",
        "Read the converted amount and the exchange rate shown below it.",
        "Use the swap button to reverse the conversion, or select another popular currency to compare.",
      ],
    },
    {
      heading: "What affects exchange rates?",
      paragraphs: [
        "Exchange rates move for many reasons. Interest rates set by central banks, inflation, economic growth, trade balances, political events and market demand all influence how strong or weak a currency is compared with others.",
        "Because of this, a rate you checked last week may not match today's rate. Always check a recent rate before you make a payment or a financial decision.",
      ],
    },
    {
      heading: "Why the converter rate can differ from your bank's rate",
      paragraphs: [
        "The rate shown by an online converter is a reference rate. Banks, exchange offices, card providers and money-transfer services usually add a margin or a fee on top of it, so the amount you actually receive or pay is often a little different.",
        "Use the converter to estimate and compare, then confirm the final rate and any fees with your bank or provider before you send or exchange money.",
      ],
    },
    {
      heading: "Common ways to use a currency converter",
      paragraphs: [
        "A converter is useful in many everyday situations.",
      ],
      bullets: [
        "Checking the price of products from international online stores.",
        "Budgeting for travel, hotels and daily spending abroad.",
        "Estimating the value of money sent or received from overseas.",
        "Pricing freelance work and invoices for clients in other countries.",
        "Comparing salaries, tuition fees or costs between countries.",
        "Following the value of savings or investments held in foreign currency.",
      ],
    },
    {
      heading: "Tips for getting the best value when exchanging money",
      paragraphs: [
        "Compare at least two or three providers instead of accepting the first offer. Look at both the exchange rate and any fixed fees, because a low fee with a poor rate can cost more than a higher fee with a better rate.",
        "Avoid exchanging large amounts at airports where margins are often wider, and be careful with offers that advertise zero fees but hide the cost in the rate. For larger transfers, check whether you can wait for a more favourable rate, but remember that rates can move in either direction.",
      ],
    },
  ],
 
  relatedTools: [
    { label: "Unit Converter", href: "/unit-converter" },
    { label: "Scientific Calculator", href: "/scientific-calculator" },
    { label: "Text Tool", href: "/text-tool" },
    { label: "QR Code Generator", href: "/qr-generator" },
  ],
};
 
const FAQ = [
  {
    question: "How does the currency converter work?",
    answer:
      "You enter an amount and choose two currencies. The tool loads current exchange rates and multiplies your amount by the rate between the two currencies. The result and the rate in both directions appear instantly.",
  },
  {
    question: "How many currencies can I convert?",
    answer:
      "You can convert between more than 160 world currencies, including USD, EUR, GBP, PKR, INR, AED, SAR, CAD, AUD, CNY, JPY and TRY. The most popular currencies are listed first to make them easy to find.",
  },
  {
    question: "How often are the exchange rates updated?",
    answer:
      "The converter uses daily reference rates. The date and time of the latest update are shown under the result, and you can use the refresh button to load the newest rates available.",
  },
  {
    question: "Is this the same rate my bank will give me?",
    answer:
      "Not exactly. The converter shows a reference rate for estimating values. Banks, exchange offices and transfer services usually add fees or a margin, so confirm the final rate with your provider before you exchange or send money.",
  },
  {
    question: "Can I convert Pakistani rupees (PKR) to US dollars and other currencies?",
    answer:
      "Yes. Choose PKR as the currency you are converting from and pick USD, EUR, GBP, AED, SAR or any other currency in the To list. You can also tap the swap button to reverse the direction instantly.",
  },
  {
    question: "Is the currency converter free to use?",
    answer:
      "Yes. The converter is free, needs no account or sign-up, and has no limit on how many conversions you can make.",
  },
  {
    question: "Does it work on a phone?",
    answer:
      "Yes. The page adapts to smaller screens, so you can check a rate on your phone while you shop, travel or send money.",
  },
  {
    question: "Should I use it for large financial decisions?",
    answer:
      "Use it as a quick guide. For large payments, investments or contracts, check the live rate and fees with your bank or a licensed provider, because rates can change quickly and the figures here are for information only.",
  },
];

const names = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" });
  } catch {
    return null;
  }
})();
const currencyName = (code) => {
  try {
    return names?.of(code) || code;
  } catch {
    return code;
  }
};

const fmt = (value, max = 2) => {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const digits = abs >= 1 ? max : abs >= 0.01 ? 4 : 6;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: abs >= 1 ? Math.min(2, max) : 0 }).format(value);
};

// Primary: Exchange Rate API (160+ currencies, daily). Fallback: currency-api on jsDelivr.
async function loadRates(signal) {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal });
    if (!res.ok) throw new Error("primary failed");
    const data = await res.json();
    if (data.result !== "success" || !data.rates) throw new Error("bad data");
    return { rates: data.rates, updated: data.time_last_update_utc };
  } catch (err) {
    if (err.name === "AbortError") throw err;
    const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json", { signal });
    if (!res.ok) throw new Error("Could not load exchange rates.");
    const data = await res.json();
    const rates = Object.fromEntries(Object.entries(data.usd || {}).map(([k, v]) => [k.toUpperCase(), v]));
    rates.USD = 1;
    return { rates, updated: data.date };
  }
}

function Select({ id, label, value, onChange, codes }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  const popular = POPULAR.filter((code) => codes.includes(code));
  const others = codes.filter((code) => !POPULAR.includes(code));
  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch = (code) =>
    !normalizedSearch ||
    code.toLowerCase().includes(normalizedSearch) ||
    currencyName(code).toLowerCase().includes(normalizedSearch);
  const filteredPopular = popular.filter(matchesSearch);
  const filteredOthers = others.filter(matchesSearch);
  const options = [...filteredPopular, ...filteredOthers];

  const openDropdown = () => {
    setSearch("");
    setActiveIndex(Math.max([...popular, ...others].indexOf(value), 0));
    setOpen(true);
  };

  const handleOptionKeyDown = (event, index) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setSearch("");
      triggerRef.current?.focus();
      return;
    }

    let nextIndex;
    if (event.key === "ArrowDown") nextIndex = Math.min(index + 1, options.length - 1);
    else if (event.key === "ArrowUp") nextIndex = Math.max(index - 1, 0);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    else return;

    event.preventDefault();
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setSearch("");
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown" && options.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
      optionRefs.current[0]?.focus();
    } else if (event.key === "ArrowUp" && options.length > 0) {
      event.preventDefault();
      const lastIndex = options.length - 1;
      setActiveIndex(lastIndex);
      optionRefs.current[lastIndex]?.focus();
    }
  };

  const chooseCurrency = (code) => {
    onChange(code);
    setOpen(false);
    setSearch("");
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={dropdownRef}
      className="currency-dropdown relative min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id} className="text-sm font-semibold text-slate-200">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        onClick={() => {
          if (open) {
            setOpen(false);
            setSearch("");
          } else {
            openDropdown();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openDropdown();
          }
        }}
        className="themed-dropdown-trigger mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-page px-4 py-3 text-left text-text transition-colors hover:border-brand/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
      >
        <span>{value} – {currencyName(value)}</span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className="themed-dropdown-menu absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/30"
        >
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-page px-3">
              <Search aria-hidden="true" size={16} className="shrink-0 text-muted" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search currency or code"
                aria-label={`Search ${label.toLowerCase()} currencies`}
                aria-controls={`${id}-listbox`}
                className="themed-dropdown-search min-w-0 flex-1 bg-transparent py-2 text-sm text-text placeholder:text-muted"
              />
            </div>
          </div>
          <div
            id={`${id}-listbox`}
            role="listbox"
            aria-labelledby={id}
            className="themed-scroll max-h-60 overflow-y-auto p-1.5"
          >
            {filteredPopular.length > 0 && (
              <>
                <div role="presentation" className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Popular
                </div>
                {filteredPopular.map((code) => {
                  const index = options.indexOf(code);
                  return (
                    <button
                      key={code}
                      ref={(element) => { optionRefs.current[index] = element; }}
                      id={`${id}-option-${code}`}
                      type="button"
                      role="option"
                      aria-selected={value === code}
                      tabIndex={activeIndex === index ? 0 : -1}
                      onClick={() => chooseCurrency(code)}
                      onKeyDown={(event) => handleOptionKeyDown(event, index)}
                      className="themed-dropdown-option flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-text transition-colors"
                    >
                      <span>{code} – {currencyName(code)}</span>
                      {value === code && <span aria-hidden="true" className="text-brand">✓</span>}
                    </button>
                  );
                })}
              </>
            )}
            {filteredOthers.length > 0 && (
              <>
                <div role="presentation" className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {normalizedSearch ? "Other matches" : "All currencies"}
                </div>
                {filteredOthers.map((code) => {
                  const index = options.indexOf(code);
                  return (
                    <button
                      key={code}
                      ref={(element) => { optionRefs.current[index] = element; }}
                      id={`${id}-option-${code}`}
                      type="button"
                      role="option"
                      aria-selected={value === code}
                      tabIndex={activeIndex === index ? 0 : -1}
                      onClick={() => chooseCurrency(code)}
                      onKeyDown={(event) => handleOptionKeyDown(event, index)}
                      className="themed-dropdown-option flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-text transition-colors"
                    >
                      <span>{code} – {currencyName(code)}</span>
                      {value === code && <span aria-hidden="true" className="text-brand">✓</span>}
                    </button>
                  );
                })}
              </>
            )}
            {options.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted">
                No currencies match “{search}”.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CurrencyConverter() {
  const [rates, setRates] = useState(null);
  const [updated, setUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("PKR");

  const refresh = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const data = await loadRates(signal);
      setRates(data.rates);
      setUpdated(data.updated);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Couldn't load live exchange rates. Check your internet connection and try again.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const codes = useMemo(() => (rates ? Object.keys(rates).sort() : []), [rates]);
  const value = Number(amount);
  const valid = amount !== "" && Number.isFinite(value) && value >= 0;

  const convert = (v, a, b) => (rates && rates[a] && rates[b] ? (v / rates[a]) * rates[b] : NaN);
  const rate = rates ? convert(1, from, to) : NaN;
  const result = valid ? convert(value, from, to) : NaN;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const updatedLabel = useMemo(() => {
    if (!updated) return "";
    const d = new Date(updated);
    return Number.isNaN(d.getTime())
      ? updated
      : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }, [updated]);

  const others = POPULAR.filter((c) => c !== from && codes.includes(c));

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <header className="mx-auto max-w-2xl text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
              <Banknote size={28} />
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Currency converter</h1>
            <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">
              Convert between 160+ world currencies using up-to-date exchange rates.
            </p>
          </header>

          <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-8 lg:p-10">
            {error && (
              <div
                role="alert"
                className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
              >
                <span className="flex items-center gap-2">
                  <TriangleAlert size={18} /> {error}
                </span>
                <button
                  type="button"
                  onClick={() => refresh()}
                  className="rounded-lg border border-rose-400/40 px-3 py-1.5 font-semibold transition hover:bg-rose-500/10"
                >
                  Try again
                </button>
              </div>
            )}

            <div>
              <label htmlFor="amount" className="text-sm font-semibold text-slate-200">
                Amount
              </label>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-2xl font-bold text-white placeholder:text-slate-600"
              />
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    aria-pressed={Number(amount) === q}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                      Number(amount) === q
                        ? "border-violet-400/50 bg-violet-500/15 text-violet-200"
                        : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    {q.toLocaleString("en-US")}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
              <Select id="from" label="From" value={from} onChange={setFrom} codes={codes.length ? codes : [from]} />
              <button
                type="button"
                onClick={swap}
                aria-label="Swap currencies"
                title="Swap currencies"
                className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:border-violet-400/50 hover:text-violet-200"
              >
                <ArrowLeftRight size={19} className="rotate-90 sm:rotate-0" />
              </button>
              <Select id="to" label="To" value={to} onChange={setTo} codes={codes.length ? codes : [to]} />
            </div>

            {/* Result */}
            <div
              className="mt-8 rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-blue-500/10 p-6 text-center sm:p-8"
              aria-live="polite"
            >
              {loading && !rates ? (
                <p className="flex items-center justify-center gap-2 text-slate-400">
                  <RefreshCw size={18} className="animate-spin" /> Loading live rates…
                </p>
              ) : valid && Number.isFinite(result) ? (
                <>
                  <p className="text-sm text-slate-400">
                    {fmt(value, 4)} {from} =
                  </p>
                  <p className="mt-2 break-words text-4xl font-black tracking-tight sm:text-5xl">
                    {fmt(result)} <span className="text-violet-300">{to}</span>
                  </p>
                  <p className="mt-4 text-sm text-slate-400">
                    1 {from} = {fmt(rate, 4)} {to} · 1 {to} = {fmt(1 / rate, 4)} {from}
                  </p>
                </>
              ) : (
                <p className="text-slate-400">
                  {rates ? "Enter a valid amount to see the conversion." : "Rates are not available yet."}
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {updatedLabel ? `Rates updated: ${updatedLabel}` : "Rates not loaded"}
              </span>
              <button
                type="button"
                onClick={() => refresh()}
                disabled={loading}
                className="flex items-center gap-1.5 font-semibold text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh rates
              </button>
            </div>

            {/* Other currencies */}
            {valid && rates && others.length > 0 && (
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
                <p className="text-sm font-semibold text-slate-300">
                  {fmt(value, 4)} {from} in other popular currencies
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((code) => (
                    <li key={code}>
                      <button
                        type="button"
                        onClick={() => setTo(code)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                          code === to
                            ? "border-violet-400/50 bg-violet-500/10"
                            : "border-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-bold text-white">{code}</span>
                          <span className="block max-w-32 truncate text-xs text-slate-500">{currencyName(code)}</span>
                        </span>
                        <span className="text-sm font-semibold text-slate-200">{fmt(convert(value, from, code))}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <p className="mt-6 text-center text-xs text-slate-500">
            Exchange rates are for information only and may differ from the rate your bank or exchange offers.{" "}
            <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
              Rates by Exchange Rate API
            </a>
            .
          </p>
        </div>
      </main>
            <ToolArticle {...Article} />
                    <ToolFAQ
                      faqs={FAQ}
                     description="Convert between 160+ world currencies with up-to-date exchange rates, from USD and PKR to EUR, GBP and AED."
                    />
      <Footer />
    </>
  );
}