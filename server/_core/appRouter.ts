import { router } from "./trpc";
import { systemRouter } from "./systemRouter";
import { authRouter } from "../routers/auth";
import { profileRouter } from "../routers/profile";
import { matchingRouter } from "../routers/matching";
import { friendsRouter } from "../routers/friends";
import { blocksRouter } from "../routers/blocks";
import { messagesRouter } from "../routers/messages";
import { notificationsRouter } from "../routers/notifications";
import { reportsRouter } from "../routers/reports";
import { adminRouter } from "../routers/admin";
import { contentModerationRouter } from "../routers/contentModeration";
import { mediaUploadRouter } from "../routers/mediaUpload";
import { groupsRouter } from "../routers/groups";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  profile: profileRouter,
  matching: matchingRouter,
  friends: friendsRouter,
  blocks: blocksRouter,
  messages: messagesRouter,
  notifications: notificationsRouter,
  reports: reportsRouter,
  admin: adminRouter,
  contentModeration: contentModerationRouter,
  mediaUpload: mediaUploadRouter,
  groups: groupsRouter,
});

export type AppRouter = typeof appRouter;
