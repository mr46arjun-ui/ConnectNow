import { sql } from "drizzle-orm";
import { getDb } from "../server/db";

async function clearExistingGroups() {
  console.log("🧹 Clearing all existing groups and related data...");
  const db = await getDb();
  if (!db) {
    console.error("Database connection is not available.");
    process.exit(1);
  }

  try {
    await db.execute(sql.raw("DELETE FROM `group_message_reactions`"));
    await db.execute(sql.raw("DELETE FROM `group_messages`"));
    await db.execute(sql.raw("DELETE FROM `group_call_participants`"));
    await db.execute(sql.raw("DELETE FROM `group_calls`"));
    await db.execute(sql.raw("DELETE FROM `group_invites`"));
    await db.execute(sql.raw("DELETE FROM `group_members`"));
    await db.execute(sql.raw("DELETE FROM `groups`"));
    console.log("✅ All existing groups and related data have been cleared cleanly!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to clear groups:", error);
    process.exit(1);
  }
}

clearExistingGroups();
