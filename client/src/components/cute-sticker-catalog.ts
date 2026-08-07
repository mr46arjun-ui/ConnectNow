import {
  CYBER_CATEGORIES,
  CYBER_EMOTICONS,
  type CyberAccentModel,
  type CyberCategory,
  type CyberFaceModel,
  type CyberMotionModel,
} from "./cyber-emoticon-catalog";

export type CuteStickerDefinition = {
  id: string;
  label: string;
  token: string;
  category: CuteStickerCategory;
  face: CyberFaceModel;
  accent: CyberAccentModel;
  motion: CyberMotionModel;
  body: string;
  bodyDeep: string;
  prop: string;
  shape: number;
  status: string;
  motionSignature: CuteMotionSignature;
  object?: CuteObjectModel;
};

export type CuteStickerMode = "interactive" | "standard";

export type CuteActionFamily =
  | "breathe"
  | "hop"
  | "nod"
  | "wave"
  | "squish"
  | "peek"
  | "sway"
  | "twirl"
  | "shiver"
  | "cheer"
  | "weep"
  | "doze"
  | "boop"
  | "tiptoe"
  | "orbit"
  | "recoil";

export type CuteMotionSignature = {
  family: CuteActionFamily;
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

export type CuteStickerCategory =
  CyberCategory | "friends" | "nature" | "treats" | "symbols";

export type CuteObjectModel =
  | "corgi"
  | "raccoon"
  | "bear"
  | "bee"
  | "bluebird"
  | "blue-heart"
  | "birthday-cake"
  | "fox"
  | "ginger-cat"
  | "love-cat"
  | "chick"
  | "chicken"
  | "pine-tree"
  | "cow"
  | "crab"
  | "tiger"
  | "dove"
  | "duck"
  | "eagle"
  | "campfire"
  | "fox-face"
  | "ghost"
  | "gift"
  | "mountain-goat"
  | "toy-blaster"
  | "ice-cream"
  | "reading-koala"
  | "lion"
  | "field-mouse"
  | "strong-left"
  | "strong-right"
  | "octopus"
  | "panda"
  | "penguin"
  | "hedgehog"
  | "pizza"
  | "rabbit"
  | "gray-mouse"
  | "broken-heart"
  | "sheep"
  | "snail"
  | "snake"
  | "squirrel"
  | "turtle"
  | "whale"
  | "check"
  | "shy-alien"
  | "hippo"
  | "owl"
  | "cheese"
  | "spark-bunny"
  | "cloud-cat"
  | "rainbow-jelly"
  | "no-cross"
  | "reindeer"
  | "scientist"
  | "red-slime"
  | "warm-hug"
  | "white-cat"
  | "blue-cup-friend";

const SOFT_PALETTES = [
  { body: "#DCEBDD", bodyDeep: "#A9CBB0", prop: "#73B878" },
  { body: "#FFE39B", bodyDeep: "#F3B85F", prop: "#F29B38" },
  { body: "#FFC9B5", bodyDeep: "#EE9273", prop: "#E76F51" },
  { body: "#E3D2EC", bodyDeep: "#B89AC9", prop: "#9567AE" },
  { body: "#F7CDD5", bodyDeep: "#E99BAA", prop: "#DE647D" },
  { body: "#CFE4F5", bodyDeep: "#8EB9DC", prop: "#5C93C4" },
  { body: "#E3E8B5", bodyDeep: "#B9C67B", prop: "#91A851" },
  { body: "#F0DED1", bodyDeep: "#D3AF99", prop: "#B98267" },
] as const;

const ACTIONS_BY_MOTION: Record<CyberMotionModel, readonly CuteActionFamily[]> =
  {
    idle: ["breathe", "nod", "tiptoe"],
    pulse: ["cheer", "boop", "squish"],
    bounce: ["hop", "cheer", "squish"],
    glitch: ["shiver", "recoil"],
    drift: ["sway", "peek", "doze"],
    shake: ["shiver", "recoil", "nod"],
    alert: ["recoil", "hop", "nod"],
    drip: ["weep", "nod", "squish"],
    orbit: ["orbit", "twirl"],
    scan: ["peek", "sway", "nod"],
  };

const ACTION_BY_ACCENT: Partial<Record<CyberAccentModel, CuteActionFamily>> = {
  wave: "wave",
  hand: "wave",
  "finger-gun": "boop",
  halo: "orbit",
  orbit: "orbit",
  moon: "orbit",
  roll: "twirl",
  tears: "weep",
  rain: "weep",
  flood: "weep",
  storm: "weep",
  tissue: "weep",
  sweat: "weep",
  zzz: "doze",
  sleep: "doze",
  pillow: "doze",
  nightcap: "doze",
  cloud: "doze",
  dim: "doze",
  scan: "sway",
  visor: "peek",
  glasses: "nod",
  shades: "nod",
  "neon-shades": "nod",
  question: "nod",
  bulb: "boop",
  target: "recoil",
  alert: "recoil",
  alarm: "recoil",
  warning: "recoil",
  lightning: "recoil",
  party: "hop",
  confetti: "cheer",
  gift: "cheer",
  stars: "cheer",
  spark: "cheer",
  burst: "cheer",
  heart: "boop",
  charm: "boop",
  "double-heart": "squish",
  hug: "squish",
  glitch: "shiver",
  flame: "shiver",
  steam: "shiver",
  horns: "recoil",
  overheat: "shiver",
};

function makeMotionSignature(
  index: number,
  motion: CyberMotionModel,
  accent: CyberAccentModel
): CuteMotionSignature {
  const motionFamilies = ACTIONS_BY_MOTION[motion];
  const family =
    ACTION_BY_ACCENT[accent] ??
    motionFamilies[(index + accent.length) % motionFamilies.length];
  const durationMs = 980 + index * 7;
  const delayMs = -((index * 43) % 1900);
  const travelX = Number((((index % 9) - 4) * 0.38).toFixed(2));
  const travelY = Number((1.8 + (index % 7) * 0.42).toFixed(2));
  const rotateDeg = Number((0.7 + (index % 11) * 0.31).toFixed(2));
  const scalePeak = Number((1.018 + (index % 8) * 0.006).toFixed(3));
  const pivotX = 38 + ((index * 7) % 25);
  const pivotY = 70 + ((index * 11) % 24);

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
    key: [
      family,
      durationMs,
      delayMs,
      travelX,
      travelY,
      rotateDeg,
      scalePeak,
      pivotX,
      pivotY,
    ].join(":"),
  };
}

const CUTE_FACE_STICKERS: readonly CuteStickerDefinition[] =
  CYBER_EMOTICONS.map((item, index) => {
    const palette =
      SOFT_PALETTES[
        (index + item.face.length + item.accent.length) % SOFT_PALETTES.length
      ];
    return {
      ...item,
      token: `:cute-${item.id}:`,
      body: palette.body,
      bodyDeep: palette.bodyDeep,
      prop: palette.prop,
      shape: index % 6,
      status: item.status.replace("glitch", "wiggle").replace("scan", "sway"),
      motionSignature: makeMotionSignature(index, item.motion, item.accent),
    };
  });

const CUTE_OBJECT_INVENTORY: ReadonlyArray<{
  id: CuteObjectModel;
  label: string;
  category: Extract<
    CuteStickerCategory,
    "friends" | "nature" | "treats" | "symbols"
  >;
}> = [
  { id: "corgi", label: "Corgi Friend", category: "friends" },
  { id: "raccoon", label: "Curious Raccoon", category: "friends" },
  { id: "bear", label: "Brown Bear", category: "friends" },
  { id: "bee", label: "Bumble Bee", category: "nature" },
  { id: "bluebird", label: "Blue Bird", category: "nature" },
  { id: "blue-heart", label: "Blue Heart", category: "symbols" },
  { id: "birthday-cake", label: "Birthday Cake", category: "treats" },
  { id: "fox", label: "Little Fox", category: "friends" },
  { id: "ginger-cat", label: "Ginger Cat", category: "friends" },
  { id: "love-cat", label: "Love Cat", category: "friends" },
  { id: "chick", label: "Tiny Chick", category: "nature" },
  { id: "chicken", label: "White Chicken", category: "nature" },
  { id: "pine-tree", label: "Pine Tree", category: "nature" },
  { id: "cow", label: "Gentle Cow", category: "friends" },
  { id: "crab", label: "Happy Crab", category: "nature" },
  { id: "tiger", label: "Tiger Cub", category: "friends" },
  { id: "dove", label: "Peaceful Dove", category: "nature" },
  { id: "duck", label: "Pond Duck", category: "nature" },
  { id: "eagle", label: "Brave Eagle", category: "nature" },
  { id: "campfire", label: "Cozy Flame", category: "nature" },
  { id: "fox-face", label: "Fox Face", category: "friends" },
  { id: "ghost", label: "Shy Ghost", category: "symbols" },
  { id: "gift", label: "Wrapped Gift", category: "symbols" },
  { id: "mountain-goat", label: "Mountain Goat", category: "friends" },
  { id: "toy-blaster", label: "Toy Blaster", category: "symbols" },
  { id: "ice-cream", label: "Vanilla Cone", category: "treats" },
  { id: "reading-koala", label: "Reading Koala", category: "friends" },
  { id: "lion", label: "Little Lion", category: "friends" },
  { id: "field-mouse", label: "Field Mouse", category: "friends" },
  { id: "strong-left", label: "Strong Left", category: "symbols" },
  { id: "strong-right", label: "Strong Right", category: "symbols" },
  { id: "octopus", label: "Orange Octopus", category: "nature" },
  { id: "panda", label: "Panda Pal", category: "friends" },
  { id: "penguin", label: "Penguin Pal", category: "friends" },
  { id: "hedgehog", label: "Hedgehog", category: "friends" },
  { id: "pizza", label: "Pizza Slice", category: "treats" },
  { id: "rabbit", label: "White Rabbit", category: "friends" },
  { id: "gray-mouse", label: "Gray Mouse", category: "friends" },
  { id: "broken-heart", label: "Mended Heart", category: "symbols" },
  { id: "sheep", label: "Woolly Sheep", category: "friends" },
  { id: "snail", label: "Garden Snail", category: "nature" },
  { id: "snake", label: "Garden Snake", category: "nature" },
  { id: "squirrel", label: "Red Squirrel", category: "friends" },
  { id: "turtle", label: "Tiny Turtle", category: "nature" },
  { id: "whale", label: "Blue Whale", category: "nature" },
  { id: "check", label: "All Good", category: "symbols" },
  { id: "shy-alien", label: "Shy Sea Friend", category: "nature" },
  { id: "hippo", label: "Happy Hippo", category: "friends" },
  { id: "owl", label: "Night Owl", category: "friends" },
  { id: "cheese", label: "Cheese Wedge", category: "treats" },
  { id: "spark-bunny", label: "Spark Bunny", category: "friends" },
  { id: "cloud-cat", label: "Cloud Cat", category: "friends" },
  { id: "rainbow-jelly", label: "Rainbow Jelly", category: "treats" },
  { id: "no-cross", label: "Not Today", category: "symbols" },
  { id: "reindeer", label: "Winter Reindeer", category: "friends" },
  { id: "scientist", label: "Tiny Scientist", category: "friends" },
  { id: "red-slime", label: "Red Jelly", category: "friends" },
  { id: "warm-hug", label: "Warm Hug", category: "symbols" },
  { id: "white-cat", label: "Snow Cat", category: "friends" },
  { id: "blue-cup-friend", label: "Blue Cup Friend", category: "friends" },
];

const CUTE_OBJECT_STICKERS: readonly CuteStickerDefinition[] =
  CUTE_OBJECT_INVENTORY.map((item, index) => {
    const palette = SOFT_PALETTES[(index * 3 + 1) % SOFT_PALETTES.length];
    return {
      id: `mini-${item.id}`,
      label: item.label,
      token: `:cute-mini-${item.id}:`,
      category: item.category,
      face: "neutral",
      accent: "none",
      motion: index % 3 === 0 ? "bounce" : index % 3 === 1 ? "drift" : "idle",
      body: palette.body,
      bodyDeep: palette.bodyDeep,
      prop: palette.prop,
      shape: index % 6,
      status:
        index % 3 === 0
          ? "gentle bounce"
          : index % 3 === 1
            ? "soft sway"
            : "calm float",
      motionSignature: makeMotionSignature(
        CUTE_FACE_STICKERS.length + index,
        index % 3 === 0 ? "bounce" : index % 3 === 1 ? "drift" : "idle",
        "none"
      ),
      object: item.id,
    };
  });

export const CUTE_STICKERS: readonly CuteStickerDefinition[] = [
  ...CUTE_FACE_STICKERS,
  ...CUTE_OBJECT_STICKERS,
];

export const CUTE_STICKER_CATEGORIES: ReadonlyArray<{
  id: "all" | CuteStickerCategory;
  label: string;
}> = [
  ...CYBER_CATEGORIES,
  { id: "friends", label: "Friends" },
  { id: "nature", label: "Nature" },
  { id: "treats", label: "Treats" },
  { id: "symbols", label: "Symbols" },
];

const CUTE_BY_TOKEN = new Map(CUTE_STICKERS.map(item => [item.token, item]));
const CUTE_BY_ID = new Map(CUTE_STICKERS.map(item => [item.id, item]));
const STANDARD_CUTE_BY_TOKEN = new Map(
  CUTE_STICKERS.map(item => [`:sticker-${item.id}:`, item])
);

export function cuteStickerFromToken(token: string) {
  return CUTE_BY_TOKEN.get(token)?.id;
}

export function cuteStickerDefinitionFromId(id: string) {
  return CUTE_BY_ID.get(id);
}

export function cuteStickerToken(
  sticker: CuteStickerDefinition,
  mode: CuteStickerMode
) {
  return mode === "interactive" ? sticker.token : `:sticker-${sticker.id}:`;
}

export function cuteStickerSelectionFromToken(
  token: string
): { id: string; mode: CuteStickerMode } | undefined {
  const interactive = CUTE_BY_TOKEN.get(token);
  if (interactive) return { id: interactive.id, mode: "interactive" };
  const standard = STANDARD_CUTE_BY_TOKEN.get(token);
  if (standard) return { id: standard.id, mode: "standard" };
  return undefined;
}

export const CUTE_STICKER_TOKEN_PATTERN = /(:(?:cute|sticker)-[a-z0-9-]+:)/g;
