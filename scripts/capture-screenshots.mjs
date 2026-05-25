import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const outDir = join(rootDir, "docs", "screenshots");
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

const FILES = {
  saveLight: "SecondBrain_SaveMemory_Light.png",
  askLight: "SecondBrain_AskQuestion_Light.png",
  saveDark: "SecondBrain_SaveMemory_Dark.png",
  askDark: "SecondBrain_AskQuestion_Dark.png",
  mobile: "SecondBrain_MobileImage.jpeg",
};

const sampleMemory =
  "Met Alex at the conference in Austin #conference #networking. We discussed AI memory systems and agreed to follow up about HydraDB.";

const mockAskResponse = {
  answer:
    "You met Alex at a conference in Austin in March 2025. You discussed AI memory systems and planned to follow up about HydraDB.",
  sources: [
    {
      sourceId: "abc123def456",
      title: "Met Alex at the conference in Austin.",
      content:
        "Met Alex at the conference in Austin. We discussed AI memory systems and agreed to follow up about HydraDB.",
      score: 0.92,
      sourceType: "memory",
      metadata: null,
    },
    {
      sourceId: "xyz789ghi012",
      title: "Austin trip notes",
      content:
        "Conference was at the Austin Convention Center. Great tacos nearby on Rainey Street.",
      score: 0.78,
      sourceType: "memory",
      metadata: null,
    },
  ],
};

async function waitForApp(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForSelector("#memory-input");
}

async function setLightTheme(page) {
  await page.evaluate(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#memory-input");
}

async function mockAskRoute(page) {
  await page.route("**/api/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockAskResponse),
    });
  });
}

async function captureSaveTab(page, filename, { fillText = sampleMemory } = {}) {
  await page.getByRole("tab", { name: "Save Memory" }).click();
  await page.waitForSelector("#memory-input");
  if (fillText) {
    await page.locator("#memory-input").fill(fillText);
  }
  await page.screenshot({
    path: join(outDir, filename),
    fullPage: true,
  });
}

async function captureAskTabWithCitations(page, filename) {
  await page.getByRole("tab", { name: "Ask Question" }).click();
  await page.waitForSelector("#question-input");
  await page.locator("#question-input").fill("Where did I meet Alex?");
  await page.getByRole("button", { name: "Ask Second Brain" }).click();
  await page.getByRole("heading", { name: "Retrieved Sources" }).waitFor();
  await page.getByText("Source 1", { exact: true }).waitFor();

  await page.screenshot({
    path: join(outDir, filename),
    fullPage: true,
  });
}

async function switchToDarkMode(page) {
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
}

async function captureMobile(browser) {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    colorScheme: "light",
  });
  const page = await context.newPage();

  await waitForApp(page);
  await page.locator("#memory-input").fill(
    "Quick note from mobile: remember to buy groceries and call Alex about the HydraDB demo.",
  );

  await page.screenshot({
    path: join(outDir, FILES.mobile),
    fullPage: true,
    type: "jpeg",
    quality: 90,
  });

  await context.close();
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
  });

  try {
    await waitForApp(page);
    await setLightTheme(page);
    await captureSaveTab(page, FILES.saveLight);

    await mockAskRoute(page);
    await captureAskTabWithCitations(page, FILES.askLight);

    await switchToDarkMode(page);
    await captureSaveTab(page, FILES.saveDark, { fillText: "" });
    await captureAskTabWithCitations(page, FILES.askDark);

    await captureMobile(browser);
    console.log(`Screenshots saved to ${outDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
