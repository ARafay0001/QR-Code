import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardPaste,
  Code,
  Flame,
  Keyboard,
  Quote,
  RotateCcw,
  Star,
  Target,
  Timer,
  Trash2,
  Trophy,
  Type,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

// Static word bank: common everyday English words (a-z only). Add or remove words freely.
const WORDS = [
  ...new Set(
    `
      the be to of and in that have it for not on with he as you do at this but his by from they we say
      her she or an will my one all would there their what so up out if about who get which go me when
      make can like time no just him know take people into year your good some could them see other than
      then now look only come its over think also back after use two how our work first well way even new
      want because any these give day most us great small large never always often under again house
      world still learn plant school ask fall sad dad lad add fad flask salad lass glad flag half hall
      shall hand sand land has had gas lag hash dash flash slash gash glass tree quiet write paper power
      pretty water type pour tower outer yet pet wet rope wipe pie tip top toy put per pure hope hold
      right light eight fight three those while should through thought quick brown jump lazy dog fox
      zebra maze quiz zoo buzz fizz zone zero amaze size prize seize blaze vex box next text exact expert
      exit extra axis index mix fix six wax tax relax cave cover voice value very visit move given river
      brave drive above black bench bunch number mountain morning memory music machine many mother mind
      mouse nice night noise north nothing notice cabin cable camel candy carry castle chain chair chance
      change charge check chest child choice circle clean clear climb clock close cloud coffee color
      common corner count country course create cross crowd daily dance danger dark dream drink early
      earth easy engine enjoy enough every family farm father field finger finish fire floor flower
      follow food forest friend front fruit garden gentle green ground group grow happy heart heavy help
      high history honest horse hour idea image inside island join journey keep kitchen knife ladder
      laugh leader leave letter listen little lucky market matter metal middle minute mirror model money
      moon nature near office order outside page paint parent party peace person picture place pocket
      point police pool porch practice problem project promise quarter question rabbit rain reach ready
      reason record remember rest road rock room round safe sea season second secret sense shadow share
      sheep shine ship shoe shop short shoulder silver simple sing sister skill sleep smile smoke snow
      soft song sound space speak speed spring square stand star start station stone store story street
      strong summer sun table talk teach team tell thank thing throw tiger today together tomorrow touch
      town toward train travel trust truth turn uncle until valley wait walk wall warm wash watch wave
      weather week weight whole wide wild wind window winter wish woman wonder wood worry yellow young
      able accept access account across act action active actor actual adapt address adult advice afraid
      agree ahead air alarm album alive allow almost alone along already alter among amount ancient anger
      angle animal annual another answer anyone anything apart apple area argue arm army around arrive
      art artist aside asleep assume attack attend aunt autumn avoid awake aware away baby bad bag bake
      balance ball band bank bar base basic basket bath battle beach bean bear beat beauty bed beef
      before begin behind believe bell belong below belt bend beside best better between beyond bike bill
      bird birth bit bite blank blanket blind block blood blow blue board boat body boil bone book boot
      border born borrow boss both bottle bottom bowl boy brain branch bread break breath bridge brief
      bright bring broad broke brother brush bubble bucket build burn burst bus bush business busy butter
      button buy cake call calm camp capital captain car card care careful case cash cat catch cause cell
      center century certain chalk champion channel chapter character cheap cheek cheese chicken chief
      chocolate church city class clever client coach coast coat code cold collect college comfort
      company compare complete computer concern condition connect contain content contest control cook
      cool copy corn cost cotton couch cough cousin cow crash crazy cream credit crew crop cry cup
      curious current curtain curve customer cut cycle damage data date dead deal dear death debate
      decide deck deep deer degree delay deliver desert design desk detail dial diary die diet different
      dig dinner direct dirt discuss dish distance doctor dollar door double doubt down draw dress drop
      drum dry duck dust duty each ear east eat edge egg either elbow electric elephant else empty end
      enemy energy enter equal escape evening event ever evil exam example excite excuse exercise expect
      explain eye face fact fail fair fan far fast fat fault fear feather feed feel fence few fill film
      final find fine fish fit flat flight float flow fly fog fold foot force foreign forget fork form
      forward frame free fresh frog fun funny future gain game gap gate gather general gift girl glove
      goal god gold golf gone goose grade grain grand grape grass gray greet grocery guess guest guide
      gun habit hair hammer hang hard hat hate hay head health hear heat hello hen herself hide hill
      himself hip hit hobby hole holiday home honey hook hop horn hospital host hot hotel hundred hungry
      hunt hurry hurt husband ice ill imagine important include inch indeed insect instead interest
      invent iron issue item jacket jar jaw jelly jewel job joke joy judge juice kick kid kill kind king
      kiss kite knee knock knot label lack lady lake lamp last late later lawn lead leaf least leg lend
      length less lesson lie life lift line lion lip list live load local lock log lone long loose lose
      lot loud love low luck lunch mad mail main male man map mark marry mask master match meal mean
      measure meat medal meet melt member mess message might mild mile milk million mine miss mistake
      moment monkey month mood more motor mouth much mud must nail name narrow neck need needle neighbor
      neither nest net nobody none noon nor nose note nurse nut oak ocean odd off offer oil old once
      onion open opinion orange organ ought oven own pack pain pair pan pants part pass past path pay
      pear pen pencil penny perfect period phone piano pick piece pig pile pillow pilot pin pipe pink
      pitch plan plate play please plenty plus poem pole pond poor pop port pot pound powder present
      press price pride prince print produce program proud public pull pump pupil push puzzle queen race
      radio rail rainbow raise range rate rather raw ray razor read real rear red reply report rich ride
      ring rise risk roll roof root rose rough row royal rub rule run sail salt same save scale scare
      scene science score scratch screen screw seal search seat seed seem sell send sentence serve set
      seven several shake shape sharp shed shell shift shiny shirt shock shore show shower shut sick side
      sign silly since single sink sir skin skirt sky slide slip slow smart smell smooth snake soap sock
      sofa soil soldier solid son soon sorry sort soul south spare special spend spice spider spoon sport
      spot stage stair stamp state steam steel step stick stomach stop storm strange stream strike string
      student study subject such sudden sugar suit sure surprise sweet swim switch system tail tall tape
      taste tea tear tent term test thin third thirsty though thread throat thumb thunder ticket tide tie
      tight till tin tiny tire title toast toe told tomato tone tongue tonight tool tooth total towel
      trade trap tray treat trick trip truck tube tune twice twin ugly umbrella unit upon upper usual
      vacation van vase vegetable vest view village vote wage wagon waist war was waste weak wear web
      wedding west whale wheat wheel where whether whisper whistle white whom whose why wife win wing
      wire wise wolf wool word worm wrap wrist wrong yard yes yesterday zip absence absolute academy
      accident achieve acquire activity actually addition advance advantage adventure advertise afternoon
      agency agenda airport alcohol alphabet although amazing ambition analyze announce anxious anymore
      anywhere apartment apologize appear appetite applause appoint approach approve argument arrange
      article ashamed assist athlete attempt attitude audience author average backpack background balloon
      bargain barrel basement bathroom battery beautiful bedroom beginning behavior benefit besides
      bicycle billion biology birthday blossom bookshelf boundary bracelet breakfast breathe brilliant
      broadcast budget building bulletin butterfly cabinet calendar camera campaign cancel capable carpet
      carrot cartoon catalog category ceiling celebrate cereal challenge charity chemical chimney circuit
      citizen classic classroom climate closet clothes cluster collar colony column comedy command
      comment commit community compass complain complex compose concert conclude conduct confirm confuse
      consider constant contact context continue contract convert convince cooperate copper correct
      costume cottage counter courage crayon creature crisp critic crystal culture cupboard cushion
      daughter decade decorate defeat defend define delicate delight demand deserve destroy develop
      diamond dictionary digital dinosaur diploma direction disagree disappear disaster discover disease
      display distant divide dolphin domestic donate doorway dragon drawer drizzle during eager earnest
      earthquake economy edition educate effort election element elevator emerge emotion employ enable
      encourage engineer enormous entire entrance envelope environment episode equipment essay evidence
      exactly examine excellent exchange exclaim exhibit expand experience experiment explore express
      extreme fabric factory faithful familiar famous fantasy fashion feature festival fiction fifteen
      figure finally fireplace firework flavor flexible flutter folder forecast forever forgive formula
      fortune fountain fraction frequent friendly frighten frozen fruitful furniture gadget galaxy
      gallery generate generous genius geography giant giraffe glacier glitter global goldfish gorilla
      government graceful graduate grammar granite graph grateful gravity growth guarantee guitar habitat
      hallway handsome happen harbor hardware harvest healthy height helicopter helpful heritage hesitate
      highway homework horizon horrible hostess household however humble hurricane identify immediate
      impact imply impress improve income increase indicate industry infant inform ingredient inhabit
      initial injury inquire insist inspect instant instrument insure intend interior internet interrupt
      interview introduce invite itself jealous journal junior justice kangaroo keyboard kingdom kitten
      knowledge laboratory landscape language laptop lantern laughter laundry lawyer leather lecture
      legend leisure lemon leopard library license lighthouse lightning likely liquid literature lizard
      lobster located lonely loyal luggage lumber magazine magic magnet mailbox maintain majority manage
      manner mansion marathon marble margin marine marriage marvel mattress maximum maybe meadow medicine
      medium melody mention merchant method midnight mineral minimum miracle mission mixture modern
      monitor monster mosquito muscle museum mystery national natural nearby necessary negative nervous
      network neutral nickel normal northern notebook novel nowhere nuclear nursery object obvious
      occasion official olive online opening operate opponent opposite orchestra ordinary organize
      original outdoor outline oxygen package paddle painting palace panda parade parcel parking partner
      passage passenger passion pasture patient pattern payment peaceful peanut pebble pepper perhaps
      permit pigeon pioneer pizza planet plastic platform pleasant pleasure poetry polite popular portion
      position positive possible postcard potato prairie praise precious prefer prepare preserve pressure
      prevent previous primary princess printer prison private process product profile progress proper
      protect protein provide pudding pumpkin puppet purple purpose pyramid quality quickly quilt raccoon
      railway random rapid reader reality really receive recent recipe recover reduce reflect refresh
      refuse region regular relate release remain remark remind remove repair repeat replace rescue
      research reserve respect respond restaurant result return reveal review reward rhythm ribbon rifle
      ritual robot rocket romance roommate rooster routine rubber saddle safety sailor sample sandwich
      satellite sauce saucer sausage scarf scatter schedule scissors scooter section secure seldom select
      senior sensible separate sequence serious servant service session setting settle seventeen shallow
      shampoo shelter sheriff shimmer shovel signal silence similar singer situate sixteen skeleton
      sketch skillet skyline slender slipper slogan snack snowman soccer social society soften solution
      someone something sometimes somewhere soothe sorrow source southern souvenir spaghetti sparkle
      speech spirit splash sponge spread sprinkle squirrel stable stadium staircase standard statue
      steady storage straight strategy stretch strict studio submit subtract succeed success suggest
      sunrise sunset support suppose surface surround survey suspect swallow sweater symbol tablet tailor
      talent target teacher teapot teenager telephone television temper temple tennis terrible territory
      theater thirteen thousand threaten timber tissue toaster tobacco topic tornado tortoise tourist
      traffic trailer training transfer treasure treaty tremble triangle tribe trophy tropical trouble
      trumpet tunnel turkey turtle twelve twenty typical understand uniform unique universe unless unlike
      unusual update upstairs useful usually valuable vanilla variety vehicle velvet venture version
      vertical victory video vinegar violin virtual visible visitor vitamin volcano volume voyage waffle
      waiter wallet walnut wander warmth warning washer waterfall wealth weapon website weekend welcome
      western whatever whenever wholesome wildlife willing wisdom wizard wooden worker worthy wrinkle
      writer written youngster yourself zigzag algorithm array async await backend binary boolean browser
      bug cache callback compile component console cookie database debug deploy domain error export fetch
      file filter framework frontend function git header import input integer interface iterate json
      keyword link logic loop merge module node output parse password pipeline pointer protocol query
      queue recursion render request response route runtime script server socket stack syntax template
      token variable
    `
      .split(/\s+/)
      .filter(Boolean),
  ),
];

// Extra real words that only use home-row keys (A S D F G H J K L), so the
// first lessons never have to fall back to made-up letter strings.
const HOME_WORDS = `ad add adds all alas alfalfa as ash ask asks dad dads dash fad fads fall falls flag flags flak flash flask flasks gag gags gal gals gas gash glad glass had hag hags half hall halls has hash jag jags lad lads lag lags lass sad saga sagas salad salads sass shag shall slash`.split(" ");

const SENTENCES = [
  "Practice does not make perfect, but careful practice makes progress that lasts.",
  "Slow is smooth, and smooth becomes fast once your fingers remember the path.",
  "Keep your eyes on the screen, your wrists relaxed, and let accuracy lead the way.",
  "Every expert was once a beginner who refused to stop typing.",
  "A calm rhythm beats a rushed sprint when the words keep on coming.",
  "Good code is written for people first and for machines second.",
  "Small daily sessions build habits that long weekend marathons never will.",
  "Build the project, break the project, then fix the project and learn why.",
  "Consistency turns ordinary effort into extraordinary skill over time.",
  "The best way to learn a keyboard is to stop looking at it.",
];

const SNIPPETS = [
  "const sum = (a, b) => a + b;",
  'console.log("Hello, world!");',
  "if (user && user.isActive) { return true; }",
  'import React, { useState } from "react";',
  'fetch("/api/users").then((res) => res.json());',
  'app.get("/", (req, res) => res.send("OK"));',
  "const [count, setCount] = useState(0);",
  'git commit -m "fix: update styles"',
  "for (let i = 0; i < arr.length; i++) {}",
  "export default function App() { return null; }",
  "npm install express mongoose dotenv",
  "const user = await User.findById(id);",
];

const LESSONS = [
  {
    id: "home-1",
    title: "Home Row",
    desc: "Rest your fingers on A S D F and J K L ; and learn to return there.",
    keys: "asdfjkl",
    focus: "asdfjkl",
    drills: ["asdf", "jkl;", "fj", "dk", "sl", "a;", "fdsa", ";lkj"],
    goal: 12,
    kind: "keys",
  },
  {
    id: "home-2",
    title: "Home Row Reach",
    desc: "Stretch your index fingers to G and H.",
    keys: "asdfghjkl",
    focus: "gh",
    drills: ["fg", "jh", "gf", "hj", "fgf", "jhj"],
    goal: 15,
    kind: "keys",
  },
  {
    id: "top",
    title: "Top Row",
    desc: "Reach up for Q W E R T Y U I O P.",
    keys: "asdfghjklqwertyuiop",
    focus: "qwertyuiop",
    goal: 18,
    kind: "keys",
  },
  {
    id: "bottom",
    title: "Bottom Row",
    desc: "Reach down for Z X C V B N M.",
    keys: "asdfghjklqwertyuiopzxcvbnm",
    focus: "zxcvbnm",
    goal: 20,
    kind: "keys",
  },
  {
    id: "words",
    title: "Common Words",
    desc: "Put every letter together with everyday words.",
    keys: "abcdefghijklmnopqrstuvwxyz",
    focus: "",
    goal: 25,
    kind: "words",
  },
  {
    id: "sentences",
    title: "Sentences & Capitals",
    desc: "Capital letters, commas and full stops with the Shift key.",
    keys: "",
    focus: "",
    goal: 28,
    kind: "sentences",
  },
  {
    id: "numbers",
    title: "Number Row",
    desc: "Type numbers without looking down.",
    keys: "0123456789",
    focus: "0123456789",
    goal: 20,
    kind: "numbers",
  },
  {
    id: "code",
    title: "Symbols & Code",
    desc: "Brackets, quotes and operators for developers.",
    keys: "",
    focus: "",
    goal: 22,
    kind: "code",
  },
];

const FINGER_NAMES = {
  lp: "left pinky",
  lr: "left ring finger",
  lm: "left middle finger",
  li: "left index finger",
  ri: "right index finger",
  rm: "right middle finger",
  rr: "right ring finger",
  rp: "right pinky",
  thumb: "thumb",
};

const FINGER_COLORS = {
  lp: "#f472b6",
  lr: "#fb923c",
  lm: "#facc15",
  li: "#4ade80",
  ri: "#2dd4bf",
  rm: "#38bdf8",
  rr: "#a78bfa",
  rp: "#e879f9",
  thumb: "#94a3b8",
};

const KB_ROWS = [
  {
    keys: "`1234567890-=",
    fingers: ["lp", "lp", "lr", "lm", "li", "li", "ri", "ri", "rm", "rr", "rp", "rp", "rp"],
    right: { id: "backspace", label: "⌫", flex: 2 },
  },
  {
    keys: "qwertyuiop[]\\",
    fingers: ["lp", "lr", "lm", "li", "li", "ri", "ri", "rm", "rr", "rp", "rp", "rp", "rp"],
    left: { id: "tab", label: "Tab", flex: 1.5 },
    right: { id: "gap", label: "", flex: 0.5 },
  },
  {
    keys: "asdfghjkl;'",
    fingers: ["lp", "lr", "lm", "li", "li", "ri", "ri", "rm", "rr", "rp", "rp"],
    left: { id: "caps", label: "Caps", flex: 1.75 },
    right: { id: "enter", label: "Enter", flex: 2.25 },
  },
  {
    keys: "zxcvbnm,./",
    fingers: ["lp", "lr", "lm", "li", "li", "ri", "ri", "rm", "rr", "rp"],
    left: { id: "lshift", label: "Shift", flex: 2.25 },
    right: { id: "rshift", label: "Shift", flex: 2.75 },
  },
];

const SHIFTED = {
  "~": "`", "!": "1", "@": "2", "#": "3", $: "4", "%": "5", "^": "6", "&": "7",
  "*": "8", "(": "9", ")": "0", _: "-", "+": "=", "{": "[", "}": "]", "|": "\\",
  ":": ";", '"': "'", "<": ",", ">": ".", "?": "/",
};

const KEY_INFO = (() => {
  const info = { " ": { finger: "thumb", hand: "both" } };
  KB_ROWS.forEach((row) =>
    [...row.keys].forEach((k, i) => {
      const finger = row.fingers[i];
      info[k] = { finger, hand: finger.startsWith("l") ? "left" : "right" };
    }),
  );
  return info;
})();

const STORAGE_KEY = "typeflow:v1";
const LINE_HEIGHT = 40;

const DEFAULT_STORE = {
  settings: { sound: true, keyboard: true, strict: false, effects: true },
  test: {
    mode: "time",
    duration: 30,
    words: 25,
    punctuation: false,
    numbers: false,
    custom: "",
  },
  history: [],
  lessons: {},
  keys: {},
  bests: {},
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const capitalize = (w) => w.charAt(0).toUpperCase() + w.slice(1);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const countCorrect = (typed, target) => {
  let c = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) c++;
  return c;
};

const normalizeText = (t) => t.replace(/\s+/g, " ").trim();

const keyLabel = (k) => (k === " " ? "Space" : k.toUpperCase());

const formatTime = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const levelFor = (wpm) =>
  wpm >= 100 ? "Elite" : wpm >= 80 ? "Expert" : wpm >= 60 ? "Advanced" : wpm >= 40 ? "Proficient" : wpm >= 25 ? "Intermediate" : "Beginner";

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
};

function calcStreak(history) {
  const days = new Set(history.map((h) => dayKey(h.d)));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function getWeakKeys(keys) {
  return Object.entries(keys)
    .filter(([, v]) => v.t >= 10 && v.m >= 2)
    .map(([k, v]) => ({ k, t: v.t, m: v.m, acc: Math.round(((v.t - v.m) / v.t) * 100) }))
    .sort((a, b) => a.acc - b.acc || b.m - a.m)
    .slice(0, 6);
}

/* ------------------------------ text builders ----------------------------- */

// Pick from a pool without repeating the previous pick back to back.
function pickDistinct(pool, prev) {
  if (pool.length < 2) return pool[0];
  let w;
  do w = pick(pool);
  while (w === prev);
  return w;
}

function makeWords(count, { punctuation, numbers } = {}) {
  const out = [];
  let startOfSentence = true;
  let prevRaw;
  for (let i = 0; i < count; i++) {
    let w = pickDistinct(WORDS, prevRaw);
    prevRaw = w;
    if (numbers && Math.random() < 0.12) {
      w = String(rand(1000));
    } else if (punctuation) {
      if (startOfSentence) w = capitalize(w);
      startOfSentence = false;
      const r = Math.random();
      if (r < 0.08) w += ",";
      else if (r < 0.15) {
        w += pick([".", ".", "?", "!"]);
        startOfSentence = true;
      }
    }
    out.push(w);
  }
  return out;
}

function buildLessonWords(lesson) {
  switch (lesson.kind) {
    case "words":
      return makeWords(40);
    case "sentences":
      return shuffle(SENTENCES).slice(0, 2).join(" ").split(" ");
    case "numbers":
      return Array.from({ length: 22 }, () => {
        const len = 2 + rand(5);
        return Array.from({ length: len }, () => rand(10)).join("");
      });
    case "code":
      return shuffle(SNIPPETS).slice(0, 4).join(" ").split(" ");
    default: {
      // Real English words only. The early home-row lessons also mix in a few
      // short finger drills (like "fj" or "asdf"), which are clearly drills.
      const inKeys = [...new Set([...WORDS, ...HOME_WORDS])].filter((w) =>
        [...w].every((c) => lesson.keys.includes(c)),
      );
      const withFocus = inKeys.filter((w) => [...w].some((c) => lesson.focus.includes(c)));
      const out = [];
      for (let i = 0; i < 36; i++) {
        const prev = out[out.length - 1];
        if (lesson.drills && Math.random() < 0.2) out.push(pickDistinct(lesson.drills, prev));
        else if (Math.random() < 0.55 && withFocus.length) out.push(pickDistinct(withFocus, prev));
        else out.push(pickDistinct(inKeys, prev));
      }
      return out;
    }
  }
}

function buildDrillWords(weak) {
  const letters = weak.filter((k) => /[a-z]/.test(k));
  if (!letters.length) return makeWords(40);
  const pool = WORDS.filter((w) => letters.some((k) => w.includes(k)));
  return Array.from({ length: 40 }, () => (pool.length && Math.random() < 0.85 ? pick(pool) : pick(WORDS)));
}

function buildTestWords(cfg) {
  switch (cfg.mode) {
    case "quote":
      return shuffle(SENTENCES).slice(0, 2).join(" ").split(" ");
    case "code":
      return shuffle(SNIPPETS).slice(0, 4).join(" ").split(" ");
    case "custom":
      return normalizeText(cfg.custom).split(" ").filter(Boolean);
    case "words":
      return makeWords(cfg.words, cfg);
    default:
      return makeWords(60, cfg);
  }
}

function buildWords(session) {
  if (session.type === "lesson") return buildLessonWords(session.lesson);
  if (session.type === "drill") return buildDrillWords(session.keys);
  return buildTestWords(session);
}

function sessionTitle(s) {
  if (s.type === "lesson") {
    return `Lesson ${LESSONS.findIndex((l) => l.id === s.lesson.id) + 1}: ${s.lesson.title}`;
  }
  if (s.type === "drill") return "Weak key drill";
  if (s.mode === "time") return `Time ${s.duration}s`;
  if (s.mode === "words") return `${s.words} words`;
  if (s.mode === "quote") return "Quote";
  if (s.mode === "code") return "Code";
  return "Custom text";
}

function bestKeyFor(s) {
  if (s.type !== "test" || s.mode === "custom") return null;
  const base = s.mode === "time" ? `time-${s.duration}` : s.mode === "words" ? `words-${s.words}` : s.mode;
  return base + (s.punctuation ? "+p" : "") + (s.numbers ? "+n" : "");
}

/* ------------------------------ key mapping ------------------------------- */

function charToKey(ch) {
  if (!ch) return null;
  if (ch === " ") return { base: " ", shift: false };
  if (/[A-Z]/.test(ch)) return { base: ch.toLowerCase(), shift: true };
  if (SHIFTED[ch]) return { base: SHIFTED[ch], shift: true };
  return KEY_INFO[ch] ? { base: ch, shift: false } : null;
}

function pressedId(e) {
  if (e.code === "ShiftLeft") return "lshift";
  if (e.code === "ShiftRight") return "rshift";
  if (e.key === "Backspace") return "backspace";
  if (e.key === "Enter") return "enter";
  if (e.key.length !== 1) return null;
  return SHIFTED[e.key] || e.key.toLowerCase();
}

/* --------------------------------- sound ---------------------------------- */

let audioCtx;
function getAudio() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone({ type = "sine", from, to = from, dur = 0.1, vol = 0.1, delay = 0 }) {
  const ctx = getAudio();
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

// Correct key = soft "pop". Wrong key = low "bonk".
function beep(ok) {
  try {
    if (ok) {
      const f = 820 + Math.random() * 140; // tiny pitch variation keeps it from sounding robotic
      playTone({ type: "sine", from: f * 1.6, to: f * 0.6, dur: 0.07, vol: 0.14 });
    } else {
      playTone({ type: "triangle", from: 210, to: 105, dur: 0.14, vol: 0.16 });
    }
  } catch {
    /* audio is optional */
  }
}

// Three rising notes when a run finishes.
function chime() {
  try {
    [660, 880, 1320].forEach((f, i) => playTone({ type: "sine", from: f, dur: 0.22, vol: 0.09, delay: i * 0.1 }));
  } catch {
    /* audio is optional */
  }
}

/* -------------------------------- storage --------------------------------- */

function loadStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw || typeof raw !== "object") return DEFAULT_STORE;
    return {
      ...DEFAULT_STORE,
      ...raw,
      settings: { ...DEFAULT_STORE.settings, ...raw.settings },
      test: { ...DEFAULT_STORE.test, ...raw.test },
    };
  } catch {
    return DEFAULT_STORE;
  }
}

function usePersistentStore() {
  const [store, setStore] = useState(loadStore);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* storage can be unavailable (private mode) */
    }
  }, [store]);
  return [store, setStore];
}

/* -------------------------------------------------------------------------- */
/*                               Small components                             */
/* -------------------------------------------------------------------------- */

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

function Pill({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition ${focusRing} ${
        active
          ? "border-blue-500 bg-blue-600/20 text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]"
          : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-600/70"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label, icon: Icon }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${focusRing} ${
        checked
          ? "border-blue-500/60 bg-blue-600/20 text-blue-100"
          : "border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );
}

// Big, obvious sound switch for the top bar of a typing run.
function SoundButton({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => {
        onToggle(!on);
        if (!on) beep(true); // preview the sound when switching on
      }}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${focusRing} ${
        on
          ? "border-blue-500/60 bg-blue-600/20 text-blue-100"
          : "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
      }`}
    >
      {on ? <Volume2 size={16} /> : <VolumeX size={16} />}
      <span className="hidden sm:inline">{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent = "text-blue-400" }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        <Icon size={14} className={accent} />
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function Stars({ count }) {
  return (
    <span className="flex gap-0.5" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= count ? "fill-yellow-400 text-yellow-400" : "text-slate-600"}
        />
      ))}
    </span>
  );
}

/* --------------------------------- charts --------------------------------- */

function LineChart({ series, labels = [], markers = [], height = 200 }) {
  const gid = useId();
  const W = 640;
  const P = { l: 36, r: 12, t: 12, b: 26 };
  const n = Math.max(0, ...series.map((s) => s.data.length));

  if (n === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-400">
        Not enough data yet
      </div>
    );
  }

  const maxVal = Math.max(10, ...series.flatMap((s) => s.data));
  const max = Math.ceil(maxVal / 10) * 10;
  const x = (i) => (n <= 1 ? (P.l + W - P.r) / 2 : P.l + (i * (W - P.l - P.r)) / (n - 1));
  const y = (v) => P.t + (1 - v / max) * (height - P.t - P.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const path = (data) => data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const first = series[0];

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label={`Line chart: ${series.map((s) => s.name).join(", ")}`}
      className="w-full"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={first.color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={first.color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#334155" strokeDasharray="3 4" />
          <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
            {t}
          </text>
        </g>
      ))}

      {first.data.length > 1 && (
        <path
          d={`${path(first.data)} L${x(first.data.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`}
          fill={`url(#${gid})`}
        />
      )}

      {series.map((s) => (
        <g key={s.name}>
          {s.data.length > 1 && (
            <path
              d={path(s.data)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.thin ? 1.5 : 2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.thin ? "4 4" : undefined}
            />
          )}
          {!s.thin && s.data.length <= 40 &&
            s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} />)}
        </g>
      ))}

      {markers.map((i) => (
        <text key={i} x={x(i)} y={y(0) - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="#f87171">
          ×
        </text>
      ))}

      {[0, Math.floor((n - 1) / 2), n - 1]
        .filter((v, i, a) => a.indexOf(v) === i && labels[v] !== undefined)
        .map((i) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="#94a3b8">
            {labels[i]}
          </text>
        ))}
    </svg>
  );
}

/* ---------------------------- virtual keyboard ---------------------------- */

const Key = memo(function Key({ id, label, flex = 1, finger, isNext, pressed, ghost }) {
  if (ghost) return <div style={{ flex }} />;
  const color = finger ? FINGER_COLORS[finger] : "#64748b";
  const isPressed = pressed && pressed.key === id;

  let style;
  if (isNext) {
    style = { flex, background: color, borderColor: color, color: "#0f172a", boxShadow: `0 0 14px ${color}aa` };
  } else {
    style = {
      flex,
      background: finger ? `${color}1f` : "#1e293b",
      borderColor: finger ? `${color}55` : "#334155",
      color: "#cbd5e1",
    };
  }

  return (
    <div
      style={style}
      className={`flex h-8 min-w-0 select-none items-center justify-center rounded-md border text-[11px] font-semibold transition-transform sm:h-9 sm:text-xs xl:h-10 xl:text-sm ${
        isPressed
          ? pressed.ok
            ? "scale-95 ring-2 ring-white"
            : "scale-95 bg-red-500/40 ring-2 ring-red-500"
          : ""
      }`}
    >
      {label}
    </div>
  );
});

const VirtualKeyboard = memo(function VirtualKeyboard({ nextChar, pressed }) {
  const next = charToKey(nextChar);
  const nextInfo = next ? KEY_INFO[next.base] : null;
  const shiftId = next?.shift ? (nextInfo.hand === "left" ? "rshift" : "lshift") : null;

  return (
    <div className="hidden sm:block" aria-hidden="true">
      <div className="flex flex-col gap-1">
        {KB_ROWS.map((row) => (
          <div key={row.keys} className="flex gap-1">
            {row.left && (
              <Key
                id={row.left.id}
                label={row.left.label}
                flex={row.left.flex}
                isNext={shiftId === row.left.id}
                pressed={pressed}
                ghost={row.left.id === "gap"}
              />
            )}
            {[...row.keys].map((k, i) => (
              <Key
                key={k}
                id={k}
                label={k.toUpperCase()}
                finger={row.fingers[i]}
                isNext={next?.base === k}
                pressed={pressed}
              />
            ))}
            {row.right && (
              <Key
                id={row.right.id}
                label={row.right.label}
                flex={row.right.flex}
                isNext={shiftId === row.right.id}
                pressed={pressed}
                ghost={row.right.id === "gap"}
              />
            )}
          </div>
        ))}
        <div className="flex gap-1">
          <div style={{ flex: 4 }} />
          <Key id=" " label="Space" flex={7} finger="thumb" isNext={next?.base === " "} pressed={pressed} />
          <div style={{ flex: 4 }} />
        </div>
      </div>
    </div>
  );
});

/* ------------------------------ typing surface ---------------------------- */

const Word = memo(function Word({ text, start, typed, active }) {
  return (
    <span className="whitespace-pre">
      {[...text].map((ch, j) => {
        const t = typed[j];
        let cls = "text-slate-500";
        if (t !== undefined) cls = t === ch ? "text-slate-100" : "rounded bg-red-500/20 text-red-400";
        const caret = active && j === typed.length;
        return (
          <span
            key={start + j}
            data-i={start + j}
            data-caret={caret ? "" : undefined}
            className={`${cls} ${caret ? "shadow-[inset_2px_0_0_#60a5fa]" : ""}`}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
});

function instructionFor(s) {
  if (s.type === "lesson") {
    return {
      title: `Type the text below: ${s.lesson.title}`,
      body: `${s.lesson.desc} Follow the highlighted key on the keyboard guide and use the finger it shows. Press any key to start.`,
    };
  }
  if (s.type === "drill") {
    return {
      title: "Practice the keys you miss most",
      body: "These words contain your trouble keys. Slow down and aim for accuracy first. Press any key to start.",
    };
  }
  const start = "The timer starts the moment you press your first key.";
  switch (s.mode) {
    case "time":
      return { title: `Type as many words as you can in ${s.duration} seconds`, body: `${start} Use Backspace to fix mistakes.` };
    case "words":
      return { title: `Type all ${s.words} words`, body: `Finish the text as fast and accurately as you can. ${start}` };
    case "quote":
      return { title: "Type the sentences exactly as shown", body: `Include the capital letters and punctuation. ${start}` };
    case "code":
      return { title: "Type the code exactly as shown", body: `Watch the brackets, quotes and symbols. ${start}` };
    default:
      return { title: "Type your own text", body: `Copy it exactly as shown. ${start}` };
  }
}

// Little hands: the finger you should use for the next key lights up.
const HAND_FINGERS = [
  ["lp", 22],
  ["lr", 30],
  ["lm", 36],
  ["li", 30],
  ["thumb", 18],
  ["ri", 30],
  ["rm", 36],
  ["rr", 30],
  ["rp", 22],
];

function FingerGuide({ active, color }) {
  return (
    <div className="flex items-end gap-1.5" aria-hidden="true">
      {HAND_FINGERS.map(([finger, h]) => {
        const on = finger === active;
        return (
          <span
            key={finger}
            className="w-3.5 rounded-full transition-all duration-150"
            style={{
              height: h + (on ? 8 : 0),
              background: on ? color : "#475569",
              boxShadow: on ? `0 0 14px ${color}` : "none",
              opacity: on ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}

// Compact "which key, which finger" card that sits beside the text.
function NextKeyCard({ nextChar }) {
  const key = charToKey(nextChar);
  const info = key ? KEY_INFO[key.base] : null;

  if (!info) {
    return <div className="hidden rounded-2xl border border-slate-700 bg-slate-900/40 lg:block" />;
  }

  const color = FINGER_COLORS[info.finger];
  const shiftSide = key.shift ? (info.hand === "left" ? "right" : "left") : null;

  return (
    <div
      className="flex flex-col justify-center gap-3 rounded-2xl border-2 px-4 py-3"
      style={{ borderColor: `${color}aa`, background: `${color}1f`, boxShadow: `0 0 22px ${color}33` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 min-w-14 items-center justify-center rounded-xl px-2 font-mono text-2xl font-extrabold text-slate-900"
          style={{ background: color, boxShadow: `0 0 16px ${color}99` }}
        >
          {nextChar === " " ? "Space" : nextChar}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">Next key</p>
          <p className="text-base font-bold leading-tight text-white">
            <span style={{ color }}>{FINGER_NAMES[info.finger]}</span>
          </p>
          {shiftSide && (
            <p className="text-sm text-slate-200">
              + hold <b style={{ color }}>{shiftSide} Shift</b>
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-center">
        <FingerGuide active={info.finger} color={color} />
      </div>
    </div>
  );
}

function TypingSession({ session, settings, onSetting, onFinish, onRestart, onExit }) {
  const timed = session.type === "test" && session.mode === "time";
  const duration = session.duration || 0;

  const [words, setWords] = useState(() => buildWords(session));
  const target = useMemo(() => words.join(" "), [words]);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(null);
  const [shake, setShake] = useState(false);
  const [fx, setFx] = useState([]); // flying letters

  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const wrapRef = useRef(null);
  const fxId = useRef(0);
  const typedRef = useRef("");
  const targetRef = useRef(target);
  const statusRef = useRef("idle");
  const startRef = useRef(0);
  const doneRef = useRef(false);
  const statsRef = useRef({ total: 0, mistakes: 0, keys: {}, samples: [] });
  const soundRef = useRef(settings.sound);
  targetRef.current = target;
  soundRef.current = settings.sound;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Time mode: keep feeding words so the text never runs out.
  useEffect(() => {
    if (timed && typed.length > target.length - 200) {
      setWords((w) => [...w, ...makeWords(40, session)]);
    }
  }, [timed, typed.length, target.length, session]);

  const wordMeta = useMemo(() => {
    let start = 0;
    return words.map((w, i) => {
      const text = i < words.length - 1 ? `${w} ` : w;
      const meta = { text, start };
      start += text.length;
      return meta;
    });
  }, [words]);

  const activeIdx = wordMeta.findIndex((m) => typed.length < m.start + m.text.length);

  // Keep the caret on the second line.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const caret = box?.querySelector("[data-caret]");
    if (!caret) return;
    const top = Math.max(0, caret.offsetTop - LINE_HEIGHT);
    if (Math.abs(box.scrollTop - top) > 1) box.scrollTop = top;
  }, [typed]);

  const pushSample = (sec) => {
    const s = statsRef.current;
    const t = typedRef.current;
    const minutes = sec / 60;
    s.samples.push({
      t: sec,
      wpm: countCorrect(t, targetRef.current) / 5 / minutes,
      raw: t.length / 5 / minutes,
      errors: s.mistakes,
      len: t.length,
    });
  };

  const finish = useCallback(
    (finalTyped, endMs) => {
      if (doneRef.current) return;
      doneRef.current = true;
      statusRef.current = "done";
      setStatus("done");
      if (soundRef.current) chime();

      const s = statsRef.current;
      const tgt = targetRef.current;
      const ms = Math.max(1000, endMs);
      const minutes = ms / 60000;
      const correct = countCorrect(finalTyped, tgt);

      // Consistency: how steady the per-second speed was.
      const lens = [0, ...s.samples.map((x) => x.len)];
      const speeds = lens.slice(1).map((l, i) => (l - lens[i]) * 12);
      let consistency = null;
      if (speeds.length >= 4) {
        const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const sd = Math.sqrt(speeds.reduce((a, b) => a + (b - mean) ** 2, 0) / speeds.length);
        consistency = mean > 0 ? clamp(Math.round(100 * (1 - sd / mean)), 0, 100) : 0;
      }

      const lastT = s.samples.length ? s.samples[s.samples.length - 1].t : 0;
      if (ms / 1000 - lastT > 0.4) pushSample(ms / 1000);

      onFinish(
        {
          wpm: Math.round(correct / 5 / minutes),
          raw: Math.round(finalTyped.length / 5 / minutes),
          accuracy: s.total ? Math.round(((s.total - s.mistakes) / s.total) * 100) : 100,
          correct,
          leftover: finalTyped.length - correct,
          mistakes: s.mistakes,
          seconds: Math.round(ms / 1000),
          samples: s.samples,
          consistency,
        },
        s.keys,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onFinish],
  );

  // Ticking clock + per-second samples for the chart.
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      const ms = performance.now() - startRef.current;
      const t = timed ? Math.min(ms, duration * 1000) : ms;
      setElapsed(t);
      const s = statsRef.current;
      const sec = Math.floor(t / 1000);
      while (s.samples.length < sec) pushSample(s.samples.length + 1);
      if (timed && ms >= duration * 1000) finish(typedRef.current, duration * 1000);
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, timed, duration, finish]);

  // A letter flies up from the character you just typed: green if right, red if wrong.
  const spawnFx = (idx, ch, ok) => {
    if (!settings.effects || (ch === " " && ok)) return;
    const el = boxRef.current?.querySelector(`[data-i="${idx}"]`);
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    const r = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const id = ++fxId.current;
    const item = {
      id,
      ch: ch === " " ? "␣" : ch,
      ok,
      left: r.left - w.left + r.width / 2,
      top: r.top - w.top,
      dx: Math.round((Math.random() - 0.5) * 44),
    };
    setFx((list) => [...list.slice(-14), item]);
    setTimeout(() => setFx((list) => list.filter((f) => f.id !== id)), 800);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 180);
  };

  const handleChange = (e) => {
    if (statusRef.current === "done") return;
    const tgt = targetRef.current;
    const prev = typedRef.current;
    let v = e.target.value;
    if (v.length > tgt.length) v = v.slice(0, tgt.length);

    if (v.length > prev.length) {
      if (statusRef.current === "idle") {
        startRef.current = performance.now();
        statusRef.current = "running";
        setStatus("running");
      }
      const s = statsRef.current;
      for (let i = prev.length; i < v.length; i++) {
        const ok = v[i] === tgt[i];
        const key = tgt[i].toLowerCase();
        const ks = s.keys[key] || (s.keys[key] = { t: 0, m: 0 });
        s.total++;
        ks.t++;
        if (!ok) {
          s.mistakes++;
          ks.m++;
        }
        if (settings.sound) beep(ok);
        spawnFx(i, v[i], ok);
        if (!ok && settings.strict) {
          v = v.slice(0, i); // refuse the wrong key
          triggerShake();
          break;
        }
      }
    }

    typedRef.current = v;
    setTyped(v);
    if (!timed && v.length === tgt.length) finish(v, performance.now() - startRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      onRestart();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onExit();
      return;
    }
    const id = pressedId(e);
    if (id) setPressed({ key: id, ok: e.key === targetRef.current[typedRef.current.length] || id.endsWith("shift") });
  };

  const total = statsRef.current.total;
  const correctNow = useMemo(() => countCorrect(typed, target), [typed, target]);
  const liveWpm = status === "idle" ? 0 : Math.round(correctNow / 5 / (Math.max(elapsed, 1500) / 60000));
  const liveAcc = total ? Math.round(((total - statsRef.current.mistakes) / total) * 100) : 100;
  const progress = timed ? elapsed / (duration * 1000) : typed.length / target.length;
  const timeLabel = timed ? Math.max(0, Math.ceil((duration * 1000 - elapsed) / 1000)) : formatTime(elapsed);
  const { title } = instructionFor(session);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <style>{`
        @keyframes tf-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes tf-fly-ok{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),-54px) scale(1.7)}}
        @keyframes tf-fly-bad{0%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}25%{transform:translate(-5px,-12px) rotate(-14deg) scale(1.4)}100%{opacity:0;transform:translate(var(--dx),46px) rotate(28deg) scale(1.2)}}
        @media (prefers-reduced-motion: reduce){.tf-fx{display:none}}
      `}</style>

      <div className="rounded-3xl bg-slate-800 p-4 shadow-2xl sm:p-5">
        {/* Top bar: exit, title, live stats, sound, restart */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onExit}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-600 hover:text-white ${focusRing}`}
          >
            <X size={16} />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <h2 className="min-w-0 flex-1 truncate text-base font-bold sm:text-lg">{sessionTitle(session)}</h2>

          <div className="flex items-center gap-2" aria-live="off">
            {[
              ["WPM", liveWpm, "text-blue-400"],
              ["Acc", `${liveAcc}%`, liveAcc >= 95 ? "text-green-400" : liveAcc >= 85 ? "text-yellow-300" : "text-red-400"],
              [timed ? "Left" : "Time", timeLabel, "text-cyan-300"],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="flex items-baseline gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5"
              >
                <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
              </div>
            ))}
          </div>

          <SoundButton on={settings.sound} onToggle={(v) => onSetting({ sound: v })} />

          <button
            type="button"
            onClick={onRestart}
            aria-label="Restart with new text"
            className={`flex cursor-pointer items-center gap-2 rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-600 hover:text-white ${focusRing}`}
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>

        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-slate-700"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clamp(progress, 0, 1) * 100)}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-[width] duration-200"
            style={{ width: `${clamp(progress, 0, 1) * 100}%` }}
          />
        </div>

        {/* One-line instruction */}
        <p className="mt-3 text-sm text-slate-300 sm:text-base">
          <Keyboard size={16} className="mr-2 inline text-blue-300" />
          <b className="text-white">{title}</b>
          <span className="text-slate-400">
            {status === "idle" ? " · press any key to start" : " · fix mistakes with Backspace"}
          </span>
        </p>

        {/* Text area + next key card side by side */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_270px]">
          <div
            ref={wrapRef}
            className="relative rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4"
            style={shake ? { animation: "tf-shake .18s" } : undefined}
          >
            <div
              ref={boxRef}
              className="relative flex flex-wrap overflow-hidden scroll-smooth font-mono text-xl sm:text-2xl"
              style={{ height: LINE_HEIGHT * 3, lineHeight: `${LINE_HEIGHT}px` }}
            >
              {wordMeta.map((m, i) => (
                <Word
                  key={i}
                  text={m.text}
                  start={m.start}
                  typed={typed.slice(m.start, m.start + m.text.length)}
                  active={i === activeIdx}
                />
              ))}
            </div>

            {!focused && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-900/70 backdrop-blur-sm">
                <span className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200">
                  Click here or press any key to focus
                </span>
              </div>
            )}

            <textarea
              ref={inputRef}
              value={typed}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onKeyUp={() => setPressed(null)}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              aria-label="Type the text shown above"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              className="absolute inset-0 z-20 h-full w-full cursor-text resize-none opacity-0"
            />

            {/* Flying letters */}
            <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
              {fx.map((f) => (
                <span
                  key={f.id}
                  className="tf-fx absolute -translate-x-1/2 font-mono text-2xl font-bold sm:text-3xl"
                  style={{ left: f.left, top: f.top }}
                >
                  <span
                    className="block"
                    style={{
                      "--dx": `${f.dx}px`,
                      color: f.ok ? "#4ade80" : "#f87171",
                      textShadow: f.ok ? "0 0 12px rgba(74,222,128,.7)" : "0 0 12px rgba(248,113,113,.7)",
                      animation: `${f.ok ? "tf-fly-ok" : "tf-fly-bad"} .75s ease-out forwards`,
                    }}
                  >
                    {f.ch}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <NextKeyCard nextChar={target[typed.length]} />
        </div>

        {settings.keyboard && (
          <div className="mt-3">
            <VirtualKeyboard nextChar={target[typed.length]} pressed={pressed} />
          </div>
        )}

        {/* Options + shortcuts on one row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Toggle checked={settings.keyboard} onChange={(v) => onSetting({ keyboard: v })} label="Keyboard guide" icon={Keyboard} />
            <Toggle checked={settings.strict} onChange={(v) => onSetting({ strict: v })} label="Stop on mistakes" icon={Target} />
            <Toggle checked={settings.effects} onChange={(v) => onSetting({ effects: v })} label="Animations" icon={Zap} />
          </div>
          <p className="text-xs text-slate-400">
            <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-100">Tab</kbd> new text ·{" "}
            <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-100">Esc</kbd> exit
          </p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- results -------------------------------- */

function ResultView({ session, result, onRestart, onExit, onNextLesson, onDrill }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onRestart();
      } else if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRestart, onExit]);

  const { samples } = result;
  const labels = samples.map((s) => `${Math.round(s.t)}s`);
  const markers = samples.reduce((acc, s, i) => {
    if (s.errors > (i ? samples[i - 1].errors : 0)) acc.push(i);
    return acc;
  }, []);
  const lesson = session.type === "lesson" ? session.lesson : null;

  return (
    <div className="mx-auto w-full max-w-6xl rounded-3xl bg-slate-800 p-4 shadow-2xl sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6">
        {/* Left: score */}
        <div className="text-center">
          <p className="text-sm font-medium text-slate-400">{sessionTitle(session)}</p>

          {lesson && (
            <div className="mt-2 flex flex-col items-center gap-1.5">
              <Stars count={result.stars} />
              <p className={`text-sm font-medium ${result.passed ? "text-green-400" : "text-yellow-300"}`}>
                {result.passed ? "Lesson passed!" : `Goal: ${lesson.goal} WPM with 92% accuracy. Try again!`}
              </p>
            </div>
          )}

          {result.isBest && (
            <p className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-200">
              <Trophy size={14} /> New personal best!
            </p>
          )}

          <div className="mt-4 flex items-end justify-center gap-8">
            <div>
              <div className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-5xl font-extrabold text-transparent sm:text-6xl">
                {result.wpm}
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-400">WPM</div>
            </div>
            <div>
              <div
                className={`text-5xl font-extrabold sm:text-6xl ${
                  result.accuracy >= 95 ? "text-green-400" : result.accuracy >= 85 ? "text-yellow-300" : "text-red-400"
                }`}
              >
                {result.accuracy}%
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Accuracy</div>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            Level: <span className="font-semibold text-slate-200">{levelFor(result.wpm)}</span>
            {result.prevBest > 0 && !result.isBest && <> · Best: {result.prevBest} WPM</>}
          </p>

          <div className="mt-4 grid grid-cols-4 gap-2 lg:grid-cols-2">
            {[
              ["Raw", `${result.raw} WPM`],
              ["Mistakes", result.mistakes],
              ["Time", `${result.seconds}s`],
              ["Steady", result.consistency === null ? "–" : `${result.consistency}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-700 bg-slate-900/70 px-2 py-2.5">
                <div className="text-lg font-bold text-white">{value}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: chart + weak keys */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="font-medium uppercase tracking-wide">Speed over time</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <i className="h-0.5 w-4 bg-blue-400" /> WPM
                </span>
                <span className="flex items-center gap-1">
                  <i className="h-0.5 w-4 border-t border-dashed border-slate-400" /> Raw
                </span>
                <span className="flex items-center gap-1 text-red-400">× Mistake</span>
              </span>
            </div>
            <LineChart
              height={150}
              labels={labels}
              markers={markers}
              series={[
                { name: "WPM", color: "#60a5fa", data: samples.map((s) => Math.round(s.wpm)) },
                { name: "Raw", color: "#94a3b8", thin: true, data: samples.map((s) => Math.round(s.raw)) },
              ]}
            />
          </div>

          {result.weak.length > 0 && (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Keys to practice</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.weak.map(([k, v]) => (
                  <span key={k} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-sm text-red-200">
                    <b className="font-mono">{keyLabel(k)}</b> · {v.m} missed
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {lesson && result.passed && onNextLesson && (
          <button
            type="button"
            onClick={onNextLesson}
            className={`flex cursor-pointer items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold transition hover:bg-green-700 ${focusRing}`}
          >
            Next lesson <ArrowRight size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className={`flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold transition hover:bg-blue-700 ${focusRing}`}
        >
          <RotateCcw size={18} /> Try again
        </button>
        {result.weak.some(([k]) => /[a-z]/.test(k)) && (
          <button
            type="button"
            onClick={onDrill}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border border-slate-600 bg-slate-700 px-5 py-2.5 font-semibold transition hover:bg-slate-600 ${focusRing}`}
          >
            <Target size={18} /> Drill weak keys
          </button>
        )}
        <button
          type="button"
          onClick={onExit}
          className={`cursor-pointer rounded-xl border border-slate-600 px-5 py-2.5 font-semibold text-slate-300 transition hover:bg-slate-700 ${focusRing}`}
        >
          Back to menu
        </button>
        <span className="text-xs text-slate-400">
          <kbd className="rounded bg-slate-700 px-1.5 py-0.5 text-slate-200">Enter</kbd> retry ·{" "}
          <kbd className="rounded bg-slate-700 px-1.5 py-0.5 text-slate-200">Esc</kbd> menu
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------- tabs ---------------------------------- */

const STEPS = [
  ["Pick one", "Choose a lesson to learn, or a test to measure your speed."],
  ["Type what you see", "Green letters are correct, red ones are mistakes. Use Backspace to fix them."],
  ["Check your score", "See your WPM (words per minute) and accuracy, then try to beat them."],
];

function HowItWorks() {
  return (
    <ol className="mb-8 grid gap-3 sm:grid-cols-3">
      {STEPS.map(([title, text], i) => (
        <li key={title} className="flex gap-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold">
            {i + 1}
          </span>
          <div>
            <p className="text-lg font-semibold text-white">{title}</p>
            <p className="mt-1 text-base leading-relaxed text-slate-300">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function LearnTab({ store, onStart }) {
  const done = LESSONS.filter((l) => store.lessons[l.id]?.stars > 0).length;
  const nextIdx = LESSONS.findIndex((l) => !store.lessons[l.id]?.stars);
  const next = nextIdx === -1 ? LESSONS[0] : LESSONS[nextIdx];

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="font-semibold text-white">
            {done === 0 ? "New here? Start with the home row." : `${done} of ${LESSONS.length} lessons completed`}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
              style={{ width: `${(done / LESSONS.length) * 100}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onStart({ type: "lesson", lesson: next })}
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 ${focusRing}`}
        >
          {done === 0 ? "Start learning" : done === LESSONS.length ? "Practice again" : "Continue"}
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {LESSONS.map((lesson, i) => {
          const p = store.lessons[lesson.id];
          const passed = p?.stars > 0;
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => onStart({ type: "lesson", lesson })}
              className={`group flex cursor-pointer gap-4 rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-500/60 hover:bg-slate-800 ${focusRing} ${
                passed ? "border-green-500/30 bg-slate-900/70" : "border-slate-700 bg-slate-900/70"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                  passed ? "bg-green-500/20 text-green-300" : "bg-blue-600/20 text-blue-300"
                }`}
              >
                {passed ? <Check size={20} /> : i + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white">{lesson.title}</h3>
                  <Stars count={p?.stars || 0} />
                </div>
                <p className="mt-1 text-base text-slate-300">{lesson.desc}</p>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                  <span>
                    Goal: {lesson.goal} WPM · 92% accuracy
                  </span>
                  {p ? (
                    <span className="text-blue-300">Best {p.bestWpm} WPM</span>
                  ) : (
                    <ChevronRight size={16} className="transition group-hover:translate-x-1" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MODES = [
  { id: "time", label: "Time", icon: Timer },
  { id: "words", label: "Words", icon: Type },
  { id: "quote", label: "Quote", icon: Quote },
  { id: "code", label: "Code", icon: Code },
  { id: "custom", label: "Custom", icon: ClipboardPaste },
];

function TestTab({ store, onChange, onStart }) {
  const cfg = store.test;
  const customReady = normalizeText(cfg.custom).length >= 10;
  const startCfg = { type: "test", ...cfg };
  const best = store.bests[bestKeyFor(startCfg)];
  const canStart = cfg.mode !== "custom" || customReady;

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Test mode">
        {MODES.map(({ id, label, icon: Icon }) => (
          <Pill key={id} active={cfg.mode === id} onClick={() => onChange({ mode: id })}>
            <span className="flex items-center gap-2">
              <Icon size={16} />
              {label}
            </span>
          </Pill>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:p-6">
        {cfg.mode === "time" && (
          <div>
            <p className="mb-3 text-sm font-medium text-slate-300">Duration</p>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 60, 120].map((d) => (
                <Pill key={d} active={cfg.duration === d} onClick={() => onChange({ duration: d })}>
                  {d}s
                </Pill>
              ))}
            </div>
          </div>
        )}

        {cfg.mode === "words" && (
          <div>
            <p className="mb-3 text-sm font-medium text-slate-300">Number of words</p>
            <div className="flex flex-wrap gap-2">
              {[10, 25, 50, 100].map((w) => (
                <Pill key={w} active={cfg.words === w} onClick={() => onChange({ words: w })}>
                  {w}
                </Pill>
              ))}
            </div>
          </div>
        )}

        {cfg.mode === "quote" && (
          <p className="text-sm text-slate-300">Type two short sentences with capital letters and punctuation.</p>
        )}

        {cfg.mode === "code" && (
          <p className="text-sm text-slate-300">
            Type JavaScript and Node snippets: brackets, quotes, arrows and operators.
          </p>
        )}

        {cfg.mode === "custom" && (
          <div>
            <label htmlFor="custom-text" className="mb-2 block text-sm font-medium text-slate-300">
              Paste anything you want to practice
            </label>
            <textarea
              id="custom-text"
              value={cfg.custom}
              onChange={(e) => onChange({ custom: e.target.value })}
              rows={5}
              maxLength={2000}
              placeholder="Paste a paragraph, an article, or code you want to type…"
              className="w-full resize-y rounded-xl border border-slate-600 bg-slate-700 p-4 text-white outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              {customReady ? `${normalizeText(cfg.custom).length}/2000 characters` : "Enter at least 10 characters."}
            </p>
          </div>
        )}

        {(cfg.mode === "time" || cfg.mode === "words") && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-700 pt-5">
            <Toggle
              checked={cfg.punctuation}
              onChange={(v) => onChange({ punctuation: v })}
              label="Punctuation & capitals"
            />
            <Toggle checked={cfg.numbers} onChange={(v) => onChange({ numbers: v })} label="Numbers" />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={!canStart}
          onClick={() => onStart(startCfg)}
          className={`flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-10 py-4 text-lg font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
        >
          <Zap size={20} /> Start test
        </button>
        {best ? (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Trophy size={14} className="text-yellow-400" /> Personal best for this setup:{" "}
            <b className="text-slate-200">{best} WPM</b>
          </p>
        ) : (
          <p className="text-sm text-slate-400">The clock starts when you press your first key.</p>
        )}
      </div>
    </div>
  );
}

function StatsTab({ store, onReset, onDrill }) {
  const { history } = store;
  const weak = useMemo(() => getWeakKeys(store.keys), [store.keys]);
  const streak = useMemo(() => calcStreak(history), [history]);

  if (!history.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
        <BarChart3 size={36} className="mx-auto text-slate-500" />
        <p className="mt-4 font-semibold text-white">No results yet</p>
        <p className="mt-1 text-sm text-slate-400">Finish a lesson or a test and your progress will show up here.</p>
      </div>
    );
  }

  const recent = history.slice(-10);
  const avg = (arr, k) => Math.round(arr.reduce((a, b) => a + b[k], 0) / arr.length);
  const best = Math.max(...history.map((h) => h.wpm));
  const last30 = history.slice(-30);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Trophy} accent="text-yellow-400" label="Best speed" value={`${best}`} sub="WPM" />
        <StatCard icon={Zap} label="Average" value={`${avg(recent, "wpm")}`} sub="WPM, last 10" />
        <StatCard
          icon={Target}
          accent="text-green-400"
          label="Accuracy"
          value={`${avg(recent, "acc")}%`}
          sub="last 10"
        />
        <StatCard
          icon={Flame}
          accent="text-orange-400"
          label="Streak"
          value={`${streak}`}
          sub={streak === 1 ? "day" : "days"}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium uppercase tracking-wide">Last {last30.length} results</span>
          <span>{history.length} total</span>
        </div>
        <LineChart
          labels={last30.map((_, i) => `#${history.length - last30.length + i + 1}`)}
          series={[
            { name: "WPM", color: "#60a5fa", data: last30.map((h) => h.wpm) },
            { name: "Accuracy", color: "#4ade80", thin: true, data: last30.map((h) => h.acc) },
          ]}
        />
        <p className="mt-1 text-center text-xs text-slate-400">Blue is speed (WPM). Dashed green is accuracy (%).</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Weakest keys</h3>
            {weak.some((w) => /[a-z]/.test(w.k)) && (
              <button
                type="button"
                onClick={() => onDrill(weak.map((w) => w.k))}
                className={`cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold transition hover:bg-blue-700 ${focusRing}`}
              >
                Practice them
              </button>
            )}
          </div>
          {weak.length ? (
            <ul className="mt-4 space-y-3">
              {weak.map((w) => (
                <li key={w.k} className="flex items-center gap-3">
                  <span className="w-14 rounded-lg bg-slate-800 py-1 text-center font-mono text-sm font-bold text-white">
                    {keyLabel(w.k)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full ${w.acc >= 90 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${w.acc}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-slate-300">{w.acc}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Nothing stands out yet. Keep typing and your trouble keys will appear here.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h3 className="font-semibold text-white">Recent results</h3>
          <ul className="mt-4 divide-y divide-slate-800">
            {[...history]
              .reverse()
              .slice(0, 6)
              .map((h) => (
                <li key={h.d} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="min-w-0 truncate text-slate-300">{h.label}</span>
                  <span className="shrink-0 pl-3 text-slate-400">
                    <b className="text-blue-300">{h.wpm}</b> WPM · {h.acc}%
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete all your typing history and lesson progress? This can't be undone.")) onReset();
          }}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:text-red-300 ${focusRing}`}
        >
          <Trash2 size={14} /> Reset all progress
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

const TABS = [
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "test", label: "Test", icon: Timer },
  { id: "stats", label: "Stats", icon: BarChart3 },
];

export default function TypingTutor() {
  const [store, setStore] = usePersistentStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const [tab, setTab] = useState("learn");
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);

  const newRun = () => Date.now() + Math.random();

  const startSession = useCallback((cfg) => {
    setResult(null);
    setSession({ ...cfg, runId: newRun() });
  }, []);

  const restart = useCallback(() => {
    setResult(null);
    setSession((s) => s && { ...s, runId: newRun() });
  }, []);

  const exit = useCallback(() => {
    setResult(null);
    setSession(null);
  }, []);

  const updateSettings = useCallback(
    (patch) => setStore((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    [setStore],
  );
  const updateTest = useCallback(
    (patch) => setStore((p) => ({ ...p, test: { ...p.test, ...patch } })),
    [setStore],
  );

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const handleFinish = useCallback(
    (raw, keyStats) => {
      const s = sessionRef.current;
      const prev = storeRef.current;
      const bestKey = bestKeyFor(s);
      const prevBest = bestKey ? prev.bests[bestKey] || 0 : 0;

      let stars = 0;
      let passed = false;
      if (s.type === "lesson") {
        passed = raw.accuracy >= 92 && raw.wpm >= s.lesson.goal;
        if (passed) stars = raw.accuracy >= 98 && raw.wpm >= s.lesson.goal * 1.25 ? 3 : raw.accuracy >= 95 ? 2 : 1;
      }

      const weak = Object.entries(keyStats)
        .filter(([, v]) => v.m > 0)
        .sort((a, b) => b[1].m - a[1].m)
        .slice(0, 5);

      setResult({
        ...raw,
        stars,
        passed,
        weak,
        prevBest,
        isBest: prevBest > 0 && raw.wpm > prevBest,
      });

      setStore((p) => {
        const keys = { ...p.keys };
        for (const [k, v] of Object.entries(keyStats)) {
          const cur = keys[k] || { t: 0, m: 0 };
          keys[k] = { t: cur.t + v.t, m: cur.m + v.m };
        }
        const lessons = { ...p.lessons };
        if (s.type === "lesson") {
          const old = lessons[s.lesson.id] || { stars: 0, bestWpm: 0 };
          lessons[s.lesson.id] = {
            stars: Math.max(old.stars, stars),
            bestWpm: Math.max(old.bestWpm, raw.wpm),
          };
        }
        const bests = { ...p.bests };
        if (bestKey) bests[bestKey] = Math.max(bests[bestKey] || 0, raw.wpm);
        return {
          ...p,
          keys,
          lessons,
          bests,
          history: [
            ...p.history,
            { d: Date.now(), wpm: raw.wpm, acc: raw.accuracy, label: sessionTitle(s) },
          ].slice(-200),
        };
      });
    },
    [setStore],
  );

  const lessonIdx = session?.type === "lesson" ? LESSONS.findIndex((l) => l.id === session.lesson.id) : -1;
  const nextLesson = lessonIdx >= 0 && lessonIdx < LESSONS.length - 1 ? LESSONS[lessonIdx + 1] : null;

  const startDrill = useCallback((keys) => startSession({ type: "drill", keys }), [startSession]);

  let content;
  if (session && result) {
    content = (
      <ResultView
        session={session}
        result={result}
        onRestart={restart}
        onExit={exit}
        onNextLesson={nextLesson ? () => startSession({ type: "lesson", lesson: nextLesson }) : null}
        onDrill={() => startDrill(result.weak.map(([k]) => k))}
      />
    );
  } else if (session) {
    content = (
      <TypingSession
        key={session.runId}
        session={session}
        settings={store.settings}
        onSetting={updateSettings}
        onFinish={handleFinish}
        onRestart={restart}
        onExit={exit}
      />
    );
  } else {
    content = (
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <Keyboard size={16} />
            Free Typing Tutor
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
            Type{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Faster</span>
            , Learn Smarter
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Learn touch typing with guided lessons, test your speed, and track your progress. No signup, and your
            progress is saved in this browser.
          </p>
        </header>

        <div className="mt-10 rounded-3xl bg-slate-800 p-5 shadow-2xl sm:p-8">
          <div
            role="tablist"
            aria-label="Typing tutor sections"
            className="mx-auto mb-8 grid max-w-md grid-cols-3 gap-1 rounded-2xl border border-slate-700 bg-slate-900 p-1"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${focusRing} ${
                  tab === id ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {tab !== "stats" && <HowItWorks />}

          <div role="tabpanel">
            {tab === "learn" && <LearnTab store={store} onStart={startSession} />}
            {tab === "test" && <TestTab store={store} onChange={updateTest} onStart={startSession} />}
            {tab === "stats" && (
              <StatsTab
                store={store}
                onDrill={startDrill}
                onReset={() => setStore((p) => ({ ...DEFAULT_STORE, settings: p.settings, test: p.test }))}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

   return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
        <Navbar />
      </header>

      <main className={`flex-1 px-4 ${session ? "py-3 sm:py-4" : "py-12 sm:py-16"}`}>{content}</main>

      <Footer />
    </div>
  );
}