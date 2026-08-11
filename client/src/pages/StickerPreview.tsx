import React from "react";
import { useMemo, useState } from "react";
import { CuteSticker } from "@/components/CuteSticker";
import { ClayMochiEmoji } from "@/components/ClayMochiEmoji";
import {
  CLAY_MOCHI_CATEGORIES,
  CLAY_MOCHI_STICKERS,
  type ClayMochiCategory,
} from "@/components/clay-mochi-catalog";
import {
  CUTE_STICKER_CATEGORIES,
  CUTE_STICKERS,
  type CuteStickerCategory,
} from "@/components/cute-sticker-catalog";

type PickerMode = "clay" | "cute";

export default function StickerPreview() {
  const [mode, setMode] = useState<PickerMode>("clay");
  const [clayCategory, setClayCategory] = useState<"all" | ClayMochiCategory>("all");
  const [cuteCategory, setCuteCategory] = useState<"all" | CuteStickerCategory>("all");

  const clayStickers = useMemo(() => {
    const list = CLAY_MOCHI_STICKERS.filter(
      item => clayCategory === "all" || item.category === clayCategory
    );
    const faces = list.filter(item => !item.object && !item.stable);
    const stable = list.filter(item => item.object || item.stable);
    return [...faces, ...stable];
  }, [clayCategory]);

  const cuteStickers = useMemo(() => {
    const list = CUTE_STICKERS.filter(
      item => cuteCategory === "all" || item.category === cuteCategory
    );
    const faces = list.filter(item => !item.object);
    const minis = list.filter(item => item.object);
    return [...faces, ...minis];
  }, [cuteCategory]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#140f0d] pb-20 text-[#f5f5f5]">
      <header className="sticky top-0 z-20 border-b border-rose-100/10 bg-[#140f0d]/90 backdrop-blur">
        <div className="container flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-[#f5f5f5]">
              Clay Sticker Studio
            </h1>
            <span className="rounded-full border border-[#d4a373]/30 bg-[#d4a373]/10 px-3 py-1 text-xs text-[#e8c9a0]">
              3D matte polymer clay · warm studio key · chibi proportions
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("clay")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                mode === "clay"
                  ? "bg-[#d4a373] text-[#1a110c]"
                  : "bg-white/5 text-[#b8b8b8] hover:bg-white/10"
              }`}
            >
              Clay Mochi
            </button>
            <button
              type="button"
              onClick={() => setMode("cute")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                mode === "cute"
                  ? "bg-rose-300 text-[#2a0f0f]"
                  : "bg-white/5 text-[#b8b8b8] hover:bg-white/10"
              }`}
            >
              Cute Stickers
            </button>
            <span className="ml-auto text-xs text-[#737373]">
              {mode === "clay"
                ? `${clayStickers.length} clay mochi`
                : `${cuteStickers.length} cute stickers`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(mode === "clay" ? CLAY_MOCHI_CATEGORIES : CUTE_STICKER_CATEGORIES).map(
              cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    mode === "clay"
                      ? setClayCategory(cat.id as "all" | ClayMochiCategory)
                      : setCuteCategory(cat.id as "all" | CuteStickerCategory)
                  }
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    (mode === "clay"
                      ? clayCategory === cat.id
                      : cuteCategory === cat.id)
                      ? "bg-white/15 text-[#f5f5f5]"
                      : "text-[#999999] hover:bg-white/5 hover:text-[#e7e7e7]"
                  }`}
                >
                  {cat.label}
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="container pt-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[#999999]">
            {mode === "clay"
              ? "Mood-driven poses: raised fists, open arms, heart hands, covers, salutes, waves — every sticker has its own body language."
              : "Cute face stickers re-rendered with bead eyes, chibi arms and matte clay shading."}
          </p>
        </div>

        {mode === "clay" ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {clayStickers.map(item => (
              <div
                key={item.id}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#d4a373]/10 bg-gradient-to-b from-[#201916] to-[#100d0c] p-3 transition hover:border-[#d4a373]/35"
              >
                <ClayMochiEmoji sticker={item.id} size="picker" />
                <span className="mt-1 text-center text-[10px] leading-tight text-[#b8b8b8]">
                  {item.label}
                </span>
                <span className="text-[9px] text-[#737373]">{item.pose ?? "rest"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {cuteStickers.map(item => (
              <div
                key={item.id}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-rose-100/10 bg-gradient-to-b from-[#201916] to-[#100d0c] p-3 transition hover:border-rose-200/35"
              >
                <CuteSticker sticker={item.id} size="picker" />
                <span className="mt-1 text-center text-[10px] leading-tight text-[#b8b8b8]">
                  {item.label}
                </span>
                <span className="text-[9px] text-[#737373]">{item.pose ?? "rest"}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
