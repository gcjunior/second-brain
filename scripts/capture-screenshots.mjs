import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const outDir = join(rootDir, "docs", "screenshots");
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

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
    },
    {
      sourceId: "xyz789ghi012",
      title: "Austin trip notes",
      content:
        "Conference was at the Austin Convention Center. Great tacos nearby on Rainey Street.",
      score: 0.78,
    },
  ],
};

async function waitForApp(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForSelector("#memory-input");
}

async function captureSaveTab(page) {
  await page.evaluate(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#memory-input");

  await page.getByRole("tab", { name: "Save Memory" }).click();
  await page.locator("#memory-input").fill(
    "Met Alex at the conference in Austin. We discussed AI memory systems and agreed to follow up about HydraDB."
  );

  await page.screenshot({
    path: join(outDir, "save-tab.png"),
    fullPage: true,
  });
}

async function captureAskTabWithCitations(page) {
  await page.route("**/api/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockAskResponse),
    });
  });

  await page.getByRole("tab", { name: "Ask Question" }).click();
  await page.locator("#question-input").fill("Where did I meet Alex?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await page.getByText("Retrieved Sources").waitFor();
  await page.getByText("Source 1").waitFor();

  await page.screenshot({
    path: join(outDir, "ask-tab-citations.png"),
    fullPage: true,
  });
}

async function captureDarkMode(page) {
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark")
  );

  await page.screenshot({
    path: join(outDir, "dark-mode.png"),
    fullPage: true,
  });
}

async function captureMobile(browser) {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    colorScheme: "light",
  });
  const page = await context.newPage();

  await waitForApp(page);
  await page.locator("#memory-input").fill(
    "Quick note from mobile: remember to buy groceries and call Alex about the HydraDB demo."
  );

  await page.screenshot({
    path: join(outDir, "mobile.png"),
    fullPage: true,
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
    await captureSaveTab(page);
    await captureAskTabWithCitations(page);
    await captureDarkMode(page);
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
