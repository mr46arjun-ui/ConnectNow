# ConnectNow Cyber HUD Emoticon System

## Full-video audit

The supplied 92.07-second, 720 × 384 reference was sampled at 0.25-second
intervals (369 frames) and reviewed as eleven timeline contact sheets plus
eleven close motion comparisons. The source uses an eleven-column fixed picker
grid. It contains three kinds of material:

| Timeline | Visible source content                                      | ConnectNow treatment                                                                           |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 0–30 s   | Animated yellow blob/anime faces and repeated scroll passes | Every distinct face, pose, prop, and motion family was consolidated into the Cyber HUD catalog |
| 31–74 s  | Mostly stable face and accessory variants                   | Rebuilt as parameterized SVG face/accent combinations                                          |
| 74–86 s  | Animals, objects, and pictograms rather than anime faces    | Not duplicated as faces; these remain covered by the Standard and GIF tabs                     |
| 87–92 s  | Standard Unicode emoji picker                               | Preserved in the Standard tab                                                                  |

Repeated frames, color-cycle frames, and repeated scroll passes count as one
design signal rather than duplicate buttons. This produces 132 distinct,
searchable Cyber HUD signals: 22 facial-expression families with six variants
per family.

## Structural rules

- **Locked layer:** 128 × 128 viewBox, octagonal frame, four corner brackets,
  crosshairs, grid, face anchors, 14 px safe area, and bottom status rail.
- **Dynamic layer:** eye/mouth expression, pulse rings, scanning indicators,
  tears, props, warnings, reticles, and wearable accents.
- **Placement:** eyes occupy the y=47–67 band, mouths the y=72–92 band, and
  accessory art stays in the outer HUD ring whenever possible.
- **Line system:** 2.5 px rounded primary stroke, 0.75 px grid, 3 px live rail,
  identical 12 px frame cuts, and non-scaling strokes.
- **Small-size rule:** eyes and mouth retain full contrast at 52 px while grid
  detail may recede.

## Catalog matrix

Each family has six entries, so the matrix accounts for all 132 buttons.

| Category  | Face families                               | Variant vocabulary                                                                                                                                                 |
| --------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Core      | Online, Confused, Skeptical, Thinking       | scan, visor, optics, mask, helmet, query, glitch, gesture, idea, terminal, map                                                                                     |
| Joy       | Happy, Grinning, Laughing, Winking          | blush, halo, bloom, wave, spark, teeth, party, gift, stars, music, tears, roll, confetti, burst, mic, heart, finger ray, charm                                     |
| Love      | Kissing, In Love                            | heart, twin hearts, bloom, spark, wave, stars, hug, orbit                                                                                                          |
| Style     | Smug, Cool                                  | shades, neon shades, cap, crown, stealth, headset, visor, patrol                                                                                                   |
| Alert     | Surprised, Shocked, Scared, Angry           | target, alert, burst, sweat, lightning, alarm, rain, ghost, shadow, flame, warning, steam, horns, overheat                                                         |
| Low power | Sad, Crying, Sobbing, Tired, Sleepy, Unwell | rain, battery, tears, cloud, heartbreak, tissue, freeze, flood, storm, empty, sleep, Z-Z-Z, coffee, moon, pillow, nightcap, mask, fever, nausea, bandage, medicine |

The original five public message tokens remain compatible:
`:cyber-idle:`, `:cyber-happy:`, `:cyber-surprised:`, `:cyber-sad:`, and
`:cyber-angry:`. New entries use the same durable scheme, such as
`:cyber-happy-halo:` and `:cyber-sick-bandage:`.

## Motion and wavelength matrix

All smooth states use `cubic-bezier(0.25, 1, 0.5, 1)`. Glitch states use
`steps(2, end)` to reproduce the source's sharp digital frame skips.

| Motion state | Frequency / duration | Moving parts                                  | Typical trigger           |
| ------------ | -------------------- | --------------------------------------------- | ------------------------- |
| Idle         | 0.5 Hz / 2 s         | 2 px whole-icon buoyancy and calm ring breath | online, neutral           |
| Pulse        | about 3 Hz / 0.36 s  | glow and inner signal expansion               | happy, hearts, stars      |
| Bounce       | 2 Hz / 0.5 s         | 100→108→100% snap                             | laugh, party, gift        |
| Glitch       | 4 Hz / 0.25 s        | 1–2 px stepped horizontal twitch and flicker  | angry, overheat, shadow   |
| Drift        | 0.5 Hz / 2 s         | slow prop/face translation                    | thinking, tired, sleep    |
| Shake        | about 3 Hz / 0.32 s  | short alternating x offsets                   | fear, fever, nausea       |
| Alert        | 2 Hz / 0.5 s         | face 100→115→100%, reticle lock               | surprised, warning, alarm |
| Drip         | 0.5 Hz / 2 s         | downward particle translation and fade        | tears, rain, flood        |
| Orbit        | 2 Hz / 0.5 s         | outer prop/reticle rotation                   | love, halo, moon          |
| Scan         | 2 Hz / 0.5 s         | horizontal optical sweep                      | visor, glasses, terminal  |

`prefers-reduced-motion: reduce` disables every loop and leaves the most
readable key pose.

## Production asset specification

| Property                   | Value                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Canvas                     | SVG `viewBox="0 0 128 128"`; 14 px outer safe area                                   |
| Void surface               | `#05070D` / deep app black `#000000` and `#0D0D0D`                                   |
| Holographic cyan           | `#25F6FF`                                                                            |
| Neon magenta               | `#FF2BD6`                                                                            |
| Electric amber             | `#FFB000`                                                                            |
| Overheat red               | `#FF3B30`                                                                            |
| Battery blue               | `#4B7BFF`                                                                            |
| Interface text             | `#F5F5F5`                                                                            |
| Bloom                      | restrained 10–12 px visual bloom using CSS `drop-shadow`                             |
| Picker / message / compact | 88 px / 104 px / 52 px                                                               |
| Accessibility              | labeled `role="img"` in messages; decorative picker art; keyboard-selectable buttons |

## Implementation contract

- `client/src/components/cyber-emoticon-catalog.ts` owns the 132 definitions,
  categories, tokens, palettes, and motion mapping.
- `client/src/components/CyberAnimeEmoticon.tsx` owns the reusable parametric
  SVG renderer.
- `client/src/index.css` owns motion, bloom, and reduced-motion behavior.
- `client/src/components/GroupMediaPicker.tsx` exposes **Standard**,
  **Cyber HUD**, and **GIFs**. The legacy Anime Reactions section is removed.

Messages store compact text tokens and render them as live SVG. This keeps the
database payload small, allows text and signals in the same message, and avoids
uploading duplicate image assets.

This is a semantic, futuristic reconstruction of every identifiable anime-face
family in the video, not a pixel copy of the small source sprites. Literal
frame-perfect reproduction would require the original named sprite, SVG, or
Lottie assets from the source pack.
