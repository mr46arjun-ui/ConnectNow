import type { CSSProperties } from "react";
import {
  CYBER_EMOTICONS,
  CYBER_EMOTICON_TOKEN_PATTERN,
  cyberDefinitionFromId,
  cyberDefinitionFromToken,
  type CyberAccentModel,
  type CyberFaceModel,
} from "./cyber-emoticon-catalog";

type CyberAnimeEmoticonProps = {
  emotion: string;
  size?: "compact" | "picker" | "message";
  decorative?: boolean;
};

export type FaceGeometry = {
  leftEye: string;
  rightEye: string;
  mouth: string;
  filledEyes?: boolean;
  filledMouth?: boolean;
};

export const FACE_GEOMETRY: Record<CyberFaceModel, FaceGeometry> = {
  neutral: { leftEye: "M34 55h18", rightEye: "M76 55h18", mouth: "M49 76h30" },
  smile: {
    leftEye: "M36 56q8-8 16 0",
    rightEye: "M76 56q8-8 16 0",
    mouth: "M48 74q16 16 32 0",
  },
  grin: {
    leftEye: "M35 55q8-7 16 0",
    rightEye: "M77 55q8-7 16 0",
    mouth: "M47 72q17 20 34 0v10H47Z",
    filledMouth: true,
  },
  laugh: {
    leftEye: "m32 49 15 9-15 9",
    rightEye: "m96 49-15 9 15 9",
    mouth: "M48 72q16 22 32 0Z",
    filledMouth: true,
  },
  wink: {
    leftEye: "M34 56h17",
    rightEye: "M77 58q8-10 16 0",
    mouth: "M50 75q14 13 28 0",
  },
  kiss: {
    leftEye: "M35 57q8-8 16 0",
    rightEye: "M77 57q8-8 16 0",
    mouth: "m59 77 5-4 5 4-5 5Z",
  },
  love: {
    leftEye: "m34 52 5-4 5 4 5-4 5 4-10 11Z",
    rightEye: "m74 52 5-4 5 4 5-4 5 4-10 11Z",
    mouth: "M49 76q15 15 30 0",
    filledEyes: true,
  },
  smug: {
    leftEye: "M34 58q9 4 18-2",
    rightEye: "M76 56q9 6 18 2",
    mouth: "M52 79q18 5 27-7",
  },
  cool: { leftEye: "M33 55h20", rightEye: "M75 55h20", mouth: "M51 78h27" },
  confused: {
    leftEye: "M34 58q9-10 18 0",
    rightEye: "M77 52q8 8 16 0",
    mouth: "M50 78q8-7 15 0t14 0",
  },
  skeptical: {
    leftEye: "M33 54l19 5",
    rightEye: "m76 59 19-5",
    mouth: "M52 79h25",
  },
  thinking: {
    leftEye: "M36 55h15",
    rightEye: "M74 54h15",
    mouth: "M51 77q13-7 26 1",
  },
  surprised: {
    leftEye: "M42 47a10 10 0 1 0 0 20 10 10 0 1 0 0-20",
    rightEye: "M86 47a10 10 0 1 0 0 20 10 10 0 1 0 0-20",
    mouth: "M64 76a6 6 0 1 0 0 12 6 6 0 1 0 0-12",
  },
  shocked: {
    leftEye: "M41 48a9 9 0 1 0 0 18 9 9 0 1 0 0-18",
    rightEye: "M87 48a9 9 0 1 0 0 18 9 9 0 1 0 0-18",
    mouth: "M64 72a9 12 0 1 0 0 24 9 12 0 1 0 0-24",
    filledMouth: true,
  },
  scared: {
    leftEye: "m33 57 5-7 6 7 6-7",
    rightEye: "m77 57 5-7 6 7 6-7",
    mouth: "m49 80 7-6 8 6 8-6 7 6",
  },
  sad: {
    leftEye: "M32 59q10-12 20 0",
    rightEye: "M76 59q10-12 20 0",
    mouth: "M49 82q15-14 30 0",
  },
  cry: {
    leftEye: "M32 57q10-10 20 0",
    rightEye: "M76 57q10-10 20 0",
    mouth: "M50 80q14-12 28 0",
  },
  sob: {
    leftEye: "m32 54 9 6 10-6",
    rightEye: "m77 54 10 6 9-6",
    mouth: "M49 80q15-15 30 0",
  },
  tired: {
    leftEye: "M34 58h18",
    rightEye: "M76 58h18",
    mouth: "M52 80q12-5 24 0",
  },
  sleepy: {
    leftEye: "M34 57q9 8 18 0",
    rightEye: "M76 57q9 8 18 0",
    mouth: "M54 79h20",
  },
  sick: {
    leftEye: "m33 52 18 9",
    rightEye: "m77 61 18-9",
    mouth: "M49 79q7-8 15 0t15 0",
  },
  angry: {
    leftEye: "m29 48 25 8-6 10-18-7Z",
    rightEye: "m99 48-25 8 6 10 18-7Z",
    mouth: "m48 80 8-5 8 5 8-5 8 5",
    filledEyes: true,
  },
};

const HEART_PATH = "m95 31c-7-8-18 2-9 11l9 9 9-9c9-9-2-19-9-11Z";

function FaceExpression({ face }: { face: CyberFaceModel }) {
  const geometry = FACE_GEOMETRY[face];
  return (
    <g className={`cyber-emote__features cyber-emote__features--${face}`}>
      <path
        className={`cyber-emote__eye ${geometry.filledEyes ? "cyber-emote__eye--solid" : ""}`}
        d={geometry.leftEye}
      />
      <path
        className={`cyber-emote__eye ${geometry.filledEyes ? "cyber-emote__eye--solid" : ""}`}
        d={geometry.rightEye}
      />
      <path
        className={`cyber-emote__mouth ${geometry.filledMouth ? "cyber-emote__mouth--solid" : ""}`}
        d={geometry.mouth}
      />
    </g>
  );
}

function CyberAccent({ accent }: { accent: CyberAccentModel }) {
  if (accent === "none") return null;

  if (["scan", "dash", "glitch"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="M25 42h34M68 68h34M36 89h48" />
      </g>
    );
  }
  if (["visor", "shades", "neon-shades", "glasses"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <rect x="28" y="47" width="31" height="19" rx="5" />
        <rect x="69" y="47" width="31" height="19" rx="5" />
        <path d="M59 55h10M28 51l-8-4m80 4 8-4" />
      </g>
    );
  }
  if (accent === "mask") {
    return (
      <path
        className="cyber-emote__accent"
        d="m42 69 22 8 22-8v19l-22 8-22-8Z"
      />
    );
  }
  if (accent === "halo") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--halo">
        <ellipse cx="64" cy="22" rx="23" ry="7" />
        <path d="M41 22h46" />
      </g>
    );
  }
  if (accent === "blush") {
    return (
      <path
        className="cyber-emote__accent cyber-emote__accent--blush"
        d="m27 72 9-5m-5 12 9-5m61-7-9 5m5 7-9-5"
      />
    );
  }
  if (accent === "teeth") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--teeth">
        <path d="M49 74h30v13H49Z" />
        <path d="M56 74v13m8-13v13m8-13v13M49 80h30" />
      </g>
    );
  }
  if (accent === "wilt") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--wilt">
        <path d="M100 55q-6 24-20 34m13-18q-9-1-12-9m18-7q8 0 10-9" />
        <path d="M105 37q12 2 7 13-12 2-16-7 0-9 9-6Z" />
      </g>
    );
  }
  if (["alert", "alarm", "warning"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="m101 15 17 29H84Z" />
        <path d="M101 24v10m0 5h.1" />
        {accent === "alarm" ? <path d="M91 14 85 8m26 6 6-6" /> : null}
      </g>
    );
  }
  if (accent === "bulb") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--bulb">
        <path d="M101 15a15 15 0 0 1 9 27q-4 3-4 8H96q0-5-4-8a15 15 0 0 1 9-27Z" />
        <path d="M96 54h10m-8 5h6M101 8V2m-18 13-5-5m41 5 5-5" />
      </g>
    );
  }
  if (accent === "low-signal") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--low-signal">
        <path d="M88 45v-5m7 5V32m7 13V24m7 21V16" />
        <path d="m86 17 27 27" />
      </g>
    );
  }
  if (accent === "battery" || accent === "empty") {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <rect x="88" y="23" width="27" height="20" rx="3" />
        <path d="M115 29h4v8h-4" />
        {accent === "battery" ? (
          <path d="M93 28h8v10h-8" />
        ) : (
          <path d="m93 29 16 8m0-8-16 8" />
        )}
      </g>
    );
  }
  if (accent === "terminal") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--terminal">
        <rect x="85" y="20" width="37" height="29" rx="3" />
        <path d="m91 29 6 5-6 5m10 0h12M85 26h37" />
      </g>
    );
  }
  if (accent === "map") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--map">
        <path d="m84 25 12-6 12 6 12-6v29l-12 6-12-6-12 6Z" />
        <path d="M96 19v29m12-23v29" />
      </g>
    );
  }
  if (accent === "coffee") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--coffee">
        <path d="M88 29h25v20q-2 9-12 9t-13-9Z" />
        <path d="M113 35h7q8 0 3 11h-10M94 23q-5-6 1-11m8 11q-5-6 1-11" />
      </g>
    );
  }
  if (accent === "pillow") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--pillow">
        <path d="M86 25q6-8 14-3 9-5 17 3-4 11 0 22-8 8-17 3-8 5-14-3 4-11 0-22Z" />
        <path d="M93 32h16m-16 8h12" />
      </g>
    );
  }
  if (accent === "tissue") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--tissue">
        <path d="M87 35h32v22H87Z" />
        <path d="M91 35q2-15 11-10 9-6 13 10M95 45h16" />
      </g>
    );
  }
  if (accent === "medicine") {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--medicine">
        <path d="M88 32q0-8 8-8h16q8 0 8 8t-8 8H96q-8 0-8-8Z" />
        <path d="m100 24 8 16M101 48v15m-7-7h14" />
      </g>
    );
  }
  if (["helmet", "cap", "police", "nightcap", "spy"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="M35 43q3-24 29-24t29 24" />
        <path d="M27 43h74" />
        {accent === "police" ? <path d="m64 23 5 5-5 5-5-5Z" /> : null}
      </g>
    );
  }
  if (accent === "crown") {
    return (
      <path
        className="cyber-emote__accent cyber-emote__accent--crown"
        d="m42 39-5-20 17 11 10-18 10 18 17-11-5 20Z"
      />
    );
  }
  if (accent === "horns") {
    return (
      <path
        className="cyber-emote__accent cyber-emote__accent--horns"
        d="M42 40Q22 30 31 13q4 14 19 13m36 14q20-10 11-27-4 14-19 13"
      />
    );
  }
  if (["heart", "double-heart", "charm"].includes(accent)) {
    return (
      <g className="cyber-emote__accent cyber-emote__accent--heart">
        <path d={HEART_PATH} />
        {accent === "double-heart" ? (
          <path d="m26 37c-5-6-14 2-7 9l7 7 7-7c7-7-2-15-7-9Z" />
        ) : null}
      </g>
    );
  }
  if (accent === "broken-heart") {
    return (
      <path
        className="cyber-emote__accent cyber-emote__accent--heart"
        d="m96 29c-9-8-21 4-10 15l10 10 10-10c11-11-1-23-10-15Zm0 0-5 9 7 3-5 10"
      />
    );
  }
  if (["spark", "stars", "burst", "confetti", "flower"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="m26 31 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm76 37 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
        {accent === "confetti" ? (
          <path d="m22 82 7 5m72-54 7-5M44 21l-3-7m43 83 4 8" />
        ) : null}
      </g>
    );
  }
  if (["party", "gift"].includes(accent)) {
    return accent === "party" ? (
      <path
        className="cyber-emote__accent cyber-emote__accent--party"
        d="m91 49 20-32 6 38Zm6-22 12 7m-8-18 12 5"
      />
    ) : (
      <g className="cyber-emote__accent cyber-emote__accent--gift">
        <rect x="91" y="31" width="25" height="23" rx="2" />
        <path d="M103 31v23M89 38h29m-15-7q-12-9-10-15 8-1 10 15Zm0 0q12-9 10-15-8-1-10 15Z" />
      </g>
    );
  }
  if (["music", "mic", "headset"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="M97 25v21m0-15 14-4v15" />
        <circle cx="92" cy="47" r="5" />
        <circle cx="106" cy="43" r="5" />
      </g>
    );
  }
  if (["tears", "rain", "flood", "storm", "sweat"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="M35 65v25m56-25v25M22 38v16m84-19v17" />
        {accent === "storm" ? (
          <path d="m54 26 12-13-2 11h11L59 43l4-13Z" />
        ) : null}
      </g>
    );
  }
  if (["ice", "cloud", "moon", "zzz", "sleep", "dim"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        {accent === "moon" ? (
          <path d="M103 19q-15 20 7 29-27 4-25-17 2-13 18-12Z" />
        ) : null}
        {accent === "cloud" ? (
          <path d="M89 38q2-12 12-8 8-9 15 2 11 1 9 12H86q-5-3 3-6Z" />
        ) : null}
        {["zzz", "sleep"].includes(accent) ? (
          <path d="M90 48h18L92 30h18M99 24h12l-11-11h12" />
        ) : null}
        {accent === "ice" ? (
          <path d="M101 18v34m-15-8 30-18m-30 0 30 18" />
        ) : null}
        {accent === "dim" ? <path d="M91 22h25v8H91Zm0 14h17v8H91Z" /> : null}
      </g>
    );
  }
  if (accent === "question") {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="M101 18q13 0 13 10 0 7-9 10v5m0 8h.1" />
      </g>
    );
  }
  if (accent === "target" || accent === "orbit" || accent === "roll") {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <circle cx="64" cy="62" r="41" />
        <path d="M64 14v15m0 66v15M16 62h15m66 0h15" />
      </g>
    );
  }
  if (accent === "lightning") {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="m99 15-13 24h12l-8 19 25-29h-13l8-14Z" />
      </g>
    );
  }
  if (["thermometer", "nauseous", "bandage"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="M95 20v27m-5 0a5 5 0 1 0 10 0 5 5 0 1 0-10 0" />
        <path d="m18 32 18-12 8 12-18 12Z" />
      </g>
    );
  }
  if (["flame", "steam", "overheat"].includes(accent)) {
    return (
      <g className={`cyber-emote__accent cyber-emote__accent--${accent}`}>
        <path d="M96 52q-14-13 2-31-1 13 9 14 7-10 3-20 17 19 3 37Z" />
        {accent === "steam" ? (
          <path d="M28 35q-8-8 0-16m12 16q-8-8 0-16" />
        ) : null}
      </g>
    );
  }
  if (["hand", "wave", "finger-gun", "hug"].includes(accent)) {
    return (
      <path
        className={`cyber-emote__accent cyber-emote__accent--${accent}`}
        d="M19 70q-12-8-6-18l10 8-3-17 9 15 2-18 7 22-4 23m75-15q12-8 6-18l-10 8 3-17-9 15-2-18-7 22 4 23"
      />
    );
  }
  if (["ghost", "shadow", "skull"].includes(accent)) {
    return (
      <path
        className={`cyber-emote__accent cyber-emote__accent--${accent}`}
        d="M91 47q0-24 15-24t15 24v12l-5-5-5 5-5-5-5 5-5-5-5 5Zm8-12h2m10 0h2m-12 9h10"
      />
    );
  }
  return (
    <path
      className={`cyber-emote__accent cyber-emote__accent--${accent}`}
      d="M91 22h25v25H91Zm5 6h15m-15 7h10"
    />
  );
}

export function CyberAnimeEmoticon({
  emotion,
  size = "picker",
  decorative = false,
}: CyberAnimeEmoticonProps) {
  const definition = cyberDefinitionFromId(emotion) ?? CYBER_EMOTICONS[0];
  const style = {
    "--cyber-primary": definition.primary,
    "--cyber-secondary": definition.secondary,
  } as CSSProperties;

  return (
    <span
      className={`cyber-emote cyber-emote--face-${definition.face} cyber-emote--motion-${definition.motion} cyber-emote--${size}`}
      style={style}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : `${definition.label} cyber emoticon`}
      aria-hidden={decorative || undefined}
    >
      <span className="cyber-emote__float">
        <svg viewBox="0 0 128 128" focusable="false" aria-hidden="true">
          <path
            className="cyber-emote__grid"
            d="M28 24v80M46 18v92M64 14v100M82 18v92M100 24v80M24 28h80M18 46h92M14 64h100M18 82h92M24 100h80"
          />
          <circle
            className="cyber-emote__pulse cyber-emote__pulse--outer"
            cx="64"
            cy="64"
            r="52"
          />
          <circle
            className="cyber-emote__pulse cyber-emote__pulse--inner"
            cx="64"
            cy="64"
            r="46"
          />
          <path
            className="cyber-emote__frame"
            d="M26 14h76l12 12v76l-12 12H26l-12-12V26Z"
          />
          <path
            className="cyber-emote__corner"
            d="M14 42V26l12-12h16m44 0h16l12 12v16m0 44v16l-12 12H86m-44 0H26l-12-12V86"
          />
          <path
            className="cyber-emote__crosshair"
            d="M59 14h10M59 114h10M14 59v10M114 59v10"
          />
          <FaceExpression face={definition.face} />
          <CyberAccent accent={definition.accent} />
          <path className="cyber-emote__status" d="M42 100h44" />
          <path
            className="cyber-emote__status cyber-emote__status--live"
            d="M42 100h18"
          />
        </svg>
      </span>
    </span>
  );
}

export function cyberEmotionFromToken(token: string) {
  return cyberDefinitionFromToken(token)?.id;
}

export { CYBER_EMOTICONS, CYBER_EMOTICON_TOKEN_PATTERN };
