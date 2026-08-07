/**
 * Content Moderation Utilities
 * Handles profanity filtering, content flagging, and LLM-based moderation
 */

import { Filter } from "bad-words";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// Lazy-loaded shared profanity filter instance.
let profanityFilter: Filter | null = null;
function getFilter(): Filter {
  if (!profanityFilter) {
    profanityFilter = new Filter();
  }
  return profanityFilter;
}

// Patterns for spam detection. URLs and repeated characters are signals but
// only fire for excessive usage (after the 6th repeat / multiple URLs).
const SPAM_PATTERNS = [
  /(.)\1{9,}/i, // 10+ repeated characters in a row
  /(https?:\/\/|www\.)/gi, // URLs (any)
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, // IP addresses
];

export function containsProfanity(content: string): boolean {
  if (!content) return false;
  return getFilter().isProfane(content);
}

export function isSpam(content: string): boolean {
  if (!content) return false;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      // URLs alone are not spam; require another signal.
      if (pattern === SPAM_PATTERNS[1]) continue;
      return true;
    }
  }
  // Allow several URLs but flag if more than 3.
  const urlCount = (content.match(/https?:\/\//gi) ?? []).length;
  if (urlCount > 3) return true;

  // Excessive capitalization.
  const upperCount = (content.match(/[A-Z]/g) || []).length;
  if (content.length > 20 && upperCount / content.length > 0.6) {
    return true;
  }
  return false;
}

export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeContent(content: string): string {
  if (!content) return "";
  const cleaned = getFilter().clean(content);
  return escapeHtml(cleaned);
}

/**
 * Use LLM to detect toxic/inappropriate content
 * Returns confidence score (0-1) and flag reason
 */
export async function detectToxicContent(
  content: string
): Promise<{ isToxic: boolean; confidence: number; reason: string } | null> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content moderation AI. Analyze the following message and determine if it contains:
1. Harassment or bullying
2. Hate speech or discrimination
3. Explicit sexual content
4. Violence or threats
5. Spam or scams
6. Other inappropriate content

Respond with a JSON object: { "isToxic": boolean, "confidence": number (0-1), "reason": string }`,
        },
        {
          role: "user",
          content: `Analyze this message: "${content}"`,
        },
      ],
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent || typeof messageContent !== "string") return null;
    const text = messageContent;

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);
    return {
      isToxic: result.isToxic || false,
      confidence: Math.min(Math.max(result.confidence || 0, 0), 1),
      reason: result.reason || "Unknown",
    };
  } catch (error) {
    console.error("[Moderation] LLM error:", error);
    return null;
  }
}

/**
 * Process message for moderation
 * Returns moderation result with flags
 */
export async function moderateMessage(
  messageId: number,
  content: string,
  userId: number
): Promise<{
  shouldFlag: boolean;
  reason?: string;
  confidence?: number;
}> {
  // Check for profanity
  if (containsProfanity(content)) {
    return { shouldFlag: true, reason: "Profanity detected" };
  }

  // Check for spam
  if (isSpam(content)) {
    return { shouldFlag: true, reason: "Spam detected" };
  }

  // Use LLM for advanced detection
  const llmResult = await detectToxicContent(content);
  if (llmResult && llmResult.isToxic && llmResult.confidence > 0.7) {
    // Create content flag in database
    await db.createContentFlag(
      messageId,
      llmResult.reason,
      llmResult.confidence.toString()
    );

    return {
      shouldFlag: true,
      reason: llmResult.reason,
      confidence: llmResult.confidence,
    };
  }

  return { shouldFlag: false };
}

/**
 * Get moderation statistics
 */
export async function getModerationStats() {
  const unreviewedFlags = await db.getUnreviewedFlags(1000);
  const pendingReports = await db.getReports("pending", 1000);

  return {
    unreviewedFlagsCount: unreviewedFlags.length,
    pendingReportsCount: pendingReports.length,
    averageConfidence:
      unreviewedFlags.length > 0
        ? unreviewedFlags.reduce((sum, f) => sum + (parseFloat(f.aiConfidence?.toString() || "0") || 0), 0) /
          unreviewedFlags.length
        : 0,
  };
}

/**
 * Rate limiting check
 * Returns true if user is rate limited
 */
export function checkRateLimit(userId: number, action: string, limit: number = 10, windowMs: number = 60000): boolean {
  // This would typically use Redis for distributed rate limiting
  // For now, we'll use a simple in-memory approach
  // In production, implement with Redis
  return false;
}

/**
 * IP-based abuse prevention
 * Track and block suspicious IPs
 */
export function checkIPReputation(ip: string): boolean {
  // This would integrate with IP reputation services
  // For now, return false (not blocked)
  return false;
}
