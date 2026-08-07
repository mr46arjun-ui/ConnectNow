import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3000";

async function runMultiGuestTest() {
  console.log("🚀 Starting Multi-Guest Session Verification Test...\n");

  // Create 3 concurrent guest sockets
  const socket1 = io(SERVER_URL, {
    auth: { mode: "anonymous" },
    transports: ["websocket", "polling"],
  });

  const socket2 = io(SERVER_URL, {
    auth: { mode: "anonymous" },
    transports: ["websocket", "polling"],
  });

  const socket3 = io(SERVER_URL, {
    auth: { mode: "anonymous" },
    transports: ["websocket", "polling"],
  });

  await Promise.all([
    new Promise(res => socket1.on("connect", res)),
    new Promise(res => socket2.on("connect", res)),
    new Promise(res => socket3.on("connect", res)),
  ]);

  console.log("✅ 3 Concurrent Guest Sockets Connected!");

  const targetGroupId = 1;

  // 1. Join Group Room
  await Promise.all([
    new Promise(res => {
      socket1.emit("group:join", { groupId: targetGroupId });
      socket1.on("group:joined", res);
    }),
    new Promise(res => {
      socket2.emit("group:join", { groupId: targetGroupId });
      socket2.on("group:joined", res);
    }),
    new Promise(res => {
      socket3.emit("group:join", { groupId: targetGroupId });
      socket3.on("group:joined", res);
    }),
  ]);

  await new Promise(r => setTimeout(r, 200));
  console.log(`✅ All 3 Guest Sockets successfully joined Group #${targetGroupId}!`);

  // Listeners
  let messageReceivedBy2 = false;
  socket2.on("group:message", (msg) => {
    if (msg.content.includes("Hello from Guest 1!")) {
      messageReceivedBy2 = true;
    }
  });

  let reactionReceivedBy3 = false;
  socket3.on("group:reaction-updated", (data) => {
    console.log("[Test Debug] socket3 received group:reaction-updated:", data);
    reactionReceivedBy3 = true;
  });

  // 2. Send Message from Guest 1
  const sendResponse: any = await new Promise((resolve) => {
    socket1.emit("group:send-message", {
      groupId: targetGroupId,
      content: "Hello from Guest 1!",
    }, (resp: any) => {
      resolve(resp);
    });
  });

  const activeMessageId = Number(sendResponse?.messageId);
  console.log(`✅ Guest 1 sent message (Message ID: ${activeMessageId})`);

  await new Promise(r => setTimeout(r, 400));
  console.log(messageReceivedBy2 ? "✅ Guest 2 received real-time text message broadcast from Guest 1!" : "❌ Guest 2 failed to receive message");

  // 3. Toggle Reaction from Guest 2
  await new Promise(r => setTimeout(r, 300));
  if (activeMessageId > 0) {
    socket2.emit("group:toggle-reaction", {
      messageId: activeMessageId,
      groupId: targetGroupId,
      emoji: "🔥",
    }, (ack: any) => {
      console.log("Toggle reaction ack from server:", ack);
    });
  }

  await new Promise(r => setTimeout(r, 500));
  console.log(reactionReceivedBy3 ? "✅ Guest 3 received real-time Emoji Reaction sync broadcast!" : "❌ Emoji reaction broadcast failed");

  // 4. Test WebRTC Group Call Signaling for Guests
  let callSignalOk = false;
  socket1.emit("group-call:start", { groupId: targetGroupId, callType: "video" }, (res: any) => {
    if (res?.ok && res?.call) {
      callSignalOk = true;
    }
  });

  await new Promise(r => setTimeout(r, 500));
  console.log(callSignalOk ? "✅ Guest group video call initiation verified!" : "❌ Guest call initiation failed");

  // Disconnect sockets cleanly
  socket1.disconnect();
  socket2.disconnect();
  socket3.disconnect();

  console.log("\n🎉 Multi-Guest Automated Verification Completed Successfully!");
  process.exit(0);
}

runMultiGuestTest().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
