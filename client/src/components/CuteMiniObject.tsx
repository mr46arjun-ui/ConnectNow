import React from "react";
import type { CuteObjectModel } from "./cute-sticker-catalog";

const BIRDS: readonly CuteObjectModel[] = [
  "bluebird",
  "chick",
  "chicken",
  "dove",
  "duck",
  "eagle",
  "penguin",
  "owl",
];

const SMALL_CREATURES: readonly CuteObjectModel[] = [
  "bee",
  "crab",
  "octopus",
  "snail",
  "snake",
  "turtle",
  "whale",
  "shy-alien",
];

const CAT_LIKE: readonly CuteObjectModel[] = [
  "corgi",
  "fox",
  "ginger-cat",
  "love-cat",
  "tiger",
  "fox-face",
  "cloud-cat",
  "white-cat",
];

const LONG_EARS: readonly CuteObjectModel[] = ["rabbit", "spark-bunny"];
const HORNED: readonly CuteObjectModel[] = ["cow", "mountain-goat", "reindeer"];

function MiniFace() {
  return (
    <g className="cute-object__face">
      <g className="cute-object__bead-eye">
        <ellipse cx="48" cy="62" rx="4.6" ry="6" fill="#1b1816" />
        <ellipse cx="47" cy="60.6" rx="1.5" ry="2" fill="#fff" />
      </g>
      <g className="cute-object__bead-eye">
        <ellipse cx="80" cy="62" rx="4.6" ry="6" fill="#1b1816" />
        <ellipse cx="79" cy="60.6" rx="1.5" ry="2" fill="#fff" />
      </g>
      <path d="M55 77q9 9 18 0" />
    </g>
  );
}

function MiniHighlight({ x = 46, y = 38, rx = 14, ry = 6 }: { x?: number; y?: number; rx?: number; ry?: number }) {
  return (
    <ellipse
      className="cute-object__highlight"
      cx={x}
      cy={y}
      rx={rx}
      ry={ry}
      transform={`rotate(-24 ${x} ${y})`}
    />
  );
}

export function CuteMiniObject({ object }: { object: CuteObjectModel }) {
  if (object === "blue-heart" || object === "broken-heart") {
    return (
      <g className={`cute-object cute-object--${object}`}>
        <MiniHighlight x={42} y={36} rx={16} ry={7} />
        <path
          className="cute-object__heart"
          d="M64 103 27 67C3 43 35 11 64 40c29-29 61 3 37 27Z"
        />
        {object === "broken-heart" ? (
          <path className="cute-object__detail" d="m65 38-9 24 14 5-11 33" />
        ) : null}
      </g>
    );
  }

  if (object === "warm-hug") {
    return (
      <g className="cute-object cute-object--warm-hug">
        <MiniHighlight x={44} y={40} rx={16} ry={7} />
        <circle className="cute-object__body" cx="49" cy="68" r="29" />
        <circle className="cute-object__body-alt" cx="79" cy="68" r="29" />
        <path
          className="cute-object__detail"
          d="M27 80q37 28 74 0M39 61h4m18 0h4m17 0h4"
        />
        <path
          className="cute-object__heart"
          d="m64 42c-6-8-18 2-9 11l9 9 9-9c9-9-3-19-9-11Z"
        />
      </g>
    );
  }

  if (
    ["birthday-cake", "pizza", "cheese", "ice-cream", "rainbow-jelly"].includes(
      object
    )
  ) {
    return (
      <g className={`cute-object cute-object--${object}`}>
        <MiniHighlight x={48} y={40} rx={16} ry={7} />
        {object === "birthday-cake" ? (
          <>
            <path className="cute-object__treat" d="M28 57h72v46H28Z" />
            <path
              className="cute-object__icing"
              d="M28 67q9 11 18 0 9 11 18 0 9 11 18 0 9 11 18 0V50H28Z"
            />
            <path
              className="cute-object__detail"
              d="M43 50V30m21 20V25m21 25V30"
            />
            <path
              className="cute-object__flame"
              d="M43 30q-7-8 0-15 7 7 0 15Zm21-5q-7-8 0-15 7 7 0 15Zm21 5q-7-8 0-15 7 7 0 15Z"
            />
          </>
        ) : null}
        {object === "pizza" ? (
          <>
            <path className="cute-object__treat" d="m64 17 42 87H22Z" />
            <path className="cute-object__crust" d="M28 92q36 19 72 0" />
            <circle className="cute-object__topping" cx="55" cy="61" r="7" />
            <circle className="cute-object__topping" cx="75" cy="78" r="7" />
          </>
        ) : null}
        {object === "cheese" ? (
          <>
            <path className="cute-object__treat" d="m23 92 73-66 10 79H23Z" />
            <circle className="cute-object__hole" cx="68" cy="66" r="8" />
            <circle className="cute-object__hole" cx="88" cy="89" r="6" />
          </>
        ) : null}
        {object === "ice-cream" ? (
          <>
            <path className="cute-object__cone" d="M45 63h38l-19 50Z" />
            <circle className="cute-object__icing" cx="64" cy="49" r="25" />
            <circle className="cute-object__icing" cx="48" cy="58" r="14" />
            <circle className="cute-object__icing" cx="80" cy="58" r="14" />
          </>
        ) : null}
        {object === "rainbow-jelly" ? (
          <>
            <path
              className="cute-object__jelly"
              d="M28 102q-9-74 36-74t36 74q-9 10-18 0-9 10-18 0-9 10-18 0-9 10-18 0Z"
            />
            <path
              className="cute-object__rainbow"
              d="M36 85q28-46 56 0M42 89q22-34 44 0M49 93q15-22 30 0"
            />
          </>
        ) : null}
        <MiniFace />
      </g>
    );
  }

  if (
    [
      "pine-tree",
      "campfire",
      "gift",
      "toy-blaster",
      "check",
      "no-cross",
      "strong-left",
      "strong-right",
    ].includes(object)
  ) {
    return (
      <g className={`cute-object cute-object--${object}`}>
        <MiniHighlight x={48} y={40} rx={14} ry={6} />
        {object === "pine-tree" ? (
          <>
            <path className="cute-object__trunk" d="M57 87h14v26H57Z" />
            <path
              className="cute-object__nature"
              d="M64 14 33 55h18L27 89h74L77 55h18Z"
            />
          </>
        ) : null}
        {object === "campfire" ? (
          <>
            <path
              className="cute-object__detail"
              d="m31 100 66-20m-66 0 66 20"
            />
            <path
              className="cute-object__flame"
              d="M64 95q-36-20-9-63 0 22 16 21 14-17 6-34 31 33 8 66-9 13-21 10Z"
            />
          </>
        ) : null}
        {object === "gift" ? (
          <>
            <rect
              className="cute-object__gift"
              x="24"
              y="47"
              width="80"
              height="62"
              rx="8"
            />
            <path
              className="cute-object__detail"
              d="M64 47v62M20 61h88m-44-14q-25-18-22-30 17-2 22 30Zm0 0q25-18 22-30-17-2-22 30Z"
            />
          </>
        ) : null}
        {object === "toy-blaster" ? (
          <path
            className="cute-object__toy"
            d="M20 51h72l16 14-16 14H71l-8 30H43l4-30H20Z"
          />
        ) : null}
        {object === "check" ? (
          <path className="cute-object__check" d="m21 67 28 28 59-65" />
        ) : null}
        {object === "no-cross" ? (
          <path className="cute-object__cross" d="m28 28 72 72m0-72-72 72" />
        ) : null}
        {object === "strong-left" || object === "strong-right" ? (
          <path
            className="cute-object__arm"
            d={
              object === "strong-left"
                ? "M105 94Q82 113 52 95 23 78 29 49q5-20 21-19l5 30q18-18 36-4 17 13 14 38Z"
                : "M23 94q23 19 53 1 29-17 23-46-5-20-21-19l-5 30q-18-18-36-4-17 13-14 38Z"
            }
          />
        ) : null}
      </g>
    );
  }

  if (SMALL_CREATURES.includes(object)) {
    return (
      <g className={`cute-object cute-object--${object}`}>
        <MiniHighlight x={46} y={40} rx={13} ry={6} />
        {object === "bee" ? (
          <>
            <ellipse
              className="cute-object__wing"
              cx="43"
              cy="45"
              rx="18"
              ry="12"
              transform="rotate(-28 43 45)"
            />
            <ellipse
              className="cute-object__wing"
              cx="85"
              cy="45"
              rx="18"
              ry="12"
              transform="rotate(28 85 45)"
            />
            <ellipse
              className="cute-object__nature"
              cx="64"
              cy="70"
              rx="34"
              ry="26"
            />
            <path
              className="cute-object__detail"
              d="M48 50v40m17-45v50m17-42v36"
            />
          </>
        ) : null}
        {object === "crab" ? (
          <>
            <ellipse
              className="cute-object__nature"
              cx="64"
              cy="74"
              rx="32"
              ry="25"
            />
            <path
              className="cute-object__detail"
              d="M36 69 16 51m76 18 20-18M31 85 16 99m81-14 15 14"
            />
            <path
              className="cute-object__claw"
              d="M14 51q-5-20 15-18l-4 14 13-1q-5 17-24 5Zm100 0q5-20-15-18l4 14-13-1q5 17 24 5Z"
            />
          </>
        ) : null}
        {object === "octopus" || object === "shy-alien" ? (
          <path
            className="cute-object__nature"
            d="M31 83q0-53 33-53t33 53v22L86 93l-11 12-11-12-11 12-11-12-11 12Z"
          />
        ) : null}
        {object === "snail" ? (
          <>
            <path
              className="cute-object__nature"
              d="M22 88q25-15 52 0h30v17H22Z"
            />
            <circle className="cute-object__shell" cx="55" cy="70" r="29" />
            <path
              className="cute-object__detail"
              d="M55 55q18 3 10 20-8 12-23 2"
            />
          </>
        ) : null}
        {object === "snake" ? (
          <path
            className="cute-object__nature cute-object__snake"
            d="M25 86q3-35 35-16 31 18 43-8 10-22-16-31"
          />
        ) : null}
        {object === "turtle" ? (
          <>
            <ellipse
              className="cute-object__shell"
              cx="62"
              cy="72"
              rx="37"
              ry="27"
            />
            <circle className="cute-object__nature" cx="103" cy="72" r="14" />
            <path
              className="cute-object__detail"
              d="M45 54 79 89m0-35L45 89M39 72h46"
            />
          </>
        ) : null}
        {object === "whale" ? (
          <>
            <path
              className="cute-object__nature"
              d="M18 79q15-35 52-28 24 5 38-14-2 17 8 25-13 4-20 16-14 27-48 22Q26 97 18 79Z"
            />
            <path
              className="cute-object__water"
              d="M73 46q-9-19 0-28m0 14-11-8m11 8 11-8"
            />
          </>
        ) : null}
        <MiniFace />
      </g>
    );
  }

  if (BIRDS.includes(object)) {
    return (
      <g className={`cute-object cute-object--${object}`}>
        <MiniHighlight x={46} y={36} rx={14} ry={6} />
        <ellipse
          className="cute-object__bird"
          cx="64"
          cy="70"
          rx="34"
          ry="39"
        />
        <path
          className="cute-object__wing"
          d="M37 63q-25 12-15 32 18 1 26-15m43-17q25 12 15 32-18 1-26-15"
        />
        <path className="cute-object__beak" d="m57 72 14-7 14 7-14 8Z" />
        {object === "chicken" ? (
          <path className="cute-object__flame" d="M54 31q0-17 10-9 10-8 10 9" />
        ) : null}
        {object === "eagle" ? (
          <path
            className="cute-object__detail"
            d="M35 48q29-24 58 0M38 52l16 7m36-7-16 7"
          />
        ) : null}
        {object === "penguin" ? (
          <ellipse
            className="cute-object__belly"
            cx="64"
            cy="79"
            rx="22"
            ry="25"
          />
        ) : null}
        {object === "owl" ? (
          <path
            className="cute-object__detail"
            d="M36 50 26 28l26 12m40 10 10-22-26 12M42 58h18m8 0h18"
          />
        ) : null}
        <MiniFace />
      </g>
    );
  }

  if (["ghost", "red-slime", "scientist", "blue-cup-friend"].includes(object)) {
    return (
      <g className={`cute-object cute-object--${object}`}>
        <MiniHighlight x={48} y={40} rx={15} ry={7} />
        {object === "ghost" ? (
          <path
            className="cute-object__ghost"
            d="M27 102V62q0-39 37-39t37 39v40L89 89l-13 13-12-13-12 13-13-13Z"
          />
        ) : null}
        {object === "red-slime" ? (
          <path
            className="cute-object__slime"
            d="M25 102q-7-70 39-70t39 70q-9 12-20 0-10 12-19 0-10 12-20 0-10 12-19 0Z"
          />
        ) : null}
        {object === "scientist" ? (
          <>
            <path
              className="cute-object__hair"
              d="m25 48 9-28 15 13L64 8l14 25 16-13 9 28"
            />
            <circle className="cute-object__body" cx="64" cy="70" r="35" />
            <circle className="cute-object__glasses" cx="50" cy="63" r="12" />
            <circle className="cute-object__glasses" cx="79" cy="63" r="12" />
          </>
        ) : null}
        {object === "blue-cup-friend" ? (
          <>
            <path
              className="cute-object__cup"
              d="M31 43h64v51q-4 17-32 17T31 94Z"
            />
            <path
              className="cute-object__detail"
              d="M95 54h15q13 0 7 24H95M45 32q-8-9 1-20m19 20q-8-9 1-20"
            />
          </>
        ) : null}
        <MiniFace />
      </g>
    );
  }

  const catLike = CAT_LIKE.includes(object);
  const longEars = LONG_EARS.includes(object);
  const horned = HORNED.includes(object);
  return (
    <g className={`cute-object cute-object--${object}`}>
      <MiniHighlight x={46} y={38} rx={14} ry={6} />
      {object === "lion" ? (
        <circle className="cute-object__mane" cx="64" cy="66" r="48" />
      ) : null}
      {object === "hedgehog" ? (
        <path
          className="cute-object__spines"
          d="m19 90 7-19-12-9 18-8-5-17 19 3 7-17 14 13 15-12 7 18 19-2-5 18 17 8-14 13 5 18Z"
        />
      ) : null}
      {object === "squirrel" ? (
        <path
          className="cute-object__tail"
          d="M93 91q33-8 17-42-10-20-28-5 20 5 13 22-6 14-20 13"
        />
      ) : null}
      {object === "sheep" ? (
        <path
          className="cute-object__wool"
          d="M27 61q-8-20 12-23 5-21 24-12 16-14 29 4 22-2 20 19 17 8 4 25"
        />
      ) : null}
      {catLike ? (
        <path
          className="cute-object__ear"
          d="M31 48 35 14l26 24m36 10-4-34-26 24"
        />
      ) : null}
      {longEars ? (
        <path
          className="cute-object__ear"
          d="M39 49Q20 3 42 8q18 5 18 39m29 2Q108 3 86 8 68 13 68 47"
        />
      ) : null}
      {horned ? (
        <path
          className="cute-object__horn"
          d="M42 40Q20 34 29 14q5 15 19 15m38 11q22-6 13-26-5 15-19 15"
        />
      ) : null}
      {!catLike && !longEars && !horned ? (
        <>
          <circle className="cute-object__ear-round" cx="35" cy="42" r="16" />
          <circle className="cute-object__ear-round" cx="93" cy="42" r="16" />
        </>
      ) : null}
      <ellipse className="cute-object__body" cx="64" cy="70" rx="37" ry="38" />
      {object === "panda" || object === "raccoon" ? (
        <path
          className="cute-object__mask"
          d="M35 55q15-14 25 3-9 22-27 7Zm58 0q-15-14-25 3 9 22 27 7Z"
        />
      ) : null}
      {object === "tiger" ? (
        <path
          className="cute-object__detail"
          d="M45 35 54 50m19-15-8 15M35 72l14 4m44-4-14 4"
        />
      ) : null}
      {object === "love-cat" ? (
        <path
          className="cute-object__heart"
          d="m100 34c-7-8-19 2-9 12l9 9 9-9c10-10-2-20-9-12Z"
        />
      ) : null}
      {object === "reading-koala" ? (
        <path
          className="cute-object__book"
          d="M24 78q20-12 40 4 20-16 40-4v31q-20-12-40 1-20-13-40-1Z"
        />
      ) : null}
      {object === "cloud-cat" ? (
        <path
          className="cute-object__cloud"
          d="M28 94q-10-17 9-23 3-19 21-12 16-15 29 2 19 0 16 18 16 8 3 20H31Z"
        />
      ) : null}
      {object === "spark-bunny" ? (
        <path
          className="cute-object__spark"
          d="m99 23 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z"
        />
      ) : null}
      <MiniFace />
    </g>
  );
}
