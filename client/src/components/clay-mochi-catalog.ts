export type ClayMochiCategory = "core" | "joy" | "love" | "style" | "alert" | "low" | "nature" | "friends" | "treats";

export type ClayPose =
  | "rest"
  | "open"
  | "raised"
  | "wave"
  | "clap"
  | "hug"
  | "shrug"
  | "point"
  | "peek"
  | "crossed"
  | "fist"
  | "cheek"
  | "cover"
  | "hold"
  | "down"
  | "pray"
  | "hush"
  | "salute"
  | "hip"
  | "heart"
  | "shiver";

export type ClayMochiDefinition = {
  id: string;
  label: string;
  token: string;
  category: ClayMochiCategory;
  face: string;
  accent: string;
  motion: string;
  body: string;
  bodyDeep: string;
  prop: string;
  shape: number;
  status: string;
  motionSignature: ClayMotionSignature;
  object?: string;
  stable?: boolean;
  pose?: ClayPose;
};

export type ClayMochiMode = "interactive" | "standard";

export type ClayMotionSignature = {
  family: string;
  durationMs: number;
  delayMs: number;
  travelX: number;
  travelY: number;
  rotateDeg: number;
  scalePeak: number;
  pivotX: number;
  pivotY: number;
  key: string;
};

const CLAY_PALETTES = [
  { body: "#DCEBDD", bodyDeep: "#A9CBB0", prop: "#73B878" },
  { body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38" },
  { body: "#FFC9B5", bodyDeep: "#EE9273", prop: "#E76F51" },
  { body: "#E3D2EC", bodyDeep: "#B89AC9", prop: "#9567AE" },
  { body: "#F7CDD5", bodyDeep: "#E99BAA", prop: "#DE647D" },
  { body: "#CFE4F5", bodyDeep: "#8EB9DC", prop: "#5C93C4" },
  { body: "#E3E8B5", bodyDeep: "#B9C67B", prop: "#91A851" },
  { body: "#F0DED1", bodyDeep: "#D3AF99", prop: "#B98267" },
] as const;

const ACTION_FAMILIES = [
  "breathe", "hop", "nod", "wave", "squish", "peek", "sway", "twirl",
  "shiver", "cheer", "weep", "doze", "boop", "tiptoe", "orbit", "recoil"
] as const;

function clayMotion(index: number): ClayMotionSignature {
  const families = ACTION_FAMILIES;
  const family = families[index % families.length];
  const durationMs = 800 + (index * 37) % 1000;
  const delayMs = -((index * 47) % 1800);
  const travelX = Number((((index % 9) - 4) * 0.35).toFixed(2));
  const travelY = Number((1.5 + (index % 7) * 0.45).toFixed(2));
  const rotateDeg = Number((0.6 + (index % 11) * 0.28).toFixed(2));
  const scalePeak = Number((1.015 + (index % 8) * 0.005).toFixed(3));
  const pivotX = 38 + ((index * 7) % 25);
  const pivotY = 68 + ((index * 11) % 24);

  return {
    family,
    durationMs,
    delayMs,
    travelX,
    travelY,
    rotateDeg,
    scalePeak,
    pivotX,
    pivotY,
    key: [family, durationMs, delayMs, travelX, travelY, rotateDeg, scalePeak, pivotX, pivotY].join(":"),
  };
}

const STATIC_CLAY_ITEMS: readonly ClayMochiDefinition[] = [
  { id: "clay-heart", label: "Clay Heart", token: ":clay-heart:", category: "love", face: "none", accent: "none", motion: "idle", body: "#F7CDD5", bodyDeep: "#E99BAA", prop: "#DE647D", shape: 0, status: "stable", motionSignature: clayMotion(0), stable: true },
  { id: "broken-heart", label: "Broken Heart", token: ":clay-broken-heart:", category: "low", face: "none", accent: "none", motion: "idle", body: "#F7CDD5", bodyDeep: "#E99BAA", prop: "#DE647D", shape: 1, status: "stable", motionSignature: clayMotion(1), stable: true },
  { id: "clay-star", label: "Clay Star", token: ":clay-star:", category: "joy", face: "none", accent: "none", motion: "idle", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38", shape: 2, status: "stable", motionSignature: clayMotion(2), stable: true },
  { id: "clay-spark", label: "Collision Spark", token: ":clay-spark:", category: "alert", face: "none", accent: "none", motion: "idle", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38", shape: 3, status: "stable", motionSignature: clayMotion(3), stable: true },
  { id: "clay-bomb", label: "Clay Bomb", token: ":clay-bomb:", category: "alert", face: "none", accent: "none", motion: "idle", body: "#4a4a4a", bodyDeep: "#2a2a2a", prop: "#1a1a1a", shape: 4, status: "stable", motionSignature: clayMotion(4), stable: true },
  { id: "clay-poop", label: "Clay Poop", token: ":clay-poop:", category: "core", face: "none", accent: "none", motion: "idle", body: "#A0856B", bodyDeep: "#6B5B4F", prop: "#4A3F35", shape: 5, status: "stable", motionSignature: clayMotion(5), stable: true },
  { id: "skull", label: "Clay Skull", token: ":clay-skull:", category: "alert", face: "none", accent: "none", motion: "idle", body: "#F0DED1", bodyDeep: "#D3AF99", prop: "#B98267", shape: 0, status: "stable", motionSignature: clayMotion(6), stable: true },
  { id: "clay-apple", label: "Clay Apple", token: ":clay-apple:", category: "core", face: "none", accent: "none", motion: "idle", body: "#E76F51", bodyDeep: "#C4533A", prop: "#4A7C3F", shape: 1, status: "stable", motionSignature: clayMotion(7), stable: true },
  { id: "snail", label: "Clay Snail", token: ":clay-snail:", category: "nature", face: "none", accent: "none", motion: "idle", body: "#D3AF99", bodyDeep: "#B98267", prop: "#A0856B", shape: 2, status: "stable", motionSignature: clayMotion(8), stable: true },
  { id: "turtle", label: "Clay Turtle", token: ":clay-turtle:", category: "nature", face: "none", accent: "none", motion: "idle", body: "#73B878", bodyDeep: "#4A8F4F", prop: "#2D6B31", shape: 3, status: "stable", motionSignature: clayMotion(9), stable: true },
  { id: "octopus", label: "Clay Octopus", token: ":clay-octopus:", category: "nature", face: "none", accent: "none", motion: "idle", body: "#F29B38", bodyDeep: "#D47A1E", prop: "#B85F14", shape: 4, status: "stable", motionSignature: clayMotion(10), stable: true },
  { id: "cat-face", label: "Clay Cat", token: ":clay-cat:", category: "friends", face: "none", accent: "none", motion: "idle", body: "#3a3a3a", bodyDeep: "#1a1a1a", prop: "#0a0a0a", shape: 5, status: "stable", motionSignature: clayMotion(11), stable: true },
  { id: "dog-face", label: "Clay Dog", token: ":clay-dog:", category: "friends", face: "none", accent: "none", motion: "idle", body: "#F3B85F", bodyDeep: "#D4943A", prop: "#B87A28", shape: 0, status: "stable", motionSignature: clayMotion(12), stable: true },
  { id: "panda", label: "Clay Panda", token: ":clay-panda:", category: "friends", face: "none", accent: "none", motion: "idle", body: "#F0DED1", bodyDeep: "#D3AF99", prop: "#3a3a3a", shape: 1, status: "stable", motionSignature: clayMotion(13), stable: true },
  { id: "penguin", label: "Clay Penguin", token: ":clay-penguin:", category: "friends", face: "none", accent: "none", motion: "idle", body: "#5C93C4", bodyDeep: "#3D6F99", prop: "#F0DED1", shape: 2, status: "stable", motionSignature: clayMotion(14), stable: true },
  { id: "clay-cherry", label: "Clay Cherry", token: ":clay-cherry:", category: "treats", face: "none", accent: "none", motion: "idle", body: "#DE647D", bodyDeep: "#B84A5F", prop: "#4A7C3F", shape: 3, status: "stable", motionSignature: clayMotion(15), stable: true },
  { id: "birthday-cake", label: "Clay Cake", token: ":clay-cake:", category: "treats", face: "none", accent: "none", motion: "idle", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#DE647D", shape: 4, status: "stable", motionSignature: clayMotion(16), stable: true },
  { id: "clay-party", label: "Party Popper", token: ":clay-party:", category: "joy", face: "none", accent: "none", motion: "idle", body: "#F29B38", bodyDeep: "#D47A1E", prop: "#DE647D", shape: 5, status: "stable", motionSignature: clayMotion(17), stable: true },
  { id: "clay-flame", label: "Clay Flame", token: ":clay-flame:", category: "alert", face: "none", accent: "none", motion: "idle", body: "#F29B38", bodyDeep: "#D47A1E", prop: "#DE647D", shape: 0, status: "stable", motionSignature: clayMotion(18), stable: true },
  { id: "clay-thumbs-up", label: "Thumbs Up", token: ":clay-thumbs-up:", category: "joy", face: "none", accent: "none", motion: "idle", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#D3AF99", shape: 1, status: "stable", motionSignature: clayMotion(19), stable: true },
  { id: "clay-thumbs-down", label: "Thumbs Down", token: ":clay-thumbs-down:", category: "low", face: "none", accent: "none", motion: "idle", body: "#A9CBB0", bodyDeep: "#73B878", prop: "#4A8F4F", shape: 2, status: "stable", motionSignature: clayMotion(20), stable: true },
  { id: "clay-beer", label: "Clay Beer", token: ":clay-beer:", category: "joy", face: "none", accent: "none", motion: "idle", body: "#F3B85F", bodyDeep: "#D4943A", prop: "#F29B38", shape: 3, status: "stable", motionSignature: clayMotion(21), stable: true },
  { id: "clay-wine", label: "Clay Wine", token: ":clay-wine:", category: "love", face: "none", accent: "none", motion: "idle", body: "#DE647D", bodyDeep: "#B84A5F", prop: "#8B3A4A", shape: 4, status: "stable", motionSignature: clayMotion(22), stable: true },
  { id: "pizza", label: "Clay Pizza", token: ":clay-pizza:", category: "treats", face: "none", accent: "none", motion: "idle", body: "#F29B38", bodyDeep: "#D47A1E", prop: "#B85F14", shape: 5, status: "stable", motionSignature: clayMotion(23), stable: true },
  { id: "check", label: "Clay Check", token: ":clay-check:", category: "core", face: "none", accent: "none", motion: "idle", body: "#73B878", bodyDeep: "#4A8F4F", prop: "#2D6B31", shape: 0, status: "stable", motionSignature: clayMotion(24), stable: true },
  { id: "no-cross", label: "Clay Cross", token: ":clay-no-cross:", category: "alert", face: "none", accent: "none", motion: "idle", body: "#DE647D", bodyDeep: "#B84A5F", prop: "#8B3A4A", shape: 1, status: "stable", motionSignature: clayMotion(25), stable: true },
  { id: "clay-blob-base", label: "Clay Blob", token: ":clay-blob:", category: "core", face: "smile", accent: "none", motion: "idle", body: "#DCEBDD", bodyDeep: "#A9CBB0", prop: "#73B878", shape: 0, status: "0.5 Hz float", motionSignature: clayMotion(26), stable: false },
];

const ANIMATED_CLAY_ITEMS: readonly ClayMochiDefinition[] = [
  { id: "blob-laugh", label: "Laughing Blob", token: ":clay-laugh:", category: "joy", face: "laugh", accent: "tears", motion: "bounce", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38", shape: 0, status: "2 Hz bounce", motionSignature: clayMotion(27), pose: "open" },
  { id: "blob-kiss", label: "Blowing Kiss", token: ":clay-kiss:", category: "love", face: "kiss", accent: "heart", motion: "pulse", body: "#F7CDD5", bodyDeep: "#E99BAA", prop: "#DE647D", shape: 1, status: "3 Hz pulse", motionSignature: clayMotion(28), pose: "heart" },
  { id: "blob-love", label: "Heart Eyes", token: ":clay-love:", category: "love", face: "love", accent: "double-heart", motion: "orbit", body: "#DE647D", bodyDeep: "#B84A5F", prop: "#8B3A4A", shape: 2, status: "2 Hz orbit", motionSignature: clayMotion(29), pose: "heart" },
  { id: "blob-sob", label: "Sobbing Blob", token: ":clay-sob:", category: "low", face: "sob", accent: "flood", motion: "drip", body: "#CFE4F5", bodyDeep: "#8EB9DC", prop: "#5C93C4", shape: 3, status: "0.5 Hz fall", motionSignature: clayMotion(30), pose: "cover" },
  { id: "blob-angry", label: "Angry Blob", token: ":clay-angry:", category: "alert", face: "angry", accent: "steam", motion: "glitch", body: "#E76F51", bodyDeep: "#C4533A", prop: "#A83D2A", shape: 4, status: "4 Hz glitch", motionSignature: clayMotion(31), pose: "fist" },
  { id: "blob-shocked", label: "Shocked Blob", token: ":clay-shocked:", category: "alert", face: "shocked", accent: "lightning", motion: "alert", body: "#FFC9B5", bodyDeep: "#EE9273", prop: "#E76F51", shape: 5, status: "2 Hz lock-on", motionSignature: clayMotion(32), pose: "peek" },
  { id: "blob-sleepy", label: "Sleepy Blob", token: ":clay-sleepy:", category: "low", face: "sleepy", accent: "zzz", motion: "drift", body: "#E3D2EC", bodyDeep: "#B89AC9", prop: "#9567AE", shape: 0, status: "0.5 Hz drift", motionSignature: clayMotion(33), pose: "cheek" },
  { id: "blob-thinking", label: "Thinking Blob", token: ":clay-thinking:", category: "core", face: "thinking", accent: "question", motion: "orbit", body: "#DCEBDD", bodyDeep: "#A9CBB0", prop: "#73B878", shape: 1, status: "2 Hz orbit", motionSignature: clayMotion(34), pose: "cheek" },
  { id: "blob-wink-point", label: "Winking & Pointing", token: ":clay-wink-point:", category: "joy", face: "wink", accent: "finger-gun", motion: "scan", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38", shape: 2, status: "2 Hz scan", motionSignature: clayMotion(35), pose: "point" },
  { id: "blob-blush", label: "Blushing Blob", token: ":clay-blush:", category: "love", face: "smile", accent: "double-heart", motion: "squish", body: "#F7CDD5", bodyDeep: "#E99BAA", prop: "#DE647D", shape: 3, status: "soft squish", motionSignature: clayMotion(36), pose: "peek" },
  { id: "blob-scared", label: "Trembling Blob", token: ":clay-scared:", category: "alert", face: "scared", accent: "sweat", motion: "shake", body: "#CFE4F5", bodyDeep: "#8EB9DC", prop: "#5C93C4", shape: 4, status: "3 Hz shake", motionSignature: clayMotion(37), pose: "shiver" },
  { id: "blob-sad-rain", label: "Sad under Raincloud", token: ":clay-sad-rain:", category: "low", face: "sad", accent: "rain", motion: "drift", body: "#8EB9DC", bodyDeep: "#5C93C4", prop: "#3D6F99", shape: 5, status: "0.5 Hz drift", motionSignature: clayMotion(38), pose: "down" },
  { id: "blob-cheer", label: "Joyful Cheer", token: ":clay-cheer:", category: "joy", face: "grin", accent: "confetti", motion: "cheer", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38", shape: 0, status: "2 Hz bounce", motionSignature: clayMotion(39), pose: "raised" },
  { id: "blob-angel", label: "Angel Blob", token: ":clay-angel:", category: "love", face: "smile", accent: "halo", motion: "orbit", body: "#F0DED1", bodyDeep: "#D3AF99", prop: "#F29B38", shape: 1, status: "2 Hz orbit", motionSignature: clayMotion(40), pose: "pray" },
  { id: "blob-devil", label: "Devil Blob", token: ":clay-devil:", category: "style", face: "smug", accent: "horns", motion: "glitch", body: "#E76F51", bodyDeep: "#C4533A", prop: "#A83D2A", shape: 2, status: "4 Hz glitch", motionSignature: clayMotion(41), pose: "fist" },
  { id: "blob-facepalm", label: "Facepalm Blob", token: ":clay-facepalm:", category: "core", face: "tired", accent: "hand", motion: "shake", body: "#E3D2EC", bodyDeep: "#B89AC9", prop: "#9567AE", shape: 3, status: "3 Hz shake", motionSignature: clayMotion(42), pose: "cover" },
  { id: "blob-dizzy", label: "Dizzy Blob", token: ":clay-dizzy:", category: "core", face: "confused", accent: "glitch", motion: "shake", body: "#E3E8B5", bodyDeep: "#B9C67B", prop: "#91A851", shape: 4, status: "3 Hz shake", motionSignature: clayMotion(43), pose: "shrug" },
  { id: "blob-popcorn", label: "Eating Popcorn", token: ":clay-popcorn:", category: "joy", face: "grin", accent: "party", motion: "nod", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38", shape: 5, status: "gentle nod", motionSignature: clayMotion(44), pose: "hold" },
  { id: "blob-reading", label: "Reading Book", token: ":clay-reading:", category: "core", face: "thinking", accent: "glasses", motion: "idle", body: "#B89AC9", bodyDeep: "#9567AE", prop: "#7A4F8F", shape: 0, status: "0.5 Hz float", motionSignature: clayMotion(45), pose: "hold" },
  { id: "blob-party", label: "Party Blob", token: ":clay-party-hat:", category: "joy", face: "grin", accent: "party", motion: "bounce", body: "#F29B38", bodyDeep: "#D47A1E", prop: "#DE647D", shape: 1, status: "2 Hz bounce", motionSignature: clayMotion(46), pose: "raised" },
  { id: "blob-cool", label: "Cool Blob", token: ":clay-cool:", category: "style", face: "cool", accent: "shades", motion: "scan", body: "#B89AC9", bodyDeep: "#9567AE", prop: "#7A4F8F", shape: 2, status: "2 Hz scan", motionSignature: clayMotion(47), pose: "hip" },
  { id: "blob-drooling", label: "Drooling Blob", token: ":clay-drooling:", category: "treats", face: "laugh", accent: "tears", motion: "drip", body: "#FFC9B5", bodyDeep: "#EE9273", prop: "#E76F51", shape: 3, status: "0.5 Hz fall", motionSignature: clayMotion(48), pose: "cheek" },
  { id: "blob-mindblown", label: "Mind Blown", token: ":clay-mindblown:", category: "alert", face: "shocked", accent: "burst", motion: "alert", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38", shape: 4, status: "2 Hz lock-on", motionSignature: clayMotion(49), pose: "raised" },
  { id: "blob-wizard", label: "Wizard Blob", token: ":clay-wizard:", category: "style", face: "thinking", accent: "spark", motion: "orbit", body: "#B89AC9", bodyDeep: "#9567AE", prop: "#7A4F8F", shape: 5, status: "2 Hz orbit", motionSignature: clayMotion(50), pose: "open" },
  { id: "blob-bath", label: "Bath Blob", token: ":clay-bath:", category: "core", face: "smile", accent: "cloud", motion: "sway", body: "#CFE4F5", bodyDeep: "#8EB9DC", prop: "#5C93C4", shape: 0, status: "gentle sway", motionSignature: clayMotion(51), pose: "rest" },
  { id: "blob-sick", label: "Sick Blob", token: ":clay-sick:", category: "low", face: "sick", accent: "mask", motion: "shake", body: "#DCEBDD", bodyDeep: "#A9CBB0", prop: "#73B878", shape: 1, status: "3 Hz shake", motionSignature: clayMotion(52), pose: "hold" },
  { id: "blob-bandage", label: "Bandaged Blob", token: ":clay-bandage:", category: "low", face: "tired", accent: "bandage", motion: "shake", body: "#F0DED1", bodyDeep: "#D3AF99", prop: "#B98267", shape: 2, status: "3 Hz shake", motionSignature: clayMotion(53), pose: "down" },
  { id: "blob-salute", label: "Saluting Blob", token: ":clay-salute:", category: "core", face: "neutral", accent: "cap", motion: "nod", body: "#5C93C4", bodyDeep: "#3D6F99", prop: "#2A5580", shape: 3, status: "gentle nod", motionSignature: clayMotion(54), pose: "salute" },
  { id: "blob-flex", label: "Flexing Blob", token: ":clay-flex:", category: "joy", face: "smug", accent: "none", motion: "cheer", body: "#F29B38", bodyDeep: "#D47A1E", prop: "#B85F14", shape: 4, status: "2 Hz bounce", motionSignature: clayMotion(55), pose: "fist" },
  { id: "blob-hug", label: "Hugging Blob", token: ":clay-hug:", category: "love", face: "love", accent: "hug", motion: "squish", body: "#F7CDD5", bodyDeep: "#E99BAA", prop: "#DE647D", shape: 5, status: "soft squish", motionSignature: clayMotion(56), pose: "hug" },
  { id: "blob-shrug", label: "Shrugging Blob", token: ":clay-shrug:", category: "core", face: "confused", accent: "none", motion: "sway", body: "#E3E8B5", bodyDeep: "#B9C67B", prop: "#91A851", shape: 0, status: "gentle sway", motionSignature: clayMotion(57), pose: "shrug" },
  { id: "blob-melt", label: "Melting Blob", token: ":clay-melt:", category: "alert", face: "laugh", accent: "none", motion: "drip", body: "#E3D2EC", bodyDeep: "#B89AC9", prop: "#9567AE", shape: 1, status: "0.5 Hz fall", motionSignature: clayMotion(58), pose: "down" },
  { id: "blob-clap", label: "Clapping Blob", token: ":clay-clap:", category: "joy", face: "grin", accent: "none", motion: "cheer", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38", shape: 2, status: "2 Hz bounce", motionSignature: clayMotion(59), pose: "clap" },
  { id: "blob-vomit", label: "Vomiting Blob", token: ":clay-vomit:", category: "low", face: "sick", accent: "nauseous", motion: "shake", body: "#B9C67B", bodyDeep: "#91A851", prop: "#6B8A3D", shape: 3, status: "3 Hz shake", motionSignature: clayMotion(60), pose: "cover" },
  { id: "blob-scream", label: "Screaming Blob", token: ":clay-scream:", category: "alert", face: "shocked", accent: "none", motion: "recoil", body: "#FFC9B5", bodyDeep: "#EE9273", prop: "#E76F51", shape: 4, status: "2 Hz lock-on", motionSignature: clayMotion(61), pose: "peek" },
  { id: "blob-cold", label: "Freezing Blob", token: ":clay-cold:", category: "low", face: "sad", accent: "ice", motion: "shake", body: "#CFE4F5", bodyDeep: "#8EB9DC", prop: "#5C93C4", shape: 5, status: "3 Hz shake", motionSignature: clayMotion(62), pose: "shiver" },
  { id: "blob-hot", label: "Hot Blob", token: ":clay-hot:", category: "alert", face: "sad", accent: "sweat", motion: "drip", body: "#E76F51", bodyDeep: "#C4533A", prop: "#A83D2A", shape: 0, status: "0.5 Hz fall", motionSignature: clayMotion(63), pose: "open" },
  { id: "blob-dance", label: "Dancing Blob", token: ":clay-dance:", category: "joy", face: "laugh", accent: "music", motion: "bounce", body: "#E3D2EC", bodyDeep: "#B89AC9", prop: "#9567AE", shape: 1, status: "2 Hz bounce", motionSignature: clayMotion(64), pose: "wave" },
  { id: "blob-wink-tongue", label: "Wink & Tongue", token: ":clay-wink-tongue:", category: "joy", face: "wink", accent: "none", motion: "pulse", body: "#FFC9B5", bodyDeep: "#EE9273", prop: "#E76F51", shape: 2, status: "3 Hz pulse", motionSignature: clayMotion(65), pose: "hip" },
  { id: "blob-pout", label: "Pouting Blob", token: ":clay-pout:", category: "low", face: "angry", accent: "none", motion: "drift", body: "#9567AE", bodyDeep: "#6B4F7A", prop: "#4A3A55", shape: 3, status: "0.5 Hz drift", motionSignature: clayMotion(66), pose: "crossed" },
  { id: "blob-ghost", label: "Ghost Blob", token: ":clay-ghost:", category: "style", face: "neutral", accent: "ghost", motion: "drift", body: "#F0DED1", bodyDeep: "#D3AF99", prop: "#B98267", shape: 4, status: "0.5 Hz drift", motionSignature: clayMotion(67), pose: "open" },
  { id: "blob-rainbow", label: "Rainbow Blob", token: ":clay-rainbow:", category: "love", face: "love", accent: "flower", motion: "orbit", body: "#F7CDD5", bodyDeep: "#E99BAA", prop: "#DE647D", shape: 5, status: "2 Hz orbit", motionSignature: clayMotion(68), pose: "raised" },
  { id: "blob-sparkle", label: "Sparkle Blob", token: ":clay-sparkle:", category: "joy", face: "surprised", accent: "spark", motion: "pulse", body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38", shape: 0, status: "3 Hz pulse", motionSignature: clayMotion(69), pose: "heart" },
  { id: "blob-knockout", label: "Knocked Out", token: ":clay-knockout:", category: "low", face: "tired", accent: "none", motion: "shake", body: "#8EB9DC", bodyDeep: "#5C93C4", prop: "#3D6F99", shape: 1, status: "3 Hz shake", motionSignature: clayMotion(70), pose: "down" },
  { id: "blob-construct", label: "Worker Blob", token: ":clay-construct:", category: "core", face: "neutral", accent: "helmet", motion: "nod", body: "#F29B38", bodyDeep: "#D47A1E", prop: "#B85F14", shape: 2, status: "gentle nod", motionSignature: clayMotion(71), pose: "fist" },
  { id: "blob-detective", label: "Detective Blob", token: ":clay-detective:", category: "style", face: "cool", accent: "spy", motion: "scan", body: "#3D6F99", bodyDeep: "#2A5580", prop: "#1A3D5C", shape: 3, status: "2 Hz scan", motionSignature: clayMotion(72), pose: "cheek" },
  { id: "blob-pumpkin", label: "Pumpkin Blob", token: ":clay-pumpkin:", category: "alert", face: "smug", accent: "none", motion: "pulse", body: "#F29B38", bodyDeep: "#D47A1E", prop: "#B85F14", shape: 4, status: "3 Hz pulse", motionSignature: clayMotion(73), pose: "hip" },
  { id: "blob-santa", label: "Santa Blob", token: ":clay-santa:", category: "joy", face: "smile", accent: "none", motion: "bounce", body: "#DE647D", bodyDeep: "#B84A5F", prop: "#8B3A4A", shape: 5, status: "2 Hz bounce", motionSignature: clayMotion(74), pose: "wave" },
  { id: "blob-coffee", label: "Coffee Blob", token: ":clay-coffee:", category: "core", face: "neutral", accent: "coffee", motion: "nod", body: "#D3AF99", bodyDeep: "#B98267", prop: "#9A6B52", shape: 0, status: "gentle nod", motionSignature: clayMotion(75), pose: "hold" },
  { id: "blob-sign", label: "Sign Blob", token: ":clay-sign:", category: "joy", face: "grin", accent: "party", motion: "cheer", body: "#73B878", bodyDeep: "#4A8F4F", prop: "#2D6B31", shape: 1, status: "2 Hz bounce", motionSignature: clayMotion(76), pose: "raised" },
  { id: "blob-push", label: "Pushing Blob", token: ":clay-push:", category: "alert", face: "angry", accent: "none", motion: "recoil", body: "#E76F51", bodyDeep: "#C4533A", prop: "#A83D2A", shape: 2, status: "2 Hz lock-on", motionSignature: clayMotion(77), pose: "point" },
  { id: "blob-space", label: "Space Blob", token: ":clay-space:", category: "style", face: "surprised", accent: "none", motion: "drift", body: "#5C93C4", bodyDeep: "#3D6F99", prop: "#2A5580", shape: 3, status: "0.5 Hz drift", motionSignature: clayMotion(78), pose: "open" },
  { id: "blob-type", label: "Typing Blob", token: ":clay-type:", category: "core", face: "neutral", accent: "terminal", motion: "shake", body: "#B9C67B", bodyDeep: "#91A851", prop: "#6B8A3D", shape: 4, status: "3 Hz shake", motionSignature: clayMotion(79), pose: "hold" },
  { id: "blob-cat", label: "Cat Costume Blob", token: ":clay-cat-costume:", category: "friends", face: "smile", accent: "none", motion: "sway", body: "#3a3a3a", bodyDeep: "#1a1a1a", prop: "#0a0a0a", shape: 5, status: "gentle sway", motionSignature: clayMotion(80), pose: "peek" },
];

export const CLAY_MOCHI_STICKERS: readonly ClayMochiDefinition[] = [
  ...STATIC_CLAY_ITEMS,
  ...ANIMATED_CLAY_ITEMS,
];

export const CLAY_MOCHI_CATEGORIES: ReadonlyArray<{
  id: "all" | ClayMochiCategory;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "core", label: "Core" },
  { id: "joy", label: "Joy" },
  { id: "love", label: "Love" },
  { id: "style", label: "Style" },
  { id: "alert", label: "Alert" },
  { id: "low", label: "Low" },
];

const CLAY_BY_TOKEN = new Map(CLAY_MOCHI_STICKERS.map(item => [item.token, item]));
const CLAY_BY_ID = new Map(CLAY_MOCHI_STICKERS.map(item => [item.id, item]));

export function clayMochiFromToken(token: string) {
  return CLAY_BY_TOKEN.get(token)?.id;
}

export function clayMochiDefinitionFromId(id: string) {
  return CLAY_BY_ID.get(id);
}

export function clayMochiToken(
  sticker: ClayMochiDefinition,
  mode: ClayMochiMode
) {
  return mode === "interactive" ? sticker.token : `:sticker-clay-${sticker.id}:`;
}

export function clayMochiSelectionFromToken(
  token: string
): { id: string; mode: ClayMochiMode } | undefined {
  const interactive = CLAY_BY_TOKEN.get(token);
  if (interactive) return { id: interactive.id, mode: "interactive" };
  const standard = CLAY_BY_TOKEN.get(`:sticker-clay-${token.replace(/^:/, "").replace(/:$/, "")}:`);
  if (standard) return { id: standard.id, mode: "standard" };
  return undefined;
}

export const CLAY_MOCHI_TOKEN_PATTERN = /(:(?:clay|sticker-clay)-[a-z0-9-]+:)/g;
