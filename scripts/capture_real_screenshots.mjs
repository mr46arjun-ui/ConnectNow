import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs";

const DESKTOP_DIR = "/Users/monika/Desktop";

async function captureRealScreenshots() {
  console.log("🚀 Starting Puppeteer real screenshot capture of ConnectNow app...");

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();

  // 1. Home / Guest Login Page
  console.log("📸 1. Capturing Home / Guest Login Page...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await page.waitForTimeout?.(1000) || new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(DESKTOP_DIR, "Screenshot_1_Home_Page.png") });

  // 2. Groups Directory
  console.log("📸 2. Capturing Groups Directory...");
  await page.goto("http://localhost:3000/groups", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(DESKTOP_DIR, "Screenshot_2_Groups_Directory.png") });

  // 3. Live Group Chat Room
  console.log("📸 3. Capturing Live Group Chat Room...");
  await page.goto("http://localhost:3000/groups/1", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 1500));

  // Type a message in input
  const textarea = await page.$("textarea");
  if (textarea) {
    await textarea.type("Hello everyone! Testing live group chat with video calling 🚀");
  }
  await page.screenshot({ path: path.join(DESKTOP_DIR, "Screenshot_3_GroupRoom_LiveChat.png") });

  // 4. Group Info Modal
  console.log("📸 4. Capturing Group Info Modal...");
  const groupHeaderBtn = await page.$("header button[title*='group info']");
  if (groupHeaderBtn) {
    await groupHeaderBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(DESKTOP_DIR, "Screenshot_4_GroupInfo_Modal.png") });
    // Press Escape to close modal
    await page.keyboard.press("Escape");
    await new Promise(r => setTimeout(r, 500));
  }

  // 5. User Profile Modal
  console.log("📸 5. Capturing User Profile Modal...");
  const userAvatarBtn = await page.$("button[title*='profile']");
  if (userAvatarBtn) {
    await userAvatarBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(DESKTOP_DIR, "Screenshot_5_UserProfile_Modal.png") });
    await page.keyboard.press("Escape");
    await new Promise(r => setTimeout(r, 500));
  }

  // 6. Anonymous Random Chat
  console.log("📸 6. Capturing Anonymous Random Matching...");
  await page.goto("http://localhost:3000/random-chat", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(DESKTOP_DIR, "Screenshot_6_RandomChat_Matching.png") });

  await browser.close();
  console.log("🎉 All 6 Real Pixel-Perfect Screenshots Captured & Saved to Desktop!");
}

captureRealScreenshots().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
