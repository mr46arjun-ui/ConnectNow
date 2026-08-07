import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { getDb } from "./db";

const DEFAULT_MIGRATION_ATTEMPTS = 5;
const MAX_MIGRATION_ATTEMPTS = 10;

function getMigrationAttempts() {
  const configured = Number.parseInt(
    process.env.DB_MIGRATION_ATTEMPTS ?? "",
    10
  );

  if (!Number.isInteger(configured)) return DEFAULT_MIGRATION_ATTEMPTS;
  return Math.min(Math.max(configured, 1), MAX_MIGRATION_ATTEMPTS);
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getMigrationsFolder() {
  const configured = process.env.MIGRATIONS_DIR?.trim();
  const migrationsFolder = configured
    ? path.resolve(configured)
    : path.resolve(process.cwd(), "drizzle");
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");

  if (!fs.existsSync(journalPath)) {
    throw new Error(
      `Database migration journal was not found at ${journalPath}`
    );
  }

  return migrationsFolder;
}

/**
 * Verify the columns used by account creation, private messaging, and group
 * rooms. Zero-row queries are inexpensive and catch a partially migrated
 * database before the service starts accepting traffic.
 */
export async function checkDatabaseReadiness() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection is not configured");
  }

  await db.execute(sql`
    SELECT
      id,
      openId,
      email,
      username,
      passwordHash,
      emailVerified,
      lastSeenAt
    FROM users
    LIMIT 0
  `);
  await db.execute(sql`
    SELECT id, isDeleted, isEdited, editedAt
    FROM private_messages
    LIMIT 0
  `);
  try {
    await db.execute(sql`
      SELECT id, name, createdBy, memberCount, isActive, passwordHash, isPrivate
      FROM \`groups\`
      LIMIT 0
    `);
  } catch (e) {
    console.log("[Database] Updating groups table schema...");
    try { await db.execute(sql`ALTER TABLE \`groups\` ADD COLUMN \`passwordHash\` varchar(255)`); } catch {}
    try { await db.execute(sql`ALTER TABLE \`groups\` ADD COLUMN \`isPrivate\` boolean DEFAULT false`); } catch {}
  }
  await db.execute(sql`
    SELECT id, groupId, userId, role, lastReadMessageId
    FROM group_members
    LIMIT 0
  `);
  await db.execute(sql`
    SELECT id, groupId, userId, bannedBy, banType, expiresAt
    FROM group_bans
    LIMIT 0
  `);
  await db.execute(sql`
    SELECT id, groupId, senderId, content, mentions, isDeleted, timestamp
    FROM group_messages
    LIMIT 0
  `);
  await db.execute(sql`
    SELECT id, groupId, initiatorId, callType, endedAt, participantCount, maxParticipants
    FROM group_calls
    LIMIT 0
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS group_message_reactions (
      id int AUTO_INCREMENT NOT NULL,
      messageId int NOT NULL,
      groupId int NOT NULL,
      userId int NOT NULL DEFAULT 0,
      participantKey varchar(128) NOT NULL,
      emoji varchar(32) NOT NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT group_message_reactions_id PRIMARY KEY(id),
      CONSTRAINT unique_user_reaction UNIQUE(messageId, participantKey, emoji)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await db.execute(sql`
    SELECT id, messageId, groupId, userId, participantKey, emoji
    FROM group_message_reactions
    LIMIT 0
  `);
}

/**
 * Apply committed migrations before opening the HTTP port. Failed migrations
 * stop the new release, allowing the hosting platform to retain the previous
 * healthy deployment instead of serving an application with a stale schema.
 */
export async function ensureDatabaseReady() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection is not configured");
  }

  const runMigrations = process.env.RUN_DB_MIGRATIONS !== "false";
  const attempts = getMigrationAttempts();
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (runMigrations) {
        await migrate(db, { migrationsFolder: getMigrationsFolder() });
      }
      await checkDatabaseReadiness();
      console.log(
        runMigrations
          ? "[Database] Migrations applied and schema is ready"
          : "[Database] Schema readiness check passed"
      );
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `[Database] Readiness attempt ${attempt}/${attempts} failed`,
        error
      );

      if (attempt < attempts) {
        await wait(Math.min(1_000 * 2 ** (attempt - 1), 8_000));
      }
    }
  }

  throw new Error("Database migrations or schema readiness checks failed", {
    cause: lastError,
  });
}
