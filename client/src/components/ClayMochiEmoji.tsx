import type { CSSProperties } from "react";
import React from "react";
import { useId } from "react";
import { CuteMiniObject } from "./CuteMiniObject";
import {
  CLAY_MOCHI_STICKERS,
  clayMochiDefinitionFromId,
  type ClayMochiMode,
} from "./clay-mochi-catalog";

type ClayMochiEmojiProps = {
  sticker: string;
  size?: "compact" | "picker" | "message";
  decorative?: boolean;
  mode?: ClayMochiMode;
};

const CLAY_BODY_PATH =
  "M21 104C11 91 15 60 25 37 35 15 51 9 66 10c20 0 37 9 44 31 8 24 6 49-5 63-13 14-71 15-84 0Z";

function ClayBlobFace({ face, eyeGradient, mouthGradient }: { face: string; eyeGradient: string; mouthGradient: string }) {
  const glossyEyes = (
    <>
      <ellipse cx="43" cy="59" rx="7" ry="9" fill={`url(#${eyeGradient})`} />
      <ellipse cx="43" cy="56" rx="2.1" ry="2.7" fill="#fff" />
      <circle cx="45.5" cy="61.8" r="1" fill="#8b817d" opacity=".48" />
      <ellipse cx="85" cy="59" rx="7" ry="9" fill={`url(#${eyeGradient})`} />
      <ellipse cx="85" cy="56" rx="2.1" ry="2.7" fill="#fff" />
      <circle cx="87.5" cy="61.8" r="1" fill="#8b817d" opacity=".48" />
    </>
  );

  let features: React.ReactNode;

  switch (face) {
    case "smile":
      features = <>{glossyEyes}<path d="M56 77q8 8 16 0" /></>;
      break;
    case "grin":
      features = <>{glossyEyes}<path d="M48 74q16 16 32 0Z" fill={`url(#${mouthGradient})`} /><path d="M50 75q14 6 28 0" /></>;
      break;
    case "laugh":
      features = <><path d="M34 60q9-10 18 0M76 60q9-10 18 0" /><path d="M48 72q16 22 32 0Z" fill={`url(#${mouthGradient})`} /></>;
      break;
    case "wink":
      features = <>{glossyEyes}<path d="M76 60q9-9 18 0" /><path d="M55 77q9 9 18 0" /></>;
      break;
    case "kiss":
      features = <><path d="M34 59q9-8 18 0M76 59q9-8 18 0" /><path d="m58 78 6-5 6 5-6 5Z" /></>;
      break;
    case "love":
      features = <><path d="m33 54c0-8 10-9 11-2 2-7 12-6 12 2 0 7-12 14-12 14S33 61 33 54Zm39 0c0-8 10-9 12-2 1-7 11-6 11 2 0 7-11 14-11 14S72 61 72 54Z" fill={`url(#${mouthGradient})`} /><path d="M54 78q10 11 20 0" /></>;
      break;
    case "smug":
      features = <><path d="M34 59q9 4 18-2M76 57q9 6 18 2" /><path d="M53 79q14 5 23-5" /></>;
      break;
    case "cool":
      features = <>{glossyEyes}<path d="M55 79h18" /></>;
      break;
    case "confused":
      features = <><ellipse cx="43" cy="60" rx="6" ry="8" fill={`url(#${eyeGradient})`} /><ellipse cx="85" cy="56" rx="7" ry="9" fill={`url(#${eyeGradient})`} /><path d="M53 80q6-6 12 0t12 0" /></>;
      break;
    case "skeptical":
      features = <><path d="M33 51l20 5m22 0 20-5" />{glossyEyes}<path d="M55 80h18" /></>;
      break;
    case "thinking":
      features = <><ellipse cx="45" cy="58" rx="6" ry="8" fill={`url(#${eyeGradient})`} /><ellipse cx="88" cy="56" rx="5" ry="7" fill={`url(#${eyeGradient})`} /><path d="M78 46q9-6 17 0" /><path d="M54 80q10-6 20 1" /></>;
      break;
    case "surprised":
      features = <><ellipse cx="42" cy="57" rx="9" ry="11" fill={`url(#${eyeGradient})`} /><ellipse cx="86" cy="57" rx="9" ry="11" fill={`url(#${eyeGradient})`} /><ellipse cx="64" cy="79" rx="8" ry="11" fill={`url(#${mouthGradient})`} /></>;
      break;
    case "shocked":
      features = <><ellipse cx="42" cy="56" rx="10" ry="12" fill={`url(#${eyeGradient})`} /><ellipse cx="86" cy="56" rx="10" ry="12" fill={`url(#${eyeGradient})`} /><ellipse cx="64" cy="79" rx="8" ry="12" fill={`url(#${mouthGradient})`} /></>;
      break;
    case "scared":
      features = <><path d="M32 49q10-9 20 1m24 0q10-10 20-1" />{glossyEyes}<path d="M51 84q13-17 26 0Z" /></>;
      break;
    case "sad":
      features = <><path d="M32 51q10-8 20 2m24 0q10-10 20-2" />{glossyEyes}<path d="M52 83q12-12 24 0" /></>;
      break;
    case "cry":
      features = <><path d="M33 51q9-8 18 2m26 0q9-10 18-2" />{glossyEyes}<path d="M52 82q12-11 24 0" /></>;
      break;
    case "sob":
      features = <><path d="m33 55 9 6 10-6m24 0 10 6 9-6" /><path d="M50 84q14-18 28 0Z" /></>;
      break;
    case "tired":
      features = <>{glossyEyes}<path d="M54 81q10-5 20 0" /></>;
      break;
    case "sleepy":
      features = <><path d="M34 59q9 8 18 0m24 0q9 8 18 0" /><ellipse cx="64" cy="80" rx="5" ry="6" fill={`url(#${mouthGradient})`} /></>;
      break;
    case "sick":
      features = <><path d="m34 54 17 9m-17 0 17-9m26 0 17 9m-17 0 17-9" /><path d="M51 81q7-7 14 0t13 0" /></>;
      break;
    case "angry":
      features = <><path d="m31 48 22 8m44-8-22 8" /><ellipse cx="44" cy="61" rx="6" ry="8" fill={`url(#${eyeGradient})`} /><ellipse cx="84" cy="61" rx="6" ry="8" fill={`url(#${eyeGradient})`} /><path d="M52 83q12-12 24 0" /></>;
      break;
    case "neutral":
    default:
      features = <>{glossyEyes}<path d="M56 77q8 8 16 0" /></>;
  }

  return <g className="clay-blob__face">{features}</g>;
}

function ClayAccent({ accent, propFilter }: { accent: string; propFilter: string }) {
  if (accent === "none") return null;

  if (["tears", "rain", "flood", "sweat"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--water" filter={`url(#${propFilter})`}>
        <path d="M35 65q-10 18 0 25 10-7 0-25Zm57 0q-10 18 0 25 10-7 0-25ZM20 35q-7 13 0 18 7-5 0-18Zm89-2q-7 13 0 18 7-5 0-18Z" />
      </g>
    );
  }
  if (["cloud", "zzz", "sleep", "dim"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--sleep" filter={`url(#${propFilter})`}>
        {accent === "cloud" ? <path d="M86 41q2-12 12-9 8-9 16 2 11 1 9 12H84q-5-3 2-5Z" /> : null}
        {["zzz", "sleep"].includes(accent) ? <path d="M89 48h20L92 29h19m-12-5h13l-12-12h13" /> : null}
        {accent === "dim" ? <path d="M91 22h26v9H91Zm0 15h18v9H91Z" /> : null}
      </g>
    );
  }
  if (["heart", "double-heart", "charm"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--heart" filter={`url(#${propFilter})`}>
        <path d="m98 23c-7-8-19 2-9 12l9 9 9-9c10-10-2-20-9-12Z" />
        {accent === "double-heart" ? <path d="m27 36c-5-6-15 2-7 10l7 7 7-7c8-8-2-16-7-10Z" /> : null}
      </g>
    );
  }
  if (["spark", "stars", "burst", "confetti", "flower", "blush"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--spark" filter={`url(#${propFilter})`}>
        <path d="m23 31 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm81 37 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" />
        {accent === "flower" ? <path d="M99 31c-13-8-15 9-5 9-7 11 10 14 10 3 10 7 14-9 3-10 5-11-10-14-8-2Z" /> : null}
        {accent === "blush" ? <path d="m27 72 9-5m-5 12 9-5m61-7-9 5m5 7-9-5" /> : null}
      </g>
    );
  }
  if (accent === "halo") {
    return <ellipse className="clay-blob__accent clay-blob__accent--halo" cx="64" cy="19" rx="24" ry="7" filter={`url(#${propFilter})`} />;
  }
  if (accent === "horns") {
    return <path className="clay-blob__accent clay-blob__accent--horns" d="M43 40Q22 30 30 12q5 14 20 14m36 14q21-10 13-28-5 14-20 14" filter={`url(#${propFilter})`} />;
  }
  if (["helmet", "cap", "police", "nightcap", "spy"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--hat" filter={`url(#${propFilter})`}>
        <path d="M34 42q4-25 30-25t31 25Z" />
        <path d="M27 42h75" />
      </g>
    );
  }
  if (["visor", "glasses", "shades"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--glasses" filter={`url(#${propFilter})`}>
        <rect x="26" y="49" width="33" height="20" rx="8" />
        <rect x="69" y="49" width="33" height="20" rx="8" />
        <path d="M59 57h10M26 53l-8-3m84 3 8-3" />
      </g>
    );
  }
  if (accent === "mask") {
    return <path className="clay-blob__accent clay-blob__accent--fabric" d="m41 70 23 7 23-7v20q-23 13-46 0Z" filter={`url(#${propFilter})`} />;
  }
  if (["flame", "steam", "overheat"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--flame" filter={`url(#${propFilter})`}>
        <path d="M96 54q-14-14 2-33-1 14 10 15 7-10 3-21 18 20 3 39Zm-67-17q-8-8 0-17m12 17q-8-8 0-17" />
      </g>
    );
  }
  if (["music", "mic", "headset"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--music" filter={`url(#${propFilter})`}>
        <path d="M98 24v23m0-16 15-4v16" />
        <circle cx="93" cy="48" r="6" />
        <circle cx="108" cy="44" r="6" />
      </g>
    );
  }
  if (accent === "lightning") {
    return <path className="clay-blob__accent clay-blob__accent--lightning" d="m100 14-14 25h12l-8 20 26-31h-13l9-14Z" filter={`url(#${propFilter})`} />;
  }
  if (["alert", "alarm", "warning"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--warning" filter={`url(#${propFilter})`}>
        <path d="m101 14 18 31H83Z" />
        <path d="M101 24v10m0 5h.1" />
      </g>
    );
  }
  if (accent === "question") {
    return <path className="clay-blob__accent clay-blob__accent--line" d="M99 18q15 0 15 11 0 8-10 11v6m0 8h.1" filter={`url(#${propFilter})`} />;
  }
  if (accent === "bulb") {
    return <path className="clay-blob__accent clay-blob__accent--gold" d="M101 14a15 15 0 0 1 9 28q-4 3-4 8H96q0-5-4-8a15 15 0 0 1 9-28Zm-5 41h10m-8 5h6" filter={`url(#${propFilter})`} />;
  }
  if (["terminal", "map", "battery", "empty"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--object" filter={`url(#${propFilter})`}>
        <rect x="86" y="21" width="34" height="27" rx="5" />
        <path d="M93 29h10m-10 8h19" />
        {accent === "battery" || accent === "empty" ? <path d="M120 29h4v11h-4" /> : null}
      </g>
    );
  }
  if (["wave", "hand", "finger-gun", "hug"].includes(accent)) {
    return (
      <path className="clay-blob__accent clay-blob__accent--hand" d="M20 72q-13-8-6-19l10 8-3-18 9 16 2-19 8 23-4 24m72-15q13-8 6-19l-10 8 3-18-9 16-2-19-8 23 4 24" filter={`url(#${propFilter})`} />
    );
  }
  if (["ghost", "shadow", "skull"].includes(accent)) {
    return (
      <path className="clay-blob__accent clay-blob__accent--ghost" d="M90 48q0-25 16-25t16 25v13l-5-5-6 5-5-5-5 5-6-5-5 5Zm8-12h3m10 0h3m-13 10h11" filter={`url(#${propFilter})`} />
    );
  }
  if (["ice", "thermometer", "nauseous", "bandage", "medicine", "coffee", "pillow", "tissue"].includes(accent)) {
    return (
      <g className="clay-blob__accent clay-blob__accent--object" filter={`url(#${propFilter})`}>
        {accent === "ice" ? <path d="M102 17v37m-16-8 32-20m-32 0 32 20" /> : null}
        {accent === "thermometer" ? <path d="M102 18v29m-6 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0" /> : null}
        {accent === "nauseous" ? <path d="M91 32q7-9 14 0t14 0M93 44q12-8 24 0" /> : null}
        {accent === "bandage" ? <path d="m17 32 20-13 9 13-20 13Zm8-4 12 9m-8-13 12 9" /> : null}
        {accent === "medicine" ? <path d="M87 33q0-9 9-9h16q9 0 9 9t-9 9H96q-9 0-9-9Zm15-9 7 18" /> : null}
        {accent === "coffee" ? <path d="M88 31h26v19q-2 9-13 9T88 50Zm26 5h7q7 0 2 11h-9M95 25q-5-6 1-11m8 11q-5-6 1-11" /> : null}
        {accent === "pillow" ? <path d="M85 26q7-9 15-3 10-6 18 3-5 11 0 23-8 8-18 3-8 5-15-3 5-11 0-20Z" /> : null}
        {accent === "tissue" ? <path d="M87 36h32v23H87Zm4 0q2-16 11-10 10-7 14 10" /> : null}
      </g>
    );
  }
  if (accent === "target" || accent === "orbit" || accent === "roll") {
    return (
      <g className="clay-blob__accent clay-blob__accent--ring" filter={`url(#${propFilter})`}>
        <ellipse cx="64" cy="63" rx="49" ry="18" />
        <circle cx="108" cy="57" r="5" />
      </g>
    );
  }
  if (accent === "glitch") {
    return (
      <g className="clay-blob__accent clay-blob__accent--line" filter={`url(#${propFilter})`}>
        <path d="M19 42h25m45 39h23M29 24h14" />
      </g>
    );
  }
  return <circle className="clay-blob__prop" cx="104" cy="31" r="11" filter={`url(#${propFilter})`} />;
}

function ClayStaticObject({ object, body, bodyDeep, prop, clayFilter, propFilter }: { object: string; body: string; bodyDeep: string; prop: string; clayFilter: string; propFilter: string }) {
  if (object === "clay-heart") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="m64 103 37-36C128 33 96 1 64 30c-32-29-60 3-36 27Z" /><path className="clay-static__rim" d="m64 103 37-36C128 33 96 1 64 30c-32-29-60 3-36 27Z" /></>;
  }
  if (object === "clay-star") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M64 14l10 30h32l-26 20 10 32-26-20-26 20 10-32-26-20h32Z" /><path className="clay-static__rim" d="M64 14l10 30h32l-26 20 10 32-26-20-26 20 10-32-26-20h32Z" /></>;
  }
  if (object === "clay-spark") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="m64 10 8 24h24l-20 16 8 26-20-16-20 16 8-26-20-16h24Z" /><path className="clay-static__rim" d="m64 10 8 24h24l-20 16 8 26-20-16-20 16 8-26-20-16h24Z" /></>;
  }
  if (object === "clay-bomb") {
    return <><circle className="clay-static__body" cx="64" cy="72" r="30" fill={`url(#${body})`} filter={`url(#${clayFilter})`} /><path d="M64 42v-20m0 0h10m-10 0h-10" stroke={prop} strokeWidth="4" strokeLinecap="round" /><circle cx="74" cy="32" r="4" fill={prop} /></>;
  }
  if (object === "clay-poop") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M64 110q-20-30-10-55 5-15 20-15t20 15q10 25-10 55Z" /><path className="clay-static__rim" d="M64 110q-20-30-10-55 5-15 20-15t20 15q10 25-10 55Z" /></>;
  }
  if (object === "clay-apple") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M64 110q-25-40-5-65 10-10 25-10t25 10q20 25-5 65Z" /><path d="M64 45v-10m0 0q10-5 15 0" stroke={prop} strokeWidth="4" strokeLinecap="round" /></>;
  }
  if (object === "clay-cherry") {
    return <><circle className="clay-static__body" cx="44" cy="78" r="16" fill={`url(#${body})`} filter={`url(#${clayFilter})`} /><circle className="clay-static__body" cx="84" cy="78" r="16" fill={`url(#${body})`} filter={`url(#${clayFilter})`} /><path d="M60 62q10-15 20-5t-10 25" stroke={prop} strokeWidth="3" fill="none" /></>;
  }
  if (object === "clay-beer") {
    return <><rect className="clay-static__body" x="32" y="45" width="24" height="45" rx="6" fill={`url(#${body})`} filter={`url(#${clayFilter})`} /><rect className="clay-static__body" x="72" y="45" width="24" height="45" rx="6" fill={`url(#${body})`} filter={`url(#${clayFilter})`} /><path d="M56 55h16M60 65h8" stroke={prop} strokeWidth="2" /><path d="M96 55h8v8h-8Z" /></>;
  }
  if (object === "clay-wine") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M54 45h20v10q5 10-5 15-15 5-15-15V45Zm0 0h20" /><path d="M64 45v35" stroke={prop} strokeWidth="2" /><circle cx="64" cy="42" r="4" fill={prop} /></>;
  }
  if (object === "clay-party") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M30 90q0-40 34-40t34 40v10H30Z" /><path className="clay-static__rim" d="M30 90q0-40 34-40t34 40v10H30Z" /><path d="M64 50v-25m0 0l8 8m-8-8l-8 8" stroke={prop} strokeWidth="4" strokeLinecap="round" /></>;
  }
  if (object === "clay-flame") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M64 110q-30-40-5-70 15-15 25-5 20 20 5 50-10 15-25 25Z" /><path className="clay-static__rim" d="M64 110q-30-40-5-70 15-15 25-5 20 20 5 50-10 15-25 25Z" /></>;
  }
  if (object === "clay-thumbs-up") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M40 95q-5-25 5-40 10-15 25-15h15v10h-10q-5 0-5 5v25h30v15H70v15h-15v15H40Z" /></>;
  }
  if (object === "clay-thumbs-down") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M40 35v60h15v-15h10q5 0 5-5V35q0-5-5-5H45q-5 0-10 5Z" /></>;
  }
  if (object === "cat-face") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M64 110q-30-20-30-50t30-50 30 50-30 50Z" /><path d="M31 55 35 20l29 25m36-25 4 35" stroke={bodyDeep} strokeWidth="4" /></>;
  }
  if (object === "dog-face") {
    return <><path className="clay-static__body" fill={`url(#${body})`} filter={`url(#${clayFilter})`} d="M64 110q-30-20-30-50t30-50 30 50-30 50Z" /><ellipse cx="44" cy="72" rx="6" ry="9" fill={bodyDeep} /><ellipse cx="84" cy="72" rx="6" ry="9" fill={bodyDeep} /><ellipse cx="64" cy="88" rx="10" ry="7" fill={bodyDeep} /></>;
  }
  return <CuteMiniObject object={object as any} />;
}

export function ClayMochiEmoji({
  sticker,
  size = "picker",
  decorative = false,
  mode = "interactive",
}: ClayMochiEmojiProps) {
  const definition = clayMochiDefinitionFromId(sticker) ?? CLAY_MOCHI_STICKERS[0];
  const reactId = useId().replace(/:/g, "");
  const bodyGradient = `clay-body-${reactId}`;
  const eyeGradient = `clay-eye-${reactId}`;
  const mouthGradient = `clay-mouth-${reactId}`;
  const texturePattern = `clay-texture-${reactId}`;
  const clayFilter = `clay-filter-${reactId}`;
  const propFilter = `clay-prop-${reactId}`;
  const signature = definition.motionSignature;
  const style = {
    "--clay-body": definition.body,
    "--clay-body-deep": definition.bodyDeep,
    "--clay-prop": definition.prop,
    "--clay-duration": `${signature.durationMs}ms`,
    "--clay-delay": `${signature.delayMs}ms`,
    "--clay-x": `${signature.travelX}px`,
    "--clay-x-neg": `${-signature.travelX}px`,
    "--clay-y": `${signature.travelY}px`,
    "--clay-y-neg": `${-signature.travelY}px`,
    "--clay-y-lift": `${(-signature.travelY * 0.65).toFixed(2)}px`,
    "--clay-rotate": `${signature.rotateDeg}deg`,
    "--clay-rotate-neg": `${-signature.rotateDeg}deg`,
    "--clay-scale": signature.scalePeak,
    "--clay-pivot-x": `${signature.pivotX}%`,
    "--clay-pivot-y": `${signature.pivotY}%`,
  } as CSSProperties;

  const isStable = definition.stable === true;

  return (
    <span
      className={`clay-mochi clay-mochi--${mode} clay-mochi--${isStable ? "stable" : signature.family} clay-mochi--${size}`}
      style={style}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : `${definition.label} clay mochi emoji`}
      aria-hidden={decorative || undefined}
    >
      <span className="clay-mochi__float">
        <svg viewBox="0 0 128 128" focusable="false" aria-hidden="true">
          <defs>
            <radialGradient id={bodyGradient} cx="34%" cy="24%" r="82%">
              <stop offset="0" stopColor="#fffdf8" stopOpacity=".58" />
              <stop offset=".18" stopColor={definition.body} />
              <stop offset=".72" stopColor={definition.body} />
              <stop offset="1" stopColor={definition.bodyDeep} />
            </radialGradient>
            <radialGradient id={eyeGradient} cx="31%" cy="23%" r="74%">
              <stop offset="0" stopColor="#514b48" />
              <stop offset=".34" stopColor="#211e1c" />
              <stop offset="1" stopColor="#090807" />
            </radialGradient>
            <radialGradient id={mouthGradient} cx="50%" cy="25%" r="78%">
              <stop offset="0" stopColor="#54241e" />
              <stop offset="1" stopColor="#190c0a" />
            </radialGradient>
            <pattern id={texturePattern} width="128" height="128" patternUnits="userSpaceOnUse">
              <image href="/assets/cute-clay-microtexture.png" width="128" height="128" preserveAspectRatio="xMidYMid slice" />
            </pattern>
            <filter id={clayFilter} x="-25%" y="-25%" width="150%" height="165%">
              <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" seed={17 + definition.shape} result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
              <feComponentTransfer in="mono" result="grain">
                <feFuncA type="table" tableValues="0 .095" />
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="grain" mode="soft-light" result="textured" />
              <feDropShadow in="textured" dx="0" dy="4.2" stdDeviation="3.1" floodColor="#4a372c" floodOpacity=".34" />
            </filter>
            <filter id={propFilter} x="-35%" y="-35%" width="170%" height="180%">
              <feDropShadow dx="0" dy="2.2" stdDeviation="1.45" floodColor="#4c352a" floodOpacity=".3" />
            </filter>
          </defs>
          <ellipse className="clay-mochi__shadow" cx="64" cy="112" rx="43" ry="7" />
          {definition.object ? (
            <g filter={`url(#${clayFilter})`}>
              <ClayStaticObject object={definition.object} body={bodyGradient} bodyDeep={definition.bodyDeep} prop={definition.prop} clayFilter={clayFilter} propFilter={propFilter} />
            </g>
          ) : (
            <>
              <path className="clay-mochi__body" fill={`url(#${bodyGradient})`} filter={`url(#${clayFilter})`} d={CLAY_BODY_PATH} />
              <path className="clay-mochi__texture" fill={`url(#${texturePattern})`} d={CLAY_BODY_PATH} />
              <path className="clay-mochi__body-rim" d={CLAY_BODY_PATH} />
              <ellipse className="clay-mochi__highlight" cx="45" cy="29" rx="15" ry="8" transform="rotate(-24 45 29)" />
              <ClayBlobFace face={definition.face} eyeGradient={eyeGradient} mouthGradient={mouthGradient} />
              <g filter={`url(#${propFilter})`}>
                <ClayAccent accent={definition.accent} propFilter={propFilter} />
              </g>
            </>
          )}
        </svg>
      </span>
    </span>
  );
}

export { CLAY_MOCHI_STICKERS, type ClayMochiMode };
