import { chromium } from 'playwright-core';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, '../remotion/public/screenshots');

async function captureScreenshots() {
  // Ensure screenshots directory exists
  await mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });

  const page = await context.newPage();

  console.log('Navigating to Siouxland Online...');
  await page.goto('https://siouxland.online', { waitUntil: 'networkidle' });

  // Wait for widgets to load
  await page.waitForTimeout(3000);

  // Capture full dashboard
  console.log('Capturing full dashboard...');
  await page.screenshot({
    path: join(screenshotsDir, 'dashboard-full.png'),
    fullPage: false,
  });

  // Capture individual widgets
  const widgets = [
    { selector: '[data-widget="weather"]', name: 'weather' },
    { selector: '[data-widget="gas-prices"]', name: 'gas-prices' },
    { selector: '[data-widget="air-quality"]', name: 'air-quality' },
    { selector: '[data-widget="traffic"]', name: 'traffic' },
    { selector: '[data-widget="river"]', name: 'river' },
  ];

  for (const widget of widgets) {
    try {
      const element = await page.$(widget.selector);
      if (element) {
        console.log(`Capturing ${widget.name}...`);
        await element.screenshot({
          path: join(screenshotsDir, `${widget.name}.png`),
        });
      } else {
        console.log(`Widget ${widget.name} not found, trying alternative selectors...`);
      }
    } catch (e) {
      console.log(`Could not capture ${widget.name}: ${e.message}`);
    }
  }

  // Try to capture widgets by their visible text/headers
  const cardSelectors = await page.$$('div[class*="card"], div[class*="Card"]');
  console.log(`Found ${cardSelectors.length} card-like elements`);

  // Capture top portion (header + first row of widgets)
  console.log('Capturing top section...');
  await page.screenshot({
    path: join(screenshotsDir, 'dashboard-top.png'),
    clip: { x: 0, y: 0, width: 1920, height: 600 },
  });

  // Capture middle section
  console.log('Capturing middle section...');
  await page.screenshot({
    path: join(screenshotsDir, 'dashboard-middle.png'),
    clip: { x: 0, y: 200, width: 1920, height: 700 },
  });

  // Mobile viewport for vertical video
  console.log('Capturing mobile view...');
  await page.setViewportSize({ width: 430, height: 932 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: join(screenshotsDir, 'dashboard-mobile.png'),
  });

  // Scroll down a bit for more content
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: join(screenshotsDir, 'dashboard-mobile-scroll.png'),
  });

  await browser.close();
  console.log('Screenshots saved to:', screenshotsDir);
}

captureScreenshots().catch(console.error);
