import type { CSSProperties } from "react";
import React from "react";
import { useId } from "react";
import { CuteMiniObject } from "./CuteMiniObject";
import {
  CUTE_STICKERS,
  CUTE_STICKER_TOKEN_PATTERN,
  cuteStickerDefinitionFromId,
  cuteStickerFromToken,
  cuteStickerSelectionFromToken,
  type CuteStickerMode,
} from "./cute-sticker-catalog";
import type {
  CyberAccentModel,
  CyberFaceModel,
} from "./cyber-emoticon-catalog";

type CuteStickerProps = {
  sticker: string;
  size?: "compact" | "picker" | "message";
  decorative?: boolean;
  mode?: CuteStickerMode;
};

const CLAY_BODY_PATH =
  "M21 104C11 91 15 60 25 37 35 15 51 9 66 10c20 0 37 9 44 31 8 24 6 49-5 63-13 14-71 15-84 0Z";

const HEART_PATH = "m98 23c-7-8-19 2-9 12l9 9 9-9c10-10-2-20-9-12Z";

function GlossyEye({
  cx,
  cy = 59,
  eyeGradient,
  rx = 7,
  ry = 9,
}: {
  cx: number;
  cy?: number;
  eyeGradient: string;
  rx?: number;
  ry?: number;
}) {
  return (
    <g className="cute-sticker__eye-orb">
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${eyeGradient})`} />
      <ellipse cx={cx - 2.1} cy={cy - 3.1} rx="2.1" ry="2.7" fill="#fff" />
      <circle cx={cx + 2.5} cy={cy + 2.8} r="1" fill="#8b817d" opacity=".48" />
    </g>
  );
}

function OpenMouth({
  mouthGradient,
  shocked = false,
  grin = false,
}: {
  mouthGradient: string;
  shocked?: boolean;
  grin?: boolean;
}) {
  if (shocked) {
    return (
      <g className="cute-sticker__open-mouth">
        <ellipse
          cx="64"
          cy="79"
          rx="8"
          ry="11"
          fill={`url(#${mouthGradient})`}
        />
        <ellipse
          cx="64"
          cy="85"
          rx="4.5"
          ry="2.8"
          fill="#e57b78"
          opacity=".82"
        />
      </g>
    );
  }
  return (
    <g className="cute-sticker__open-mouth">
      <path d="M48 74q16 23 32 0Z" fill={`url(#${mouthGradient})`} />
      {grin ? (
        <path d="M50 75q14 6 28 0" className="cute-sticker__teeth" />
      ) : null}
      <path d="M55 87q9-7 18 0-9 6-18 0Z" fill="#ef8580" />
    </g>
  );
}

function CuteFace({
  face,
  eyeGradient,
  mouthGradient,
}: {
  face: CyberFaceModel;
  eyeGradient: string;
  mouthGradient: string;
}) {
  const glossyEyes = (
    <>
      <GlossyEye cx={43} eyeGradient={eyeGradient} />
      <GlossyEye cx={85} eyeGradient={eyeGradient} />
    </>
  );
  let features: React.ReactNode;

  switch (face) {
    case "neutral":
      features = (
        <>
          {glossyEyes}
          <path className="cute-sticker__mouth" d="M56 77q8 8 16 0" />
        </>
      );
      break;
    case "smile":
      features = (
        <>
          {glossyEyes}
          <OpenMouth mouthGradient={mouthGradient} />
        </>
      );
      break;
    case "grin":
      features = (
        <>
          {glossyEyes}
          <OpenMouth mouthGradient={mouthGradient} grin />
        </>
      );
      break;
    case "laugh":
      features = (
        <>
          <path
            className="cute-sticker__eye"
            d="M34 60q9-10 18 0M76 60q9-10 18 0"
          />
          <OpenMouth mouthGradient={mouthGradient} />
        </>
      );
      break;
    case "wink":
      features = (
        <>
          <GlossyEye cx={43} eyeGradient={eyeGradient} />
          <path className="cute-sticker__eye" d="M76 60q9-9 18 0" />
          <path className="cute-sticker__mouth" d="M55 77q9 9 18 0" />
        </>
      );
      break;
    case "kiss":
      features = (
        <>
          <path
            className="cute-sticker__eye"
            d="M34 59q9-8 18 0M76 59q9-8 18 0"
          />
          <path className="cute-sticker__kiss-mouth" d="m58 78 6-5 6 5-6 5Z" />
        </>
      );
      break;
    case "love":
      features = (
        <>
          <path
            className="cute-sticker__heart-eye"
            d="m33 54c0-8 10-9 11-2 2-7 12-6 12 2 0 7-12 14-12 14S33 61 33 54Zm39 0c0-8 10-9 12-2 1-7 11-6 11 2 0 7-11 14-11 14S72 61 72 54Z"
          />
          <path className="cute-sticker__mouth" d="M54 78q10 11 20 0" />
        </>
      );
      break;
    case "smug":
      features = (
        <>
          <path
            className="cute-sticker__eye"
            d="M34 59q9 4 18-2M76 57q9 6 18 2"
          />
          <path className="cute-sticker__mouth" d="M53 79q14 5 23-5" />
        </>
      );
      break;
    case "cool":
      features = (
        <>
          {glossyEyes}
          <path className="cute-sticker__mouth" d="M55 79h18" />
        </>
      );
      break;
    case "confused":
      features = (
        <>
          <GlossyEye cx={43} cy={60} eyeGradient={eyeGradient} rx={6} ry={8} />
          <GlossyEye cx={85} cy={56} eyeGradient={eyeGradient} rx={7} ry={9} />
          <path className="cute-sticker__mouth" d="M53 80q6-6 12 0t12 0" />
        </>
      );
      break;
    case "skeptical":
      features = (
        <>
          <path className="cute-sticker__brow" d="M33 51l20 5m22 0 20-5" />
          {glossyEyes}
          <path className="cute-sticker__mouth" d="M55 80h18" />
        </>
      );
      break;
    case "thinking":
      features = (
        <>
          <GlossyEye cx={45} cy={58} eyeGradient={eyeGradient} rx={6} ry={8} />
          <GlossyEye cx={88} cy={56} eyeGradient={eyeGradient} rx={5} ry={7} />
          <path className="cute-sticker__brow" d="M78 46q9-6 17 0" />
          <path className="cute-sticker__mouth" d="M54 80q10-6 20 1" />
        </>
      );
      break;
    case "surprised":
      features = (
        <>
          <GlossyEye cx={42} cy={57} eyeGradient={eyeGradient} rx={9} ry={11} />
          <GlossyEye cx={86} cy={57} eyeGradient={eyeGradient} rx={9} ry={11} />
          <OpenMouth mouthGradient={mouthGradient} shocked />
        </>
      );
      break;
    case "shocked":
      features = (
        <>
          <GlossyEye
            cx={42}
            cy={56}
            eyeGradient={eyeGradient}
            rx={10}
            ry={12}
          />
          <GlossyEye
            cx={86}
            cy={56}
            eyeGradient={eyeGradient}
            rx={10}
            ry={12}
          />
          <OpenMouth mouthGradient={mouthGradient} shocked />
        </>
      );
      break;
    case "scared":
      features = (
        <>
          <path
            className="cute-sticker__brow"
            d="M32 49q10-9 20 1m24 0q10-10 20-1"
          />
          {glossyEyes}
          <path
            className="cute-sticker__worried-mouth"
            d="M51 84q13-17 26 0Z"
          />
        </>
      );
      break;
    case "sad":
      features = (
        <>
          <path
            className="cute-sticker__brow"
            d="M32 51q10-8 20 2m24 0q10-10 20-2"
          />
          {glossyEyes}
          <path className="cute-sticker__mouth" d="M52 83q12-12 24 0" />
        </>
      );
      break;
    case "cry":
      features = (
        <>
          <path
            className="cute-sticker__brow"
            d="M33 51q9-8 18 2m26 0q9-10 18-2"
          />
          {glossyEyes}
          <path className="cute-sticker__mouth" d="M52 82q12-11 24 0" />
        </>
      );
      break;
    case "sob":
      features = (
        <>
          <path
            className="cute-sticker__eye"
            d="m33 55 9 6 10-6m24 0 10 6 9-6"
          />
          <path
            className="cute-sticker__worried-mouth"
            d="M50 84q14-18 28 0Z"
          />
        </>
      );
      break;
    case "tired":
      features = (
        <>
          <path
            className="cute-sticker__eye"
            d="M34 60q9 4 18 0m24 0q9 4 18 0"
          />
          <path className="cute-sticker__mouth" d="M54 81q10-5 20 0" />
        </>
      );
      break;
    case "sleepy":
      features = (
        <>
          <path
            className="cute-sticker__eye"
            d="M34 59q9 8 18 0m24 0q9 8 18 0"
          />
          <ellipse
            cx="64"
            cy="80"
            rx="5"
            ry="6"
            fill={`url(#${mouthGradient})`}
          />
        </>
      );
      break;
    case "sick":
      features = (
        <>
          <path
            className="cute-sticker__eye"
            d="m34 54 17 9m-17 0 17-9m26 0 17 9m-17 0 17-9"
          />
          <path className="cute-sticker__mouth" d="M51 81q7-7 14 0t13 0" />
        </>
      );
      break;
    case "angry":
      features = (
        <>
          <path
            className="cute-sticker__brow cute-sticker__brow--angry"
            d="m31 48 22 8m44-8-22 8"
          />
          <GlossyEye cx={44} cy={61} eyeGradient={eyeGradient} rx={6} ry={8} />
          <GlossyEye cx={84} cy={61} eyeGradient={eyeGradient} rx={6} ry={8} />
          <path className="cute-sticker__mouth" d="M52 83q12-12 24 0" />
        </>
      );
      break;
  }

  return (
    <g className={`cute-sticker__face cute-sticker__face--${face}`}>
      <ellipse
        className="cute-sticker__cheek"
        cx="31"
        cy="73"
        rx="9"
        ry="5.5"
      />
      <ellipse
        className="cute-sticker__cheek"
        cx="97"
        cy="73"
        rx="9"
        ry="5.5"
      />
      {features}
    </g>
  );
}

function CuteHands({ pose, filterId }: { pose: number; filterId: string }) {
  const filter = `url(#${filterId})`;

  if (pose === 1) {
    return (
      <g className="cute-sticker__hands" filter={filter}>
        <ellipse
          className="cute-sticker__hand"
          cx="42"
          cy="87"
          rx="13"
          ry="15"
          transform="rotate(-18 42 87)"
        />
        <ellipse
          className="cute-sticker__hand"
          cx="86"
          cy="87"
          rx="13"
          ry="15"
          transform="rotate(18 86 87)"
        />
      </g>
    );
  }

  if (pose === 2) {
    return (
      <g className="cute-sticker__hands" filter={filter}>
        <ellipse
          className="cute-sticker__hand"
          cx="30"
          cy="72"
          rx="11"
          ry="15"
          transform="rotate(28 30 72)"
        />
        <ellipse
          className="cute-sticker__hand"
          cx="98"
          cy="72"
          rx="11"
          ry="15"
          transform="rotate(-28 98 72)"
        />
      </g>
    );
  }

  if (pose === 3) {
    return (
      <g className="cute-sticker__hands" filter={filter}>
        <ellipse
          className="cute-sticker__hand"
          cx="31"
          cy="91"
          rx="11"
          ry="14"
          transform="rotate(18 31 91)"
        />
        <path
          className="cute-sticker__hand cute-sticker__hand--point"
          d="M91 80q4-15 14-13 6 1 4 8l10-5q8-2 9 4 0 5-8 8l-12 6q-4 13-16 12-9-1-9-10 0-7 8-10Z"
        />
      </g>
    );
  }

  if (pose === 4) {
    return (
      <g className="cute-sticker__hands" filter={filter}>
        <ellipse
          className="cute-sticker__hand"
          cx="54"
          cy="91"
          rx="13"
          ry="15"
          transform="rotate(24 54 91)"
        />
        <ellipse
          className="cute-sticker__hand"
          cx="74"
          cy="91"
          rx="13"
          ry="15"
          transform="rotate(-24 74 91)"
        />
      </g>
    );
  }

  if (pose === 5) {
    return (
      <g className="cute-sticker__hands" filter={filter}>
        <path
          className="cute-sticker__hand cute-sticker__hand--chin"
          d="M37 91q-3-13 7-20 9-5 14 4l3 7 7 1q7 3 4 10-3 8-13 7l-10 6q-10 1-12-7Z"
        />
        <ellipse
          className="cute-sticker__hand"
          cx="97"
          cy="92"
          rx="10"
          ry="13"
          transform="rotate(-14 97 92)"
        />
      </g>
    );
  }

  return (
    <g className="cute-sticker__hands" filter={filter}>
      <ellipse
        className="cute-sticker__hand"
        cx="31"
        cy="88"
        rx="12"
        ry="14"
        transform="rotate(20 31 88)"
      />
      <ellipse
        className="cute-sticker__hand"
        cx="97"
        cy="90"
        rx="10"
        ry="13"
        transform="rotate(-20 97 90)"
      />
    </g>
  );
}

function CuteProp({ accent }: { accent: CyberAccentModel }) {
  if (accent === "none") return null;

  if (["scan", "dash", "glitch"].includes(accent)) {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--line"
        d="M19 42h25m45 39h23M29 24h14"
      />
    );
  }
  if (["visor", "glasses", "shades", "neon-shades"].includes(accent)) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--glasses">
        <rect x="26" y="49" width="33" height="20" rx="8" />
        <rect x="69" y="49" width="33" height="20" rx="8" />
        <path d="M59 57h10M26 53l-8-3m84 3 8-3" />
      </g>
    );
  }
  if (accent === "mask") {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--fabric"
        d="m41 70 23 7 23-7v20q-23 13-46 0Z"
      />
    );
  }
  if (["helmet", "cap", "police", "nightcap", "spy"].includes(accent)) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--hat">
        <path d="M34 42q4-25 30-25t31 25Z" />
        <path d="M27 42h75" />
        {accent === "nightcap" ? <path d="M85 18q21 3 19 22l-12-4" /> : null}
        {accent === "police" ? <path d="m64 24 6 5-6 6-6-6Z" /> : null}
      </g>
    );
  }
  if (accent === "crown") {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--gold"
        d="m39 39-4-20 18 11 11-19 11 19 18-11-4 20Z"
      />
    );
  }
  if (accent === "halo") {
    return (
      <ellipse
        className="cute-sticker__prop cute-sticker__prop--gold"
        cx="64"
        cy="19"
        rx="24"
        ry="7"
      />
    );
  }
  if (accent === "horns") {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--horn"
        d="M43 40Q22 30 30 12q5 14 20 14m36 14q21-10 13-28-5 14-20 14"
      />
    );
  }
  if (["heart", "charm", "double-heart", "broken-heart"].includes(accent)) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--heart">
        <path d={HEART_PATH} />
        {accent === "double-heart" ? (
          <path d="m27 36c-5-6-15 2-7 10l7 7 7-7c8-8-2-16-7-10Z" />
        ) : null}
        {accent === "broken-heart" ? (
          <path className="cute-sticker__prop-cut" d="m98 23-6 10 7 3-6 9" />
        ) : null}
      </g>
    );
  }
  if (
    ["spark", "stars", "burst", "confetti", "flower", "blush"].includes(accent)
  ) {
    return (
      <g className={`cute-sticker__prop cute-sticker__prop--${accent}`}>
        <path d="m23 31 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm81 37 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" />
        {accent === "flower" ? (
          <path d="M99 31c-13-8-15 9-5 9-7 11 10 14 10 3 10 7 14-9 3-10 5-11-10-14-8-2Z" />
        ) : null}
        {accent === "confetti" ? (
          <path
            className="cute-sticker__prop--line"
            d="m21 84 8 6m71-57 8-6M43 20l-3-8m43 87 4 8"
          />
        ) : null}
      </g>
    );
  }
  if (accent === "teeth") {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--teeth"
        d="M48 74h32v14H48Zm8 0v14m8-14v14m8-14v14M48 81h32"
      />
    );
  }
  if (accent === "party" || accent === "gift") {
    return accent === "party" ? (
      <path
        className="cute-sticker__prop cute-sticker__prop--party"
        d="m91 50 21-34 7 40Zm5-22 13 7m-7-19 12 5"
      />
    ) : (
      <g className="cute-sticker__prop cute-sticker__prop--gift">
        <rect x="89" y="30" width="29" height="27" rx="4" />
        <path d="M103 30v27M87 38h33m-17-8q-12-9-10-15 8 0 10 15Zm0 0q12-9 10-15-8 0-10 15Z" />
      </g>
    );
  }
  if (["music", "mic", "headset"].includes(accent)) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--music">
        <path d="M98 24v23m0-16 15-4v16" />
        <circle cx="93" cy="48" r="6" />
        <circle cx="108" cy="44" r="6" />
      </g>
    );
  }
  if (["tears", "rain", "flood", "storm", "sweat"].includes(accent)) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--water">
        <path d="M35 65q-10 18 0 25 10-7 0-25Zm57 0q-10 18 0 25 10-7 0-25ZM20 35q-7 13 0 18 7-5 0-18Zm89-2q-7 13 0 18 7-5 0-18Z" />
        {accent === "storm" ? (
          <path
            className="cute-sticker__prop--lightning"
            d="m54 27 13-14-3 12h12L59 44l5-14Z"
          />
        ) : null}
      </g>
    );
  }
  if (["roll", "target", "orbit"].includes(accent)) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--ring">
        <ellipse cx="64" cy="63" rx="49" ry="18" />
        <circle cx="108" cy="57" r="5" />
      </g>
    );
  }
  if (accent === "question") {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--line"
        d="M99 18q15 0 15 11 0 8-10 11v6m0 8h.1"
      />
    );
  }
  if (["alert", "alarm", "warning"].includes(accent)) {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--warning"
        d="m101 14 18 31H83Zm0 10v11m0 5h.1"
      />
    );
  }
  if (accent === "lightning") {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--lightning"
        d="m100 14-14 25h12l-8 20 26-31h-13l9-14Z"
      />
    );
  }
  if (accent === "bulb") {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--gold"
        d="M101 14a15 15 0 0 1 9 28q-4 3-4 8H96q0-5-4-8a15 15 0 0 1 9-28Zm-5 41h10m-8 5h6"
      />
    );
  }
  if (["terminal", "map", "battery", "empty"].includes(accent)) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--object">
        <rect x="86" y="21" width="34" height="27" rx="5" />
        {accent === "map" ? (
          <path d="m88 27 10-5 10 5 10-5v25l-10 5-10-5-10 5Z" />
        ) : (
          <path d="M93 29h10m-10 8h19" />
        )}
        {["battery", "empty"].includes(accent) ? (
          <path d="M120 29h4v11h-4" />
        ) : null}
      </g>
    );
  }
  if (
    ["cloud", "moon", "zzz", "sleep", "dim", "ice", "low-signal"].includes(
      accent
    )
  ) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--sleep">
        {accent === "moon" ? (
          <path d="M103 18q-16 21 7 30-28 5-26-17 2-14 19-13Z" />
        ) : null}
        {accent === "cloud" ? (
          <path d="M86 41q2-12 12-9 8-9 16 2 11 1 9 12H84q-5-3 2-5Z" />
        ) : null}
        {["zzz", "sleep"].includes(accent) ? (
          <path d="M89 48h20L92 29h19m-12-5h13l-12-12h13" />
        ) : null}
        {accent === "ice" ? (
          <path d="M102 17v37m-16-8 32-20m-32 0 32 20" />
        ) : null}
        {accent === "dim" ? <path d="M91 22h26v9H91Zm0 15h18v9H91Z" /> : null}
        {accent === "low-signal" ? (
          <path d="M88 46v-5m7 5V33m7 13V25m7 21V17m-23 2 28 28" />
        ) : null}
      </g>
    );
  }
  if (["coffee", "pillow", "tissue", "medicine"].includes(accent)) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--object">
        {accent === "coffee" ? (
          <path d="M88 31h26v19q-2 9-13 9T88 50Zm26 5h7q7 0 2 11h-9M95 25q-5-6 1-11m8 11q-5-6 1-11" />
        ) : null}
        {accent === "pillow" ? (
          <path d="M85 26q7-9 15-3 10-6 18 3-5 11 0 23-8 8-18 3-8 5-15-3 5-11 0-20Z" />
        ) : null}
        {accent === "tissue" ? (
          <path d="M87 36h32v23H87Zm4 0q2-16 11-10 10-7 14 10" />
        ) : null}
        {accent === "medicine" ? (
          <path d="M87 33q0-9 9-9h16q9 0 9 9t-9 9H96q-9 0-9-9Zm15-9 7 18" />
        ) : null}
      </g>
    );
  }
  if (["thermometer", "nauseous", "bandage"].includes(accent)) {
    return (
      <g className="cute-sticker__prop cute-sticker__prop--medical">
        {accent === "thermometer" ? (
          <path d="M102 18v29m-6 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0" />
        ) : null}
        {accent === "bandage" ? (
          <path d="m17 32 20-13 9 13-20 13Zm8-4 12 9m-8-13 12 9" />
        ) : null}
        {accent === "nauseous" ? (
          <path d="M91 32q7-9 14 0t14 0M93 44q12-8 24 0" />
        ) : null}
      </g>
    );
  }
  if (["flame", "steam", "overheat"].includes(accent)) {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--flame"
        d="M96 54q-14-14 2-33-1 14 10 15 7-10 3-21 18 20 3 39Zm-67-17q-8-8 0-17m12 17q-8-8 0-17"
      />
    );
  }
  if (["wave", "hand", "finger-gun", "hug"].includes(accent)) {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--hand"
        d="M20 72q-13-8-6-19l10 8-3-18 9 16 2-19 8 23-4 24m72-15q13-8 6-19l-10 8 3-18-9 16-2-19-8 23 4 24"
      />
    );
  }
  if (["ghost", "shadow", "skull"].includes(accent)) {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--ghost"
        d="M90 48q0-25 16-25t16 25v13l-5-5-6 5-5-5-5 5-6-5-5 5Zm8-12h3m10 0h3m-13 10h11"
      />
    );
  }
  if (accent === "wilt") {
    return (
      <path
        className="cute-sticker__prop cute-sticker__prop--flower"
        d="M101 56q-6 23-21 34m15-18q-10-1-13-9m20-7q8 0 10-9m-7-10q12 2 7 13-12 2-16-7 0-9 9-6Z"
      />
    );
  }

  return <circle className="cute-sticker__prop" cx="104" cy="31" r="11" />;
}

export function CuteSticker({
  sticker,
  size = "picker",
  decorative = false,
  mode = "interactive",
}: CuteStickerProps) {
  const definition = cuteStickerDefinitionFromId(sticker) ?? CUTE_STICKERS[0];
  const reactId = useId().replace(/:/g, "");
  const bodyGradient = `cute-body-${reactId}`;
  const eyeGradient = `cute-eye-${reactId}`;
  const mouthGradient = `cute-mouth-${reactId}`;
  const texturePattern = `cute-texture-${reactId}`;
  const clayFilter = `cute-clay-${reactId}`;
  const propFilter = `cute-prop-${reactId}`;
  const signature = definition.motionSignature;
  const style = {
    "--cute-body": definition.body,
    "--cute-body-deep": definition.bodyDeep,
    "--cute-prop": definition.prop,
    "--cute-duration": `${signature.durationMs}ms`,
    "--cute-delay": `${signature.delayMs}ms`,
    "--cute-x": `${signature.travelX}px`,
    "--cute-x-neg": `${-signature.travelX}px`,
    "--cute-y": `${signature.travelY}px`,
    "--cute-y-neg": `${-signature.travelY}px`,
    "--cute-y-lift": `${(-signature.travelY * 0.65).toFixed(2)}px`,
    "--cute-rotate": `${signature.rotateDeg}deg`,
    "--cute-rotate-neg": `${-signature.rotateDeg}deg`,
    "--cute-scale": signature.scalePeak,
    "--cute-pivot-x": `${signature.pivotX}%`,
    "--cute-pivot-y": `${signature.pivotY}%`,
  } as CSSProperties;

  return (
    <span
      className={`cute-sticker cute-sticker--${mode} cute-sticker--action-${signature.family} cute-sticker--${size}`}
      style={style}
      data-motion-signature={mode === "interactive" ? signature.key : undefined}
      role={decorative ? undefined : "img"}
      aria-label={
        decorative
          ? undefined
          : `${definition.label} ${mode === "interactive" ? "interactive" : "standard"} cute sticker`
      }
      aria-hidden={decorative || undefined}
    >
      <span className="cute-sticker__float">
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
            <pattern
              id={texturePattern}
              width="128"
              height="128"
              patternUnits="userSpaceOnUse"
            >
              <image
                href="/assets/cute-clay-microtexture.png"
                width="128"
                height="128"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
            <filter
              id={clayFilter}
              x="-25%"
              y="-25%"
              width="150%"
              height="165%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency=".72"
                numOctaves="2"
                seed={17 + definition.shape}
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="saturate"
                values="0"
                result="mono"
              />
              <feComponentTransfer in="mono" result="grain">
                <feFuncA type="table" tableValues="0 .095" />
              </feComponentTransfer>
              <feBlend
                in="SourceGraphic"
                in2="grain"
                mode="soft-light"
                result="textured"
              />
              <feDropShadow
                in="textured"
                dx="0"
                dy="4.2"
                stdDeviation="3.1"
                floodColor="#4a372c"
                floodOpacity=".34"
              />
            </filter>
            <filter
              id={propFilter}
              x="-35%"
              y="-35%"
              width="170%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="2.2"
                stdDeviation="1.45"
                floodColor="#4c352a"
                floodOpacity=".3"
              />
            </filter>
          </defs>
          <ellipse
            className="cute-sticker__shadow"
            cx="64"
            cy="112"
            rx="43"
            ry="7"
          />
          {definition.object ? (
            <g filter={`url(#${clayFilter})`}>
              <CuteMiniObject object={definition.object} />
              <ellipse
                className="cute-object__highlight"
                cx="46"
                cy="34"
                rx="16"
                ry="8"
                transform="rotate(-24 46 34)"
              />
            </g>
          ) : (
            <>
              <path
                className="cute-sticker__body"
                fill={`url(#${bodyGradient})`}
                filter={`url(#${clayFilter})`}
                d={CLAY_BODY_PATH}
              />
              <path
                className="cute-sticker__texture"
                fill={`url(#${texturePattern})`}
                d={CLAY_BODY_PATH}
              />
              <path className="cute-sticker__body-rim" d={CLAY_BODY_PATH} />
              <ellipse
                className="cute-sticker__highlight"
                cx="45"
                cy="29"
                rx="15"
                ry="8"
                transform="rotate(-24 45 29)"
              />
              <CuteHands pose={definition.shape} filterId={propFilter} />
              <CuteFace
                face={definition.face}
                eyeGradient={eyeGradient}
                mouthGradient={mouthGradient}
              />
              <g filter={`url(#${propFilter})`}>
                <CuteProp accent={definition.accent} />
              </g>
            </>
          )}
        </svg>
      </span>
    </span>
  );
}

export {
  CUTE_STICKERS,
  CUTE_STICKER_TOKEN_PATTERN,
  cuteStickerFromToken,
  cuteStickerSelectionFromToken,
};
