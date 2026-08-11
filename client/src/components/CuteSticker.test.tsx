import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync } from "node:fs";
import { CYBER_EMOTICONS } from "./CyberAnimeEmoticon";
import {
  CUTE_STICKERS,
  CUTE_STICKER_TOKEN_PATTERN,
  CuteSticker,
  cuteStickerFromToken,
  cuteStickerSelectionFromToken,
} from "./CuteSticker";
import {
  cuteStickerDefinitionFromId,
  cuteStickerToken,
} from "./cute-sticker-catalog";

describe("Cute sticker catalog", () => {
  it("covers every audited Cyber HUD face and prop signal exactly once", () => {
    const faceStickers = CUTE_STICKERS.filter(item => !item.object);
    const miniStickers = CUTE_STICKERS.filter(item => item.object);

    expect(CUTE_STICKERS).toHaveLength(192);
    expect(faceStickers).toHaveLength(132);
    expect(miniStickers).toHaveLength(60);
    expect(new Set(faceStickers.map(item => item.id))).toEqual(
      new Set(CYBER_EMOTICONS.map(item => item.id))
    );
    expect(new Set(CUTE_STICKERS.map(item => item.token)).size).toBe(192);
    expect(
      new Set(CUTE_STICKERS.map(item => cuteStickerToken(item, "standard")))
        .size
    ).toBe(192);
  });

  it("assigns a non-duplicated action signature to every interactive sticker", () => {
    const signatures = CUTE_STICKERS.map(item => item.motionSignature.key);
    expect(new Set(signatures).size).toBe(CUTE_STICKERS.length);
  });

  it("keeps motion semantically aligned with the audited pose", () => {
    expect(
      cuteStickerDefinitionFromId("happy-wave")?.motionSignature.family
    ).toBe("wave");
    expect(
      cuteStickerDefinitionFromId("happy-spark")?.motionSignature.family
    ).toBe("cheer");
    expect(
      cuteStickerDefinitionFromId("laugh-tears")?.motionSignature.family
    ).toBe("weep");
    expect(
      cuteStickerDefinitionFromId("sleepy-zzz")?.motionSignature.family
    ).toBe("doze");
    expect(
      cuteStickerDefinitionFromId("angry-overheat")?.motionSignature.family
    ).toBe("shiver");
  });

  it("keeps six tactile variants in every face family", () => {
    const familyCounts = new Map<string, number>();
    for (const item of CUTE_STICKERS.filter(item => !item.object)) {
      familyCounts.set(item.face, (familyCounts.get(item.face) ?? 0) + 1);
    }

    expect(familyCounts.size).toBe(22);
    expect(new Set(familyCounts.values())).toEqual(new Set([6]));
  });

  it("persists and resolves compound sticker tokens", () => {
    expect(cuteStickerFromToken(":cute-happy-halo:")).toBe("happy-halo");
    expect(cuteStickerFromToken(":cute-mini-corgi:")).toBe("mini-corgi");
    expect(cuteStickerFromToken(":cute-unknown:")).toBeUndefined();
    expect(cuteStickerSelectionFromToken(":sticker-happy-halo:")).toEqual({
      id: "happy-halo",
      mode: "standard",
    });
    expect(cuteStickerSelectionFromToken(":cute-happy-halo:")).toEqual({
      id: "happy-halo",
      mode: "interactive",
    });
    expect(
      "hello :cute-tired-coffee: :sticker-sick-bandage:".match(
        CUTE_STICKER_TOKEN_PATTERN
      )
    ).toEqual([":cute-tired-coffee:", ":sticker-sick-bandage:"]);
  });

  it("renders standalone late-video miniatures as accessible sticker art", () => {
    const markup = renderToStaticMarkup(
      <CuteSticker sticker="mini-corgi" size="message" />
    );

    expect(markup).toContain(
      'aria-label="Corgi Friend interactive cute sticker"'
    );
    expect(markup).toContain("cute-object--corgi");
    expect(markup).toContain("data-motion-signature=");
  });

  it("renders the standard edition without a live motion signature", () => {
    const markup = renderToStaticMarkup(
      <CuteSticker sticker="happy-halo" size="message" mode="standard" />
    );

    expect(markup).toContain("cute-sticker--standard");
    expect(markup).toContain('aria-label="Happy · Halo standard cute sticker"');
    expect(markup).not.toContain("data-motion-signature=");
  });

  it("ships the prototype-derived clay surface texture", () => {
    expect(
      existsSync(
        new URL(
          "../../public/assets/cute-clay-microtexture.png",
          import.meta.url
        )
      )
    ).toBe(true);
  });
});
