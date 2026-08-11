export type CyberFaceModel =
  | "neutral"
  | "smile"
  | "grin"
  | "laugh"
  | "wink"
  | "kiss"
  | "love"
  | "smug"
  | "cool"
  | "confused"
  | "skeptical"
  | "thinking"
  | "surprised"
  | "shocked"
  | "scared"
  | "sad"
  | "cry"
  | "sob"
  | "tired"
  | "sleepy"
  | "sick"
  | "angry";

export type CyberAccentModel =
  | "none"
  | "scan"
  | "visor"
  | "glasses"
  | "mask"
  | "helmet"
  | "blush"
  | "halo"
  | "flower"
  | "wave"
  | "spark"
  | "teeth"
  | "party"
  | "gift"
  | "stars"
  | "music"
  | "tears"
  | "roll"
  | "confetti"
  | "burst"
  | "mic"
  | "heart"
  | "finger-gun"
  | "charm"
  | "double-heart"
  | "hug"
  | "orbit"
  | "shades"
  | "cap"
  | "crown"
  | "spy"
  | "neon-shades"
  | "headset"
  | "police"
  | "question"
  | "glitch"
  | "sweat"
  | "alert"
  | "dash"
  | "hand"
  | "bulb"
  | "terminal"
  | "map"
  | "target"
  | "lightning"
  | "alarm"
  | "skull"
  | "rain"
  | "ghost"
  | "shadow"
  | "battery"
  | "cloud"
  | "broken-heart"
  | "wilt"
  | "tissue"
  | "ice"
  | "low-signal"
  | "flood"
  | "storm"
  | "empty"
  | "sleep"
  | "zzz"
  | "coffee"
  | "moon"
  | "pillow"
  | "nightcap"
  | "dim"
  | "thermometer"
  | "nauseous"
  | "bandage"
  | "medicine"
  | "flame"
  | "warning"
  | "steam"
  | "horns"
  | "overheat";

export type CyberMotionModel =
  | "idle"
  | "pulse"
  | "bounce"
  | "glitch"
  | "drift"
  | "shake"
  | "alert"
  | "drip"
  | "orbit"
  | "scan";

export type CyberCategory = "core" | "joy" | "love" | "style" | "alert" | "low";

export type CyberEmoticonDefinition = {
  id: string;
  label: string;
  token: string;
  category: CyberCategory;
  face: CyberFaceModel;
  accent: CyberAccentModel;
  motion: CyberMotionModel;
  primary: string;
  secondary: string;
  status: string;
};

type Family = {
  baseId: string;
  label: string;
  category: CyberCategory;
  face: CyberFaceModel;
  motion: CyberMotionModel;
  palette: keyof typeof PALETTES;
  accents: readonly CyberAccentModel[];
};

const PALETTES = {
  cyan: ["#25F6FF", "#4B7BFF"],
  magenta: ["#FF2BD6", "#25F6FF"],
  violet: ["#A855F7", "#25F6FF"],
  amber: ["#FFB000", "#25F6FF"],
  danger: ["#FF3B30", "#FFB000"],
  blue: ["#4B7BFF", "#25F6FF"],
} as const;

const ACCENT_LABELS: Record<CyberAccentModel, string> = {
  none: "",
  scan: "Scan",
  visor: "Visor",
  glasses: "Optics",
  mask: "Mask",
  helmet: "Helmet",
  blush: "Blush",
  halo: "Halo",
  flower: "Bloom",
  wave: "Wave",
  spark: "Spark",
  teeth: "Teeth",
  party: "Party",
  gift: "Gift",
  stars: "Stars",
  music: "Music",
  tears: "Tears",
  roll: "Roll",
  confetti: "Confetti",
  burst: "Burst",
  mic: "Mic",
  heart: "Heart",
  "finger-gun": "Finger Ray",
  charm: "Charm",
  "double-heart": "Twin Hearts",
  hug: "Hug",
  orbit: "Orbit",
  shades: "Shades",
  cap: "Cap",
  crown: "Crown",
  spy: "Stealth",
  "neon-shades": "Neon Shades",
  headset: "Headset",
  police: "Patrol",
  question: "Query",
  glitch: "Glitch",
  sweat: "Sweat",
  alert: "Alert",
  dash: "Side Eye",
  hand: "Gesture",
  bulb: "Idea",
  terminal: "Terminal",
  map: "Map",
  target: "Target",
  lightning: "Lightning",
  alarm: "Alarm",
  skull: "Critical",
  rain: "Rain",
  ghost: "Ghost",
  shadow: "Shadow",
  battery: "Battery",
  cloud: "Cloud",
  "broken-heart": "Heartbreak",
  wilt: "Wilt",
  tissue: "Tissue",
  ice: "Freeze",
  "low-signal": "Low Signal",
  flood: "Flood",
  storm: "Storm",
  empty: "Empty",
  sleep: "Sleep",
  zzz: "Z-Z-Z",
  coffee: "Coffee",
  moon: "Moon",
  pillow: "Pillow",
  nightcap: "Nightcap",
  dim: "Dim",
  thermometer: "Fever",
  nauseous: "Nauseous",
  bandage: "Bandage",
  medicine: "Medicine",
  flame: "Flame",
  warning: "Warning",
  steam: "Steam",
  horns: "Horns",
  overheat: "Overheat",
};

const MOTION_STATUS: Record<CyberMotionModel, string> = {
  idle: "0.5 Hz float",
  pulse: "3 Hz pulse",
  bounce: "2 Hz bounce",
  glitch: "4 Hz glitch",
  drift: "0.5 Hz drift",
  shake: "3 Hz shake",
  alert: "2 Hz lock-on",
  drip: "0.5 Hz fall",
  orbit: "2 Hz orbit",
  scan: "2 Hz scan",
};

const MOTION_BY_ACCENT: Partial<Record<CyberAccentModel, CyberMotionModel>> = {
  scan: "scan",
  visor: "scan",
  glasses: "scan",
  shades: "scan",
  "neon-shades": "scan",
  terminal: "scan",
  map: "scan",
  spark: "pulse",
  stars: "pulse",
  party: "bounce",
  gift: "bounce",
  confetti: "bounce",
  burst: "pulse",
  heart: "pulse",
  "double-heart": "pulse",
  charm: "pulse",
  tears: "drip",
  rain: "drip",
  flood: "drip",
  storm: "drip",
  tissue: "drip",
  orbit: "orbit",
  halo: "orbit",
  target: "alert",
  alert: "alert",
  alarm: "alert",
  warning: "alert",
  lightning: "alert",
  question: "drift",
  glitch: "glitch",
  shadow: "glitch",
  ghost: "drift",
  sweat: "drip",
  flame: "glitch",
  steam: "glitch",
  horns: "glitch",
  overheat: "glitch",
  thermometer: "shake",
  nauseous: "shake",
  medicine: "shake",
  ice: "shake",
  zzz: "drift",
  sleep: "drift",
  moon: "orbit",
};

const FAMILIES: readonly Family[] = [
  {
    baseId: "idle",
    label: "Online",
    category: "core",
    face: "neutral",
    motion: "idle",
    palette: "cyan",
    accents: ["none", "scan", "visor", "glasses", "mask", "helmet"],
  },
  {
    baseId: "happy",
    label: "Happy",
    category: "joy",
    face: "smile",
    motion: "pulse",
    palette: "magenta",
    accents: ["none", "blush", "halo", "flower", "wave", "spark"],
  },
  {
    baseId: "grin",
    label: "Grinning",
    category: "joy",
    face: "grin",
    motion: "pulse",
    palette: "magenta",
    accents: ["none", "teeth", "party", "gift", "stars", "music"],
  },
  {
    baseId: "laugh",
    label: "Laughing",
    category: "joy",
    face: "laugh",
    motion: "bounce",
    palette: "magenta",
    accents: ["none", "tears", "roll", "confetti", "burst", "mic"],
  },
  {
    baseId: "wink",
    label: "Winking",
    category: "joy",
    face: "wink",
    motion: "scan",
    palette: "cyan",
    accents: ["none", "heart", "finger-gun", "glasses", "stars", "charm"],
  },
  {
    baseId: "kiss",
    label: "Kissing",
    category: "love",
    face: "kiss",
    motion: "pulse",
    palette: "magenta",
    accents: ["none", "heart", "double-heart", "flower", "spark", "wave"],
  },
  {
    baseId: "love",
    label: "In Love",
    category: "love",
    face: "love",
    motion: "orbit",
    palette: "magenta",
    accents: ["none", "double-heart", "stars", "flower", "hug", "orbit"],
  },
  {
    baseId: "smug",
    label: "Smug",
    category: "style",
    face: "smug",
    motion: "drift",
    palette: "violet",
    accents: ["none", "shades", "cap", "crown", "spy", "visor"],
  },
  {
    baseId: "cool",
    label: "Cool",
    category: "style",
    face: "cool",
    motion: "scan",
    palette: "violet",
    accents: ["shades", "neon-shades", "cap", "headset", "visor", "police"],
  },
  {
    baseId: "confused",
    label: "Confused",
    category: "core",
    face: "confused",
    motion: "drift",
    palette: "amber",
    accents: ["none", "question", "scan", "glitch", "sweat", "alert"],
  },
  {
    baseId: "skeptical",
    label: "Skeptical",
    category: "core",
    face: "skeptical",
    motion: "scan",
    palette: "amber",
    accents: ["none", "dash", "glasses", "question", "scan", "glitch"],
  },
  {
    baseId: "thinking",
    label: "Thinking",
    category: "core",
    face: "thinking",
    motion: "orbit",
    palette: "cyan",
    accents: ["none", "question", "hand", "bulb", "terminal", "map"],
  },
  {
    baseId: "surprised",
    label: "Surprised",
    category: "alert",
    face: "surprised",
    motion: "alert",
    palette: "amber",
    accents: ["none", "target", "alert", "burst", "sweat", "gift"],
  },
  {
    baseId: "shocked",
    label: "Shocked",
    category: "alert",
    face: "shocked",
    motion: "alert",
    palette: "danger",
    accents: ["none", "alert", "lightning", "tears", "glitch", "alarm"],
  },
  {
    baseId: "scared",
    label: "Scared",
    category: "alert",
    face: "scared",
    motion: "shake",
    palette: "blue",
    accents: ["none", "sweat", "tears", "rain", "ghost", "shadow"],
  },
  {
    baseId: "sad",
    label: "Sad",
    category: "low",
    face: "sad",
    motion: "drift",
    palette: "blue",
    accents: ["none", "rain", "battery", "tears", "cloud", "broken-heart"],
  },
  {
    baseId: "cry",
    label: "Crying",
    category: "low",
    face: "cry",
    motion: "drip",
    palette: "blue",
    accents: ["none", "tears", "rain", "broken-heart", "tissue", "ice"],
  },
  {
    baseId: "sob",
    label: "Sobbing",
    category: "low",
    face: "sob",
    motion: "drip",
    palette: "blue",
    accents: ["none", "flood", "storm", "broken-heart", "alarm", "empty"],
  },
  {
    baseId: "tired",
    label: "Tired",
    category: "low",
    face: "tired",
    motion: "drift",
    palette: "blue",
    accents: ["none", "sleep", "zzz", "battery", "coffee", "moon"],
  },
  {
    baseId: "sleepy",
    label: "Sleepy",
    category: "low",
    face: "sleepy",
    motion: "drift",
    palette: "violet",
    accents: ["none", "zzz", "moon", "pillow", "nightcap", "cloud"],
  },
  {
    baseId: "sick",
    label: "Unwell",
    category: "low",
    face: "sick",
    motion: "shake",
    palette: "blue",
    accents: ["mask", "thermometer", "ice", "nauseous", "bandage", "medicine"],
  },
  {
    baseId: "angry",
    label: "Angry",
    category: "alert",
    face: "angry",
    motion: "glitch",
    palette: "danger",
    accents: ["none", "flame", "warning", "steam", "horns", "overheat"],
  },
] as const;

export const CYBER_EMOTICONS: readonly CyberEmoticonDefinition[] =
  FAMILIES.flatMap(family => {
    const [primary, secondary] = PALETTES[family.palette];
    return family.accents.map((accent, accentIndex) => {
      const motion = MOTION_BY_ACCENT[accent] ?? family.motion;
      const id =
        accentIndex === 0 ? family.baseId : `${family.baseId}-${accent}`;
      const accentLabel = ACCENT_LABELS[accent];
      return {
        id,
        label: accentLabel ? `${family.label} · ${accentLabel}` : family.label,
        token: `:cyber-${id}:`,
        category: family.category,
        face: family.face,
        accent,
        motion,
        primary,
        secondary,
        status: MOTION_STATUS[motion],
      };
    });
  });

export const CYBER_CATEGORIES: ReadonlyArray<{
  id: "all" | CyberCategory;
  label: string;
}> = [
  { id: "all", label: "All signals" },
  { id: "core", label: "Core" },
  { id: "joy", label: "Joy" },
  { id: "love", label: "Love" },
  { id: "style", label: "Style" },
  { id: "alert", label: "Alert" },
  { id: "low", label: "Low power" },
];

const CYBER_BY_TOKEN = new Map(CYBER_EMOTICONS.map(item => [item.token, item]));
const CYBER_BY_ID = new Map(CYBER_EMOTICONS.map(item => [item.id, item]));

export function cyberDefinitionFromToken(token: string) {
  return CYBER_BY_TOKEN.get(token);
}

export function cyberDefinitionFromId(id: string) {
  return CYBER_BY_ID.get(id);
}

export const CYBER_EMOTICON_TOKEN_PATTERN = /(:cyber-[a-z0-9-]+:)/g;
