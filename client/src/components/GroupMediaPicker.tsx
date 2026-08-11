import type { EmojiClickData, Theme } from "emoji-picker-react";
import { Loader2, Search } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  CYBER_EMOTICONS,
  CyberAnimeEmoticon,
} from "@/components/CyberAnimeEmoticon";
import {
  CYBER_CATEGORIES,
  type CyberCategory,
} from "@/components/cyber-emoticon-catalog";
import { CuteSticker } from "@/components/CuteSticker";
import {
  CUTE_STICKERS,
  CUTE_STICKER_CATEGORIES,
  cuteStickerToken,
  type CuteStickerCategory,
  type CuteStickerMode,
} from "@/components/cute-sticker-catalog";

import {
  CLAY_MOCHI_STICKERS,
  CLAY_MOCHI_CATEGORIES,
  type ClayMochiCategory,
} from "./clay-mochi-catalog";
import { ClayMochiEmoji } from "./ClayMochiEmoji";

type PickerTab = "standard" | "cute" | "clay" | "cyber" | "gifs";

type GifAsset = {
  id: string;
  title: string;
  previewUrl: string;
  shareUrl: string;
};

type TenorResponse = {
  next?: string;
  results?: Array<{
    id?: string;
    content_description?: string;
    media_formats?: {
      gif?: { url?: string };
      tinygif?: { url?: string };
    };
  }>;
};

type GroupMediaPickerProps = {
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gif: GifAsset) => void;
};

const FALLBACK_GIFS: GifAsset[] = [
  {
    id: "fallback-cat-typing",
    title: "Excited typing cat",
    previewUrl: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
    shareUrl: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  },
  {
    id: "fallback-happy-dance",
    title: "Happy dance",
    previewUrl: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    shareUrl: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  },
  {
    id: "fallback-shocked",
    title: "Shocked reaction",
    previewUrl: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
    shareUrl: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
  },
  {
    id: "fallback-celebrate",
    title: "Celebration",
    previewUrl: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
    shareUrl: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
  },
];

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY?.trim();
const TENOR_CLIENT_KEY = "connectnow_group_chat";
const StandardEmojiPicker = lazy(async () => {
  const emojiPickerModule = await import("emoji-picker-react");
  return { default: emojiPickerModule.default };
});

async function fetchTenorGifs(
  search: string,
  position: string | undefined,
  signal: AbortSignal
) {
  if (!TENOR_API_KEY) return { gifs: [] as GifAsset[], next: undefined };
  const url = new URL("https://tenor.googleapis.com/v2/search");
  url.searchParams.set("q", search);
  url.searchParams.set("key", TENOR_API_KEY);
  url.searchParams.set("client_key", TENOR_CLIENT_KEY);
  url.searchParams.set("limit", "18");
  url.searchParams.set("contentfilter", "medium");
  url.searchParams.set("media_filter", "gif,tinygif");
  url.searchParams.set(
    "locale",
    navigator.language.replace("-", "_") || "en_US"
  );
  if (position) url.searchParams.set("pos", position);

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`GIF search failed (${response.status})`);
  const payload = (await response.json()) as TenorResponse;
  const gifs = (payload.results ?? []).flatMap(result => {
    const shareUrl = result.media_formats?.gif?.url;
    const previewUrl = result.media_formats?.tinygif?.url ?? shareUrl;
    if (!shareUrl || !previewUrl) return [];
    return [
      {
        id: result.id ?? shareUrl,
        title: result.content_description || "Tenor GIF",
        previewUrl,
        shareUrl,
      },
    ];
  });
  return { gifs, next: payload.next };
}

export function GroupMediaPicker({
  onEmojiSelect,
  onGifSelect,
}: GroupMediaPickerProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>("standard");
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState<GifAsset[]>(FALLBACK_GIFS);
  const [gifNext, setGifNext] = useState<string | undefined>();
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [gifError, setGifError] = useState("");
  const [cyberSearch, setCyberSearch] = useState("");
  const [cyberCategory, setCyberCategory] = useState<"all" | CyberCategory>(
    "all"
  );
  const [cuteSearch, setCuteSearch] = useState("");
  const [cuteCategory, setCuteCategory] = useState<"all" | CuteStickerCategory>(
    "all"
  );
  const [cuteMode, setCuteMode] = useState<CuteStickerMode>("interactive");
  const [claySearch, setClaySearch] = useState("");
  const [clayCategory, setClayCategory] = useState<"all" | ClayMochiCategory>(
    "all"
  );
  const requestControllerRef = useRef<AbortController | null>(null);

  const filteredFallbacks = useMemo(() => {
    const query = gifSearch.trim().toLowerCase();
    if (!query) return FALLBACK_GIFS;
    const matches = FALLBACK_GIFS.filter(gif =>
      gif.title.toLowerCase().includes(query)
    );
    return matches.length > 0 ? matches : FALLBACK_GIFS;
  }, [gifSearch]);

  const filteredCyberEmoticons = useMemo(() => {
    const query = cyberSearch.trim().toLowerCase();
    return CYBER_EMOTICONS.filter(item => {
      const matchesCategory =
        cyberCategory === "all" || item.category === cyberCategory;
      const matchesSearch =
        !query ||
        item.label.toLowerCase().includes(query) ||
        item.id.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [cyberCategory, cyberSearch]);

  const filteredCuteStickers = useMemo(() => {
    const query = cuteSearch.trim().toLowerCase();
    return CUTE_STICKERS.filter(item => {
      const matchesCategory =
        cuteCategory === "all" || item.category === cuteCategory;
      const matchesSearch =
        !query ||
        item.label.toLowerCase().includes(query) ||
        item.id.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [cuteCategory, cuteSearch]);

  const filteredClayMochi = useMemo(() => {
    const query = claySearch.trim().toLowerCase();
    return CLAY_MOCHI_STICKERS.filter(item => {
      const matchesCategory =
        clayCategory === "all" || item.category === clayCategory;
      const matchesSearch =
        !query ||
        item.label.toLowerCase().includes(query) ||
        item.id.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [clayCategory, claySearch]);

  useEffect(() => {
    if (activeTab !== "gifs") return;
    requestControllerRef.current?.abort();
    if (!TENOR_API_KEY) {
      setGifResults(filteredFallbacks);
      setGifNext(undefined);
      setGifError("");
      setIsLoadingGifs(false);
      return;
    }

    const controller = new AbortController();
    requestControllerRef.current = controller;
    const timer = window.setTimeout(async () => {
      setIsLoadingGifs(true);
      setGifError("");
      try {
        const result = await fetchTenorGifs(
          gifSearch.trim() || "reactions",
          undefined,
          controller.signal
        );
        setGifResults(result.gifs);
        setGifNext(result.next);
      } catch (error) {
        if (controller.signal.aborted) return;
        setGifResults(filteredFallbacks);
        setGifError(
          "Live GIF search is unavailable, so curated reactions are shown."
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingGifs(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeTab, filteredFallbacks, gifSearch]);

  const loadMoreGifs = async () => {
    if (!gifNext || !TENOR_API_KEY || isLoadingGifs) return;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsLoadingGifs(true);
    try {
      const result = await fetchTenorGifs(
        gifSearch.trim() || "reactions",
        gifNext,
        controller.signal
      );
      setGifResults(current => [...current, ...result.gifs]);
      setGifNext(result.next);
    } catch (error) {
      if (!controller.signal.aborted)
        setGifError("Could not load more GIFs. Try again.");
    } finally {
      if (!controller.signal.aborted) setIsLoadingGifs(false);
    }
  };

  const tabs: Array<{ id: PickerTab; label: string }> = [
    { id: "standard", label: "Standard" },
    { id: "cute", label: "Cute" },
    { id: "clay", label: "Clay Mochi" },
    { id: "cyber", label: "Cyber HUD" },
    { id: "gifs", label: "GIFs" },
  ];

  return (
    <div className="w-[min(94vw,420px)] overflow-hidden rounded-2xl border border-red-900/70 bg-black text-white shadow-2xl">
      <div
        className="grid grid-cols-4 border-b border-white/10 bg-neutral-950 p-1"
        role="tablist"
        aria-label="Message media"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-9 rounded-lg px-2 text-[11px] font-semibold transition ${
              activeTab === tab.id
                ? "bg-red-800 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "standard" ? (
        <Suspense
          fallback={
            <div className="flex h-[340px] items-center justify-center text-sm text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading emojis…
            </div>
          }
        >
          <StandardEmojiPicker
            theme={"dark" as Theme}
            onEmojiClick={(data: EmojiClickData) => onEmojiSelect(data.emoji)}
            width="100%"
            height={340}
            lazyLoadEmojis
          />
        </Suspense>
      ) : activeTab === "cute" ? (
        <div className="p-3">
          <div className="mb-3 rounded-xl border border-rose-200/20 bg-[#181311] px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-[#f3b2b8] shadow-[0_0_10px_rgba(243,178,184,0.65)]"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold tracking-[0.14em] text-[#ffe8df]">
                NATURAL CLAY STICKERS
              </p>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              {CUTE_STICKERS.length} unique designs in both moving and still
              editions · no neon.
            </p>
          </div>
          <div
            className="mb-2 grid grid-cols-2 rounded-xl border border-rose-200/15 bg-[#100d0c] p-1"
            role="tablist"
            aria-label="Cute sticker edition"
          >
            {(
              [
                {
                  id: "interactive",
                  label: "Interactive",
                  detail: "unique motion",
                },
                { id: "standard", label: "Standard", detail: "stable" },
              ] as const
            ).map(edition => (
              <button
                key={edition.id}
                type="button"
                role="tab"
                aria-selected={cuteMode === edition.id}
                onClick={() => setCuteMode(edition.id)}
                className={`min-h-11 rounded-lg px-2 text-left transition ${
                  cuteMode === edition.id
                    ? "bg-[#6f171a] text-white shadow-[0_5px_16px_rgba(0,0,0,0.28)]"
                    : "text-stone-400 hover:bg-white/5 hover:text-stone-100"
                }`}
              >
                <span className="block text-[11px] font-bold">
                  {edition.label}
                </span>
                <span className="block text-[9px] opacity-70">
                  {edition.detail}
                </span>
              </button>
            ))}
          </div>
          <div className="mb-2 grid grid-cols-[1fr_8rem] gap-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-500" />
              <input
                type="search"
                value={cuteSearch}
                onChange={event => setCuteSearch(event.target.value)}
                placeholder="Search stickers"
                aria-label="Search cute stickers"
                className="min-h-9 w-full rounded-lg border border-rose-200/15 bg-[#100d0c] pl-8 pr-2 text-xs text-white outline-none focus:border-rose-300/60"
              />
            </label>
            <select
              value={cuteCategory}
              onChange={event =>
                setCuteCategory(
                  event.target.value as "all" | CuteStickerCategory
                )
              }
              aria-label="Cute sticker category"
              className="min-h-9 rounded-lg border border-rose-200/15 bg-[#100d0c] px-2 text-[11px] text-[#ffe8df] outline-none focus:border-rose-300/60"
            >
              {CUTE_STICKER_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid max-h-[306px] grid-cols-4 gap-1.5 overflow-y-auto pr-1">
            {filteredCuteStickers.map(item => (
              <button
                key={`${cuteMode}-${item.id}`}
                type="button"
                onClick={() => onEmojiSelect(cuteStickerToken(item, cuteMode))}
                aria-label={`Add ${item.label} ${cuteMode} cute sticker`}
                title={`${item.label} · ${
                  cuteMode === "interactive"
                    ? `${item.motionSignature.family} ${item.motionSignature.durationMs} ms`
                    : "stable pose"
                }`}
                data-cute-mode={cuteMode}
                className="cute-sticker-card group relative flex min-h-24 flex-col items-center justify-center overflow-hidden rounded-xl border border-rose-100/10 bg-gradient-to-b from-[#201916] to-[#100d0c] px-1 py-1.5 text-center transition hover:border-rose-200/35 hover:from-[#2a211d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              >
                <span className="pointer-events-none absolute inset-x-3 top-1 h-px bg-gradient-to-r from-transparent via-rose-100/25 to-transparent" />
                <CuteSticker
                  sticker={item.id}
                  size="compact"
                  mode={cuteMode}
                  decorative
                />
                <span className="mt-0.5 max-w-full truncate text-[9px] font-bold uppercase tracking-[0.06em] text-[#fff5ef]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          {filteredCuteStickers.length === 0 ? (
            <p className="py-8 text-center text-xs text-stone-500">
              No cute stickers match this filter.
            </p>
          ) : null}
        </div>
      ) : activeTab === "clay" ? (
        <div className="p-3">
          <div className="mb-3 rounded-xl border border-[#d4a373]/25 bg-[#181311] px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-[#d4a373] shadow-[0_0_10px_rgba(212,163,115,0.65)]"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold tracking-[0.14em] text-[#ffe8df]">
                CLAY MOCHI EMOJIS
              </p>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              {CLAY_MOCHI_STICKERS.length} unique clay-mochi emoticons inspired by
              anime blob dynamics · matte tactile finish · no neon.
            </p>
          </div>
          <div className="mb-2 grid grid-cols-[1fr_8rem] gap-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-500" />
              <input
                type="search"
                value={claySearch}
                onChange={event => setClaySearch(event.target.value)}
                placeholder="Search clay mochis"
                aria-label="Search clay mochi emojis"
                className="min-h-9 w-full rounded-lg border border-[#d4a373]/15 bg-[#100d0c] pl-8 pr-2 text-xs text-white outline-none focus:border-[#d4a373]/60"
              />
            </label>
            <select
              value={clayCategory}
              onChange={event =>
                setClayCategory(
                  event.target.value as "all" | ClayMochiCategory
                )
              }
              aria-label="Clay mochi category"
              className="min-h-9 rounded-lg border border-[#d4a373]/15 bg-[#100d0c] px-2 text-[11px] text-[#ffe8df] outline-none focus:border-[#d4a373]/60"
            >
              {CLAY_MOCHI_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid max-h-[306px] grid-cols-4 gap-1.5 overflow-y-auto pr-1">
            {filteredClayMochi.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onEmojiSelect(item.token)}
                aria-label={`Add ${item.label} clay mochi emoji`}
                title={`${item.label} · ${item.status}`}
                className="clay-mochi-card group relative flex min-h-24 flex-col items-center justify-center overflow-hidden rounded-xl border border-[#d4a373]/10 bg-gradient-to-b from-[#201916] to-[#100d0c] px-1 py-1.5 text-center transition hover:border-[#d4a373]/35 hover:from-[#2a211d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a373]"
              >
                <span className="pointer-events-none absolute inset-x-3 top-1 h-px bg-gradient-to-r from-transparent via-[#d4a373]/25 to-transparent" />
                <ClayMochiEmoji
                  sticker={item.id}
                  size="compact"
                  decorative
                />
                <span className="mt-0.5 max-w-full truncate text-[9px] font-bold uppercase tracking-[0.06em] text-[#fff5ef]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          {filteredClayMochi.length === 0 ? (
            <p className="py-8 text-center text-xs text-stone-500">
              No clay mochis match this filter.
            </p>
          ) : null}
        </div>
      ) : activeTab === "cyber" ? (
        <div className="p-3">
          <div className="mb-3 rounded-xl border border-[#25f6ff]/25 bg-[#071014] px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-[#25f6ff] shadow-[0_0_10px_#25f6ff]"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold tracking-[0.16em] text-[#b9fbff]">
                HOLO REACTION DECK
              </p>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {CYBER_EMOTICONS.length} audited vector signals from the full
              reference timeline.
            </p>
          </div>
          <div className="mb-2 grid grid-cols-[1fr_8rem] gap-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#65aeb3]" />
              <input
                type="search"
                value={cyberSearch}
                onChange={event => setCyberSearch(event.target.value)}
                placeholder="Search signals"
                aria-label="Search Cyber HUD emoticons"
                className="min-h-9 w-full rounded-lg border border-[#25f6ff]/20 bg-[#05070d] pl-8 pr-2 text-xs text-white outline-none focus:border-[#25f6ff]/70"
              />
            </label>
            <select
              value={cyberCategory}
              onChange={event =>
                setCyberCategory(event.target.value as "all" | CyberCategory)
              }
              aria-label="Cyber HUD category"
              className="min-h-9 rounded-lg border border-[#25f6ff]/20 bg-[#05070d] px-2 text-[11px] text-[#b9fbff] outline-none focus:border-[#25f6ff]/70"
            >
              {CYBER_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid max-h-[306px] grid-cols-4 gap-1.5 overflow-y-auto pr-1">
            {filteredCyberEmoticons.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onEmojiSelect(item.token)}
                aria-label={`Add ${item.label} cyber emoticon`}
                title={`${item.label} · ${item.status}`}
                className="cyber-emote-card group relative flex min-h-24 flex-col items-center justify-center overflow-hidden rounded-lg border border-[#25f6ff]/20 bg-[#05070d] px-1 py-1.5 text-center transition hover:border-[#25f6ff]/70 hover:bg-[#071014] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25f6ff]"
              >
                <span className="pointer-events-none absolute inset-x-2 top-1 h-px bg-gradient-to-r from-transparent via-[#25f6ff]/50 to-transparent" />
                <CyberAnimeEmoticon
                  emotion={item.id}
                  size="compact"
                  decorative
                />
                <span className="mt-0.5 max-w-full truncate text-[9px] font-bold uppercase tracking-[0.08em] text-[#f5f5f5]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          {filteredCyberEmoticons.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              No Cyber HUD signals match this filter.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="p-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="search"
              value={gifSearch}
              onChange={event => setGifSearch(event.target.value)}
              placeholder="Search reactions"
              aria-label="Search GIFs"
              className="min-h-10 w-full rounded-xl border border-white/10 bg-neutral-950 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500/70"
            />
          </label>
          {gifError ? (
            <p className="mt-2 text-[11px] text-red-200">{gifError}</p>
          ) : null}
          <div className="mt-3 grid max-h-[275px] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {gifResults.map(gif => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onGifSelect(gif)}
                className="group relative min-h-24 overflow-hidden rounded-xl border border-white/10 bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                title={`Send ${gif.title}`}
              >
                <img
                  src={gif.previewUrl}
                  alt={gif.title}
                  loading="lazy"
                  className="h-28 w-full object-cover transition duration-200 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/75 px-2 py-1 text-left text-[10px] text-white">
                  {gif.title}
                </span>
              </button>
            ))}
          </div>
          {isLoadingGifs ? (
            <div className="flex min-h-10 items-center justify-center text-xs text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading GIFs…
            </div>
          ) : gifNext ? (
            <button
              type="button"
              onClick={loadMoreGifs}
              className="mt-3 min-h-9 w-full rounded-lg border border-red-900/70 text-xs font-semibold text-red-200 hover:bg-red-950/40"
            >
              Load more
            </button>
          ) : null}
          <p className="mt-2 text-center text-[10px] text-slate-600">
            {TENOR_API_KEY
              ? "Powered by Tenor"
              : "Curated GIF library · add VITE_TENOR_API_KEY for live search"}
          </p>
        </div>
      )}
    </div>
  );
}

export type { GifAsset };
