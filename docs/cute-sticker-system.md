# ConnectNow Soft Sticker System

## Purpose

Soft Stickers are a separate visual collection beside Cyber HUD. They use the
same complete reference-video coverage checklist—22 face families with six
pose/prop variants each, plus every distinct late-video animal, food, nature,
and symbol sticker—but deliberately replace neon interface geometry with warm,
tactile characters.

The attached prototype is stored at
`client/public/assets/cute-sticker-styleboard.png` and is the measured source
for material, proportion, lighting, hand scale, eye treatment, and depth. A
prototype-derived neutral surface tile lives at
`client/public/assets/cute-clay-microtexture.png`. Production stickers combine
that real raster microtexture with deterministic SVG geometry so all 192
designs stay complete, crisp, searchable, and consistent rather than drifting
between unrelated generated renders.

Every design is available in two shelves:

- **Interactive:** 192 animated/reactive stickers using durable `:cute-…:`
  tokens.
- **Standard:** the same 192 designs in fully stable poses using durable
  `:sticker-…:` tokens.

The picker therefore exposes 384 sendable editions without duplicating a
design inside either shelf.

## Visual grammar

- One consistent low rounded-triangle body proportion across the collection.
- Six distinct hand/body posture systems: resting, excited fists, cheek
  clutch, pointing, heart/hug, and thinking chin.
- Soft pastel clay/jelly depth, prototype-derived matte grain, gentle edge
  darkening, glossy eyes, small grounding shadows, and warm studio highlights.
- Charcoal eyes and mouths, warm translucent cheeks, and small tactile hands.
- One readable real-world prop or atmospheric effect per variant.
- No neon, HUD frames, digital grids, bloom, or luminous symbol glows.

## Complete coverage

| Category  | Families                                     |   Count |
| --------- | -------------------------------------------- | ------: |
| Core      | Online, Confused, Skeptical, Thinking        |      24 |
| Joy       | Happy, Grinning, Laughing, Winking           |      24 |
| Love      | Kissing, In Love                             |      12 |
| Style     | Smug, Cool                                   |      12 |
| Alert     | Surprised, Shocked, Scared, Angry            |      24 |
| Low power | Sad, Crying, Sobbing, Tired, Sleepy, Unwell  |      36 |
| Friends   | Original animals and character companions    |      29 |
| Nature    | Birds, garden, woodland, and sea life        |      16 |
| Treats    | Cake, cone, pizza, cheese, and rainbow jelly |       5 |
| Symbols   | Hearts, gestures, gift, checks, toy, and hug |      10 |
| **Total** | **132 reactions + 60 late-video miniatures** | **192** |

Each Soft Sticker has the same semantic ID as its Cyber HUD counterpart, while
using an independent durable token. Example:

```text
:cute-tired-coffee:
```

This one-to-one ID invariant prevents a face, pose, or prop family from being
missed when either collection evolves. Standalone late-video items use
`:cute-mini-…:` tokens, for example `:cute-mini-corgi:`.

## Motion grammar

The source video's locked grid and compact localized transitions are retained,
but the waveform is softened for the tactile material. Motion is semantic:
wave props wave, tears fall/weep, sleepy props doze, sparks cheer, orbit props
orbit, and overheat states shiver.

- calm float and breathing: 2.4 seconds;
- happy prop pop: 0.7 seconds;
- laugh bounce: 0.65 seconds;
- fear/anger wiggle: 0.38 seconds;
- thinking sway: 1.6 seconds;
- surprise pop: 0.65 seconds;
- tear fall: 1.8 seconds;
- love orbit: 2.4 seconds.

Sixteen action families cover breathe, hop, nod, wave, squish, peek, sway,
twirl, shiver, cheer, weep, doze, boop, tiptoe, orbit, and recoil. Every item
also receives its own duration, phase, travel, rotation, scale, and pivot tuple.
The catalog test requires all 192 tuples to be unique, preventing two stickers
from having the exact same motion. All animation is disabled in the Standard
shelf and under `prefers-reduced-motion: reduce`.

## Source files

- `client/src/components/cute-sticker-catalog.ts`: inventory, tokens, palettes.
- `client/src/components/CuteSticker.tsx`: SVG character and prop renderer.
- `client/src/components/CuteMiniObject.tsx`: standalone animal, food, nature,
  and symbol renderer.
- `client/src/components/GroupMediaPicker.tsx`: dedicated Cute tab, search, and
  category filters, plus Interactive/Standard shelf switch.
- `client/src/pages/GroupRoom.tsx`: persisted token-to-sticker message rendering.
