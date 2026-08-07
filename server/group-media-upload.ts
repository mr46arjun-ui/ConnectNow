import type { Express } from "express";
import express from "express";
import { mkdir, writeFile } from "node:fs/promises";
import type { IncomingMessage } from "node:http";
import path from "node:path";
import { ensurePublicGroupMembership } from "./groups";
import { rateLimitMiddleware } from "./security";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";

const MAX_VOICE_NOTE_BYTES = 4 * 1024 * 1024;
const LOCAL_MEDIA_DIRECTORY = path.resolve(
  process.cwd(),
  ".connectnow-media",
  "group-voice"
);
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;

const AUDIO_EXTENSIONS = new Map([
  ["audio/webm", "webm"],
  ["audio/ogg", "ogg"],
  ["audio/mp4", "m4a"],
  ["audio/aac", "aac"],
  ["audio/mpeg", "mp3"],
]);

function normalizedAudioType(request: IncomingMessage) {
  const header = request.headers["content-type"];
  const rawContentType = Array.isArray(header) ? header[0] : header;
  const contentType = rawContentType?.split(";", 1)[0]?.trim();
  return contentType && AUDIO_EXTENSIONS.has(contentType) ? contentType : null;
}

function publicLocalFileName(
  groupId: number,
  userId: number,
  requestId: string,
  extension: string
) {
  return `${groupId}-${userId}-${requestId}.${extension}`;
}

async function persistVoiceNote(
  data: Buffer,
  contentType: string,
  groupId: number,
  userId: number,
  requestId: string
) {
  const extension = AUDIO_EXTENSIONS.get(contentType) ?? "webm";
  const storageKey = `group-voice/${groupId}/${userId}/${requestId}.${extension}`;

  if (
    process.env.BUILT_IN_FORGE_API_URL?.trim() &&
    process.env.BUILT_IN_FORGE_API_KEY?.trim()
  ) {
    return storagePut(storageKey, data, contentType);
  }

  await mkdir(LOCAL_MEDIA_DIRECTORY, { recursive: true });
  const fileName = publicLocalFileName(groupId, userId, requestId, extension);
  await writeFile(path.join(LOCAL_MEDIA_DIRECTORY, fileName), data);
  return {
    key: fileName,
    url: `/uploads/group-voice/${encodeURIComponent(fileName)}`,
  };
}

export function registerGroupMediaRoutes(app: Express) {
  app.use(
    "/uploads/group-voice",
    express.static(LOCAL_MEDIA_DIRECTORY, {
      fallthrough: false,
      immutable: true,
      maxAge: "30d",
      setHeaders(response, filePath) {
        response.setHeader("X-Content-Type-Options", "nosniff");
        const extension = path.extname(filePath).slice(1).toLowerCase();
        const contentType = [...AUDIO_EXTENSIONS.entries()].find(
          ([, candidateExtension]) => candidateExtension === extension
        )?.[0];
        if (contentType) response.setHeader("Content-Type", contentType);
      },
    })
  );

  app.post(
    "/api/group-media/voice",
    rateLimitMiddleware("group.voice-upload", 20, 60_000),
    express.raw({
      type: request => Boolean(normalizedAudioType(request)),
      limit: MAX_VOICE_NOTE_BYTES,
    }),
    async (request, response) => {
      try {
        const groupId = Number(request.query.groupId);
        const requestId =
          typeof request.query.requestId === "string"
            ? request.query.requestId
            : "";
        const contentType = normalizedAudioType(request);

        if (
          !Number.isInteger(groupId) ||
          groupId < 1 ||
          !REQUEST_ID_PATTERN.test(requestId) ||
          !contentType
        ) {
          response.status(400).json({ error: "Invalid voice-note upload" });
          return;
        }

        const user = await sdk.authenticateRequest(request);
        const canUpload = await ensurePublicGroupMembership(groupId, user.id);
        if (!canUpload) {
          response.status(403).json({ error: "Group access is unavailable" });
          return;
        }

        const body = Buffer.isBuffer(request.body) ? request.body : null;
        if (!body || body.length === 0 || body.length > MAX_VOICE_NOTE_BYTES) {
          response
            .status(400)
            .json({ error: "The voice note is empty or too large" });
          return;
        }

        const stored = await persistVoiceNote(
          body,
          contentType,
          groupId,
          user.id,
          requestId
        );
        response.status(201).json({
          url: stored.url,
          contentType,
          size: body.length,
        });
      } catch (error) {
        const status =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          Number((error as { statusCode?: unknown }).statusCode) === 403
            ? 401
            : 500;
        if (status === 500) {
          console.error("[GroupMedia] Voice-note upload failed", error);
        }
        response.status(status).json({
          error:
            status === 401
              ? "Your session has expired"
              : "Voice-note storage is temporarily unavailable",
        });
      }
    }
  );
}

export {
  AUDIO_EXTENSIONS,
  MAX_VOICE_NOTE_BYTES,
  REQUEST_ID_PATTERN,
  publicLocalFileName,
};
